import { Queue, Worker, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null }) as unknown as ConnectionOptions;

export const workflowQueue = new Queue("workflow-events", { connection });

if (process.env.NODE_ENV !== "test") {
  // Best-effort async worker for retries/notifications; extend with dedicated workers in production.
  // Keeping this in-process keeps MVP simple for docker-compose local.
  new Worker(
    "workflow-events",
    async (job) => {
      logger.info({ jobId: job.id, name: job.name }, "processed background job");
    },
    { connection },
  );
}
