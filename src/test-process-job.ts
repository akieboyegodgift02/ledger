import "dotenv/config";
import { processNextJob } from "./modules/jobs/job.worker.js";

const result = await processNextJob();

console.log("Worker result:", result);