import * as sdk from '@hypewatch/sdk';
// import ParseMode from 'node-telegram-bot-api';

export const BURN_EVENT: number = 5
export const MINT_EVENT: number = 4
export const NEW_TOKEN_EVENT: number = 3

export const MINT_TYPE: 'mint' = 'mint';
export const BURN_TYPE: 'burn' = 'burn';
export const NEWTOKEN_TYPE: 'newtoken' = 'newtoken';

export const START_LISTEN: string = 'Starting to listen for contract logs...' 
export const SIGNATURE_PROCESSED = (signature: string) => `Signature ${signature} already processed, skipping...`;
export const HANDLE_LOGS_ERROR = (error: unknown) => `Error in handleLogs: ${error}`;
export const RECEIVED_LOG_WITH_ERROR: string = 'Received log with non-null error, ignoring';
export const ERROR_PARSING_LOGS: string = 'Error parsing solana log:';
export const ERROR_FORMATTING_LOGS: string = 'Failed formatting solana log object (report):';
export const UNRECOGNIZED_TRANSACTION_TYPE = (event: sdk.Event) => `Unrecognized transaction type, event=${event}`;
export const NO_TRANSACTIONS_FOUND = (signature: string) => `Для сигнатуры ${signature} не найдено транзакций.`;
export const BOT_START: string = 'Telegram bot initialized';
export const ERROR_BOT_START: string = 'Telegram bot is not initialized. Call initTelegramBot() first.';
export const TELEGRAM_SEND_ERROR = (err: unknown) => `Failed to send message to Telegram: ${err}`;

// export const HTML_PARSE_MODE: ParseMode = 'HTML'

