import { ProviderType } from "@prisma/client";
import { prisma } from "./db";
import { decryptSecret, encryptSecret } from "./crypto";

export async function upsertConnectedAccount(params: {
  userId: string;
  provider: ProviderType;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  externalUserIdentifier?: string;
  isShared?: boolean;
}) {
  return prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: params.userId, provider: params.provider } },
    update: {
      encryptedAccessToken: encryptSecret(params.accessToken),
      encryptedRefreshToken: params.refreshToken ? encryptSecret(params.refreshToken) : null,
      tokenExpiresAt: params.expiresAt,
      externalUserIdentifier: params.externalUserIdentifier,
      isShared: params.isShared ?? false,
      status: "connected",
      lastCheckedAt: new Date(),
    },
    create: {
      userId: params.userId,
      provider: params.provider,
      encryptedAccessToken: encryptSecret(params.accessToken),
      encryptedRefreshToken: params.refreshToken ? encryptSecret(params.refreshToken) : undefined,
      tokenExpiresAt: params.expiresAt,
      externalUserIdentifier: params.externalUserIdentifier,
      isShared: params.isShared ?? false,
      status: "connected",
      lastCheckedAt: new Date(),
    },
  });
}

export async function getDecryptedToken(userId: string, provider: ProviderType) {
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!account) return null;
  return {
    ...account,
    accessToken: decryptSecret(account.encryptedAccessToken),
    refreshToken: account.encryptedRefreshToken ? decryptSecret(account.encryptedRefreshToken) : null,
  };
}
