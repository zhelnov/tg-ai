# Telegram AI Bot

A TypeScript-based Telegram bot that integrates with OpenAI's GPT models to provide AI-powered responses to messages.

## Features

- 🤖 AI-powered responses using OpenAI GPT models
- 📱 Telegram client integration using GramJS
- 🔐 Secure session management
- ⚡ TypeScript for better development experience
- 🌍 Environment variable configuration

## Prerequisites

Before running this bot, you'll need:

1. **Telegram API Credentials**:
   - Go to https://my.telegram.org/
   - Log in with your phone number
   - Create a new application
   - Note down your `api_id` and `api_hash`

2. **OpenAI API Key**:
   - Go to https://platform.openai.com/
   - Create an account and get your API key

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd telegram-ai-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Edit `.env` file with your credentials:
```env
OPENAI_API_KEY=your_openai_api_key_here
TELEGRAM_API_ID=your_telegram_api_id_here
TELEGRAM_API_HASH=your_telegram_api_hash_here
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Watch Mode (for development)
```bash
npm run watch
```

## First Run

On the first run, the bot will:
1. Ask for your phone number
2. Send you a verification code via Telegram
3. Ask for the verification code
4. If you have 2FA enabled, ask for your password

## How It Works

1. The bot connects to Telegram using your credentials
2. It listens for new messages in all chats you're part of
3. When a new message is received, it sends the message content to OpenAI's GPT model
4. The AI response is automatically sent back to the same chat

## Configuration

### OpenAI Model
You can change the AI model by modifying the `model` parameter in `src/index.ts`:
```typescript
model: 'gpt-4o-mini', // or 'gpt-4', 'gpt-3.5-turbo', etc.
```

### Connection Retries
Modify the `connectionRetries` parameter in the TelegramClient configuration if needed.

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure
- The session string contains sensitive authentication data

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Run `npm install` to install dependencies
2. **Authentication errors**: Make sure your Telegram API credentials are correct
3. **OpenAI API errors**: Verify your OpenAI API key and ensure you have sufficient credits

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Verify your environment variables are set correctly
3. Ensure you have the latest version of Node.js

## License

MIT License - see LICENSE file for details. 