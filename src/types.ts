import { Commitment } from '@solana/web3.js';

export type TradeTransaction = {
  id: string;
  tokenId: string;
  orderId: string;
  token: string;
  creator: string;
  wallet: string;
  address: string;
  networkId: number;
  type: 'mint' | 'burn';
  committedAt: string;
  createdAt: string;
  supply: number;
  supplyDelta: number;
  baseCrncyAmount: number;
};

export type NewTokenTransaction = {
  id: string;
  tokenId: string;
  orderId: string;
  token: string;
  creator: string;
  wallet: string;
  address: string;
  networkId: number;
  type: 'newtoken';
  committedAt: string;
  createdAt: string;
};

export type Transaction = TradeTransaction | NewTokenTransaction;