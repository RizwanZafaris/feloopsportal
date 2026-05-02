import axios, { type AxiosInstance, type AxiosError, type AxiosRequestConfig } from 'axios';
import { getSession, clearSession } from './auth';
import type {
  AdminUser,
  Profile,
  SubscriptionTier,
  Coupon,
  RefundRequest,
  FamilyGroup,
  KycReview,
  ComplianceFlag,
  SmsBankRoute,
  SmsParserTemplate,
  ReceiptUpload,
  RemittanceProvider,
  MarketQuote,
  CoachPrompt,
  CoachGuardrailTrip,
  CoachConversation,
  CanaryConfig,
  FeloScoreFormula,
  FeloScoreOverride,
  NotificationTemplate,
  EngagementCampaign,
  AnnouncementBanner,
  FeatureFlag,
  TwoPersonApproval,
  AuditLogEntry,
  DashboardStats,
  FunnelStage,
  CohortRetention,
  MrrWaterfall,
  TraceabilityEvent,
  TransactionLineage,
  Incident,
  IncidentTimelineEvent,
  SupportTicket,
  SupportTicketMessage,
  ProviderHealth,
  ApiHealthStatus,
  SmsRouteHealth,
  DatabaseHealth,
  LaunchReadinessItem,
  LaunchReadinessStatus,
  LaunchReadinessSummary,
} from '@/types/admin';

// ─── Axios Instance ────────────────────────────────────────────────

const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'https://appbackendfelo-production.up.railway.app/v1';

