import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

import {
  loadAndValidateConfig,
  PromptConfig,
  PromptConfigEntry,
} from './ConfigValidator';

export class Config {
  private static instance: Config;
  private readonly sessionFile: string;

  public readonly openaiApiKey: string;
  public readonly openaiBaseUrl: string;
  public readonly telegramApiId: number;
  public readonly telegramApiHash: string;
  public readonly openaiModel: string;
  public sessionString: string;

  private promptConfig: PromptConfig | undefined;

  private constructor() {
    // Load environment variables
    dotenv.config();

    this.sessionFile = path.resolve('.tgs');

    // Validate and load required environment variables
    this.openaiApiKey = this.getEnv('OPENAI_API_KEY');
    this.openaiBaseUrl = this.getEnv('OPENAI_BASE_URL', false);
    this.telegramApiId = this.getRequiredNumberEnv('TELEGRAM_API_ID');
    this.telegramApiHash = this.getEnv('TELEGRAM_API_HASH');
    this.openaiModel = this.getEnv('OPENAI_MODEL');

    // Load session string from .tgs file if it exists
    this.sessionString = this.loadSessionString();
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private getEnv(key: string, required: boolean = true): string {
    const value = process.env[key];
    if (!value && required) {
      throw new Error(`${key} environment variable is required`);
    }
    return value!;
  }

  private getRequiredNumberEnv(key: string): number {
    const value = this.getEnv(key);
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      throw new Error(`${key} must be a valid number`);
    }
    return numValue;
  }

  private loadSessionString(): string {
    if (fs.existsSync(this.sessionFile)) {
      return fs.readFileSync(this.sessionFile, 'utf-8').trim();
    }
    return '';
  }

  public getPromptConfig(chatId: string): PromptConfigEntry {
    if (!this.promptConfig) {
      this.promptConfig = loadAndValidateConfig();
    }
    return this.promptConfig.promptConfig[chatId];
  }

  public keepConversationPrompts(chatId: string): boolean {
    if (!this.promptConfig) {
      this.promptConfig = loadAndValidateConfig();
    }

    return this.promptConfig.keepConversationPrompts.includes(
      chatId.toString()
    );
  }

  public saveSessionString(sessionString: string): void {
    if (sessionString && sessionString.length > 0) {
      fs.writeFileSync(this.sessionFile, sessionString, 'utf-8');
    }
  }

  public hasValidSession(): boolean {
    return this.sessionString.length > 0;
  }

  public getSessionFilePath(): string {
    return this.sessionFile;
  }
}
