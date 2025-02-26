import TelegramBot from 'node-telegram-bot-api';
import { getChatContext, userState } from './utils';
import { getFilterInlineKeyboard, getClearFilterInlineKeyboard, getEventInlineKeyboard } from './keyboards';

export function handleCallbackQuery(bot: TelegramBot) {
    bot.on('callback_query', async (query) => {
        const chatId = query.message?.chat.id;
        if (!chatId) return;

        const context = getChatContext(chatId);

        const data = query.data || '';

        if (data.startsWith('filter:')) {
            const filterType = data.split(':')[1];

            switch (filterType) {
                case 'token_network':
                    userState[chatId] = 'awaitingTokenName';
                    await bot.sendMessage(chatId, 'Enter the token name:', {});
                    break;

                case 'mint_address':
                    userState[chatId] = 'awaitingMintAddress';
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
            const networkName = data.split(':')[1];
            context.networkName = networkName;

            let message = `
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

✅ <b>Data saved</b>

👇 Select a filter:`;

            await bot.editMessageText(message, {
                chat_id: chatId,
                parse_mode: 'HTML',
                message_id: query.message?.message_id,
                reply_markup: getFilterInlineKeyboard()
            });
        } else if (data.startsWith('event:')) {
            const eventType = data.split(':')[1];
            let inline_keyboard = getEventInlineKeyboard();
            let eventTypes = context.eventTypes;

            const eventMap: Record<string, number> = {
                'Mint': 0,
                'Burn': 1,
                'Create': 2
            };

            if (eventType == 'return') {
                let message = `
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

👇 Select a filter:`;

                await bot.editMessageText(message, {
                    chat_id: chatId,
                    parse_mode: 'HTML',
                    message_id: query.message?.message_id,
                    reply_markup: getFilterInlineKeyboard()
                });
            }

            eventTypes?.forEach((event) => {
                const index = eventMap[event.charAt(0).toUpperCase() + event.slice(1)];
                if (index !== undefined) {
                    inline_keyboard.inline_keyboard[index][0].text = inline_keyboard.inline_keyboard[index][0].text.replace('⬜️', '✅');
                }
            });

            const index = eventMap[eventType];
            if (index !== undefined) {
                const eventKey = eventType.toLowerCase();
                if (context.eventTypes?.includes(eventKey)) {
                    context.eventTypes = context.eventTypes.filter(event => event !== eventKey);
                    inline_keyboard.inline_keyboard[index][0].text = inline_keyboard.inline_keyboard[index][0].text.replace('✅', '⬜️');
                } else {
                    context.eventTypes = context.eventTypes || [];
                    context.eventTypes.push(eventKey);
                    inline_keyboard.inline_keyboard[index][0].text = inline_keyboard.inline_keyboard[index][0].text.replace('⬜️', '✅');
                }

                await bot.editMessageReplyMarkup(inline_keyboard, {
                    chat_id: chatId,
                    message_id: query.message?.message_id
                });
            }
        } else if (data.startsWith('clear:')) {
            const clearType = data.split(':')[1];
            switch (clearType) {
                case 'token_network':
                    context.token = undefined;
                    context.networkName = undefined;

                    await bot.editMessageText('Token and network data cleared. What else to clear or return?', {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: getClearFilterInlineKeyboard()
                    });
                    break;
                case 'mint_address':
                    context.mintAddress = undefined;

                    await bot.editMessageText('Mint address data cleared. What else to clear or return?', {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: getClearFilterInlineKeyboard()
                    });
                    break;
                case 'event':
                    context.eventTypes = undefined;

                    await bot.editMessageText('Event data cleared. What else to clear or return?', {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: getClearFilterInlineKeyboard()
                    });
                    break;
                case 'price':
                    context.maxPrice = undefined;
                    context.minPrice = undefined;

                    await bot.editMessageText('Price data cleared. What else to clear or return?', {
                        chat_id: chatId,
                        message_id: query.message?.message_id,
                        reply_markup: getClearFilterInlineKeyboard()
                    });
                    break;
                case 'return':
                    let message = `
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

👇 Select a filter:`;

                    await bot.editMessageText(message, {
                        chat_id: chatId,
                        parse_mode: 'HTML',
                        message_id: query.message?.message_id,
                        reply_markup: getFilterInlineKeyboard()
                    });
                    break;
                default:
                    break;
            }
        }

        await bot.answerCallbackQuery(query.id);
    });
}