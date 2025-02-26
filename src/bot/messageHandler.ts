import TelegramBot from 'node-telegram-bot-api';
import { getChatContext, saveChatContext, saveChatIds, chatContext, userState } from './utils';
import { getFilterInlineKeyboard, getNetworkInlineKeyboard, filterSettingMenu, mainMenu, filterChatSettingMenu, getGroupFilterInlineKeyboard } from './keyboards';

export function handleMessage(bot: TelegramBot, myUsername: string, chatIds: Set<number>) {
    bot.on('message', async (msg) => {
        const state = userState[msg.chat.id] || 'idle';
        let context = getChatContext(msg.chat.id);

        if (msg.chat_shared) {

            let botInfo = await bot.getMe();
            let botId = botInfo.id;

            const botMember = await bot.getChatMember(msg.chat_shared.chat_id, botId);

            console.log(botMember);
            
            if (botMember.status != 'member' && botMember.status != 'administrator') {
                await bot.sendMessage(msg.chat.id, 'First, add the bot to the chat and make it an administrator');

                return;
            }

            const chatMember = await bot.getChatMember(msg.chat_shared.chat_id, msg.chat.id);

            if (chatMember.status !== 'administrator' && chatMember.status !== 'creator') {
                await bot.sendMessage(msg.chat.id, 'You do not have permission to edit filters.');
                return;
            }

            if (!context?.chatIds) {
                context.chatIds = [];
            }

            context.chatIds?.push(msg.chat_shared.chat_id);
            
            const sharedChatId = msg.chat_shared.chat_id;
            chatIds.add(sharedChatId);
            await saveChatIds(chatIds);
            console.log(`Shared chat ID saved: ${sharedChatId}`);

            let userChatIds = context.chatIds || [];
            let inline_keyboard = [];

            inline_keyboard = await Promise.all(userChatIds.map(async (id) => {
                const chat = await bot.getChat(id);
                return [{ text: chat.title || `Chat ${id}`, callback_data: `chat_${id}` }];
            }));

            let sentMessage = await bot.sendMessage(msg.chat.id, 'Select a chat to set filter:', {
                reply_markup: {
                    inline_keyboard
                }
            });
        }

        if (msg.new_chat_members) {
            const botUser = msg.new_chat_members.find(
            (member) => member.username === myUsername
            );
            if (botUser) {
            chatIds.add(msg.chat.id);
            await saveChatIds(chatIds);
            }
        }
        const chatId = msg.chat.id;
        const text = msg.text || '';

        if (!text || msg.entities?.some((e) => e.type === 'bot_command')) {
            return;
        }

        if (state === 'awaitingTokenName' && text !== 'Filter setting' && text !== 'Set filter') {
            if (context.selectedChatId) {
                context = getChatContext(Number(context.selectedChatId));
            }

            context.token = text.trim();

            userState[chatId] = 'idle';
            await bot.sendMessage(chatId, 'Choose network', {
            reply_markup: getNetworkInlineKeyboard()
            });
            return;
        }

        if (state === 'awaitingMintAddress' && text !== 'Filter setting' && text !== 'Set filter') {
            if (context.selectedChatId) {
                context = getChatContext(Number(context.selectedChatId));
            }

            context.mintAddress = text.trim();
            userState[chatId] = 'idle';
            await bot.sendMessage(chatId, '✅ Mint address saved', {
            reply_to_message_id: msg.message_id
            });

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

👇 Choose filter:`

            let sentMessage = await bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                reply_markup: context.selectedChatId ? getFilterInlineKeyboard() : getGroupFilterInlineKeyboard()
            });

            context.previousMessageId = sentMessage.message_id;
            return;
        }

        if (state === 'awaitingMinPrice' && text !== 'Filter setting' && text !== 'Set filter') {
            if (context.selectedChatId) {
                context = getChatContext(Number(context.selectedChatId));
            }

            const parsed = parseFloat(text.replace(',', '.'));
            if (!isNaN(parsed)) {
            context.minPrice = parsed;

            userState[chatId] = 'awaitingMaxPrice';

            await bot.sendMessage(chatId, 'Enter the maximum price value:');
            return;
            } else {
            await bot.sendMessage(chatId, 'Invalid number input, please try again.');
            return;
            }
        }

        if (state === 'awaitingMaxPrice' && text !== 'Filter setting' && text !== 'Set filter') {
            if (context.selectedChatId) {
                context = getChatContext(Number(context.selectedChatId));
            }

            const parsed = parseFloat(text.replace(',', '.'));
            if (!isNaN(parsed)) {
            context.maxPrice = parsed;

            userState[chatId] = 'idle';

            await bot.sendMessage(chatId, '✅ Prices saved');

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

👇 Choose filter:`

            let sentMessage = await bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                reply_markup: context.selectedChatId ? getFilterInlineKeyboard() : getGroupFilterInlineKeyboard()
            });

            context.previousMessageId = sentMessage.message_id;
            return;
            } else {
            await bot.sendMessage(chatId, 'Invalid number input, please try again.');
            return;
            }
        }

        if (text === 'Filter setting') {
            await bot.sendMessage(chatId, 'Filter settings:', {
            reply_markup: filterSettingMenu
            });
            return;
        }

        if (text === 'Return') {
            if (userState[chatId] == 'returnToFilterSettings') {
                await bot.sendMessage(chatId, 'Filter settings:', {reply_markup: filterSettingMenu});

                userState[chatId] = 'idle';
            } else {
                await bot.sendMessage(chatId, 'Main menu:', {reply_markup: mainMenu});
            }
            return;
        }

        if (text === 'Set filter') {            
            context.selectedChatId = undefined;

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

👇 Choose filter:`

            let sentMessage = await bot.sendMessage(chatId, message, {
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

            await bot.sendMessage(chatId, 'Add the bot to a chat first and grant it administrator rights. Only the group or channel owner can manage filters. Otherwise, the bot will not grant access to the filters.', {
                reply_markup: filterChatSettingMenu
            });

            if (context.chatIds?.length == 0) {
                return;
            }
            
            inline_keyboard = await Promise.all(userChatIds.map(async (id) => {
                const chat = await bot.getChat(id);
                return [{ text: chat.title || `Chat ${id}`, callback_data: `chat_${id}` }];
            }));

            let sentMessage = await bot.sendMessage(chatId, 'Select a chat to set filter:', {
                reply_markup: {
                    inline_keyboard
                }
            });
            
            context.previousMessageId = sentMessage.message_id; 

            return;
        }
    });
}
