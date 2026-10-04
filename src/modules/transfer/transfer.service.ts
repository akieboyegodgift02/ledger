import { randomUUID } from "node:crypto";
import { sql } from "../../db/index.js";
import postgres, {type TransactionSql} from "postgres"

export async function createTransfer (
    //function signature

    fromWalletId: number,
    toWalletId: number,
    amount: bigint

) {

    //Validate

    if (amount <= 0n) {
            throw new Error ("Amount must be greater than zero");
    }

    if (fromWalletId === toWalletId) {
        throw new Error("Cannot transfer to the same wallet")
    }

    const walletIds = [fromWalletId, toWalletId].sort(
        (a,b) => Number(a) - Number(b)
    )

    async function lockWallet(
        tx: TransactionSql, 
        walletIds: number[]) {

        const wallets = [];

        for (const walletId of walletIds) {

            const [wallet] = await tx `
                SELECT id, currency, status
                FROM wallets
                WHERE id = ${walletId}
                FOR UPDATE
            `

            if (!wallet) {
                throw new Error (`Wallet ID: ${walletId} not found`)
            };

            wallets.push(wallet);
        
        }

        return wallets;

    }


    return await sql.begin( async (tx)=>{

        const wallets = await lockWallet(tx, walletIds);

        const senderWallet = wallets.find(
            wallet =>  Number(wallet.id) === fromWalletId
        )

        const recipientWallet = wallets.find(
            wallet => Number(wallet.id) === toWalletId
        )

        if (!senderWallet || !recipientWallet) {
            throw new Error ("One or both wallets not found")
        }

        // Validate state
        if(senderWallet.status !== "ACTIVE") {
            throw new Error("Sender wallet is not active")
        }

        if(recipientWallet.status !== "ACTIVE") {
            throw new Error("Recipient wallet is not active")
        }

        if (senderWallet.currency !== recipientWallet.currency) {
            throw new Error ("Wallet currencies must match")
        }

        const [balance] = await tx `
            SELECT COALESCE(SUM(amount), 0) AS balance
            FROM ledger_entries
            WHERE wallet_id = ${fromWalletId}
        `
        
        const currentBalance = BigInt(balance?.balance ?? "0");

        if (currentBalance < amount) {
            throw new Error ("Insufficient balance")
        }

        const [transaction] = await tx `
            INSERT INTO transactions (
                type,
                status,
                reference
            ) 
            VALUES (
                'TRANSFER',
                'PENDING',
                ${randomUUID()}
            )

            RETURNING *
        `

        if(!transaction) {
            throw new Error ("Failed to create transfer transaction");
        }

        // Double entry invariant

        await tx `
            INSERT INTO ledger_entries (
                transaction_id,
                wallet_id,
                amount
            )
            VALUES (
                ${transaction.id},
                ${fromWalletId},
                ${(-amount).toString()}
            )
        `;

        await tx `
            INSERT INTO ledger_entries (
                transaction_id,
                wallet_id,
                amount
            )

            VALUES (
                ${transaction.id},
                ${toWalletId},
                ${amount.toString()}
            )
        `

        const [completedTransaction] = await tx `
            UPDATE transactions
            SET
                status = 'COMPLETED',
                completed_at = NOW()
            WHERE id = ${transaction.id}
            RETURNING *
        `
        if(!completedTransaction) {
            throw new Error("Failed to complete transfer transaction");
        }

        return completedTransaction;

    });
}