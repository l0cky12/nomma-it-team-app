export interface ADConnector {
  lookupUser(query: string): Promise<{ source: string; query: string; result: string }>;
  suspendUser?(samAccountName: string): Promise<{ status: string }>;
  enableUser?(samAccountName: string): Promise<{ status: string }>;
}

export class StubADConnector implements ADConnector {
  async lookupUser(query: string) {
    return {
      source: "stub",
      query,
      result: "AD lookup stub; configure LDAP connector for production",
    };
  }
}
