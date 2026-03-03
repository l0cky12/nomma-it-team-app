import { z } from "zod";
import { RepairStatus } from "@prisma/client";

export const voteSchema = z.object({
  featureId: z.string().min(1),
  priority: z.coerce.number().int().min(1).max(4),
});

export const checkoutSchema = z.object({
  assetTag: z.string().min(1),
  assigneeUserId: z.string().min(1),
  expectedReturnDate: z.string().datetime(),
  notes: z.string().max(500).optional(),
  confirm: z.literal(true),
});

export const checkinSchema = z.object({
  assetTag: z.string().min(1),
  notes: z.string().max(500).optional(),
  confirm: z.literal(true),
});

export const createRepairSchema = z.object({
  assetTag: z.string().min(1),
  issue: z.string().min(3),
  technicianId: z.string().min(1),
  eta: z.string().datetime().optional(),
  confirm: z.literal(true),
});

export const updateRepairSchema = z.object({
  ticketId: z.string().min(1),
  status: z.nativeEnum(RepairStatus),
  note: z.string().max(500).optional(),
  confirm: z.literal(true),
});

export const completeRepairSchema = z.object({
  ticketId: z.string().min(1),
  returnToPool: z.boolean(),
  confirm: z.literal(true),
});

export const connectTokenSchema = z.object({
  provider: z.enum(["SNIPEIT", "GOOGLE", "MICROSOFT", "AD"]),
  accessToken: z.string().min(5),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  externalUserIdentifier: z.string().optional(),
  isShared: z.boolean().default(false),
});
