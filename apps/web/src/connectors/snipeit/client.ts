import { ProviderType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

interface SnipeItContext {
  actorUserId: string;
  allowSharedFallback?: boolean;
}

export class SnipeItClient {
  private constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    public readonly usingSharedCredentials: boolean,
  ) {}

  static async forUser(context: SnipeItContext) {
    const config = await prisma.integrationConfig.findFirst();
    const baseUrl = config?.snipeItBaseUrl || process.env.SNIPEIT_BASE_URL;
    if (!baseUrl) throw new Error("Snipe-IT base URL is not configured");

    let account = await prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId: context.actorUserId, provider: ProviderType.SNIPEIT } },
    });
    let usingShared = false;

    if (!account && context.allowSharedFallback) {
      account = await prisma.connectedAccount.findFirst({ where: { provider: ProviderType.SNIPEIT, isShared: true } });
      usingShared = true;
    }

    if (!account) throw new Error("No Snipe-IT credentials connected for this user");
    return new SnipeItClient(baseUrl.replace(/\/$/, ""), decryptSecret(account.encryptedAccessToken), usingShared);
  }

  private async request(path: string, init?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    const text = await response.text();
    let payload: unknown;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      throw new Error(`Snipe-IT request failed (${response.status})`);
    }

    return {
      payload,
      externalRequestId: response.headers.get("x-request-id") ?? undefined,
    };
  }

  assetLookupByTag(assetTag: string) {
    return this.request(`/api/v1/hardware/bytag/${encodeURIComponent(assetTag)}`, { method: "GET" });
  }

  checkoutAsset(assetId: string | number, assigneeExternalId: string, note: string) {
    return this.request(`/api/v1/hardware/${assetId}/checkout`, {
      method: "POST",
      body: JSON.stringify({ checkout_to_type: "user", assigned_user: assigneeExternalId, note }),
    });
  }

  checkinAsset(assetId: string | number, note: string) {
    return this.request(`/api/v1/hardware/${assetId}/checkin`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  updateAssetStatus(assetId: string | number, statusId: number, note: string) {
    return this.request(`/api/v1/hardware/${assetId}`, {
      method: "PATCH",
      body: JSON.stringify({ status_id: statusId, notes: note }),
    });
  }
}
