import TelegramBot from 'node-telegram-bot-api';
import * as CFG from './config'
import * as CONST from './const'
import { loadChatIds, loadChatContext, getChatContext } from './bot/utils'
import { handleMessage } from './bot/messageHandler';
import { handleCommands } from './bot/commandHandler';
import { handleCallbackQuery } from './bot/callbackQueryHandler';
import { TradeTransaction , NewTokenTransaction, Transaction } from './types'

let bot: TelegramBot;
let chatIds = new Set<number>();


export async function initBot(token: string): Promise<void> {
  await loadChatContext();

  chatIds = await loadChatIds();

  bot = new TelegramBot(token, { polling: true });

  const me = await bot.getMe();
  const myUsername = me.username || '';

  handleCommands(bot, myUsername, chatIds);
  handleMessage(bot, myUsername, chatIds);
  handleCallbackQuery(bot);
}

export async function broadcastEventNotification(transactions: Transaction[], text: string): Promise<void> {
  if (!bot) {
    throw new Error(CONST.ERROR_BOT_START);
  }
  for (const id of chatIds) {
    if (id < 0) {
      await bot.sendMessage(id, text, { parse_mode: 'HTML' });
    } else {
      try {
        const context = getChatContext(id);

        if (!context) {
          await bot.sendMessage(id, text, { parse_mode: 'HTML' });
        } else {
          for (const transaction of transactions) {
            if (context.token && context.token.toLocaleLowerCase() !== transaction.address.toLocaleLowerCase()) continue;
            if (context.networkName && context.networkName.toLocaleLowerCase() !== CFG.NETWORK_ID[transaction.networkId].toLocaleLowerCase()) continue;
            if (context.eventTypes && !context.eventTypes.includes(transaction.type.toLocaleLowerCase())) continue;
            if (context.mintAddress && context.mintAddress !== transaction.wallet) continue;

            if (transaction.type == 'mint') {
              if (context.minPrice && transaction.baseCrncyAmount <= context.minPrice) continue;
              if (context.maxPrice && transaction.baseCrncyAmount >= context.maxPrice) continue;
            }
  
            await bot.sendMessage(id, text, { parse_mode: 'HTML' });
          }
        }
      } catch (error) {
        console.error(CONST.TELEGRAM_SEND_ERROR(id), error);
      }
    }
  }
}