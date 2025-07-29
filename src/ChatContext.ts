import * as fs from 'fs';
import * as path from 'path';

export interface ChatMessage {
  message: string;
  from: string;
  when: number;
}

export class ChatContext {
  private static instance: ChatContext;
  private readonly contextDir: string;

  private readonly maxMessages: number = 200;

  private constructor() {
    this.contextDir = path.resolve('./contexts');
    this.ensureContextDirectory();
  }

  addMessage(chatId: string, message: string, from: string = 'user'): void {
    if (!message?.trim()) {
      return;
    }

    const messages = this.readContextFile(chatId);

    const newMessage: ChatMessage = {
      message: message,
      from,
      when: Date.now(),
    };

    messages.push(newMessage);

    this.writeContextFile(chatId, messages);
  }

  getContext(chatId: string): ChatMessage[] {
    const allMessages = this.readContextFile(chatId);

    if (allMessages.length <= this.maxMessages) {
      return allMessages;
    }

    return allMessages.slice(-this.maxMessages);
  }

  public static getInstance(): ChatContext {
    if (!ChatContext.instance) {
      ChatContext.instance = new ChatContext();
    }
    return ChatContext.instance;
  }

  private ensureContextDirectory(): void {
    if (!fs.existsSync(this.contextDir)) {
      fs.mkdirSync(this.contextDir, { recursive: true });
    }
  }

  private getContextFilePath(chatId: string): string {
    return path.join(this.contextDir, `${chatId}.json`);
  }

  private readContextFile(chatId: string): ChatMessage[] {
    const filePath = this.getContextFilePath(chatId);

    if (!fs.existsSync(filePath)) {
      return [];
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error reading context file for ${chatId}:`, error);
      return [];
    }
  }

  private writeContextFile(chatId: string, messages: ChatMessage[]): void {
    const filePath = this.getContextFilePath(chatId);

    try {
      fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error writing context file for ${chatId}:`, error);
    }
  }
}
