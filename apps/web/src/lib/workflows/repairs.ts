import { AssetStatus, RepairStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditEvent } from "@/lib/audit";
import { SnipeItClient } from "@/connectors/snipeit/client";

const REPAIR_STATUS_MAP: Record<RepairStatus, number> = {
  RECEIVED: 3,
  DIAGNOSED: 3,
  IN_REPAIR: 3,
  READY: 2,
  RETURNED: 2,
};

export async function createRepairTicket(params: {
  actorUserId: string;
  correlationId: string;
  assetTag: string;
  technicianId: string;
  issue: string;
  eta?: Date;
}) {
  const asset = await prisma.asset.findUnique({ where: { assetTag: params.assetTag } });
  if (!asset) throw new Error("Asset not found");

  const before = { assetStatus: asset.status };
  const snipeClient = await SnipeItClient.forUser({ actorUserId: params.actorUserId, allowSharedFallback: true });
  let externalRequestId: string | undefined;

  try {
    if (asset.snipeItAssetId) {
      const result = await snipeClient.updateAssetStatus(
        asset.snipeItAssetId,
        REPAIR_STATUS_MAP.RECEIVED,
        `Repair opened: ${params.issue}`,
      );
      externalRequestId = result.externalRequestId;
    }

    const created = await prisma.$transaction(async (tx) => {
      await tx.asset.update({ where: { id: asset.id }, data: { status: AssetStatus.IN_REPAIR } });
      const ticket = await tx.repairTicket.create({
        data: {
          assetId: asset.id,
          issue: params.issue,
          technicianId: params.technicianId,
          eta: params.eta,
          openedByUserId: params.actorUserId,
          status: RepairStatus.RECEIVED,
        },
      });
      await tx.repairStatusHistory.create({
        data: {
          repairTicketId: ticket.id,
          fromStatus: null,
          toStatus: RepairStatus.RECEIVED,
          changedByUserId: params.actorUserId,
          note: "Ticket created",
        },
      });
      return ticket;
    });

    await writeAuditEvent({
      actorUserId: params.actorUserId,
      actionType: "REPAIR_CREATE",
      targetType: "RepairTicket",
      targetId: created.id,
      correlationId: params.correlationId,
      externalSystem: "SNIPEIT",
      externalRequestId,
      performedUsingSharedCredentials: snipeClient.usingSharedCredentials,
      beforeData: before,
      afterData: { status: created.status, technicianId: created.technicianId },
      success: true,
    });

    return created;
  } catch (error) {
    await writeAuditEvent({
      actorUserId: params.actorUserId,
      actionType: "REPAIR_CREATE",
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

export async function updateRepairStatus(params: {
  actorUserId: string;
  correlationId: string;
  ticketId: string;
  status: RepairStatus;
  note?: string;
}) {
  const ticket = await prisma.repairTicket.findUnique({
    where: { id: params.ticketId },
    include: { asset: true },
  });
  if (!ticket) throw new Error("Repair ticket not found");

  const before = { status: ticket.status };
  const snipeClient = await SnipeItClient.forUser({ actorUserId: params.actorUserId, allowSharedFallback: true });
  let externalRequestId: string | undefined;

  try {
    if (ticket.asset.snipeItAssetId) {
      const result = await snipeClient.updateAssetStatus(
        ticket.asset.snipeItAssetId,
        REPAIR_STATUS_MAP[params.status],
        params.note ?? `Repair status moved to ${params.status}`,
      );
      externalRequestId = result.externalRequestId;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.repairTicket.update({ where: { id: ticket.id }, data: { status: params.status } });
      await tx.repairStatusHistory.create({
        data: {
          repairTicketId: ticket.id,
          fromStatus: ticket.status,
          toStatus: params.status,
          changedByUserId: params.actorUserId,
          note: params.note,
        },
      });
      return next;
    });

    await writeAuditEvent({
      actorUserId: params.actorUserId,
      actionType: "REPAIR_STATUS_UPDATE",
      targetType: "RepairTicket",
      targetId: updated.id,
      correlationId: params.correlationId,
      externalSystem: "SNIPEIT",
      externalRequestId,
      performedUsingSharedCredentials: snipeClient.usingSharedCredentials,
      beforeData: before,
      afterData: { status: updated.status },
      success: true,
    });

    return updated;
  } catch (error) {
    await writeAuditEvent({
      actorUserId: params.actorUserId,
      actionType: "REPAIR_STATUS_UPDATE",
      targetType: "RepairTicket",
      targetId: ticket.id,
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

export async function completeRepair(params: {
  actorUserId: string;
  correlationId: string;
  ticketId: string;
  returnToPool: boolean;
}) {
  const ticket = await prisma.repairTicket.findUnique({ where: { id: params.ticketId }, include: { asset: true } });
  if (!ticket) throw new Error("Repair ticket not found");

  const updated = await prisma.$transaction(async (tx) => {
    const completed = await tx.repairTicket.update({
      where: { id: ticket.id },
      data: { status: RepairStatus.RETURNED, closedAt: new Date() },
    });

    await tx.repairStatusHistory.create({
      data: {
        repairTicketId: ticket.id,
        fromStatus: ticket.status,
        toStatus: RepairStatus.RETURNED,
        changedByUserId: params.actorUserId,
        note: params.returnToPool ? "Returned to pool" : "Returned to assigned user",
      },
    });

    await tx.asset.update({
      where: { id: ticket.asset.id },
      data: { status: params.returnToPool ? AssetStatus.AVAILABLE : AssetStatus.CHECKED_OUT },
    });

    return completed;
  });

  await writeAuditEvent({
    actorUserId: params.actorUserId,
    actionType: "REPAIR_COMPLETE",
    targetType: "RepairTicket",
    targetId: updated.id,
    correlationId: params.correlationId,
    success: true,
    metadata: { returnToPool: params.returnToPool },
  });

  return updated;
}
