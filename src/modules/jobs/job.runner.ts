
import "dotenv/config";
import { processNextJob } from "./job.worker.js";
import { recoverStaleJobs } from "./job.service.js";

const POLL_INTERVAL_MS = 1_000;
const RECOVERY_INTERVAL_MS = 60_000;

let shuttingDown = false;

process.on("SIGINT", () => {
    shuttingDown = true;
});

process.on("SIGTERM", () => {
    shuttingDown = true;
});

async function runWorker() {
    let lastRecovery = 0;

    console.log("Job worker started.");

    while (!shuttingDown) {
        try {
            const now = Date.now();

            if (now - lastRecovery >= RECOVERY_INTERVAL_MS) {
                const result = await recoverStaleJobs();

                if (result.recovered > 0 || result.failed > 0) {
                    console.log("Stale-job recovery:", result);
                }

                lastRecovery = now;
            }

            const job = await processNextJob();

            if (!job) {
                await new Promise((resolve) =>
                    setTimeout(resolve, POLL_INTERVAL_MS)
                );
            }
        } catch (error) {
            console.error("Worker runner error:", error);

            await new Promise((resolve) =>
                setTimeout(resolve, POLL_INTERVAL_MS)
            );
        }
    }

    console.log("Job worker stopped.");
}

runWorker().catch((error) => {
    console.error("Fatal worker error:", error);
    process.exitCode = 1;
});
