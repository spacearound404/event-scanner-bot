import { Connection, PublicKey, Logs, Commitment, Signer } from '@solana/web3.js';
import { PROGRAM_PUBKEY, SOLANA_RPC_URL, PROGRAM_VERSION } from './config';
import { broadcastEventNotification } from './telegramBot';
import { getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as sdk from '@hypewatch/sdk';
import { NETWORK_ID, COMMITMENT, HYPE_DEV_URL, HYPE_MAIN_URL, SOLANA_MAIN_URL, SOLANA_ENV, SOLANA_DEV_URL, TICKER } from './config'
import { TradeTransaction , NewTokenTransaction, Transaction } from './types'
import { isAlreadyProcessed, markAsProcessed } from './utils'
import * as CONST from './const'
import BigNumber from 'bignumber.js';


const connection = new Connection(SOLANA_RPC_URL, COMMITMENT as Commitment);


export function subscribeToSolanaLogs(): void {
  console.log(CONST.START_LISTEN);

  const programPublicKey: PublicKey = new PublicKey(PROGRAM_PUBKEY);

  connection.onLogs(
    programPublicKey,
    (logs: Logs) => {
      if (isAlreadyProcessed(logs.signature)) {
        console.log(CONST.SIGNATURE_PROCESSED(logs.signature));
        return;
      }

      handleLogs(logs).catch((error) => {
        console.error(CONST.HANDLE_LOGS_ERROR(error));
      });

      markAsProcessed(logs.signature);
    },
    COMMITMENT
  );
}

async function handleLogs(logs: Logs): Promise<void> {
  if (logs.err !== null) {
    console.error(
      JSON.stringify({
        now: performance.now(),
        message: CONST.RECEIVED_LOG_WITH_ERROR,
        error: logs.err,
        logs: logs.logs,
      })
    );
    return;
  }

  const { transactions } = parseLogsToTransactions(logs);

  if (transactions.length) {
    const formattedMessage = await formatMessageForTelegram(transactions, logs.signature);

    if (formattedMessage.trim().length > 0) {
      broadcastEventNotification(formattedMessage);
    }
  }
}


function parseLogsToTransactions(logs: Logs): { transactions: Transaction[]; lastOrderId: number } {
  let reports: sdk.Report[] = [];

  try {
    reports = sdk.getReports(logs.logs, Math.pow(10, 6));
  } catch (error) {
    console.error(
      JSON.stringify({
        now: performance.now(),
        message: CONST.ERROR_PARSING_LOGS,
        logs: logs.logs,
        error,
      })
    );
  }

  const orderIds: number[] = reports.map((r) => (r.report as { orderId?: number }).orderId ?? -1);
  const lastOrderId: number = Math.max.apply(Math, orderIds);

  const transactions: Transaction[] = reports
    .map((report) => {
      try {
        return formatTransaction(report, logs.signature);
      } catch (error) {
        console.error(
          JSON.stringify({
            now: performance.now(),
            message: CONST.ERROR_FORMATTING_LOGS,
            report,
            error,
          })
        );
      }
    })
    .filter((tx) => tx) as Transaction[];

  return { transactions, lastOrderId };
}

function formatTransaction(solanaReport: sdk.Report, signature: string): TradeTransaction | NewTokenTransaction {
  const { event, report } = solanaReport;

  if (event === CONST.NEW_TOKEN_EVENT) {
    const { tokenId, orderId, mint: token, creator, address, networkId, time } = report as sdk.NewTokenReport;
    return {
      id: signature,
      tokenId: tokenId.toString(),
      orderId: orderId.toString(),
      token: token.toString(),
      creator: creator.toString(),
      wallet: creator.toString(),
      address,
      networkId,
      type: CONST.NEWTOKEN_TYPE,
      committedAt: time.toISOString().slice(0, -5),
      createdAt: new Date().toISOString().slice(0, -5),
    };
  } else if ([CONST.MINT_EVENT, CONST.BURN_EVENT].includes(event)) {
    const { tokenId, orderId, mint: token, creator, wallet, address, networkId, supply, tokensAmount, baseCrncyAmount, time } =
      report as sdk.MintReport | sdk.BurnReport;
    return {
      id: signature,
      tokenId: tokenId.toString(),
      orderId: orderId.toString(),
      token: token.toString(),
      creator: creator.toString(),
      wallet: (wallet || '').toString(),
      address,
      networkId,
      type: event === CONST.MINT_EVENT ? CONST.MINT_TYPE : CONST.BURN_TYPE,
      committedAt: time.toISOString().slice(0, -5),
      createdAt: new Date().toISOString().slice(0, -5),
      supply,
      supplyDelta: event === CONST.MINT_EVENT ? tokensAmount : -tokensAmount,
      baseCrncyAmount: baseCrncyAmount,
    };
  } else {
    throw new Error(CONST.UNRECOGNIZED_TRANSACTION_TYPE(event));
  }
}

async function formatMessageForTelegram(transactions: Transaction[], signature: string): Promise<string> {
  const messagePromises = transactions.map(async (tx: any) => {
    if (!tx.baseCrncyAmount) {
      return;
    }

    let netTicker: string = TICKER[tx.networkId];
    let baseUrl: string = HYPE_DEV_URL;
    let buyerUrlScan: string = '';
    let txUrlScan: string = '';
    let priceDelta: string = '';
    let spent: string = '';
    let got: string = '';
    let isFirstMint: boolean = true;
    let balanceAfterTx: number = 0;

    const tokenPriceUsd: BigNumber = getTokenPrice(tx.supply, root);
    const marketCap: string = tokenPriceUsd.multipliedBy(new BigNumber(tx.supply)).toFixed(2);

    if (tx.supplyDelta) {
      const val = tx.baseCrncyAmount / tx.supplyDelta;
      priceDelta = `(${val.toFixed(2)})`;
    }

    if (tx.type == CONST.MINT_TYPE) {
      spent = `$${tx.baseCrncyAmount.toFixed(2)}`;
      got = `${tx.supplyDelta} HYPE`;
    } 

    if (tx.type == CONST.BURN_TYPE) {
      spent = `${tx.supplyDelta} HYPE`;
      got = `$${tx.baseCrncyAmount.toFixed(2)}`;
    }

    if (SOLANA_ENV === CONST.SOLANA_DEV) {
      baseUrl = `${HYPE_DEV_URL}${netTicker}/${tx.address}`;
      buyerUrlScan = `${SOLANA_DEV_URL}address/${tx.wallet}?cluster=devnet`;
      txUrlScan = `${SOLANA_DEV_URL}tx/${tx.id}?cluster=devnet`;
    }

    if (SOLANA_ENV === CONST.SOLANA_MAIN) {
      baseUrl = `${HYPE_MAIN_URL}${netTicker}/${tx.address}`;
      buyerUrlScan = `${SOLANA_MAIN_URL}account/${tx.wallet}`;
      txUrlScan = `${SOLANA_MAIN_URL}tx/${tx.id}`;
    }

    const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
    const token2022Accounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(tx.wallet),
      { programId: TOKEN_2022_PROGRAM_ID }
    );

    const account = token2022Accounts.value.find(account => account?.account?.data?.parsed?.info?.mint.toString() === tx.token);
    if (account) {
      balanceAfterTx = account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
    }

    if (balanceAfterTx - tx.supplyDelta == 0) {
      isFirstMint = true;
    } else {
      isFirstMint = false;
    }

    let message = `
<b> <a href="${baseUrl}">${tx.address}</a> | <a href="${baseUrl}">${NETWORK_ID[tx.networkId]}</a> | ${tx.type == CONST.MINT_TYPE ? "BUY!": "SELL"} </b>
🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧
🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧🫧
🔀 <b>Spent:</b> ${spent} 
🔀 <b>Got:</b> ${got}
👤 <b></b><a href="${buyerUrlScan}">Buyer</a> | <b></b><a href="${txUrlScan}">TX</a>${isFirstMint ? `\n<a href="${buyerUrlScan}">🪙 New Holder</a>` : ''}
🏷 <b>Price:</b> $${tokenPriceUsd.toFixed(2)} (${tx.supplyDelta.toFixed(2)}%)
💸 <b>Market Cap:</b> $${marketCap}
<a href="https://hype.fun/">Hype.fun</a> | <a href="https://x.com/hype_protocol">Twitter</a> | <a href="https://t.me/hype_fam">Telegram</a>
    `.trim();

    return message;
    });

    const messages = await Promise.all(messagePromises);

    return messages
    .filter((m: any) => m.trim().length > 0)
    .join('')
    .trim();
}

