import { initTelegramBot } from './telegramBot';
import { subscribeToSolanaLogs } from './solanaLogsListener';

async function main() {
  initTelegramBot();
  subscribeToSolanaLogs();
}

main().catch(console.error);
