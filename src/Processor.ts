import * as _ from 'lodash';
import { Api } from 'telegram/tl';
import { TelegramClient } from 'telegram';

import { Gpt } from './Gpt';
import { PromptBuilder } from './PromptBuilder';
import { ChatContext } from './ChatContext';
import { Config } from './Config';
import { CustomFile } from 'telegram/client/uploads';

export class Processor {
  private static instance: Processor;

  private readonly client: TelegramClient;
  private readonly gpt: Gpt;
  private readonly context: ChatContext;
  private readonly config: Config;

  static getInstance(client: TelegramClient): Processor {
    if (!Processor.instance) {
      Processor.instance = new Processor(client);
    }
    return Processor.instance;
  }

  private constructor(client: TelegramClient) {
    this.gpt = Gpt.getInstance();
    this.context = ChatContext.getInstance();
    this.config = Config.getInstance();
    this.client = client;

    this.client.addEventHandler(async (event: Api.UpdateNewMessage) => {
      if (!event.message) {
        return;
      }
      try {
        await this.processTelegramEvent(event);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  async processTelegramEvent(event: Api.UpdateNewMessage): Promise<void> {
    const peerId: any = _.get(event, 'message.peerId');
    const chatId: any = _.get(event, 'chatId');
    const userId: any = _.get(event, 'originalArgs.userId');
    const fromSelf = this.isMyMessage(event);

    // for detecting new chats
    // console.log(peerId, chatId, userId);

    if (peerId) {
      const chat = await this.client.getEntity(peerId);
      const chatTitle = _.get(chat, 'title');
      const actualMessage = _.get(event, 'message.message');
      const channelId = (peerId as any).channelId || (peerId as any).chatId;

      const promptConfig = this.config.getPromptConfig(channelId);

      const replyText = await this.getReplyText(
        channelId,
        actualMessage,
        chatTitle,
        fromSelf,
        await this.extractImageFromEvent(event)
      );

      if (replyText) {
        let imageUrl: string | undefined;

        if (
          actualMessage &&
          promptConfig?.memeProbability &&
          PromptBuilder.tossCoin(promptConfig.memeProbability)
        ) {
          // TODO move prompt to config
          console.log('Coin decided to generate meme');
          imageUrl = await this.gpt.generateImage(
            `Make meme about this message: "${actualMessage}"`
          );
        }

        await this.sendReply(peerId, replyText || '', 10, imageUrl);
      }

      return;
    }

    if (chatId) {
      const actualMessage: any =
        _.get(event, 'message') || _.get(event, 'message.message');

      const promptConfig = this.config.getPromptConfig(chatId);
      const replyText = await this.getReplyText(
        chatId,
        actualMessage,
        _.get(event, 'fromId'),
        fromSelf,
        await this.extractImageFromEvent(event)
      );
      if (replyText) {
        const target = new Api.PeerChat({ chatId });
        let imageUrl: string | undefined;

        if (
          promptConfig?.memeProbability &&
          PromptBuilder.tossCoin(promptConfig.memeProbability)
        ) {
          console.log('Generating meme');
          imageUrl = await this.gpt.generateImage(
            `Make meme based on this message either on English or without captions at all: "${actualMessage}"`
          );
        }

        await this.sendReply(target, replyText || '', 0, imageUrl);
      }

      return;
    }

    if (userId) {
      const actualMessage: any = _.get(event, 'message');
      const senderId = userId.toString();
      const replyText = await this.getReplyText(
        senderId,
        actualMessage,
        senderId,
        fromSelf,
        await this.extractImageFromEvent(event)
      );
      if (replyText) {
        const target = new Api.PeerUser({ userId });
        await this.sendReply(target, replyText, 10);
      }

      return;
    }

    console.log('No peerId or chatId');
  }

  private isMyMessage(event: Api.UpdateNewMessage): boolean {
    return ['out', 'fromMe', 'isOutgoing', 'outgoin'].some(
      p => _.get(event, p) || _.get(event.message, p)
    );
  }

  private async extractImageFromEvent(
    event: Api.UpdateNewMessage
  ): Promise<string | null> {
    try {
      if (!_.get(event, 'message.media')) {
        return null;
      }

      if (_.get(event, 'message.media.photo.id')) {
        console.log('Image detected in message');
        const buffer = await this.client.downloadMedia(
          _.get(event, 'message.media') as any
        );
        if (buffer) {
          console.log('Image downloaded');
          return `data:image/jpeg;base64,${buffer.toString('base64')}`;
        }
      }

      if (_.get(event, 'message.media.document.id')) {
        const mimeType = _.get(event, 'message.media.document.mimeType', null);

        if (mimeType?.startsWith('image/')) {
          console.log('Image document detected:', mimeType);

          const buffer = await this.client.downloadMedia(
            _.get(event, 'message.media') as any
          );

          if (buffer) {
            return `data:${mimeType};base64,${buffer.toString('base64')}`;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting image from event:', error);
      return null;
    }
  }

  private async getReplyText(
    chatId: string,
    message?: string,
    from?: string,
    fromSelf?: boolean,
    imageData?: string | null
  ): Promise<string | void> {
    const promptConfig = this.config.getPromptConfig(chatId);
    if (!promptConfig) {
      return;
    }

    if (!promptConfig.respondToSelf && fromSelf) {
      console.log(`Ignoring own from ${chatId}`);
      return;
    }

    if (
      promptConfig.triggerWords &&
      !promptConfig.triggerWords.some(word =>
        message?.toLowerCase().includes(word.toLowerCase())
      )
    ) {
      return;
    }

    if (
      !promptConfig.disableLengthConstraint &&
      message?.length &&
      (message.length < 5 || message.length > 1000)
    ) {
      return;
    }

    if (message?.includes('https://')) {
      console.log(`Ignoring link MSG ${message}`);
      return;
    }

    if (message) {
      this.context.addMessage(chatId, message, from);
    }

    const context = this.context.getContext(chatId);

    console.log(
      `MSG from ${from}: ${message?.slice(0, 20).replace('\n/g', ' ')}... ${message?.length} ${imageData ? 'WITH IMAGE' : ''}`
    );

    const prompt = PromptBuilder.getPrompt(chatId, message, context, imageData);
    const response = await this.gpt.generateResponse(prompt);

    if (response) {
      this.context.addMessage(chatId, response, 'assistant');
      if (promptConfig.markAIMessages) {
        return `${promptConfig.markAIMessages} ${response}`;
      }

      return response;
    }
  }

  private async sendReply(
    target: Api.TypeEntityLike,
    message: string,
    delay: number = 0,
    imageUrl?: string
  ): Promise<void> {
    console.log(`GPT response (in ${delay}s): `, message);
    if (delay) {
      await new Promise(r => setTimeout(r, delay * 1000));
    }

    if (imageUrl) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const fileBuffer = Buffer.from(uint8Array);

      await this.client.invoke(
        new Api.messages.SendMedia({
          peer: target,
          media: new Api.InputMediaUploadedPhoto({
            file: await this.client.uploadFile({
              file: new CustomFile(
                'image.jpg',
                fileBuffer.length,
                '',
                fileBuffer
              ),
              workers: 1,
            }),
          }),
          message: message || '',
        })
      );
    } else {
      await this.client.sendMessage(target, {
        message,
      });
    }
  }
}
