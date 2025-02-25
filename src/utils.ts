import * as CFG from './config';
import BigNumber from 'bignumber.js';
import * as CONST from './const'


export const processedSignatures = new Set<string>();

export function isAlreadyProcessed(signature: string): boolean {
  return processedSignatures.has(signature);
}

export function markAsProcessed(signature: string): void {
  processedSignatures.add(signature);
  setTimeout(() => {
    processedSignatures.delete(signature);
  }, CFG.EVENT_EXPIRE_SECONDS);
}

export function createMessage(baseUrl: string, tx: any, spent: string, got: string, buyerUrlScan: string, txUrlScan: string, isFirstMint: boolean, tokenPriceUsd: BigNumber, marketCap: string): string {
  return `
<b> <a href="${baseUrl}">${tx.address}</a> | <a href="${baseUrl}">${CFG.NETWORK_ID[tx.networkId]}</a> | ${tx.type == CONST.MINT_TYPE ? "BUY!": "SELL"} </b>
🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧
🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧
🔀 <b>Spent:</b> ${spent} 
🔀 <b>Got:</b> ${got}
👤 <b></b><a href="${buyerUrlScan}">Buyer</a> | <b></b><a href="${txUrlScan}">TX</a>${isFirstMint ? `\n<a href="${buyerUrlScan}">🪙 New Holder</a>` : ''}
🏷 <b>Price:</b> $${tokenPriceUsd.toFixed(2)} (${tx.supplyDelta.toFixed(2)}%)
💸 <b>Market Cap:</b> $${marketCap}
<a href="https://hype.fun/">Hype.fun</a> | <a href="https://x.com/hype_protocol">Twitter</a> | <a href="https://t.me/hype_fam">Telegram</a>
  `.trim();
}

export function calculateReserve(
  currentSupply: number | BigNumber,
  rootData: any
) {
  const bnCurrentSupply = new BigNumber(currentSupply);
  return new BigNumber(rootData.maxSupply)
    .multipliedBy(bnCurrentSupply)
    .multipliedBy(rootData.initPrice)
    .dividedBy(new BigNumber(rootData.maxSupply).minus(bnCurrentSupply));
}

export function getTokenPrice(
  currentSupply: number | BigNumber,
  rootData: any,
  reserveParam?: number | BigNumber
) {
  const reserve =
    reserveParam === undefined
      ? calculateReserve(currentSupply, rootData)
      : new BigNumber(reserveParam);

  return reserve
    .plus(new BigNumber(rootData.maxSupply).multipliedBy(new BigNumber(rootData.initPrice)))
    .dividedBy(new BigNumber(rootData.maxSupply).minus(currentSupply));
}