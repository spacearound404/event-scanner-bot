import TelegramBot from 'node-telegram-bot-api';
import * as CONST from '../const'
import { getChatContext, saveChatIds, userState, generateFilterMessage } from './utils';
import { getFilterInlineKeyboard, getNetworkInlineKeyboard, filterSettingMenu, mainMenu, filterChatSettingMenu, getGroupFilterInlineKeyboard } from './keyboards';


export function handleMessage(bot: TelegramBot, myUsername: string, chatIds: Set<number>) {
    bot.on('message', async (msg) => {
        let state = userState[msg.chat.id] || 'idle';
        let context = getChatContext(msg.chat.id);
        let chatId = msg.chat.id;
        let text = msg.text || '';

        // handle selected chats/channel in bot
        if (msg.chat_shared) {
            try {
                let botInfo = await bot.getMe();
                let botMember = await bot.getChatMember(msg.chat_shared.chat_id, botInfo.id);
                
                if (botMember.status != CONST.ADMIN_STATUS_MEMBER) {
                    await bot.sendMessage(msg.chat.id, CONST.ADD_BOT_TO_CHAT);
                    return;
                }
            } catch (error) {
                await bot.sendMessage(msg.chat.id, CONST.ADD_BOT_TO_CHAT);
                return;
            }

            const chatMember = await bot.getChatMember(msg.chat_shared.chat_id, msg.chat.id);

            if (chatMember.status !== CONST.ADMIN_STATUS_MEMBER && chatMember.status !== CONST.CREATOR_STATUS_MEMBER) {
                await bot.sendMessage(msg.chat.id, CONST.NO_PERMISSION_TO_EDIT_FILTERS);
                return;
            }

            context.chatIds = context.chatIds || [];
            context.chatIds?.push(msg.chat_shared.chat_id);
    
            chatIds.add(msg.chat_shared.chat_id);
            await saveChatIds(chatIds);

            let inline_keyboard = [];

            inline_keyboard = await Promise.all(context.chatIds.map(async (id) => {
                const chat = await bot.getChat(id);
                return [{ text: chat.title || `Chat ${id}`, callback_data: `chat_${id}` }];
            }));

            await bot.sendMessage(msg.chat.id, CONST.SELECT_CHAT_TO_SET_FILTER, {
                reply_markup: {
                    inline_keyboard
                }
            });
        }

        // handle adding bot to chats/channel
        if (msg.new_chat_members) {
            const botUser = msg.new_chat_members.find((member) => member.username === myUsername);
            if (botUser) {
                chatIds.add(msg.chat.id);
                await saveChatIds(chatIds);
            }
        }

        if (!text || msg.entities?.some((e) => e.type === 'bot_command')) {
            return;
        }

        if (state === 'awaitingTokenName' && text !== 'Filter setting' && text !== 'Set filter') {
            context = context.selectedChatId ? getChatContext(Number(context.selectedChatId)) : context;

            context.token = text.trim();
            userState[chatId] = 'idle';

            await bot.sendMessage(chatId, CONST.CHOOSE_NETWORK, {reply_markup: getNetworkInlineKeyboard()});
            return;
        }

        if (state === 'awaitingMintAddress' && text !== 'Filter setting' && text !== 'Set filter') {
            context = context.selectedChatId ? getChatContext(Number(context.selectedChatId)) : context;

            context.mintAddress = text.trim();
            userState[chatId] = 'idle';

            await bot.sendMessage(chatId, CONST.MINT_ADDRESS_SAVED, {reply_to_message_id: msg.message_id});

            let sentMessage = await bot.sendMessage(chatId, generateFilterMessage(context), {
                parse_mode: 'HTML',
                reply_markup: context.selectedChatId ? getFilterInlineKeyboard() : getGroupFilterInlineKeyboard()
            });

            context.previousMessageId = sentMessage.message_id;
            return;
        }

        if (state === 'awaitingMinPrice' && text !== 'Filter setting' && text !== 'Set filter') {
            context = context.selectedChatId ? getChatContext(Number(context.selectedChatId)) : context;

            let parsed = parseFloat(text.replace(',', '.'));

            if (!isNaN(parsed)) {
                context.minPrice = parsed;

                userState[chatId] = 'awaitingMaxPrice';

                await bot.sendMessage(chatId, CONST.ENTER_MAX_PRICE);
                return;
            } else {
                await bot.sendMessage(chatId, CONST.INVALID_NUMBER_INPUT);
                return;
            }
        }

        if (state === 'awaitingMaxPrice' && text !== 'Filter setting' && text !== 'Set filter') {
            context = context.selectedChatId ? getChatContext(Number(context.selectedChatId)) : context;

            let parsed = parseFloat(text.replace(',', '.'));

            if (!isNaN(parsed)) {
                context.maxPrice = parsed;

                userState[chatId] = 'idle';

                await bot.sendMessage(chatId, CONST.PRICES_SAVED);

                let sentMessage = await bot.sendMessage(chatId, generateFilterMessage(context), {
                    parse_mode: 'HTML',
                    reply_markup: context.selectedChatId ? getFilterInlineKeyboard() : getGroupFilterInlineKeyboard()
                });

                context.previousMessageId = sentMessage.message_id;
                return;
            } else {
                await bot.sendMessage(chatId, CONST.INVALID_NUMBER_INPUT);
                return;
            }
        }

        if (text === 'Filter setting') {
            await bot.sendMessage(chatId, CONST.FILTER_SETTINGS, {reply_markup: filterSettingMenu});
            return;
        }

        if (text === 'Return') {
            if (userState[chatId] == 'returnToFilterSettings') {
                await bot.sendMessage(chatId, CONST.FILTER_SETTINGS, {reply_markup: filterSettingMenu});

                userState[chatId] = 'idle';
            } else {
                await bot.sendMessage(chatId, CONST.MAIN_MENU, {reply_markup: mainMenu});
            }
            return;
        }

        if (text === 'Set filter') {            
            context.selectedChatId = undefined;

            let sentMessage = await bot.sendMessage(chatId, generateFilterMessage(context), {
                parse_mode: 'HTML',
                reply_markup: getFilterInlineKeyboard()
            });

            context.previousMessageId = sentMessage.message_id; 
            return;
        }

        if (text === 'Set chat filter') {
            let userChatIds = context.chatIds || [];
            let inline_keyboard = [];
            userState[chatId] = 'returnToFilterSettings';

            await bot.sendMessage(chatId, CONST.ADD_BOT_TO_CHAT_AND_GRANT_RIGHTS, {reply_markup: filterChatSettingMenu});

            if (!context.chatIds || context.chatIds?.length == 0) {
                return;
            }
            
            inline_keyboard = await Promise.all(userChatIds.map(async (id) => {
                const chat = await bot.getChat(id);
                return [{ text: chat.title || `Chat ${id}`, callback_data: `chat_${id}` }];
            }));

            let sentMessage = await bot.sendMessage(chatId, CONST.SELECT_CHAT_TO_SET_FILTER, {reply_markup: { inline_keyboard }});
            
            context.previousMessageId = sentMessage.message_id; 

            return;
        }
    });
}
