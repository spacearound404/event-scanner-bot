
import TelegramBot, { ChatAdministratorRights } from 'node-telegram-bot-api';

let bot: TelegramBot;

export function getFilterInlineKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'by token + network', callback_data: 'filter:token_network' }],
      [{ text: 'by mint address', callback_data: 'filter:mint_address' }],
      [{ text: 'by event', callback_data: 'filter:event' }],
      [{ text: 'by price', callback_data: 'filter:price' }],
      [{ text: 'clear filter', callback_data: 'filter:clear' }]
    ]
  };
}

export function getGroupFilterInlineKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'by token + network', callback_data: 'filter:token_network' }],
      [{ text: 'by mint address', callback_data: 'filter:mint_address' }],
      [{ text: 'by event', callback_data: 'filter:event' }],
      [{ text: 'by price', callback_data: 'filter:price' }],
      [{ text: 'clear filter', callback_data: 'filter:clear' }],
      [{ text: 'delete group', callback_data: 'deleteGroup' }],
      [{ text: 'return', callback_data: 'returnToGroups' }]
    ]
  };
}

export function getClearFilterInlineKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'by token + network', callback_data: 'clear:token_network' }],
      [{ text: 'by mint address', callback_data: 'clear:mint_address' }],
      [{ text: 'by event', callback_data: 'clear:event' }],
      [{ text: 'by price', callback_data: 'clear:price' }],
      [{ text: 'return', callback_data: 'clear:return' }]
    ]
  };
}

export function getNetworkInlineKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Twitter', callback_data: 'network:Twitter' }],
      [{ text: 'Instagram', callback_data: 'network:Instagram' }],
      [{ text: 'Telegram', callback_data: 'network:Telegram' }],
      [{ text: 'Facebook', callback_data: 'network:Facebook' }]
    ]
  };
}

export function getEventInlineKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '⬜️ Mint', callback_data: 'event:Mint' }],
      [{ text: '⬜️ Burn', callback_data: 'event:Burn' }],
      [{ text: '⬜️ Create', callback_data: 'event:Create' }],
      [{ text: 'Back', callback_data: 'event:return' }],
    ]
  };
}

export const mainMenu: TelegramBot.ReplyKeyboardMarkup = {
  keyboard: [
    [{ text: 'Filter setting' }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false
};

export const filterSettingMenu: TelegramBot.ReplyKeyboardMarkup = {
  keyboard: [
    [
      { text: 'Set filter' },
      { text: 'Set chat filter' }
    ],
    [
      { text: 'Return' }
    ]
  ],
  resize_keyboard: true,
  one_time_keyboard: false
};

export const filterChatSettingMenu: TelegramBot.ReplyKeyboardMarkup = {
  keyboard: [
    [
      {
        text: 'Add private chat',
        request_chat: {
          request_id: 1,
          chat_is_channel: false,
          chat_has_username: false,
        }
      },
      {
        text: 'Add public chat',
        request_chat: {
          request_id: 2,
          chat_is_channel: false,
          chat_has_username: true,
        }
      },
    ],
    [
      {
        text: 'Add channel',
        request_chat: {
          request_id: 3,
          chat_is_channel: true,
        }
      },
    ],
    [
      { text: 'Return' }
    ]
  ],
  resize_keyboard: true,
  one_time_keyboard: false
};