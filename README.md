# Telegram AI Bot

A TypeScript-based Telegram bot that integrates with OpenAI's GPT models to provide AI-powered responses to messages.

## Features

- 🤖 AI-powered responses using OpenAI GPT models
- 📱 Telegram client integration using GramJS
- 🔐 Secure session management

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
cd tg-ai
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

5. Set up prompt config file, example in ./prompt-config.example.json

## Usage

```bash
npm start
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

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure
- The session string contains sensitive authentication data

## License

MIT License - see LICENSE file for details.
