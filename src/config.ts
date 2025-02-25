import dotenv from 'dotenv';
import { Commitment } from '@solana/web3.js';

dotenv.config();

export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export const PROGRAM_PUBKEY = process.env.PROGRAM_PUBKEY || 'YourProgramPublicKeyHere';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
// export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';

export const EVENT_EXPIRE_SECONDS = 3600_000;

export const  NETWORK_ID: { [key: number]: string } = {
    0: 'Twitter',
    1: 'Telegram',
    2: 'Instagram',
    3: 'Facebook'
}

export const  TICKER: { [key: number]: string } = {
    0: 't',
    1: 'tg',
    2: 'ig',
    3: 'fb'
}

export const COMMITMENT: Commitment = 'processed';

export const PROGRAM_VERSION = process.env.PROGRAM_VERSION || '0';

export const HYPE_DEV_URL: string = process.env.HYPE_DEV_URL || 'https://dev.hype.vote/';
export const HYPE_MAIN_URL: string = process.env.HYPE_MAIN_URL || 'https://hype.fun/';
export const SOLANA_MAIN_URL: string = process.env.SOLANA_MAIN_URL || 'https://solscan.io/';
export const SOLANA_DEV_URL: string = process.env.SOLANA_DEV_URL || 'https://explorer.solana.com/';
export const SOLANA_ENV: string = process.env.SOLANA_ENV || 'dev';