import TelegramBot from 'node-telegram-bot-api';
import * as CONST from '../const'
import { getChatContext, userState, generateFilterMessage } from './utils';
import { getFilterInlineKeyboard, getClearFilterInlineKeyboard, getEventInlineKeyboard, getGroupFilterInlineKeyboard, filterChatSettingMenu } from './keyboards';


export function handleCallbackQuery(bot: TelegramBot) {
    bot.on('callback_query', async (query) => {
        let chatId = query.message?.chat.id;
        if (!chatId) return;
        let context = getChatContext(chatId);

        let data = query.data || '';

        if (data.startsWith('filter:')) {
            if (context.selectedChatId) {
                context = getChatContext(Number(context.selectedChatId));
            }

            const filterType = data.split(':')[1];

            switch (filterType) {
                case 'token_network':
                    userState[chatId] = 'awaitingTokenName';

                    if (context.previousMessageId !== undefined) {
                        await bot.deleteMessage(chatId, context.previousMessageId);
                    }

                    await bot.sendMessage(chatId, 'Enter the token name:', {});
                    break;

                case 'mint_address':
                    userState[chatId] = 'awaitingMintAddress';
                    
                    if (context.previousMessageId !== undefined) {
                        await bot.deleteMessage(chatId, context.previousMessageId);
                    }

                    await bot.sendMessage(chatId, 'Enter the mint address:', {});
                    break;

                case 'event':
                    let inline_keyboard = getEventInlineKeyboard();
                    let eventTypes = context.eventTypes;
                    const eventMap: Record<string, number> = {
                        'Mint': 0,
                        'Burn': 1,
                        'Create': 2
                    };

                    eventTypes?.forEach((event) => {
                        const index = eventMap[event.charAt(0).toUpperCase() + event.slice(1)];
                        if (index !== undefined) {
                            inline_keyboard.inline_keyboard[index][0].text = inline_keyboard.inline_keyboard[index][0].text.replace('⬜️', '✅');
                        }
                    });

                    await bot.editMessageText('Select an event:', {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: inline_keyboard
                    });
                    break;

                case 'price':
                    userState[chatId] = 'awaitingMinPrice';

                    if (context.previousMessageId !== undefined) {
                        await bot.deleteMessage(chatId, context.previousMessageId);
                    }

                    await bot.sendMessage(chatId, 'Enter the minimum price value:');
                    break;

                case 'clear':
                    await bot.editMessageText('What to clear?', {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: getClearFilterInlineKeyboard()
                    });
                    break;
                default:
                    break;
            }
        } else if (data.startsWith('network:')) {
            context = context.selectedChatId ? getChatContext(Number(context.selectedChatId)) : context;

            let networkName = data.split(':')[1];
            context.networkName = networkName;


            await bot.editMessageText(generateFilterMessage(context), {
                chat_id: chatId,
                parse_mode: 'HTML',
                message_id: query.message?.message_id,
                reply_markup: context.selectedChatId ? getFilterInlineKeyboard() : getGroupFilterInlineKeyboard()
            });

            context.previousMessageId = query.message?.message_id;
        } else if (data.startsWith('event:')) {
            context = context.selectedChatId ? getChatContext(Number(context.selectedChatId)) : context;

            let eventType = data.split(':')[1];
            let inline_keyboard = getEventInlineKeyboard();
            let eventTypes = context.eventTypes;

            if (eventType == 'return') {
                await bot.editMessageText(generateFilterMessage(context), {
                    chat_id: chatId,
                    parse_mode: 'HTML',
                    message_id: query.message?.message_id,
                    reply_markup: context.selectedChatId ? getFilterInlineKeyboard() : getGroupFilterInlineKeyboard()
                });

                context.previousMessageId = query.message?.message_id;
            }

            eventTypes?.forEach((event) => {
                let index = CONST.EVENT_MAP[event.charAt(0).toUpperCase() + event.slice(1)];
                if (index !== undefined) {
                    inline_keyboard.inline_keyboard[index][0].text = inline_keyboard.inline_keyboard[index][0].text.replace(CONST.UNCHECKED_BOX, CONST.CHECKED_BOX);
                }
            });

            let index = CONST.EVENT_MAP[eventType];
            if (index !== undefined) {
                let eventKey = eventType.toLowerCase();
                if (context.eventTypes?.includes(eventKey)) {
                    context.eventTypes = context.eventTypes.filter(event => event !== eventKey);
                    inline_keyboard.inline_keyboard[index][0].text = inline_keyboard.inline_keyboard[index][0].text.replace(CONST.CHECKED_BOX, CONST.UNCHECKED_BOX);
                } else {
                    context.eventTypes = context.eventTypes || [];
                    context.eventTypes.push(eventKey);
                    inline_keyboard.inline_keyboard[index][0].text = inline_keyboard.inline_keyboard[index][0].text.replace(CONST.UNCHECKED_BOX, CONST.CHECKED_BOX);
                }

                await bot.editMessageReplyMarkup(inline_keyboard, {
                    chat_id: chatId,
                    message_id: query.message?.message_id
                });
            }
        } else if (data.startsWith('clear:')) {
            context = context.selectedChatId ? getChatContext(Number(context.selectedChatId)) : context;

            let clearType = data.split(':')[1];

            switch (clearType) {
                case 'token_network':
                    context.token = undefined;
                    context.networkName = undefined;

                    await bot.editMessageText(CONST.TOKEN_AND_NETWORK_DATA_CLEARED, {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: getClearFilterInlineKeyboard()
                    });
                    break;
                case 'mint_address':
                    context.mintAddress = undefined;

                    await bot.editMessageText(CONST.MINT_ADDRESS_DATA_CLEARED, {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: getClearFilterInlineKeyboard()
                    });
                    break;
                case 'event':
                    context.eventTypes = undefined;

                    await bot.editMessageText(CONST.EVENT_DATA_CLEARED, {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: getClearFilterInlineKeyboard()
                    });
                    break;
                case 'price':
                    context.maxPrice = undefined;
                    context.minPrice = undefined;

                    await bot.editMessageText(CONST.PRICE_DATA_CLEARED, {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: getClearFilterInlineKeyboard()
                    });
                    break;
                case 'return':
                    await bot.editMessageText(generateFilterMessage(context), {
                        chat_id: chatId,
                        parse_mode: 'HTML',
                        message_id: query.message?.message_id,
                        reply_markup: context.selectedChatId ? getFilterInlineKeyboard() : getGroupFilterInlineKeyboard()
                    });

                    context.previousMessageId = query.message?.message_id;
                    break;
                default:
                    break;
            }
        } else if (data.startsWith('chat_')) {
            const selectedChatId = data.split('_')[1];
            context.selectedChatId = selectedChatId;

            context = getChatContext(Number(context.selectedChatId));

            await bot.editMessageText(generateFilterMessage(context), {
                chat_id: chatId,
                message_id: query.message?.message_id,
                parse_mode: 'HTML',
                reply_markup: getGroupFilterInlineKeyboard()
            });

            context.previousMessageId = query.message?.message_id; 

        } else if (data.startsWith('returnToGroups')) {
            let inline_keyboard = [];
            let userChatIds = context.chatIds || [];

            inline_keyboard = await Promise.all(userChatIds.map(async (id) => {
                const chat = await bot.getChat(id);
                return [{ text: chat.title || `Chat ${id}`, callback_data: `chat_${id}` }];
            }));

            await bot.editMessageText(CONST.SELECT_CHAT_TO_SET_FILTER, {
                chat_id: chatId,
                message_id: query.message?.message_id,
                reply_markup: {inline_keyboard}
            });

            context = getChatContext(chatId);
        } else if (data.startsWith('deleteGroup')) {
            context = getChatContext(Number(context.selectedChatId));
            
            if (context.previousMessageId !== undefined) {
                await bot.deleteMessage(chatId, context.previousMessageId);
            }

            context.token = undefined;
            context.networkName = undefined;
            context.eventTypes = undefined;
            context.mintAddress = undefined;
            context.minPrice = undefined;
            context.maxPrice = undefined;
            context.chatIds = undefined;
            context.selectedChatId = undefined;
            context.previousMessageId = undefined;


            context = getChatContext(chatId);
            context.chatIds = context.chatIds?.filter(id => id !== Number(context.selectedChatId));
            
            let userChatIds = context.chatIds || [];
            let inline_keyboard = [];
            userState[chatId] = 'returnToFilterSettings';

            await bot.sendMessage(chatId, CONST.ADD_BOT_TO_CHAT_AND_GRANT_RIGHTS, {
                reply_markup: filterChatSettingMenu
            });

            if (context.chatIds?.length == 0) {
                return;
            }
            
            inline_keyboard = await Promise.all(userChatIds.map(async (id) => {
                const chat = await bot.getChat(id);
                return [{ text: chat.title || `Chat ${id}`, callback_data: `chat_${id}` }];
            }));

            let sentMessage = await bot.sendMessage(chatId, CONST.SELECT_CHAT_TO_SET_FILTER, {
                reply_markup: { inline_keyboard }
            });
            
            context.previousMessageId = sentMessage.message_id; 
        }

        await bot.answerCallbackQuery(query.id);
    });
}