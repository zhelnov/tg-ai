import { OpenAI } from 'openai';
import { Config } from './Config';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

export class Gpt {
  private static instance: Gpt;

  private readonly openaiClient: OpenAI;

  private constructor(
    private readonly openaiApiKey: string,
    private readonly openaiBaseUrl: string,
    private readonly model: string
  ) {
    this.openaiClient = new OpenAI({
      apiKey: this.openaiApiKey,
      baseURL: this.openaiBaseUrl,
    });
  }

  public static getInstance(): Gpt {
    if (!Gpt.instance) {
      const { openaiApiKey, openaiBaseUrl, openaiModel } = Config.getInstance();
      Gpt.instance = new Gpt(openaiApiKey, openaiBaseUrl, openaiModel);
    }
    return Gpt.instance;
  }

  async generateImage(prompt: string) {
    const response = await this.openaiClient.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
    });
    console.dir(response, { depth: null });
    return response?.data?.[0]?.url;
  }

  async generateResponse(
    messages: ChatCompletionMessageParam[]
  ): Promise<string | void> {
    if (!messages?.length) {
      return;
    }

    const gptResponse = await this.openaiClient.chat.completions.create({
      model: this.model,
      messages,
    });

    const replyText = gptResponse.choices[0]?.message?.content || '';

    if (replyText) {
      console.log('GPT RAW RESPONSE', replyText);
      return replyText.replace(/"/g, '').replace(/—/g, '-');
    } else {
      console.error('GPT RAW RESPONSE IS EMPTY');
    }
  }
}
