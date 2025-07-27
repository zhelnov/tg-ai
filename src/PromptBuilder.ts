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
      const mappedChatHistory: ChatCompletionMessageParam[] = context.map(
        ctx => {
          const name = names?.[ctx.from] ?? ctx.from ?? 'anonymous';
          return {
            role: name === 'assistant' ? 'assistant' : 'user',
            content: ctx.message,
            name: name.replace(/[\s<|\\/>\"]/g, '_'),
          };
        }
      );

      messages.push(...mappedChatHistory);
    }

    // Add image data if present
    if (imageData) {
      console.log('Image received');
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageData,
            },
          },
        ],
      });
    }

    messages.push({
      role: 'system',
      content: prompt,
    });

    // below prompting with context as text in one prompt instead of separate messages
    // messages.push({
    //   role: 'system',
    //   content: [
    //     // context.length
    //     //   ? `Conversation history: "${context.map(ctx => `${names?.[ctx.from] ?? ctx.from ?? 'anonymous'}: ${ctx.message}`).join('\n')}"`
    //     //   : '',
    //     `Answer last message "${lastMessage}" keeping in mind conversation history`,
    //     this.mixinWithProbability(this.randomMixin(mixins), 30),
    //     prompt,
    //   ].join(' '),
    // });

    return messages;
  }
}
