import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  requiresTwoPersonApproval,
  ROLE_PERMISSIONS,
  filterNavByRole,
} from '@/lib/rbac';
import type { AdminUser, AdminRole, Permission } from '@/types/admin';

const mockUser = (role: AdminRole, overrides?: Partial<AdminUser>): AdminUser => ({
  id: 'u1',
  email: 'test@felo.io',
  displayName: 'Test',
  role,
  permissions: [],
  isActive: true,
  lastLoginAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('RBAC', () => {
  describe('hasPermission', () => {
    it('grants all permissions to super_admin', () => {
      const user = mockUser('super_admin');
      expect(hasPermission(user, 'users:delete')).toBe(true);
      expect(hasPermission(user, 'feature_flags:kill')).toBe(true);
      expect(hasPermission(user, 'analytics:export')).toBe(true);
    });

    it('denies all for null user', () => {
      expect(hasPermission(null, 'users:read')).toBe(false);
    });

    it('denies for inactive user', () => {
      const user = mockUser('analyst', { isActive: false });
      expect(hasPermission(user, 'users:read')).toBe(false);
    });

    it('respects role-based permissions', () => {
      const analyst = mockUser('analyst');
      expect(hasPermission(analyst, 'users:read')).toBe(true);
      expect(hasPermission(analyst, 'users:write')).toBe(false);
      expect(hasPermission(analyst, 'users:delete')).toBe(false);
    });

    it('respects explicit user.permissions array', () => {
      const user = mockUser('readonly', { permissions: ['users:write'] as Permission[] });
      expect(hasPermission(user, 'users:write')).toBe(true);
      expect(hasPermission(user, 'users:read')).toBe(true); // readonly base
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true if any permission matches', () => {
      const user = mockUser('analyst');
      expect(hasAnyPermission(user, ['users:read', 'users:delete'])).toBe(true);
      expect(hasAnyPermission(user, ['users:delete', 'feature_flags:kill'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true only if all permissions match', () => {
      const admin = mockUser('super_admin');
      expect(hasAllPermissions(admin, ['users:read', 'users:delete', 'feature_flags:kill'])).toBe(true);

      const analyst = mockUser('analyst');
      expect(hasAllPermissions(analyst, ['users:read', 'users:delete'])).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('returns permissions for each role', () => {
      expect(getRolePermissions('super_admin').length).toBeGreaterThan(20);
      expect(getRolePermissions('readonly').length).toBeGreaterThan(5);
      expect(getRolePermissions('billing_admin')).toContain('subscriptions:refund');
    });

    it('returns empty array for unknown role', () => {
      expect(getRolePermissions('unknown' as AdminRole)).toEqual([]);
    });
  });

  describe('requiresTwoPersonApproval', () => {
    it('requires 2PA for refunds over PKR 50k', () => {
      expect(requiresTwoPersonApproval('refund', 50000)).toBe(true);
      expect(requiresTwoPersonApproval('refund', 49999)).toBe(false);
    });

    it('requires 2PA for FX override', () => {
      expect(requiresTwoPersonApproval('fx_override')).toBe(true);
    });

    it('requires 2PA for tier override', () => {
      expect(requiresTwoPersonApproval('tier_override')).toBe(true);
    });

    it('requires 2PA for prompt activation', () => {
      expect(requiresTwoPersonApproval('prompt_activation')).toBe(true);
    });
  });

  describe('ROLE_PERMISSIONS completeness', () => {
    it('has defined permissions for all roles', () => {
      const roles: AdminRole[] = ['super_admin', 'ops_manager', 'support_lead', 'analyst', 'compliance_officer', 'billing_admin', 'readonly'];
      for (const role of roles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      }
    });
  });

  describe('filterNavByRole', () => {
    const navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Users', href: '/users', icon: 'Users', permissions: ['users:read'] as Permission[] },
      { label: 'Flags', href: '/flags', icon: 'ToggleLeft', permissions: ['feature_flags:kill'] as Permission[] },
    ];

    it('shows all items for super_admin', () => {
      const filtered = filterNavByRole(navItems, mockUser('super_admin'));
      expect(filtered.length).toBe(3);
    });

    it('hides items without permission', () => {
      const analyst = mockUser('analyst');
      const filtered = filterNavByRole(navItems, analyst);
      expect(filtered.length).toBe(2);
      expect(filtered.find((i) => i.label === 'Flags')).toBeUndefined();
    });
  });
});
