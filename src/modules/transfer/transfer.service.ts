import { sql } from '../../db/index.js';
import { randomUUID } from 'crypto';

async function lockWallet (
    tx: typeof sql,
    walledIds: string[],
) {
    const sortedWallet  = [...walledIds].sort(
        (a,b)=> Number(a) - Number(b),
    );

    const wallets = [];

    for (const walletId of sortedWallet) {
        const [wallet] = await tx`
            SELECT id, currency, status
            FROM wallets
            WHERE id = ${walletId}
            FOR UPDATE  
        `;

        if (!wallet) {
            throw new Error(`Wallet with id ${walletId} not found`);
        }

        wallets.push(wallet);
    }
}


export async function createTransfer(
    fromWalletId: string,
    toWalletId: string,
    amount: bigint,
) {

    // Sort wallet IDs to prevent deadlocks

    const walletIds = [fromWalletId, toWalletId].sort((a, b) => Number(a) - Number(b)); 

    const wallets = []


    for (const walletId of walletIds) {
        const [wallet] = await sql`
            SELECT id, currency, status
            FROM wallets
            WHERE id = ${walletId}
            FOR UPDATE
        `
        if (!wallet) {
            throw new Error(`Wallet with id ${walletId} not found`);
        }

        wallets.push(wallet);

        // Establish a concurrency control mechanism by locking the wallets in a consistent order to prevent deadlocks

        const senderWallet = wallets.find(wallet => String(wallet.id) === fromWalletId);

        const recipientWallet = wallets.find(wallet => String(wallet.id) === toWalletId);

        if(!senderWallet || !recipientWallet) {
            throw new Error('One or both wallets not found');
        }
    }

    if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
    }

    if (fromWalletId === toWalletId) {
        throw new Error('Cannot transfer to the same wallet');
    }

    return await sql.begin(async (tx) => {

        // Lock wallets in a consistent order to prevent deadlocks
        
        const walletIds = [fromWalletId, toWalletId].sort(
            (a, b) => Number(a) - Number(b)
        );

        const wallets = [];

        for (const walletId of walletIds) {
            const [wallet] = await tx`
                SELECT id, currency, status
                FROM wallets
                WHERE id = ${walletId}
                FOR UPDATE
            `;

            if (!wallet) {
                throw new Error(`Wallet with id ${walletId} not found`);
            }

            wallets.push(wallet);

            const senderWallet = wallets.find(wallet => String(wallet.id) === fromWalletId);

            const recipientWallet = wallets.find(wallet => String(wallet.id) === toWalletId);

            if (!senderWallet || !recipientWallet) {
                throw new Error('One or both wallets not found');
            }

            if (senderWallet.currency !== recipientWallet.currency) {
                throw new Error('Wallet currencies must match');
            }

            if (recipientWallet.status !== 'ACTIVE') {
                throw new Error('Recipient wallet is not active');
            }

            if (senderWallet.currency !== recipientWallet.currency) {
                throw new Error('Wallet currencies must match');
            }

        }

        // Check sender's wallet

        const [senderWallet] = await  tx `
            SELECT id, currency, status
            FROM wallets
            WHERE id = ${fromWalletId}
            FOR UPDATE
        `;

        if (!senderWallet) {
            throw new Error('Sender wallet not found');
        }

        if (senderWallet.status !== 'ACTIVE') {
            throw new Error('Sender wallet is not active');
        }

        // Check sender's balance
        const [balance] = await tx `
            SELECT COALESCE(SUM(amount), 0) AS balance
            FROM ledger_entries
            WHERE wallet_id = ${fromWalletId}
        `;

        const currentBalance = BigInt(balance?.balance ?? "0");

        if (currentBalance < amount) {
            throw new Error('Insufficient balance');
        }

        const [recipientWallet] = await tx `
        SELECT id, currency, status
        FROM wallets
        WHERE id = ${toWalletId}
        FOR UPDATE
        `;

        if (!recipientWallet) {
            throw new Error('Recipient wallet not found');
        }

        if (recipientWallet.status !== 'ACTIVE') {
            throw new Error('Recipient wallet is not active');
        }

        if (senderWallet.currency !== recipientWallet.currency) {
            throw new Error("Wallet currencies must match");
        }

        // create a new transaction record

        const [transaction] = await tx `
            INSERT INTO transactions (
                type,
                status,
                reference
            ) VALUES (
                'TRANSFER',
                'PENDING',
                ${randomUUID()}
            )
            RETURNING *
        `;

        if (!transaction) {
            throw new Error('Failed to create transfer transaction');
        }

        // Create ledger entries

        await tx`
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

        await tx`
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
        `;

        const [completedTransaction] = await tx`
        UPDATE transactions
        SET 
            status = 'COMPLETED',
            completed_at = NOW()
        WHERE id = ${transaction.id}
        RETURNING *
        `;

        return completedTransaction;
    });
}