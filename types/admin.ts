// ─── Incident & Support Types ──────────────────────────────────────

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'mitigated' | 'resolved' | 'closed';
  assignee: string | null;
  reporter: string;
  affectedServices: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  timeline: IncidentTimelineEvent[];
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorType: 'admin' | 'system' | 'automation';
  event: string;
  details: string | null;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  description: string;
  status: 'open' | 'pending' | 'resolved' | 'closed' | 'escalated';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  category: string;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  messages: SupportTicketMessage[];
}

export interface SupportTicketMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  senderName: string;
  content: string;
  createdAt: string;
}

export interface ProviderHealth {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  corridor: string;
  latencyMs: number;
  errorRate: number;
  lastCheckedAt: string;
}

export interface ApiHealthStatus {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  uptimePercent: number;
  lastErrorAt: string | null;
}

export interface SmsRouteHealth {
  routeId: string;
  bankName: string;
  status: 'healthy' | 'degraded' | 'down';
  successRate: number;
  avgLatencyMs: number;
  lastMessageAt: string | null;
}

export interface DatabaseHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  connectionPool: number;
  activeConnections: number;
  maxConnections: number;
  slowQueries: number;
  replicationLagMs: number | null;
}

// ─── Core User Types ───────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = 'super_admin' | 'ops_manager' | 'support_lead' | 'analyst' | 'compliance_officer' | 'billing_admin' | 'readonly';

export type Permission =
  | 'users:read' | 'users:write' | 'users:delete' | 'users:pii'
  | 'audit:read' | 'audit:write'
  | 'subscriptions:read' | 'subscriptions:write' | 'subscriptions:refund'
  | 'remittance:read' | 'remittance:write' | 'remittance:fx_override'
  | 'coach:read' | 'coach:write' | 'coach:prompt_activate'
  | 'felo_score:read' | 'felo_score:write'
  | 'notifications:read' | 'notifications:write' | 'notifications:send'
  | 'compliance:read' | 'compliance:pii_access' | 'compliance:dsr_resolve'
  | 'feature_flags:read' | 'feature_flags:write' | 'feature_flags:kill'
  | 'sms_routes:read' | 'sms_routes:write'
  | 'analytics:read' | 'analytics:export'
  | 'two_person_approval:approve'
  | 'settings:read' | 'settings:write';

// ─── End-User Profile Types ────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  corridor: 'PK' | 'AE' | 'SA' | 'BH' | 'KW' | 'QA' | 'OM' | 'GB' | 'US' | 'CA';
  tier: SubscriptionTierLabel;
  phone: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
}

export type SubscriptionTierLabel = 'free' | 'basic' | 'pro' | 'elite';

