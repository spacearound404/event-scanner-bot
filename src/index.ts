import { initBot } from './telegramBot';
import { subscribeToSolanaLogs } from './solanaLogsListener';
import { TELEGRAM_BOT_TOKEN } from './config'

async function main() {
  // initTelegramBot();

  initBot(TELEGRAM_BOT_TOKEN)
  .then(() => {
    console.log('Бот Telegram успешно запущен.');
  })
  .catch((error) => {
    console.error('Ошибка инициализации бота Telegram:', error);
  });

  subscribeToSolanaLogs();
}

main().catch(console.error);
