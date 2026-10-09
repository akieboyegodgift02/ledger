
import { sql } from "../../db/index.js";
import { claimJob } from "./job.service.js";

const MAX_RETRIES = 5;
const BASE_DELAY_SECONDS = 5;

export async function processNextJob() {
    const job = await claimJob();

    if (!job) {
        return null;
    }

    try {
        
        if (job.type === "SEND_TRANSFER_NOTIFICATION") {
            if (
                typeof job.payload !== "object" ||
                job.payload === null ||
                typeof job.payload.transactionId !== "number" ||
                typeof job.payload.walletId !== "number"
            ) {
                throw new Error("Invalid SEND_TRANSFER_NOTIFICATION payload");
            }

            console.log(
                `Notification sent for transaction ${job.payload.transactionId} to wallet ${job.payload.walletId}`
            );
        } else {
            throw new Error(`Unknown job type: ${job.type}`);
        }


        const [completedJob] = await sql`
            UPDATE jobs
            SET
                status = 'COMPLETED',
                completed_at = NOW(),
                locked_at = NULL
            WHERE id = ${job.id}
            RETURNING *
        `;

        return completedJob;
    } catch (error) {
        console.error(`Job ${job.id} failed:`, error);

        if (job.attempts <= MAX_RETRIES) {
            const delaySeconds =
                BASE_DELAY_SECONDS * 2 ** (job.attempts - 1);

            const [retriedJob] = await sql`
                UPDATE jobs
                SET
                    status = 'PENDING',
                    available_at = NOW() + (${delaySeconds} * INTERVAL '1 second'),
                    locked_at = NULL
                WHERE id = ${job.id}
                RETURNING *
            `;

            return retriedJob;
        }

        const [failedJob] = await sql`
            UPDATE jobs
            SET
                status = 'FAILED',
                failed_at = NOW(),
                locked_at = NULL
            WHERE id = ${job.id}
            RETURNING *
        `;

        return failedJob;
    }
}


