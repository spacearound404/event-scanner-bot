import * as sdk from '@hypewatch/sdk';

export const BURN_EVENT: number = 5;
export const MINT_EVENT: number = 4;
export const NEW_TOKEN_EVENT: number = 3;

export const EVENT_MAP: Record<string, number> = {
    'Mint': 0,
    'Burn': 1,
    'Create': 2
};

export const MINT_TYPE: 'mint' = 'mint';
export const BURN_TYPE: 'burn' = 'burn';
export const NEWTOKEN_TYPE: 'newtoken' = 'newtoken';

export const START_LISTEN: string = 'Starting to listen for contract logs...';
export const SIGNATURE_PROCESSED = (signature: string) => `Signature ${signature} already processed, skipping...`;
export const HANDLE_LOGS_ERROR = (error: unknown) => `Error in handleLogs: ${error}`;
export const RECEIVED_LOG_WITH_ERROR: string = 'Received log with non-null error, ignoring';
export const ERROR_PARSING_LOGS: string = 'Error parsing solana log:';
export const ERROR_FORMATTING_LOGS: string = 'Failed formatting solana log object (report):';
export const UNRECOGNIZED_TRANSACTION_TYPE = (event: sdk.Event) => `Unrecognized transaction type, event=${event}`;
export const NO_TRANSACTIONS_FOUND = (signature: string) => `Для сигнатуры ${signature} не найдено транзакций.`;
export const BOT_START: string = 'Telegram bot initialized';
export const ERROR_BOT_START: string = 'Telegram bot is not initialized. Call initTelegramBot() first.';
export const TELEGRAM_SEND_ERROR = (id: number) => `Failed to send message to Telegram (chatId: ${id}): `;

export const SOLANA_DEV: string = 'dev';
export const SOLANA_MAIN: string = 'main';

export const ADDRESS_ENTITY: string = 'address';
export const ACCOUNT_ENTITY: string = 'account';
export const TX_ENTITY: string = 'tx';

export const HYPE_CRNY_TICKER: string = 'HYPE';

export const UTF_8: string = 'utf-8';

export const MESSAGE_TELEGRAM_EVENT: string = 'message';
export const MY_CHAT_MEMBER_TELEGRAM_EVENT: string = 'my_chat_member';

export const ADMIN_CHAT_MEMBER_STATUS: string = '';

export const ADMIN_STATUS_MEMBER: string = 'administrator';
export const CREATOR_STATUS_MEMBER: string = 'creator';

export const ADD_BOT_TO_CHAT: string = 'First, add the bot to the chat and make it an administrator';
export const NO_PERMISSION_TO_EDIT_FILTERS: string = 'You do not have permission to edit filters';
export const SELECT_CHAT_TO_SET_FILTER: string = 'Select chat to set filter';
export const CHOOSE_NETWORK: string = 'Choose network';
export const MINT_ADDRESS_SAVED: string = '✅ Mint address saved';
export const ENTER_MAX_PRICE: string = 'Enter the maximum price value:';
export const INVALID_NUMBER_INPUT: string = 'Invalid number input, please try again';
export const PRICES_SAVED: string = '✅ Prices saved';
export const FILTER_SETTINGS: string = 'Filter settings:';
export const MAIN_MENU: string = 'Main menu:';
export const ADD_BOT_TO_CHAT_AND_GRANT_RIGHTS: string = 'Add the bot to a chat first and grant it administrator rights. Only the group or channel owner can manage filters. Otherwise, the bot will not grant access to the filters.';
export const WELCOME_MESSAGE: string = 'Welcome! Please choose an action:';
export const UNCHECKED_BOX: string = '⬜️';
export const CHECKED_BOX: string = '✅';
export const TOKEN_AND_NETWORK_DATA_CLEARED: string = 'Token and network data cleared. What else to clear or return?';
export const MINT_ADDRESS_DATA_CLEARED: string = 'Mint address data cleared. What else to clear or return?';
export const EVENT_DATA_CLEARED: string = 'Event data cleared. What else to clear or return?';
export const PRICE_DATA_CLEARED: string = 'Price data cleared. What else to clear or return?';
export const ERROR_AUTO_SAVING_OBJECT: string = 'Error auto-saving persistent object:';
export const FAILED_TO_SAVE_CHAT_CONTEXT: string = 'Failed to save chatContext';