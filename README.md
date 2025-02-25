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
   PROGRAM_VERSION=6
   HYPE_DEV_URL=https://dev.hype.vote/
   HYPE_MAIN_URL=https://hype.fun/
   SOLANA_ENV=dev
   ```

   Note: `SOLANA_ENV` can have values `main` and `dev`.

   For `devnet`:
   ```dotenv
   SOLANA_PROGRAM_VERSION=6
   SOLANA_PROGRAM_ID=DkeHHvSbJbHKu6M5dZqMNX7rqVeKBFLb1E1yq2PcnksK
   ```

   For `mainnet`:
   ```dotenv
   PROGRAM_ID=HYPExvaQRQHrkCNc1DAHJoByUeBqFvkJyhtpFdacLcdH
   PROGRAM_VERSION=0
   ```

## Running the Bot

To start the bot, run:
```sh
npx ts-node src/index.ts
```

This will initialize the Telegram bot and subscribe to Solana logs.