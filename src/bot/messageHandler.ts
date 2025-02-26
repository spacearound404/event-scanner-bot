import TelegramBot from 'node-telegram-bot-api';
import { getChatContext, saveChatContext, saveChatIds, chatContext, userState } from './utils';
import { getFilterInlineKeyboard, getNetworkInlineKeyboard, filterSettingMenu, mainMenu } from './keyboards';

export function handleMessage(bot: TelegramBot, myUsername: string, chatIds: Set<number>) {
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
        const chatId = msg.chat.id;
        const text = msg.text || '';

        if (!text || msg.entities?.some((e) => e.type === 'bot_command')) {
            return;
        }

        const state = userState[chatId] || 'idle';
        const context = getChatContext(chatId);

        if (state === 'awaitingTokenName' && text !== 'Filter setting' && text !== 'Set filter') {
            context.token = text.trim();

            userState[chatId] = 'idle';
            await bot.sendMessage(chatId, 'Choose network', {
            reply_markup: getNetworkInlineKeyboard()
            });
            return;
        }

        if (state === 'awaitingMintAddress' && text !== 'Filter setting' && text !== 'Set filter') {
            chatContext[chatId].mintAddress = text.trim();
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

            await bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: getFilterInlineKeyboard()
            });
            return;
        }

        if (state === 'awaitingMinPrice' && text !== 'Filter setting' && text !== 'Set filter') {
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

            await bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                reply_markup: getFilterInlineKeyboard()
            });
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
            await bot.sendMessage(chatId, 'Main menu:', {
            reply_markup: mainMenu
            });
            return;
        }

        if (text === 'Set filter') {
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

            await bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: getFilterInlineKeyboard()
            });
            return;
        }

        if (text === 'Set chat filter') {
            await bot.sendMessage(chatId, 'Setting chat filter (example functionality).', {
            reply_markup: filterSettingMenu
            });
            return;
        }
    });
}
