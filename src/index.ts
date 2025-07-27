

import { Processor } from './Processor';
import { Telegram } from './Telegram';

const telegram = new Telegram();

async function main(): Promise<void> {
  const client = await telegram.init();

  Processor.getInstance(client);

  console.log('Bot is running. Press Ctrl+C to stop.');
  process.stdin.resume();
}

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  telegram.closeRl();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  telegram.closeRl();
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 