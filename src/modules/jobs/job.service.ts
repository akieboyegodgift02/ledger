
import { sql } from "../../db/index.js";

export async function claimJob() {
    return sql.begin(async (tx) => {
       const [job] = await tx`
            SELECT *
            FROM jobs
            WHERE status = 'PENDING'
            AND available_at <= NOW()
            ORDER BY id
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        `;

        if (!job) {
            return null;
        }

        const [claimedJob] = await tx`
            UPDATE jobs
            SET
                status = 'PROCESSING',
                attempts = attempts + 1,
                locked_at = NOW()
            WHERE id = ${job.id}
            RETURNING *
        `;

        return claimedJob;
    });
}




export async function recoverStaleJobs() {
    return sql.begin(async (tx) => {
        const staleJobs = await tx`
            SELECT id, attempts
            FROM jobs
            WHERE status = 'PROCESSING'
              AND locked_at < NOW() - INTERVAL '5 minutes'
            FOR UPDATE SKIP LOCKED
        `;

        let recovered = 0;
        let failed = 0;

        for (const job of staleJobs) {
            if (job.attempts <= 5) {
                await tx`
                    UPDATE jobs
                    SET
                        status = 'PENDING',
                        available_at = NOW(),
                        locked_at = NULL
                    WHERE id = ${job.id}
                `;

                recovered++;
            } else {
                await tx`
                    UPDATE jobs
                    SET
                        status = 'FAILED',
                        failed_at = NOW(),
                        locked_at = NULL
                    WHERE id = ${job.id}
                `;

                failed++;
            }
        }

        return {
            recovered,
            failed,
        };
    });
}
