import { Connection, PublicKey, Logs, Commitment } from '@solana/web3.js';
import { PROGRAM_PUBKEY, SOLANA_RPC_URL } from './config';
import { sendTelegramMessage } from './telegramBot';
import * as sdk from '@hypewatch/sdk';
import { NETWORK_ID, COMMITMENT } from './config'
import { TradeTransaction , NewTokenTransaction, Transaction } from './types'
import { isAlreadyProcessed, markAsProcessed } from './utils'
import * as CONST from './const'


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

  const formattedMessage = formatMessageForTelegram(transactions, logs.signature);

  sendTelegramMessage(formattedMessage);
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

function formatMessageForTelegram(transactions: Transaction[], signature: string): string {
  if (!transactions.length) {
    return CONST.NO_TRANSACTIONS_FOUND(signature);
  }

  let message = `Транзакции из лога (signature: <b>${signature}</b>):\n\n`;
  transactions.forEach((tx, index) => {
    let committedAt = new Date(tx.committedAt);
    let createdAt = new Date(tx.createdAt);

    const readableCommittedAt = committedAt.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });

    const readableCreatedAt = createdAt.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });

    message += `<b>#${index + 1}.</b> Тип: <b>${tx.type.toUpperCase()}</b>\n`;
    message += `   TokenID: <b>${tx.tokenId}</b>\n`;
    message += `   Сеть: <b>${NETWORK_ID[tx.networkId]}</b>\n`;
    message += `   Creator: <b>${tx.creator}</b>\n`;
    message += `   Username: <b>${tx.address}</b>\n`;
    message += `   Order ID: <b>${tx.orderId}</b>\n`;
    message += `   Committed At: <b>${readableCommittedAt}</b>\n`;
    message += `   Created At: <b>${readableCreatedAt}</b>\n`;

    if (tx.type === CONST.MINT_TYPE || tx.type === CONST.BURN_TYPE) {
      message += `   Supply: <b>${tx.supply}</b>\n`;
      message += `   SupplyDelta: <b>${tx.supplyDelta}</b>\n`;
      message += `   Trade's base currency amount: <b>${tx.baseCrncyAmount}</b>\n`;
    }

    message += '\n';
  });

  return message.trim();
}

