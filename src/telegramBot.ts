import TelegramBot from 'node-telegram-bot-api';
import { promises as fs } from 'fs';
import path from 'path';
import * as CFG from './config'
import * as CONST from './const'


let bot: TelegramBot;
let chatIds = new Set<number>();
const CHAT_ID_FILE = path.resolve(__dirname, CFG.TELEGRAM_CHAT_IDS_PATH);


async function loadChatIds(): Promise<Set<number>> {
  try {
    const data = await fs.readFile(CHAT_ID_FILE, CONST.UTF_8) as string;
    const storedIds = JSON.parse(data) as number[];
    return new Set(storedIds);
  } catch {
    return new Set<number>();
  }
}

async function saveChatIds(ids: Set<number>): Promise<void> {
  await fs.writeFile(CHAT_ID_FILE, JSON.stringify(Array.from(ids)), CONST.UTF_8);
}

export async function initBot(token: string): Promise<void> {
  chatIds = await loadChatIds();

  bot = new TelegramBot(token, { polling: true });

  const me = await bot.getMe();
  const myUsername = me.username || '';

  bot.on('message', async (msg) => {
    if (msg.new_chat_members) {
      const botUser = msg.new_chat_members.find(
        (member) => member.username === myUsername
      );
      if (botUser) {
        chatIds.add(msg.chat.id);
        await saveChatIds(chatIds);
      }
    }
  });

  bot.on('my_chat_member', async (msg) => {
    if (msg.new_chat_member && msg.new_chat_member.user.username === myUsername) {
      if (msg.new_chat_member.status === CONST.ADMIN_CHAT_MEMBER_STATUS) {
        chatIds.add(msg.chat.id);
        await saveChatIds(chatIds);
      }
    }
  });
}

export async function broadcastEventNotification(text: string): Promise<void> {
  if (!bot) {
    throw new Error(CONST.ERROR_BOT_START);
  }
  for (const id of chatIds) {
    try {
      await bot.sendMessage(id, text, { parse_mode: 'HTML' });
    } catch (error) {
      console.error(CONST.TELEGRAM_SEND_ERROR(id), error);
    }
  }
}