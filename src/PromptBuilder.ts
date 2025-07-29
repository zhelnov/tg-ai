import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { ChatMessage } from './ChatContext';
import { Config } from './Config';

export class PromptBuilder {
  static tossCoin(probability: number): boolean {
    const clampedProbability = Math.max(1, Math.min(100, probability));
    const randomValue = Math.floor(Math.random() * 100) + 1;
    return randomValue <= clampedProbability;
  }

  static mixinWithProbability(mixin: string, probability: number): string {
    return this.tossCoin(probability) ? mixin : '';
  }

  static randomMixin(mixins?: string[]): string {
    if (mixins?.length) {
      const randomIndex = Math.floor(Math.random() * mixins.length);
      return mixins[randomIndex];
    }
    return '';
  }

  static getPrompt(
    chatId: string,
    lastMessage: string,
    context: ChatMessage[],
    imageData?: string | null
  ): ChatCompletionMessageParam[] {
    const config = Config.getInstance();
    const { prompt, mixins, responseProbability, names } =
      config.getPromptConfig(chatId);
    const messages: ChatCompletionMessageParam[] = [];

    if (!lastMessage && !imageData) {
      return [];
    }

    if (responseProbability && !this.tossCoin(responseProbability)) {
      return [];
    }

    const includeHistory = config.keepConversationPrompts(chatId);

    if (includeHistory && context.length) {
      const mappedChatHistory: ChatCompletionMessageParam[] = context.map(ctx =>
        this.mapContextMessage(ctx, imageData, names)
      );

      messages.push(...mappedChatHistory);
    }

    messages.push({
      role: 'system',
      content: [
        prompt,
        this.mixinWithProbability(this.randomMixin(mixins), 30),
      ].join(' '),
    });

    return messages;
  }

  private static mapContextMessage(
    ctx: ChatMessage,
    imageData?: string | null,
    names?: Record<string, string>
  ): ChatCompletionMessageParam {
    const name = names?.[ctx.from] ?? ctx.from ?? 'anonymous';
    const contextMessage: ChatCompletionMessageParam = {
      role: name === 'assistant' ? 'assistant' : 'user',
      content: ctx.message,
      name: name.replace(/[\s<|\\/>\"]/g, '_'),
    };

    if (imageData) {
      console.log('Image received');
      contextMessage.content = [
        {
          type: 'text',
          text: ctx.message,
        },
        {
          type: 'image_url',
          image_url: {
            url: imageData,
          },
        },
      ];
    }

    return contextMessage;
  }
}
