import { AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditEvent } from "@/lib/audit";
import { SnipeItClient } from "@/connectors/snipeit/client";

export async function checkoutLoaner(params: {
  actorUserId: string;
  correlationId: string;
  assetTag: string;
  assigneeUserId: string;
  expectedReturnDate: Date;
  notes?: string;
}) {
  const [asset, assignee] = await Promise.all([
    prisma.asset.findUnique({ where: { assetTag: params.assetTag } }),
    prisma.user.findUnique({ where: { id: params.assigneeUserId } }),
  ]);

  if (!asset) throw new Error("Asset not found");
  if (!assignee) throw new Error("Assignee not found");
  if (asset.status !== AssetStatus.AVAILABLE) throw new Error("Asset is not available");

  const snipeClient = await SnipeItClient.forUser({ actorUserId: params.actorUserId, allowSharedFallback: true });
  const before = { status: asset.status, assignedToId: asset.assignedToId, dueDate: asset.dueDate };
  let externalRequestId: string | undefined;

  try {
    if (asset.snipeItAssetId && assignee.email) {
      const result = await snipeClient.checkoutAsset(
        asset.snipeItAssetId,
        assignee.email,
        params.notes ?? "Checked out from NOMMA IT Team App",
      );
      externalRequestId = result.externalRequestId;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextAsset = await tx.asset.update({
        where: { id: asset.id },
        data: {
          status: AssetStatus.CHECKED_OUT,
          assignedToId: assignee.id,
          dueDate: params.expectedReturnDate,
        },
      });

      await tx.loanerAssignment.create({
        data: {
          assetId: asset.id,
          assigneeUserId: assignee.id,
          checkedOutByUserId: params.actorUserId,
          expectedReturnDate: params.expectedReturnDate,
          notes: params.notes,
        },
      });

      return nextAsset;
    });

    await writeAuditEvent({
      actorUserId: params.actorUserId,
      actionType: "DEVICE_CHECKOUT",
      targetType: "Asset",
      targetId: asset.id,
      correlationId: params.correlationId,
      externalSystem: "SNIPEIT",
      externalRequestId,
      performedUsingSharedCredentials: snipeClient.usingSharedCredentials,
      beforeData: before,
      afterData: { status: updated.status, assignedToId: updated.assignedToId, dueDate: updated.dueDate },
      success: true,
      metadata: { assigneeUserId: assignee.id },
    });

    return updated;
  } catch (error) {
    await writeAuditEvent({
      actorUserId: params.actorUserId,
      actionType: "DEVICE_CHECKOUT",
      targetType: "Asset",
      targetId: asset.id,
      correlationId: params.correlationId,
      externalSystem: "SNIPEIT",
      externalRequestId,
      performedUsingSharedCredentials: snipeClient.usingSharedCredentials,
      beforeData: before,
      success: false,
      errorSummary: error instanceof Error ? error.message : "Unknown error",
      metadata: { assigneeUserId: assignee.id },
    });
    throw error;
  }
}

export async function checkinLoaner(params: {
  actorUserId: string;
  correlationId: string;
  assetTag: string;
  notes?: string;
}) {
  const asset = await prisma.asset.findUnique({ where: { assetTag: params.assetTag } });
  if (!asset) throw new Error("Asset not found");

  const assignment = await prisma.loanerAssignment.findFirst({
    where: { assetId: asset.id, checkedInAt: null },
    orderBy: { checkedOutAt: "desc" },
  });

  const before = { status: asset.status, assignedToId: asset.assignedToId, dueDate: asset.dueDate };
  const snipeClient = await SnipeItClient.forUser({ actorUserId: params.actorUserId, allowSharedFallback: true });
  let externalRequestId: string | undefined;

  try {
    if (asset.snipeItAssetId) {
      const result = await snipeClient.checkinAsset(asset.snipeItAssetId, params.notes ?? "Checked in from NOMMA IT Team App");
      externalRequestId = result.externalRequestId;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (assignment) {
        await tx.loanerAssignment.update({ where: { id: assignment.id }, data: { checkedInAt: new Date() } });
      }
      return tx.asset.update({
        where: { id: asset.id },
        data: { status: AssetStatus.AVAILABLE, assignedToId: null, dueDate: null },
      });
    });

    await writeAuditEvent({
      actorUserId: params.actorUserId,
      actionType: "DEVICE_CHECKIN",
      targetType: "Asset",
      targetId: asset.id,
      correlationId: params.correlationId,
      externalSystem: "SNIPEIT",
      externalRequestId,
      performedUsingSharedCredentials: snipeClient.usingSharedCredentials,
      beforeData: before,
      afterData: { status: updated.status, assignedToId: updated.assignedToId, dueDate: updated.dueDate },
      success: true,
    });

    return updated;
  } catch (error) {
    await writeAuditEvent({
      actorUserId: params.actorUserId,
      actionType: "DEVICE_CHECKIN",
      targetType: "Asset",
      targetId: asset.id,
      correlationId: params.correlationId,
      externalSystem: "SNIPEIT",
      externalRequestId,
      performedUsingSharedCredentials: snipeClient.usingSharedCredentials,
      beforeData: before,
      success: false,
      errorSummary: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
