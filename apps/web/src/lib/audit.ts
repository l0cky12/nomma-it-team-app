import { prisma } from "./db";

export async function writeAuditEvent(input: {
  actorUserId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  correlationId: string;
  externalSystem?: string;
  externalRequestId?: string;
  performedUsingSharedCredentials?: boolean;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  success: boolean;
  errorSummary?: string;
}) {
  await prisma.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      actionType: input.actionType,
      targetType: input.targetType,
      targetId: input.targetId,
      correlationId: input.correlationId,
      externalSystem: input.externalSystem,
      externalRequestId: input.externalRequestId,
      performedUsingSharedCredentials: input.performedUsingSharedCredentials ?? false,
      beforeData: input.beforeData as object | undefined,
      afterData: input.afterData as object | undefined,
      metadata: input.metadata as object | undefined,
      success: input.success,
      errorSummary: input.errorSummary,
    },
  });
}
