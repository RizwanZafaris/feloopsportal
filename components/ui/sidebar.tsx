'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/rbac';
import type { Permission } from '@/types/admin';
import {
  LayoutDashboard,
  Users,
  Search,
  MessageSquare,
  Send,
  CreditCard,
  Brain,
  Award,
  Bell,
  Shield,
  BarChart3,
  ClipboardList,
  ToggleLeft,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Landmark,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Search: <Search className="h-4 w-4" />,
  MessageSquare: <MessageSquare className="h-4 w-4" />,
  Send: <Send className="h-4 w-4" />,
  CreditCard: <CreditCard className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
  Award: <Award className="h-4 w-4" />,
  Bell: <Bell className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  ClipboardList: <ClipboardList className="h-4 w-4" />,
  ToggleLeft: <ToggleLeft className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  Landmark: <Landmark className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
};

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: string;
    permission?: Permission;
    children?: { label: string; href: string; permission?: Permission }[];
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' }],
  },
  {
    title: 'People',
    items: [
      { label: 'Users', href: '/users', icon: 'Users', permission: 'users:read' },
      { label: 'Traceability', href: '/traceability', icon: 'Search', permission: 'audit:read' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Incidents', href: '/incidents', icon: 'AlertTriangle', permission: 'audit:read' },
      { label: 'Support Tickets', href: '/support-tickets', icon: 'MessageSquare', permission: 'users:read' },
      { label: 'System Health', href: '/system-health', icon: 'Activity', permission: 'audit:read' },
    ],
  },
  {
    title: 'Capture',
    items: [{ label: 'SMS Routes', href: '/sms-routes', icon: 'MessageSquare', permission: 'sms_routes:read' }],
  },
  {
    title: 'Remittance',
    items: [{ label: 'Remittance Ops', href: '/remittance-ops', icon: 'Send', permission: 'remittance:read' }],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Felo Score', href: '/felo-score', icon: 'Award', permission: 'felo_score:read' },
      { label: 'Coach Ops', href: '/coach-ops', icon: 'Brain', permission: 'coach:read' },
      {
        label: 'Notifications',
        href: '/notifications-ops',
        icon: 'Bell',
        permission: 'notifications:read',
        children: [
          { label: 'Templates', href: '/notifications-ops' },
          { label: 'Banners', href: '/notifications-ops/banners' },
        ],
      },
    ],
  },
  {
    title: 'Monetization',
    items: [
      { label: 'Subscriptions', href: '/subscriptions-ops', icon: 'CreditCard', permission: 'subscriptions:read' },
    ],
  },
  {
    title: 'Governance',
    items: [
      { label: 'Compliance', href: '/compliance-ops', icon: 'Shield', permission: 'compliance:read' },
      { label: 'Analytics', href: '/analytics', icon: 'BarChart3', permission: 'analytics:read' },
      { label: 'Audit Log', href: '/audit-viewer', icon: 'ClipboardList', permission: 'audit:read' },
      { label: 'Feature Flags', href: '/feature-flags', icon: 'ToggleLeft', permission: 'feature_flags:read' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-felo-sage-600 text-white font-bold text-sm">
          F
        </div>
        {!collapsed && <span className="font-semibold text-foreground">FELO Ops</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              if (item.permission && !hasPermission(user, item.permission)) return null;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedSections[item.label];

              return (
                <div key={item.href}>
                  {hasChildren && !collapsed ? (
                    <button
                      onClick={() => toggleSection(item.label)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {ICON_MAP[item.icon]}
                      <span className="flex-1 text-left">{item.label}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  ) : collapsed ? (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-center rounded-lg py-2 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                      title={item.label}
                    >
                      {ICON_MAP[item.icon]}
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {ICON_MAP[item.icon]}
                      <span>{item.label}</span>
                    </Link>
                  )}

                  {/* Children */}
                  {hasChildren && isExpanded && !collapsed && (
                    <div className="ml-6 mt-1 space-y-1 border-l pl-2">
                      {item.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block rounded-md px-3 py-1.5 text-sm transition-colors',
                            isActive(child.href)
                              ? 'text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        {user && !collapsed && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <div className="h-6 w-6 rounded-full bg-felo-sage-200 flex items-center justify-center text-xs font-medium text-felo-sage-800">
              {user.displayName?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium">{user.displayName}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user.role}</p>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {user && collapsed && (
          <button onClick={logout} className="mt-1 flex w-full justify-center rounded-lg p-2 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
