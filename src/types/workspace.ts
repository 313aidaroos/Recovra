export const ORGANIZATION_ROLES = ["owner", "admin", "finance", "analyst", "operations", "reviewer", "viewer"] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

/** Roles allowed to ingest documents, run audits and edit vendor/contract data. */
export const WRITER_ROLES: OrganizationRole[] = ["owner", "admin", "finance", "analyst", "operations"];
/** Roles allowed to approve claims and record realized money. */
export const APPROVER_ROLES: OrganizationRole[] = ["owner", "admin", "finance"];
/** Roles allowed to manage members and organization settings. */
export const ADMIN_ROLES: OrganizationRole[] = ["owner", "admin"];

export type Organization = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  review_threshold: string;
};

export type Membership = {
  organization: Organization;
  role: OrganizationRole;
};

export type WorkspaceUser = {
  id: string;
  email: string;
  fullName: string;
};
