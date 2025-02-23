import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from './config';
import * as CONST from './const'


let bot: TelegramBot;

export function initTelegramBot(): TelegramBot {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
  console.log(CONST.BOT_START);
  return bot;
}

export function sendTelegramMessage(message: string) {
  if (!bot) {
    console.error(CONST.ERROR_BOT_START);
    return;
  }
  bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'HTML' }).catch((err) => {
    console.error(CONST.TELEGRAM_SEND_ERROR(err));
  });
}
