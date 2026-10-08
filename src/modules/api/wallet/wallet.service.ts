import { sql } from "../../../db/index.js";
import { WalletNotFoundError } from "../../../errors/wallet-not-found-error.js";

export async function getUserWallets(userId: number) {
  const wallets = await sql`
    SELECT
      id,
      account_id,
      currency,
      status
    FROM wallets
    WHERE account_id = ${userId}
    ORDER BY id
  `;

  return wallets;
}

export async function getUserWallet(
  userId: number,
  walletId: number,
) {
  const [wallet] = await sql`
    SELECT
      id,
      account_id,
      currency,
      status
    FROM wallets
    WHERE id = ${walletId}
      AND account_id = ${userId}
  `;

  if (!wallet) {
    throw new WalletNotFoundError;
  }

  return wallet;
}