export type IntegrationStatus = "connected" | "available" | "coming_soon" | "requires_setup";

export type IntegrationRecord = {
  id: string;
  organizationId: string;
  provider: string;
  category: string;
  status: IntegrationStatus;
  externalAccountId?: string;
  lastSyncedAt?: string;
};

export type ConnectorObject = {
  sourceObjectId: string;
  sourceUpdatedAt: string;
  payload: unknown;
  provenance: Record<string, string>;
};

export interface RecovraConnector {
  provider: string;
  supportedObjects: readonly string[];
  sync(args: {
    organizationId: string;
    cursor?: string;
    idempotencyKey: string;
  }): Promise<{ objects: ConnectorObject[]; nextCursor?: string }>;
  revoke(args: { organizationId: string; integrationId: string }): Promise<void>;
}

/**
 * Credentials are resolved in trusted server code. Implementations must never
 * serialize provider secrets or service-role keys into connector records.
 */
export interface ConnectorSecretResolver {
  resolve(integrationId: string, organizationId: string): Promise<Record<string, string>>;
}
