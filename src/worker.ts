
import "dotenv/config";
import { processNextJob } from "./modules/jobs/job.worker.js";
import { recoverStaleJobs } from "./modules/jobs/job.service.js";

const POLL_INTERVAL_MS = 2000;
const RECOVERY_INTERVAL_MS = 60_000;

let lastRecoveryTime = 0;

async function startWorker() {
    console.log("Background worker started.");

    while (true) {
        try {
            const now = Date.now();

            if (now - lastRecoveryTime >= RECOVERY_INTERVAL_MS) {
                const recovery = await recoverStaleJobs();
                lastRecoveryTime = Date.now();

                if (recovery.recovered > 0 || recovery.failed > 0) {
                    console.log("Stale-job recovery:", recovery);
                }
            }

            const job = await processNextJob();

            if (!job) {
                await new Promise((resolve) =>
                    setTimeout(resolve, POLL_INTERVAL_MS)
                );
            }
        } catch (error) {
            console.error("Worker error:", error);

            await new Promise((resolve) =>
                setTimeout(resolve, POLL_INTERVAL_MS)
            );
        }
    }
}

startWorker();