export const api: AxiosInstance = axios.create({
  baseURL: ADMIN_API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach Bearer token (Supabase JWT format)
api.interceptors.request.use(
  (config) => {
    const session = getSession();
    if (session?.token) {
      config.headers['Authorization'] = `Bearer ${session.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors + log PII access
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Typed API Helpers ─────────────────────────────────────────────

async function get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<T>(path, config);
  return res.data;
}

async function post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<T>(path, data, config);
  return res.data;
}

async function patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.patch<T>(path, data, config);
  return res.data;
}

async function del<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<T>(path, config);
  return res.data;
}

// ─── PII Access Logging ────────────────────────────────────────────

export async function logPiiAccess(userId: string, purpose: string): Promise<void> {
  await post('/admin/pii-access', { userId, purpose, timestamp: new Date().toISOString() });
}

// ─── Incident & Support API ──────────────────────────────────────

export async function listIncidents(status?: string, severity?: string): Promise<Incident[]> {
  return get('/admin/incidents', { params: { status, severity } });
}

export async function getIncident(id: string): Promise<Incident> {
  return get(`/admin/incidents/${id}`);
}

export async function createIncident(data: Partial<Incident>): Promise<Incident> {
  return post('/admin/incidents', data);
}

export async function updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
  return patch(`/admin/incidents/${id}`, data);
}

export async function addIncidentTimelineEvent(id: string, event: Omit<IncidentTimelineEvent, 'id'>): Promise<IncidentTimelineEvent> {
  return post(`/admin/incidents/${id}/timeline`, event);
}

export async function listSupportTickets(status?: string, priority?: string): Promise<SupportTicket[]> {
  return get('/admin/support-tickets', { params: { status, priority } });
}

export async function getSupportTicket(id: string): Promise<SupportTicket> {
  return get(`/admin/support-tickets/${id}`);
}

export async function createSupportTicket(data: Partial<SupportTicket>): Promise<SupportTicket> {
  return post('/admin/support-tickets', data);
}

export async function updateSupportTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket> {
  return patch(`/admin/support-tickets/${id}`, data);
}

export async function addTicketMessage(id: string, message: Omit<SupportTicketMessage, 'id'>): Promise<SupportTicketMessage> {
  return post(`/admin/support-tickets/${id}/messages`, message);
}

export async function assignTicket(id: string, assignee: string): Promise<SupportTicket> {
  return patch(`/admin/support-tickets/${id}/assign`, { assignee });
}

export async function escalateTicket(id: string, reason: string): Promise<SupportTicket> {
  return post(`/admin/support-tickets/${id}/escalate`, { reason });
}

// ─── System Health API ─────────────────────────────────────────────

export async function getApiHealth(): Promise<ApiHealthStatus[]> {
  return get('/admin/health/api');
}

export async function getProviderHealth(): Promise<ProviderHealth[]> {
  return get('/admin/health/providers');
}

export async function getSmsRouteHealth(): Promise<SmsRouteHealth[]> {
  return get('/admin/health/sms-routes');
}

export async function getDatabaseHealth(): Promise<DatabaseHealth[]> {
  return get('/admin/health/database');
}

export async function getErrorRateHistory(hours = 24): Promise<{ timestamp: string; errorRate: number; requestCount: number }[]> {
  return get('/admin/health/error-rates', { params: { hours } });
}

// ─── Auth API ──────────────────────────────────────────────────────

export async function loginWithWebAuthn(credentialId: string): Promise<{ token: string; user: AdminUser }> {
  return post('/admin/auth/webauthn/login', { credentialId });
}

export async function registerWebAuthn(email: string, credentialId: string): Promise<{ success: boolean }> {
  return post('/admin/auth/webauthn/register', { email, credentialId });
}

export async function getCurrentUser(): Promise<AdminUser> {
  return get('/admin/auth/me');
}

export async function logout(): Promise<void> {
  await post('/admin/auth/logout', {});
  clearSession();
}

// ─── Dashboard API ─────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  return get('/admin/dashboard/stats');
}

export async function getSignupFunnel(days = 30): Promise<FunnelStage[]> {
  return get('/admin/dashboard/funnel', { params: { days } });
}

export async function getTransactionSources(): Promise<{ source: string; count: number; amount: number }[]> {
  return get('/admin/dashboard/transaction-sources');
}

export async function getServiceHealth(): Promise<{ service: string; status: 'healthy' | 'degraded' | 'down'; uptime: number }[]> {
  return get('/admin/dashboard/service-health');
}

export async function getRecentAuditLog(limit = 10): Promise<AuditLogEntry[]> {
  return get('/admin/audit-log', { params: { limit } });
}

// ─── User Management API ───────────────────────────────────────────

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  corridor?: string;
  tier?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listUsers(params: UserListParams = {}): Promise<{ items: Profile[]; total: number; page: number; totalPages: number }> {
  return get('/admin/users', { params });
}

export async function getUser(id: string): Promise<Profile> {
  await logPiiAccess(id, 'View user profile');
  return get(`/admin/users/${id}`);
}

export async function forceLogoutUser(id: string): Promise<void> {
  return post(`/admin/users/${id}/force-logout`, {});
}

export async function softDeleteUser(id: string): Promise<void> {
  return del(`/admin/users/${id}`);
}

export async function overrideUserTier(id: string, tier: string, reason: string): Promise<void> {
  return post(`/admin/users/${id}/tier-override`, { tier, reason });
}

// ─── Traceability API ──────────────────────────────────────────────

export async function searchTraceability(query: string): Promise<TraceabilityEvent[]> {
  return get('/admin/traceability/search', { params: { q: query } });
}

export async function getUserTimeline(userId: string): Promise<TraceabilityEvent[]> {
  return get(`/admin/traceability/user/${userId}`);
}

export async function getTransactionLineage(transactionId: string): Promise<TransactionLineage> {
  return get(`/admin/traceability/transaction/${transactionId}`);
}

// ─── SMS Routes API ────────────────────────────────────────────────

export async function listSmsRoutes(): Promise<SmsBankRoute[]> {
  return get('/admin/sms-routes');
}

export async function createSmsRoute(data: Partial<SmsBankRoute>): Promise<SmsBankRoute> {
  return post('/admin/sms-routes', data);
}

export async function updateSmsRoute(id: string, data: Partial<SmsBankRoute>): Promise<SmsBankRoute> {
  return patch(`/admin/sms-routes/${id}`, data);
}

export async function listParserTemplates(): Promise<SmsParserTemplate[]> {
  return get('/admin/sms-routes/templates');
}

export async function createParserTemplate(data: Partial<SmsParserTemplate>): Promise<SmsParserTemplate> {
  return post('/admin/sms-routes/templates', data);
}

export async function updateParserTemplate(id: string, data: Partial<SmsParserTemplate>): Promise<SmsParserTemplate> {
  return patch(`/admin/sms-routes/templates/${id}`, data);
}

export async function testParserTemplate(templateId: string, message: string): Promise<{
  extracted: Record<string, unknown>;
  confidence: number;
  matched: boolean;
}> {
  return post('/admin/sms-routes/templates/test', { templateId, message });
}

export async function getFailedMessages(): Promise<{ id: string; message: string; reason: string; createdAt: string }[]> {
  return get('/admin/sms-routes/failed-messages');
}

export async function reprocessFailedMessage(id: string): Promise<void> {
  return post(`/admin/sms-routes/failed-messages/${id}/reprocess`, {});
}

export async function getTemplateAccuracy(): Promise<{ templateId: string; name: string; accuracy: number; total: number }[]> {
  return get('/admin/sms-routes/accuracy');
}

// ─── Remittance Ops API ────────────────────────────────────────────

export async function listRemittanceProviders(): Promise<RemittanceProvider[]> {
  return get('/admin/remittance/providers');
}

export async function updateProvider(id: string, data: Partial<RemittanceProvider>): Promise<RemittanceProvider> {
  return patch(`/admin/remittance/providers/${id}`, data);
}

export async function getMarketQuotes(corridor?: string): Promise<MarketQuote[]> {
  return get('/admin/remittance/quotes', { params: { corridor } });
}

export async function overrideFxRate(quoteId: string, rate: number, reason: string): Promise<MarketQuote> {
  return post('/admin/remittance/fx-override', { quoteId, rate, reason });
}

export async function getComplianceFlags(status?: string): Promise<ComplianceFlag[]> {
  return get('/admin/remittance/compliance-flags', { params: { status } });
}

export async function assignComplianceFlag(id: string, assignedTo: string): Promise<void> {
  return patch(`/admin/remittance/compliance-flags/${id}/assign`, { assignedTo });
}

export async function resolveComplianceFlag(id: string, resolution: string, approved: boolean): Promise<void> {
  return patch(`/admin/remittance/compliance-flags/${id}/resolve`, { resolution, approved });
}

// ─── Subscription & Billing API ────────────────────────────────────

export async function listTiers(): Promise<SubscriptionTier[]> {
  return get('/admin/subscriptions/tiers');
}

export async function createTier(data: Partial<SubscriptionTier>): Promise<SubscriptionTier> {
  return post('/admin/subscriptions/tiers', data);
}

export async function updateTier(id: string, data: Partial<SubscriptionTier>): Promise<SubscriptionTier> {
  return patch(`/admin/subscriptions/tiers/${id}`, data);
}

export async function listCoupons(): Promise<Coupon[]> {
  return get('/admin/subscriptions/coupons');
}

export async function createCoupon(data: Partial<Coupon>): Promise<Coupon> {
  return post('/admin/subscriptions/coupons', data);
}

export async function getCouponRedemptions(couponId: string): Promise<{ items: { id: string; userId: string; createdAt: string }[]; total: number }> {
  return get(`/admin/subscriptions/coupons/${couponId}/redemptions`);
}

export async function listRefundRequests(status?: string): Promise<RefundRequest[]> {
  return get('/admin/subscriptions/refunds', { params: { status } });
}

export async function approveRefund(id: string, notes: string): Promise<RefundRequest> {
  return post(`/admin/subscriptions/refunds/${id}/approve`, { notes });
}

export async function rejectRefund(id: string, reason: string): Promise<RefundRequest> {
  return post(`/admin/subscriptions/refunds/${id}/reject`, { reason });
}

export async function listFailedPayments(): Promise<{ id: string; userId: string; amount: number; reason: string; retryCount: number; createdAt: string }[]> {
  return get('/admin/subscriptions/failed-payments');
}

export async function listWebhookEvents(provider: 'stripe' | 'revenuecat'): Promise<{ id: string; type: string; status: string; createdAt: string }[]> {
  return get('/admin/subscriptions/webhooks', { params: { provider } });
}

// ─── Coach Ops API ─────────────────────────────────────────────────

export async function listCoachPrompts(): Promise<CoachPrompt[]> {
  return get('/admin/coach/prompts');
}

export async function createCoachPrompt(data: Partial<CoachPrompt>): Promise<CoachPrompt> {
  return post('/admin/coach/prompts', data);
}

export async function activatePrompt(id: string): Promise<CoachPrompt> {
  return post(`/admin/coach/prompts/${id}/activate`, {});
}

export async function listGuardrailTrips(filters?: { severity?: string; status?: string }): Promise<CoachGuardrailTrip[]> {
  return get('/admin/coach/guardrails', { params: filters });
}

export async function getConversation(conversationId: string): Promise<CoachConversation> {
  return get(`/admin/coach/conversations/${conversationId}`);
}

export async function getTokenCostDashboard(): Promise<{
  dailyCosts: { date: string; tokens: number; cost: number }[];
  totalThisMonth: number;
}> {
  return get('/admin/coach/token-costs');
}

export async function getCanaryConfig(): Promise<CanaryConfig> {
  return get('/admin/coach/canary');
}

export async function updateCanaryConfig(config: Partial<CanaryConfig>): Promise<CanaryConfig> {
  return patch('/admin/coach/canary', config);
}

// ─── Felo Score API ────────────────────────────────────────────────

export async function getScoreFormula(): Promise<FeloScoreFormula> {
  return get('/admin/felo-score/formula');
}

export async function createFormulaVersion(weights: Record<string, number>): Promise<FeloScoreFormula> {
  return post('/admin/felo-score/formula', { weights });
}

export async function activateFormulaVersion(id: string): Promise<void> {
  return post(`/admin/felo-score/formula/${id}/activate`, {});
}

export async function listFormulaVersions(): Promise<FeloScoreFormula[]> {
  return get('/admin/felo-score/formula/versions');
}

export async function listScoreOverrides(): Promise<FeloScoreOverride[]> {
  return get('/admin/felo-score/overrides');
}

export async function createScoreOverride(data: Partial<FeloScoreOverride>): Promise<FeloScoreOverride> {
  return post('/admin/felo-score/overrides', data);
}

export async function getScoreDistribution(): Promise<{ score: number; count: number }[]> {
  return get('/admin/felo-score/distribution');
}

// ─── Notification Studio API ───────────────────────────────────────

export async function listTemplates(): Promise<NotificationTemplate[]> {
  return get('/admin/notifications/templates');
}

export async function createTemplate(data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
  return post('/admin/notifications/templates', data);
}

export async function updateTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
  return patch(`/admin/notifications/templates/${id}`, data);
}

export async function deleteTemplate(id: string): Promise<void> {
  return del(`/admin/notifications/templates/${id}`);
}

export async function listCampaigns(): Promise<EngagementCampaign[]> {
  return get('/admin/notifications/campaigns');
}

export async function createCampaign(data: Partial<EngagementCampaign>): Promise<EngagementCampaign> {
  return post('/admin/notifications/campaigns', data);
}

export async function sendCampaign(id: string): Promise<void> {
  return post(`/admin/notifications/campaigns/${id}/send`, {});
}

export async function getCampaignMetrics(campaignId: string): Promise<{
  sent: number;
  delivered: number;
  opened: number;
  clickRate: number;
}> {
  return get(`/admin/notifications/campaigns/${campaignId}/metrics`);
}

export async function listBanners(): Promise<AnnouncementBanner[]> {
  return get('/admin/notifications/banners');
}

export async function createBanner(data: Partial<AnnouncementBanner>): Promise<AnnouncementBanner> {
  return post('/admin/notifications/banners', data);
}

export async function updateBanner(id: string, data: Partial<AnnouncementBanner>): Promise<AnnouncementBanner> {
  return patch(`/admin/notifications/banners/${id}`, data);
}

export async function deleteBanner(id: string): Promise<void> {
  return del(`/admin/notifications/banners/${id}`);
}

// ─── Compliance API ────────────────────────────────────────────────

export async function getDsrRequests(status?: string): Promise<{
  id: string;
  userId: string;
  type: 'export' | 'delete';
  status: string;
  slaDeadline: string;
  createdAt: string;
}[]> {
  return get('/admin/compliance/dsr', { params: { status } });
}

export async function resolveDsr(id: string, resolution: string): Promise<void> {
  return post(`/admin/compliance/dsr/${id}/resolve`, { resolution });
}

export async function getPiiAccessLog(userId?: string): Promise<{
  id: string;
  adminId: string;
  userId: string;
  purpose: string;
  accessedAt: string;
}[]> {
  return get('/admin/compliance/pii-access-log', { params: { userId } });
}

export async function getRetentionMetrics(): Promise<{
  retentionByDataType: { dataType: string; recordCount: number; oldestRecord: string }[];
  deletionsPending: number;
  exportsPending: number;
}> {
  return get('/admin/compliance/retention');
}

// ─── Feature Flags API ─────────────────────────────────────────────

export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  return get('/admin/feature-flags');
}

export async function createFeatureFlag(data: Partial<FeatureFlag>): Promise<FeatureFlag> {
  return post('/admin/feature-flags', data);
}

export async function updateFeatureFlag(id: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> {
  return patch(`/admin/feature-flags/${id}`, data);
}

export async function killFeatureFlag(id: string): Promise<void> {
  return post(`/admin/feature-flags/${id}/kill`, {});
}

// ─── Analytics API ─────────────────────────────────────────────────

export async function getCohortRetention(): Promise<CohortRetention[]> {
  return get('/admin/analytics/cohorts');
}

export async function getFunnelAnalytics(): Promise<FunnelStage[]> {
  return get('/admin/analytics/funnel');
}

export async function getMrrWaterfall(): Promise<MrrWaterfall[]> {
  return get('/admin/analytics/mrr-waterfall');
}

export async function getLtvEstimation(): Promise<{ corridor: string; avgLtv: number; cohortSize: number }[]> {
  return get('/admin/analytics/ltv');
}

export async function exportAnalytics(format: 'csv' | 'json', reportType: string): Promise<Blob> {
  const res = await api.get(`/admin/analytics/export`, {
    params: { format, reportType },
    responseType: 'blob',
  });
  return res.data;
}

// ─── Audit Log API ─────────────────────────────────────────────────

export interface AuditLogParams {
  page?: number;
  limit?: number;
  search?: string;
  actorId?: string;
  resourceType?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listAuditLog(params: AuditLogParams = {}): Promise<{
  items: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return get('/admin/audit-log', { params });
}

export async function getAnomalies(): Promise<{
  massExports: AuditLogEntry[];
  afterHoursAccess: AuditLogEntry[];
  suspiciousDeletions: AuditLogEntry[];
}> {
  return get('/admin/audit-log/anomalies');
}

// ─── Two-Person Approval API ───────────────────────────────────────

export async function listApprovalRequests(status?: string): Promise<TwoPersonApproval[]> {
  return get('/admin/approvals', { params: { status } });
}

export async function submitApproval(approvalId: string, notes: string): Promise<TwoPersonApproval> {
  return post(`/admin/approvals/${approvalId}/approve`, { notes });
}

export async function rejectApproval(approvalId: string, reason: string): Promise<TwoPersonApproval> {
  return post(`/admin/approvals/${approvalId}/reject`, { reason });
}

// ─── Launch Readiness API ──────────────────────────────────────────

export async function listLaunchReadinessItems(filters: {
  category?: string;
  status?: string;
  blocking?: boolean;
} = {}): Promise<LaunchReadinessItem[]> {
  return get('/admin/launch-readiness/items', {
    params: {
      category: filters.category,
      status: filters.status,
      blocking: filters.blocking === undefined ? undefined : String(filters.blocking),
    },
  });
}

export async function getLaunchReadinessSummary(): Promise<LaunchReadinessSummary> {
  return get('/admin/launch-readiness/summary');
}

export async function updateLaunchReadinessStatus(
  id: number,
  status: LaunchReadinessStatus,
  notes?: string,
): Promise<LaunchReadinessItem> {
  return patch(`/admin/launch-readiness/items/${id}/status`, { status, notes });
}
