import { type AdminUser, type AdminRole, type Permission } from '@/types/admin';

// ─── Role Definitions ──────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    'users:read', 'users:write', 'users:delete', 'users:pii',
    'audit:read', 'audit:write',
    'subscriptions:read', 'subscriptions:write', 'subscriptions:refund',
    'remittance:read', 'remittance:write', 'remittance:fx_override',
    'coach:read', 'coach:write', 'coach:prompt_activate',
    'felo_score:read', 'felo_score:write',
    'notifications:read', 'notifications:write', 'notifications:send',
    'compliance:read', 'compliance:pii_access', 'compliance:dsr_resolve',
    'feature_flags:read', 'feature_flags:write', 'feature_flags:kill',
    'sms_routes:read', 'sms_routes:write',
    'analytics:read', 'analytics:export',
    'two_person_approval:approve',
    'settings:read', 'settings:write',
  ],
  ops_manager: [
    'users:read', 'users:write', 'users:pii',
    'audit:read',
    'subscriptions:read', 'subscriptions:write',
    'remittance:read', 'remittance:write', 'remittance:fx_override',
    'coach:read', 'coach:write', 'coach:prompt_activate',
    'notifications:read', 'notifications:write', 'notifications:send',
    'compliance:read', 'compliance:pii_access',
    'sms_routes:read', 'sms_routes:write',
    'analytics:read', 'analytics:export',
    'two_person_approval:approve',
    'settings:read',
  ],
  support_lead: [
    'users:read', 'users:write', 'users:pii',
    'audit:read',
    'subscriptions:read',
    'remittance:read',
    'coach:read',
    'notifications:read', 'notifications:write',
    'compliance:read', 'compliance:pii_access',
    'analytics:read',
    'settings:read',
  ],
  analyst: [
    'users:read',
    'audit:read',
    'subscriptions:read',
    'remittance:read',
    'coach:read',
    'felo_score:read',
    'notifications:read',
    'compliance:read',
    'sms_routes:read',
    'analytics:read', 'analytics:export',
    'settings:read',
  ],
  compliance_officer: [
    'users:read', 'users:pii',
    'audit:read',
    'subscriptions:read',
    'compliance:read', 'compliance:pii_access', 'compliance:dsr_resolve',
    'analytics:read', 'analytics:export',
    'settings:read',
  ],
  billing_admin: [
    'users:read',
    'audit:read',
    'subscriptions:read', 'subscriptions:write', 'subscriptions:refund',
    'analytics:read', 'analytics:export',
    'two_person_approval:approve',
    'settings:read',
  ],
  readonly: [
    'users:read',
    'audit:read',
    'subscriptions:read',
    'remittance:read',
    'coach:read',
    'felo_score:read',
    'notifications:read',
    'compliance:read',
    'sms_routes:read',
    'analytics:read',
    'settings:read',
  ],
};

// ─── Permission Descriptions ───────────────────────────────────────

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'users:read': 'View user profiles',
  'users:write': 'Edit user profiles',
  'users:delete': 'Delete/soft-delete users',
  'users:pii': 'Access personally identifiable information',
  'audit:read': 'View audit logs',
  'audit:write': 'Create audit entries',
  'subscriptions:read': 'View subscriptions and billing',
  'subscriptions:write': 'Manage subscriptions and tiers',
  'subscriptions:refund': 'Process refunds',
  'remittance:read': 'View remittance data',
  'remittance:write': 'Manage remittance providers',
  'remittance:fx_override': 'Override FX rates',
  'coach:read': 'View coach conversations',
  'coach:write': 'Manage coach prompts',
  'coach:prompt_activate': 'Activate prompt versions',
  'felo_score:read': 'View Felo Score data',
  'felo_score:write': 'Edit Felo Score formula',
  'notifications:read': 'View notification templates',
  'notifications:write': 'Manage templates and campaigns',
  'notifications:send': 'Send notifications',
  'compliance:read': 'View compliance data',
  'compliance:pii_access': 'Access PII (logged)',
  'compliance:dsr_resolve': 'Resolve DSR requests',
  'feature_flags:read': 'View feature flags',
  'feature_flags:write': 'Manage feature flags',
  'feature_flags:kill': 'Use kill switches',
  'sms_routes:read': 'View SMS routes',
  'sms_routes:write': 'Manage SMS parser templates',
  'analytics:read': 'View analytics dashboards',
  'analytics:export': 'Export analytics data',
  'two_person_approval:approve': 'Approve two-person approval requests',
  'settings:read': 'View settings',
  'settings:write': 'Edit settings',
};

// ─── Helpers ───────────────────────────────────────────────────────

export function hasPermission(user: AdminUser | null, permission: Permission): boolean {
  if (!user) return false;
  if (!user.isActive) return false;
  if (user.role === 'super_admin') return true;
  return user.permissions.includes(permission) || ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
}

export function hasAnyPermission(user: AdminUser | null, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(user: AdminUser | null, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function getAvailablePermissions(): Permission[] {
  return Object.keys(PERMISSION_DESCRIPTIONS) as Permission[];
}

// ─── Two-Person Approval Thresholds ────────────────────────────────

export const TWO_PERSON_THRESHOLDS = {
  refundAmount: 50000, // PKR 50,000
  fxOverride: true,
  tierOverride: true,
  promptActivation: true,
} as const;

export function requiresTwoPersonApproval(
  type: 'refund' | 'fx_override' | 'tier_override' | 'prompt_activation',
  amount?: number
): boolean {
  switch (type) {
    case 'refund':
      return (amount || 0) >= TWO_PERSON_THRESHOLDS.refundAmount;
    case 'fx_override':
    case 'tier_override':
    case 'prompt_activation':
      return TWO_PERSON_THRESHOLDS[type];
    default:
      return false;
  }
}

// ─── Sidebar Navigation RBAC ───────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permissions?: Permission[];
  children?: NavItem[];
}

export function filterNavByRole(items: NavItem[], user: AdminUser | null): NavItem[] {
  return items
    .filter((item) => {
      if (!item.permissions) return true;
      return hasAnyPermission(user, item.permissions);
    })
    .map((item) => ({
      ...item,
      children: item.children ? filterNavByRole(item.children, user) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0);
}
