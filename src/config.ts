import dotenv from 'dotenv';
import { Commitment } from '@solana/web3.js';

dotenv.config();

export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export const PROGRAM_PUBKEY = process.env.PROGRAM_PUBKEY || 'YourProgramPublicKeyHere';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';

export const EVENT_EXPIRE_SECONDS = 3600_000;

export const  NETWORK_ID: { [key: number]: string } = {
    0: 'Twitter',
    1: 'Telegram',
    2: 'Facebook',
    3: 'Instagram'
}

export const COMMITMENT: Commitment = 'processed';