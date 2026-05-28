export type Membership = {
  memberId: string;
  tenantId: string;
  gymName: string;
  logoUrl: string | null;
  accentColor: string | null;
};

export type TenantBranding = {
  gymName: string;
  logoUrl: string | null;
  accentColor: string | null;
};
