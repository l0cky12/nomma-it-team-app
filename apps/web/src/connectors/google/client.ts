export class GoogleAdminClient {
  constructor(private readonly token: string, public readonly usingSharedCredentials = false) {
    void this.token;
  }

  async lookupUser(query: string) {
    return { query, message: "Google lookup stub (wire Admin SDK Directory API)" };
  }

  async updateCustomFields(email: string, fields: Record<string, string>) {
    return { email, fields, message: "Google custom field update stub" };
  }
}
