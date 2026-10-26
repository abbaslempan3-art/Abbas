/** Future server adapter contracts. No provider is implemented by these types. */
export type ConnectionView =
  | {
      providerId: string;
      state: "not_configured" | "revoked" | "error";
      verifiedAt: null;
    }
  | {
      providerId: string;
      state: "verified";
      verifiedAt: string;
      scopes: string[];
    };
export type OAuthStart = { authorizationUrl: string; expiresAt: string };
export type ExecutionPlan = {
  workflowId: string;
  // A future authenticated server must resolve and authorize the tenant itself.
  steps: {
    providerId: string;
    actionId: string;
    input: Record<string, unknown>;
  }[];
};
/** Implement only on the server, with injected vault access and authorized tenant context. */
export interface ProviderAdapter {
  readonly providerId: string;
  readonly allowedScopes: readonly string[];
  verifyConnection(connectionReference: string): Promise<ConnectionView>;
  revokeConnection(connectionReference: string): Promise<void>;
}
// OAuth support and execution capabilities must be discovered from official provider docs;
// a tool's presence in the frontend catalog is not proof that either capability is available.
