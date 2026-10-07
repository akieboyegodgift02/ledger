import { sql } from "../../../db/index.js";
import { randomUUID } from "node:crypto";

export async function createDeposit(
    walletId: string,
    amount: bigint,
) {
    // Validate the deposit amount
    if (amount <= 0n) {
        throw new Error("Deposit amount must be greater than zero");
    }    

    

    return await sql.begin(async (tx) => {
        const [wallet] = await tx`
            SELECT id, currency, status
            FROM wallets
            WHERE id = ${walletId}
            FOR UPDATE  
        `;

        // Lock the wallet row to prevent concurrent modifications

        if (!wallet) {
            throw new Error(`Wallet with id ${walletId} not found`);
        }

        if (wallet.status !== "ACTIVE") {
            throw new Error(`Wallet with id ${walletId} is not active`);
        }

        // Insert the deposit transaction
        const [deposit] = await tx`
            INSERT INTO transactions (
                type,
                status,
                reference
            )
            VALUES (
                'DEPOSIT',
                'PENDING',
                ${randomUUID()}
            )
            RETURNING *
        `;

        if (!deposit) {
            throw new Error("Failed to create deposit transaction");
        }

        // Insert the ledger entry for the deposit
        await tx`
            INSERT INTO ledger_entries (
                transaction_id,
                wallet_id,
                amount
            )
            VALUES (
                ${deposit.id},
                ${walletId},
                ${amount.toString()}
            )
        `;

        const [completedDeposit] = await tx`
            UPDATE transactions
            SET
                status = 'COMPLETED',
                completed_at = NOW()
            WHERE id = ${deposit.id}
            RETURNING *
        `;

        if (!completedDeposit) {
            throw new Error("Failed to complete deposit transaction");
        }

        return completedDeposit;

    })
}