export interface SubscriptionTier {
  id: string;
  label: SubscriptionTierLabel;
  displayName: I18nString;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  entitlements: EntitlementMatrix;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementMatrix {
  maxAccounts: number;
  maxFamilyMembers: number;
  smsParsing: boolean;
  ocrUploads: boolean;
  aiCoach: boolean;
  investmentSignals: boolean;
  prioritySupport: boolean;
  customCategories: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string;
  validUntil: string | null;
  applicableTiers: SubscriptionTierLabel[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  subscriptionId: string;
  discountApplied: number;
  createdAt: string;
}

export interface RefundRequest {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  requestedBy: string;
  approvedBy: string | null;
  secondApprover: string | null;
  createdAt: string;
  updatedAt: string;
  requiresTwoPerson: boolean;
}

// ─── Family & KYC Types ────────────────────────────────────────────

export interface FamilyGroup {
  id: string;
  headUserId: string;
  name: string;
  members: FamilyMember[];
  totalAccounts: number;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  role: 'head' | 'spouse' | 'child' | 'dependent';
  permissions: ('view' | 'spend' | 'manage')[];
  addedAt: string;
  addedBy: string;
}

export interface KycReview {
  id: string;
  userId: string;
  level: 1 | 2 | 3;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  documents: KycDocument[];
  rejectionReason: string | null;
  notes: string;
}

export interface KycDocument {
  id: string;
  type: 'passport' | 'national_id' | 'residence_permit' | 'utility_bill' | 'bank_statement';
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
  verifiedAt: string | null;
  url: string;
}

export interface ComplianceFlag {
  id: string;
  userId: string;
  type: 'suspicious_activity' | 'velocity_breach' | 'sanctions_match' | 'pep_match' | 'adr_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  description: string;
  assignedTo: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

// ─── SMS & Bank Route Types ────────────────────────────────────────

export interface SmsBankRoute {
  id: string;
  bankName: string;
  senderPattern: string;
  country: string;
  isActive: boolean;
  templateId: string;
  template: SmsParserTemplate;
  accuracyScore: number;
  totalMessages: number;
  failedMessages: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SmsParserTemplate {
  id: string;
  name: string;
  regexPattern: string;
  fieldMappings: Record<string, string>;
  sampleMessages: string[];
  confidenceThreshold: number;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptUpload {
  id: string;
  userId: string;
  fileUrl: string;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrResult: Record<string, unknown> | null;
  confidenceScore: number | null;
  reviewStatus: 'auto_approved' | 'needs_review' | 'rejected';
  createdAt: string;
  processedAt: string | null;
}

// ─── Remittance Types ──────────────────────────────────────────────

export interface RemittanceProvider {
  id: string;
  name: string;
  corridors: string[];
  feeStructure: FeeStructure;
  fxMargin: number;
  etaMinutes: number;
  isActive: boolean;
  monthlyVolume: number;
  reliabilityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  type: 'flat' | 'percentage' | 'tiered';
  flatFee: number | null;
  percentageFee: number | null;
  tiers: { min: number; max: number; fee: number }[] | null;
  currency: string;
}

export interface MarketQuote {
  id: string;
  corridorFrom: string;
  corridorTo: string;
  providerId: string;
  fxRate: number;
  inverseRate: number;
  spread: number;
  timestamp: string;
  isOverridden: boolean;
  overriddenBy: string | null;
  overrideReason: string | null;
}

export interface PortfolioHolding {
  id: string;
  userId: string;
  assetType: 'cash' | 'equity' | 'mf' | 'crypto' | 'commodity';
  assetName: string;
  quantity: number;
  avgCostPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  currency: string;
  corridor: string;
  lastUpdated: string;
}

// ─── Felo Score Types ──────────────────────────────────────────────

export interface FeloScoreFormula {
  id: string;
  version: number;
  weights: ScoreWeights;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  activatedAt: string | null;
}

export interface ScoreWeights {
  savingsRate: number;
  diversification: number;
  expenseControl: number;
  consistency: number;
  goalAchievement: number;
}

export interface FeloScoreOverride {
  id: string;
  userId: string;
  originalScore: number;
  overrideScore: number;
  reason: string;
  overriddenBy: string;
  createdAt: string;
}

// ─── Coach Types ───────────────────────────────────────────────────

export interface CoachPrompt {
  id: string;
  name: string;
  version: number;
  body: string;
  isActive: boolean;
  createdBy: string;
  activatedBy: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachGuardrailTrip {
  id: string;
  userId: string;
  promptId: string;
  guardrailType: 'pii_leak' | 'financial_advice' | 'inappropriate' | 'jailbreak' | 'hallucination';
  severity: 'low' | 'medium' | 'high' | 'critical';
  messagePreview: string;
  blockedAt: string;
  blockedBy: 'auto' | 'human_review';
  reviewStatus: 'open' | 'approved' | 'false_positive';
}

export interface CoachConversation {
  id: string;
  userId: string;
  messages: CoachMessage[];
  tokenCost: number;
  model: string;
  startedAt: string;
  endedAt: string | null;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  redactedContent: string;
  tokens: number;
  createdAt: string;
}

export interface CanaryConfig {
  promptId: string;
  trafficPercent: number;
  baselinePromptId: string;
}

// ─── Notification Types ────────────────────────────────────────────

export interface NotificationTemplate {
  id: string;
  key: string;
  channel: 'push' | 'email' | 'sms' | 'in_app';
  subject: I18nString;
  body: I18nString;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface I18nString {
  en: string;
  ur: string;
  ar?: string;
}

export interface EngagementCampaign {
  id: string;
  name: string;
  templateId: string;
  audienceFilter: AudienceFilter;
  schedule: 'immediate' | 'scheduled' | 'recurring';
  scheduledAt: string | null;
  status: 'draft' | 'queued' | 'sending' | 'completed' | 'cancelled';
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  createdBy: string;
  createdAt: string;
  sentAt: string | null;
}

export interface AudienceFilter {
  corridors: string[] | null;
  tiers: SubscriptionTierLabel[] | null;
  lastActiveDays: number | null;
  segments: string[] | null;
}

export interface AnnouncementBanner {
  id: string;
  title: I18nString;
  body: I18nString;
  ctaText: I18nString | null;
  ctaUrl: string | null;
  audience: 'all' | 'corridor' | 'tier';
  audienceFilter: Record<string, unknown>;
  priority: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  impressions: number;
  clicks: number;
}

// ─── Feature Flag Types ────────────────────────────────────────────

export interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  targeting: FlagTargeting;
  killSwitchAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface FlagTargeting {
  corridors: string[] | null;
  tiers: SubscriptionTierLabel[] | null;
  percentRollout: number;
  userIds: string[] | null;
}

// ─── Launch Readiness ──────────────────────────────────────────────

export type LaunchReadinessStatus = 'pending' | 'in_progress' | 'done' | 'blocked';

export interface LaunchReadinessItem {
  id: number;
  key: string;
  category: string;
  title: string;
  description: string | null;
  owner: string | null;
  status: LaunchReadinessStatus;
  blocking: boolean;
  rotationDueAt: string | null;
  rotationPeriodDays: number | null;
  checkedBy: string | null;
  checkedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchReadinessSummary {
  breakdown: Array<{
    category: string;
    status: LaunchReadinessStatus;
    blocking: boolean;
    count: number;
  }>;
  blockingPending: number;
  readyToLaunch: boolean;
}

// ─── Approval & Audit Types ────────────────────────────────────────

export interface TwoPersonApproval {
  id: string;
  type: 'refund' | 'fx_override' | 'tier_override' | 'prompt_activation';
  resourceId: string;
  requestedBy: string;
  requestedAt: string;
  firstApproval: ApprovalRequest | null;
  secondApproval: ApprovalRequest | null;
  status: 'pending' | 'approved' | 'rejected';
  details: Record<string, unknown>;
}

export interface ApprovalRequest {
  approverId: string;
  approverName: string;
  approvedAt: string;
  notes: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorType: 'admin' | 'system' | 'user';
  action: string;
  resourceType: string;
  resourceId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  diff: Record<string, { old: unknown; new: unknown }> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'critical';
}

// ─── Analytics Types ───────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  mrr: number;
  arpu: number;
  churnRate: number;
  newUsersThisWeek: number;
  transactionsToday: number;
  supportTicketsOpen: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  dropOff: number;
  conversionRate: number;
}

export interface CohortRetention {
  cohortDate: string;
  cohortSize: number;
  periods: CohortPeriod[];
}

export interface CohortPeriod {
  period: number;
  retained: number;
  rate: number;
}

export interface MrrWaterfall {
  month: string;
  startingMrr: number;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnMrr: number;
  endingMrr: number;
  netMrrMovement: number;
}

// ─── Traceability Types ────────────────────────────────────────────

export interface TraceabilityEvent {
  id: string;
  entityType: 'user' | 'transaction' | 'subscription' | 'remittance' | 'coach_message';
  entityId: string;
  action: string;
  actorId: string;
  actorType: 'user' | 'admin' | 'system';
  timestamp: string;
  metadata: Record<string, unknown>;
  diff: Record<string, { old: unknown; new: unknown }> | null;
}

export interface TransactionLineage {
  transactionId: string;
  userId: string;
  events: TraceabilityEvent[];
  sourceSystem: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
}
