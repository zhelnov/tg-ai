import { StringSession } from 'telegram/sessions';
import * as readline from 'readline';
import { TelegramClient } from 'telegram';

import { Config } from './Config';

export class Telegram {
  private static instance: Telegram;

  private readonly rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  private client: TelegramClient | null = null;

  async init(): Promise<TelegramClient> {
    if (this.client) {
      return this.client;
    }

    const config = Config.getInstance();
    const stringSession = new StringSession(config.sessionString);

    this.client = new TelegramClient(
      stringSession,
      config.telegramApiId,
      config.telegramApiHash,
      {
        connectionRetries: 5,
        reconnectRetries: 5,
      }
    );

    await this.client.start({
      phoneNumber: async (): Promise<string> => {
        return await this.questionAsync('Enter your phone number: ');
      },
      password: async (): Promise<string> => {
        return await this.questionAsync(
          'Enter your 2FA password (if enabled): '
        );
      },
      phoneCode: async (): Promise<string> => {
        return await this.questionAsync('Enter the code you received: ');
      },
      onError: (err: Error) => console.log(err),
    });

    // Save session string to .tgs file after successful login
    const savedSession: string = (this.client.session as StringSession).save();
    config.saveSessionString(savedSession);
    console.log('You are now logged in! Your session string has been saved.');

    return this.client;
  }

  closeRl() {
    this.rl.close();
  }

  private questionAsync(question: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(question, resolve);
    });
  }
}
