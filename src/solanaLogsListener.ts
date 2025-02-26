import { Connection, PublicKey, Logs, Commitment } from '@solana/web3.js';
import { PROGRAM_PUBKEY, SOLANA_RPC_URL } from './config';
import { broadcastEventNotification } from './telegramBot';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import * as sdk from '@hypewatch/sdk';
import * as CFG from './config'
import { TradeTransaction , NewTokenTransaction, Transaction } from './types'
import { isAlreadyProcessed, markAsProcessed, createMessage, getTokenPrice } from './utils'
import * as CONST from './const'
import BigNumber from 'bignumber.js';


const connection = new Connection(SOLANA_RPC_URL, CFG.COMMITMENT as Commitment);
const root: sdk.RootAccount = new sdk.RootAccount();


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
    CFG.COMMITMENT
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

  console.log(transactions);

  if (transactions.length) {
    const formattedMessage = await formatMessageForTelegram(transactions, logs.signature);

    if (formattedMessage.trim().length > 0) {
      broadcastEventNotification(transactions, formattedMessage);
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

    let netTicker: string = CFG.TICKER[tx.networkId];
    let baseUrl: string = CFG.HYPE_DEV_URL;
    let isFirstMint: boolean = true;
    let balanceAfterTx: number = 0;
    let buyerUrlScan: string = '';
    let priceDelta: string = '';
    let txUrlScan: string = '';
    let spent: string = '';
    let got: string = '';

    const tokenPriceUsd: BigNumber = getTokenPrice(tx.supply, root);
    const marketCap: string = tokenPriceUsd.multipliedBy(new BigNumber(tx.supply)).toFixed(2);

    if (tx.supplyDelta) {
      const val = tx.baseCrncyAmount / tx.supplyDelta;
      priceDelta = `(${val.toFixed(2)})`;
    }

    if (tx.type == CONST.MINT_TYPE) {
      spent = `$${tx.baseCrncyAmount.toFixed(2)}`;
      got = `${tx.supplyDelta} ${CONST.HYPE_CRNY_TICKER}`;
    } 

    if (tx.type == CONST.BURN_TYPE) {
      spent = `${tx.supplyDelta} ${CONST.HYPE_CRNY_TICKER}`;
      got = `$${tx.baseCrncyAmount.toFixed(2)}`;
    }

    if (CFG.SOLANA_ENV === CONST.SOLANA_DEV) {
      baseUrl = `${CFG.HYPE_DEV_URL}${netTicker}/${tx.address}`;
      buyerUrlScan = CFG.SOLANA_SCAN_DEV_URL(CONST.ADDRESS_ENTITY, tx.wallet);
      txUrlScan = CFG.SOLANA_SCAN_DEV_URL(CONST.TX_ENTITY, tx.id);
    }

    if (CFG.SOLANA_ENV === CONST.SOLANA_MAIN) {
      baseUrl = `${CFG.HYPE_MAIN_URL}${netTicker}/${tx.address}`;
      buyerUrlScan = CFG.SOLANA_SCAN_MAIN_URL(CONST.ACCOUNT_ENTITY, tx.wallet);
      txUrlScan = CFG.SOLANA_SCAN_MAIN_URL(CONST.TX_ENTITY, tx.id);
    }

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

    return createMessage(baseUrl, tx, spent, got, buyerUrlScan, txUrlScan, isFirstMint, tokenPriceUsd, marketCap);
    });

    const messages = await Promise.all(messagePromises);

    return messages
    .filter((m: any) => m.trim().length > 0)
    .join('')
    .trim();
}