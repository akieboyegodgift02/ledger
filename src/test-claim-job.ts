
import "dotenv/config";
import { recoverStaleJobs } from "./modules/jobs/job.service.js";

const result = await recoverStaleJobs();

console.log("Recovery result:", result);