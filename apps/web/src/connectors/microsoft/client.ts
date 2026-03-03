export class MicrosoftGraphClient {
  constructor(private readonly token: string, public readonly usingSharedCredentials = false) {
    void this.token;
  }

  async lookupUser(query: string) {
    return { query, message: "Microsoft Graph lookup stub" };
  }

  async assignLicense(userId: string, skuId: string) {
    return { userId, skuId, message: "License assignment stub" };
  }
}