function calculateReserve(
  currentSupply: number | BigNumber,
  rootData: any
) {
  const bnCurrentSupply = new BigNumber(currentSupply);
  return new BigNumber(rootData.maxSupply)
    .multipliedBy(bnCurrentSupply)
    .multipliedBy(rootData.initPrice)
    .dividedBy(new BigNumber(rootData.maxSupply).minus(bnCurrentSupply));
}

function getTokenPrice(
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

export async function printRoot() {
  const version = Number(process.env.NEXT_PUBLIC_VERSION);
  const connection = new Connection(
    process.env.NEXT_PUBLIC_PROVIDER!,
    "confirmed"
  );
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
  const root = new sdk.RootAccount();
  const rootAccount = sdk.findRootAccountAddress(programId, version);
  const rootAccountInfo = await connection.getAccountInfo(rootAccount);

  root.update(rootAccountInfo!.data);
  return {
    admin: root.admin.toString() as any,
    tvl: root.tvl,
    tokensCount: root.tokensCount,
    counter: root.counter,
    clientsCount: root.clientsCount,
    allTimeBaseCrncyVolume: root.allTimeBaseCrncyVolume,
    maxSupply: root.maxSupply,
    initPrice: root.initPrice,
    feeRate: root.feeRate,
    minFees: root.minFees,
    creationFee: root.creationFee,
    fees: root.fees,
    holderFees: root.holderFees,
    networks: (root.networks?.map((n: sdk.NetworkRecord) => n.descriptor) ??
      []) as any,
  };
}

type Root = Awaited<ReturnType<typeof printRoot>>;

let root = new sdk.RootAccount();

(async () => {
  try {
    const rootAccount = sdk.findRootAccountAddress(new PublicKey(PROGRAM_PUBKEY), parseInt(PROGRAM_VERSION));
    const rootAccountInfo = await connection.getAccountInfo(rootAccount);
    
    if (!rootAccountInfo) {
      throw new Error("Root account not found or is empty");
    }

    root.update(rootAccountInfo.data);

    console.log("✅ Root account initialized:", root);
  } catch (error) {
    console.error("❌ Error initializing root account:", error);
  }
})();