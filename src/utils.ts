import { EVENT_EXPIRE_SECONDS } from './config';

export const processedSignatures = new Set<string>();

export function isAlreadyProcessed(signature: string): boolean {
  return processedSignatures.has(signature);
}

export function markAsProcessed(signature: string): void {
  processedSignatures.add(signature);
  setTimeout(() => {
    processedSignatures.delete(signature);
  }, EVENT_EXPIRE_SECONDS);
}