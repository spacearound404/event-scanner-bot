import TelegramBot from 'node-telegram-bot-api';
import { promises as fs } from 'fs';
import path from 'path';
import * as CONST from '../const'
import * as CFG from '../config'


export const CHAT_ID_FILE = path.resolve(__dirname, '../' + CFG.TELEGRAM_CHAT_IDS_PATH);
export const CHAT_CONTEXT_FILE = path.resolve(__dirname, '../chatContext.json');

type UserState =
  | 'idle'
  | 'awaitingTokenName'
  | 'awaitingMintAddress'
  | 'awaitingMinPrice'
  | 'awaitingMaxPrice'
  | 'returnToFilterSettings';

export let chatContext: Record<number, FilterData> = {};
export let userState: Record<number, UserState> = {};

interface FilterData {
    token?: string;
    networkName?: string;
    mintAddress?: string;
    eventTypes?: string[];
    minPrice?: number;
    maxPrice?: number;
    chatIds?: number[];
    selectedChatId?: string;
    previousMessageId?: number;
  }

export function createPersistentObject<T extends object>(
  obj: T,
  persistFn: () => Promise<void>
): T {
  return new Proxy(obj, {
    set(target, property, value) {
      target[property as keyof T] = value;
      persistFn().catch((err) =>
        console.error(CONST.ERROR_AUTO_SAVING_OBJECT, err)
      );
      return true;
    },
    get(target, property) {
      const value = target[property as keyof T];
      if (value && typeof value === 'object' && !isProxy(value)) {
        target[property as keyof T] = createPersistentObject(value, persistFn);
        return target[property as keyof T];
      }
      return value;
    },
  });
}

export function isProxy(obj: any): boolean {
  return !!obj && typeof obj === 'object' && Reflect.has(obj, '__isProxy');
}

export function getChatContext(chatId: number): FilterData {
  if (!chatContext[chatId]) {
    chatContext[chatId] = createPersistentObject<FilterData>({}, saveChatContext);
    (chatContext[chatId] as any).__isProxy = true;
  }
  return chatContext[chatId];
}

export async function loadChatIds(): Promise<Set<number>> {
  try {
    const data = await fs.readFile(CHAT_ID_FILE, CONST.UTF_8) as string;
    const storedIds = JSON.parse(data) as number[];
    return new Set(storedIds);
  } catch {
    return new Set<number>();
  }
}

export async function loadChatContext() {
  try {
    const data = await fs.readFile(CHAT_CONTEXT_FILE, 'utf-8');
    const parsed = JSON.parse(data) as Record<number, FilterData>;
    for (const chatIdStr of Object.keys(parsed)) {
      const chatId = Number(chatIdStr);
      chatContext[chatId] = createPersistentObject(parsed[chatId], saveChatContext);
      (chatContext[chatId] as any).__isProxy = true;
    }
  } catch {
    chatContext = {};
  }
}

export async function saveChatContext() {
  try {
    await fs.writeFile(
      CHAT_CONTEXT_FILE,
      JSON.stringify(chatContext, null, 2),
      'utf-8'
    );
  } catch (e) {
    console.error(CONST.FAILED_TO_SAVE_CHAT_CONTEXT, e);
  }
}

export async function saveChatIds(ids: Set<number>): Promise<void> {
  await fs.writeFile(CHAT_ID_FILE, JSON.stringify(Array.from(ids)), CONST.UTF_8);
}

export function generateFilterMessage(context: FilterData): string {
  return `
<b>🫧🫧Current filters🫧🫧</b>

🏷️ Token: <b>${context?.token ? context?.token : 'not set'}</b>
📱 Social media: <b>${context?.networkName ? context?.networkName : 'not set'}</b>
———
🎟️ Event: <b>${context?.eventTypes ? context?.eventTypes : 'not set'}</b>
———
🔗 Mint address: <b>${context?.mintAddress ? context?.mintAddress : 'not set'}</b>
———
📉 Min price: <b>${context?.minPrice ? context?.minPrice : 'not set'}</b>
📈 Max price: <b>${context?.maxPrice ? context?.maxPrice : 'not set'}</b>

👇 Choose filter:`;
}