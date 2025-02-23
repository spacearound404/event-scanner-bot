# Event Scanner Bot

This project scans events on Solana for [Hype.fun](https://hype.fun).

## Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/spacearound404/event-scanner-bot.git
   cd event-scanner-bot
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and fill it with the following variables:
   ```dotenv
   SOLANA_RPC_URL=https://api.devnet.solana.com
   PROGRAM_PUBKEY=DkeHHvSbJbHKu6M5dZqMNX7rqVeKBFLb1E1yq2PcnksK
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   ```

## Running the Bot

To start the bot, run:
```sh
npx ts-node src/index.ts
```

This will initialize the Telegram bot and subscribe to Solana logs.