import TelegramBot from 'node-telegram-bot-api';
import { loadChatIds, saveChatContext, saveChatIds, chatContext, userState } from './utils';
import { mainMenu } from './keyboards';
import * as CONST from '../const'


export function handleCommands(bot: TelegramBot, myUsername: string, chatIds: Set<number>) {
    bot.on('my_chat_member', async (msg) => {
        if (msg.new_chat_member && msg.new_chat_member.user.username === myUsername) {
            if (msg.new_chat_member.status === CONST.ADMIN_STATUS_MEMBER) {
                chatIds.add(msg.chat.id);
                await saveChatIds(chatIds);
            }
        }
    });

    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;

        chatIds = await loadChatIds();

        if (!chatContext[chatId]) {
            chatContext[chatId] = {
                'token': undefined,
                'networkName': undefined,
                'eventTypes': undefined,
                'mintAddress': undefined,
                'minPrice': undefined,
                'maxPrice': undefined,
                'chatIds': undefined,
                'selectedChatId': undefined,
                'previousMessageId': undefined
            };

            await saveChatContext();
        }

        if (!chatIds.has(chatId)) {
            chatIds.add(chatId);
            await saveChatIds(chatIds);
        }

        userState[chatId] = 'idle';

        await bot.sendMessage(chatId, CONST.WELCOME_MESSAGE, {
            reply_markup: mainMenu
        });
    });
}