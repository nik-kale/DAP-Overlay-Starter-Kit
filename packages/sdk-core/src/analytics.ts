/**
 * V2 Feature: Advanced Analytics & Insights Engine
 * Provides event tracking, user behavior analytics, funnel analysis, and session tracking
 */

import { retry, RateLimiter } from './utils.js';

// ==================== Types ====================

export interface AnalyticsEvent {
  eventName: string;
  eventType: AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  userId?: string;
  payload: Record<string, unknown>;
  metadata?: EventMetadata;
}

export enum AnalyticsEventType {
  STEP_VIEWED = 'step_viewed',
  STEP_DISMISSED = 'step_dismissed',
  STEP_COMPLETED = 'step_completed',
  CTA_CLICKED = 'cta_clicked',
  LINK_CLICKED = 'link_clicked',
  CUSTOM = 'custom',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  PAGE_VIEW = 'page_view',
  ERROR = 'error',
}

export interface EventMetadata {
  url?: string;
  referrer?: string;
  userAgent?: string;
  screenResolution?: string;
  viewport?: { width: number; height: number };
  device?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
}

export interface UserBehavior {
  userId?: string;
  sessionId: string;
  sessionStart: number;
  sessionDuration: number;
  eventsCount: number;
  stepsViewed: string[];
  stepsCompleted: string[];
  stepsDismissed: string[];
  ctaClicks: number;
  pageViews: number;
  lastActivity: number;
}

export interface FunnelStep {
  stepId: string;
  eventType: AnalyticsEventType;
  required?: boolean;
}

export interface FunnelAnalysis {
  funnelId: string;
  steps: FunnelStep[];
  totalUsers: number;
  stepConversions: Map<string, number>;
  dropOffRates: Map<string, number>;
  completionRate: number;
  averageTimeToComplete?: number;
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  events: AnalyticsEvent[];
  pageViews: number;
  stepsViewed: number;
  stepsCompleted: number;
  isActive: boolean;
}

export interface AnalyticsConfig {
  apiEndpoint?: string;
  enableAutoTracking?: boolean;
  sessionTimeout?: number; // milliseconds
  enableRateLimit?: boolean;
  maxEventsPerSecond?: number;
  enableRetry?: boolean;
  maxRetries?: number;
  batchSize?: number;
  flushInterval?: number; // milliseconds
  enableLocalStorage?: boolean;
  storageKey?: string;
}

// ==================== Analytics Engine ====================

export class AnalyticsEngine {
  private config: Required<AnalyticsConfig>;
  private sessionId: string;
  private userId?: string;
  private sessionStartTime: number;
  private lastActivityTime: number;
  private events: AnalyticsEvent[] = [];
  private eventBuffer: AnalyticsEvent[] = [];
  private rateLimiter: RateLimiter | null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private funnels: Map<string, FunnelAnalysis> = new Map();
  private sessions: Map<string, SessionData> = new Map();
  private userBehaviors: Map<string, UserBehavior> = new Map();

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/api/analytics',
      enableAutoTracking: config.enableAutoTracking ?? true,
      sessionTimeout: config.sessionTimeout || 30 * 60 * 1000, // 30 minutes
      enableRateLimit: config.enableRateLimit ?? true,
      maxEventsPerSecond: config.maxEventsPerSecond || 50,
      enableRetry: config.enableRetry ?? true,
      maxRetries: config.maxRetries || 3,
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      enableLocalStorage: config.enableLocalStorage ?? true,
      storageKey: config.storageKey || 'dap_analytics_session',
    };

    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();

    // Setup rate limiter
    this.rateLimiter = this.config.enableRateLimit
      ? new RateLimiter(this.config.maxEventsPerSecond, this.config.maxEventsPerSecond)
      : null;

    // Restore session from localStorage if available
    if (this.config.enableLocalStorage) {
      this.restoreSession();
    }

    // Setup auto-flush
    this.startAutoFlush();

    // Track session start
    if (this.config.enableAutoTracking) {
      this.trackSessionStart();
    }

    // Setup beforeunload to save session
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.trackSessionEnd();
        this.flush(true);
      });
    }
  }

  // ==================== Session Management ====================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
    if (this.config.enableLocalStorage) {
      this.saveSession();
    }
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        const lastActivity = data.lastActivityTime || 0;
        const now = Date.now();

        // Check if session is still valid
        if (now - lastActivity < this.config.sessionTimeout) {
          this.sessionId = data.sessionId;
          this.userId = data.userId;
          this.sessionStartTime = data.sessionStartTime;
          this.lastActivityTime = now;
        }
      }
    } catch (error) {
      console.warn('[DAP Analytics] Failed to restore session:', error);
    }
  }

  private saveSession(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        sessionId: this.sessionId,
        userId: this.userId,
        sessionStartTime: this.sessionStartTime,
        lastActivityTime: this.lastActivityTime,
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[DAP Analytics] Failed to save session:', error);
    }
  }

  // ==================== Event Tracking ====================

  track(
    eventName: string,
    eventType: AnalyticsEventType = AnalyticsEventType.CUSTOM,
    payload: Record<string, unknown> = {}
  ): void {
    // Check rate limit
    if (this.rateLimiter && !this.rateLimiter.tryConsume()) {
      console.warn('[DAP Analytics] Event rate limit exceeded, event dropped:', eventName);
      return;
    }

    const event: AnalyticsEvent = {
      eventName,
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      payload,
      metadata: this.collectMetadata(),
    };

    this.events.push(event);
    this.eventBuffer.push(event);
    this.lastActivityTime = Date.now();

    // Update user behavior
    this.updateUserBehavior(event);

    // Update session data
    this.updateSessionData(event);

    // Save session
    if (this.config.enableLocalStorage) {
      this.saveSession();
    }

    // Auto-flush if buffer is full
    if (this.eventBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Convenience methods for common events
  trackStepViewed(stepId: string, payload: Record<string, unknown> = {}): void {
    this.track(`step_viewed_${stepId}`, AnalyticsEventType.STEP_VIEWED, { stepId, ...payload });
  }

  trackStepCompleted(stepId: string, payload: Record<string, unknown> = {}): void {
    this.track(`step_completed_${stepId}`, AnalyticsEventType.STEP_COMPLETED, { stepId, ...payload });
  }

  trackStepDismissed(stepId: string, payload: Record<string, unknown> = {}): void {
    this.track(`step_dismissed_${stepId}`, AnalyticsEventType.STEP_DISMISSED, { stepId, ...payload });
  }

  trackCtaClicked(stepId: string, ctaText: string, payload: Record<string, unknown> = {}): void {
    this.track(`cta_clicked_${stepId}`, AnalyticsEventType.CTA_CLICKED, { stepId, ctaText, ...payload });
  }

  trackPageView(url: string, payload: Record<string, unknown> = {}): void {
    this.track(`page_view_${url}`, AnalyticsEventType.PAGE_VIEW, { url, ...payload });
  }

  trackError(error: Error, context: Record<string, unknown> = {}): void {
    this.track('error', AnalyticsEventType.ERROR, {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  private trackSessionStart(): void {
    this.track('session_start', AnalyticsEventType.SESSION_START, {
      sessionId: this.sessionId,
      timestamp: this.sessionStartTime,
    });
  }

  private trackSessionEnd(): void {
    const duration = Date.now() - this.sessionStartTime;
    this.track('session_end', AnalyticsEventType.SESSION_END, {
      sessionId: this.sessionId,
      duration,
    });
  }

  // ==================== Metadata Collection ====================

  private collectMetadata(): EventMetadata {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      device: this.detectDevice(),
      browser: this.detectBrowser(),
      os: this.detectOS(),
    };
  }

  private detectDevice(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectBrowser(): string {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'unknown';
  }

  private detectOS(): string {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'unknown';
  }

  // ==================== User Behavior Tracking ====================

  private updateUserBehavior(event: AnalyticsEvent): void {
    const key = this.userId || this.sessionId;
    let behavior = this.userBehaviors.get(key);

    if (!behavior) {
      behavior = {
        userId: this.userId,
        sessionId: this.sessionId,
        sessionStart: this.sessionStartTime,
        sessionDuration: 0,
        eventsCount: 0,
        stepsViewed: [],
        stepsCompleted: [],
        stepsDismissed: [],
        ctaClicks: 0,
        pageViews: 0,
        lastActivity: Date.now(),
      };
    }

    behavior.eventsCount++;
    behavior.sessionDuration = Date.now() - behavior.sessionStart;
    behavior.lastActivity = Date.now();

    // Update specific metrics based on event type
    const stepId = event.payload.stepId as string;
    switch (event.eventType) {
      case AnalyticsEventType.STEP_VIEWED:
        if (stepId && !behavior.stepsViewed.includes(stepId)) {
          behavior.stepsViewed.push(stepId);
        }
        break;
      case AnalyticsEventType.STEP_COMPLETED:
        if (stepId && !behavior.stepsCompleted.includes(stepId)) {
          behavior.stepsCompleted.push(stepId);
        }
        break;
      case AnalyticsEventType.STEP_DISMISSED:
        if (stepId && !behavior.stepsDismissed.includes(stepId)) {
          behavior.stepsDismissed.push(stepId);
        }
        break;
      case AnalyticsEventType.CTA_CLICKED:
        behavior.ctaClicks++;
        break;
      case AnalyticsEventType.PAGE_VIEW:
        behavior.pageViews++;
        break;
    }

    this.userBehaviors.set(key, behavior);
  }

  getUserBehavior(userId?: string): UserBehavior | undefined {
    const key = userId || this.userId || this.sessionId;
    return this.userBehaviors.get(key);
  }

  getAllUserBehaviors(): UserBehavior[] {
    return Array.from(this.userBehaviors.values());
  }

  // ==================== Session Data Management ====================

  private updateSessionData(event: AnalyticsEvent): void {
    let session = this.sessions.get(this.sessionId);

    if (!session) {
      session = {
        sessionId: this.sessionId,
        userId: this.userId,
        startTime: this.sessionStartTime,
        events: [],
        pageViews: 0,
        stepsViewed: 0,
        stepsCompleted: 0,
        isActive: true,
      };
    }

    session.events.push(event);

    // Update counters
    switch (event.eventType) {
      case AnalyticsEventType.PAGE_VIEW:
        session.pageViews++;
        break;
      case AnalyticsEventType.STEP_VIEWED:
        session.stepsViewed++;
        break;
      case AnalyticsEventType.STEP_COMPLETED:
        session.stepsCompleted++;
        break;
      case AnalyticsEventType.SESSION_END:
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
        session.isActive = false;
        break;
    }

    this.sessions.set(this.sessionId, session);
  }

  getSessionData(sessionId?: string): SessionData | undefined {
    return this.sessions.get(sessionId || this.sessionId);
  }

  getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  // ==================== Funnel Analysis ====================

  defineFunnel(funnelId: string, steps: FunnelStep[]): void {
    const funnel: FunnelAnalysis = {
      funnelId,
      steps,
      totalUsers: 0,
      stepConversions: new Map(),
      dropOffRates: new Map(),
      completionRate: 0,
    };

    this.funnels.set(funnelId, funnel);
  }

  analyzeFunnel(funnelId: string): FunnelAnalysis | undefined {
    const funnel = this.funnels.get(funnelId);
    if (!funnel) return undefined;

    // Analyze all user behaviors for this funnel
    const behaviors = this.getAllUserBehaviors();
    const usersByStep = new Map<string, Set<string>>();

    // Initialize step tracking
    funnel.steps.forEach((step) => {
      usersByStep.set(step.stepId, new Set());
    });

    // Track which users completed each step
    behaviors.forEach((behavior) => {
      const userKey = behavior.userId || behavior.sessionId;

      funnel.steps.forEach((funnelStep) => {
        let completed = false;

        switch (funnelStep.eventType) {
          case AnalyticsEventType.STEP_VIEWED:
            completed = behavior.stepsViewed.includes(funnelStep.stepId);
            break;
          case AnalyticsEventType.STEP_COMPLETED:
            completed = behavior.stepsCompleted.includes(funnelStep.stepId);
            break;
        }

        if (completed) {
          usersByStep.get(funnelStep.stepId)?.add(userKey);
        }
      });
    });

    // Calculate conversions and drop-off rates
    const totalUsers = behaviors.length;
    funnel.totalUsers = totalUsers;

    let previousStepUsers = totalUsers;
    funnel.steps.forEach((step, _index) => {
      const stepUsers = usersByStep.get(step.stepId)?.size || 0;
      const conversionRate = totalUsers > 0 ? (stepUsers / totalUsers) * 100 : 0;
      const dropOffRate = previousStepUsers > 0 ? ((previousStepUsers - stepUsers) / previousStepUsers) * 100 : 0;

      funnel.stepConversions.set(step.stepId, conversionRate);
      funnel.dropOffRates.set(step.stepId, dropOffRate);

      previousStepUsers = stepUsers;
    });

    // Calculate overall completion rate
    const lastStepId = funnel.steps[funnel.steps.length - 1]?.stepId;
    if (lastStepId) {
      const completedUsers = usersByStep.get(lastStepId)?.size || 0;
      funnel.completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;
    }

    return funnel;
  }

  getFunnel(funnelId: string): FunnelAnalysis | undefined {
    return this.funnels.get(funnelId);
  }

  // ==================== Data Export ====================

  getEvents(filter?: {
    startTime?: number;
    endTime?: number;
    eventType?: AnalyticsEventType;
    userId?: string;
  }): AnalyticsEvent[] {
    let filtered = this.events;

    if (filter) {
      filtered = filtered.filter((event) => {
        if (filter.startTime && event.timestamp < filter.startTime) return false;
        if (filter.endTime && event.timestamp > filter.endTime) return false;
        if (filter.eventType && event.eventType !== filter.eventType) return false;
        if (filter.userId && event.userId !== filter.userId) return false;
        return true;
      });
    }

    return filtered;
  }

  exportData(): {
    events: AnalyticsEvent[];
    sessions: SessionData[];
    userBehaviors: UserBehavior[];
    funnels: Array<FunnelAnalysis>;
  } {
    return {
      events: this.events,
      sessions: this.getAllSessions(),
      userBehaviors: this.getAllUserBehaviors(),
      funnels: Array.from(this.funnels.values()),
    };
  }

  clearData(): void {
    this.events = [];
    this.eventBuffer = [];
    this.sessions.clear();
    this.userBehaviors.clear();
    this.funnels.clear();
  }

  // ==================== Data Persistence ====================

  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  async flush(sync = false): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToSend = [...this.eventBuffer];
    this.eventBuffer = [];

    const sendEvents = async () => {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
        keepalive: sync, // Use keepalive for beforeunload
      });

      if (!response.ok) {
        throw new Error(`Analytics flush failed: ${response.statusText}`);
      }
    };

    try {
      if (this.config.enableRetry && !sync) {
        await retry(sendEvents, {
          maxAttempts: this.config.maxRetries,
          baseDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(`[DAP Analytics] Retrying flush (attempt ${attempt}):`, error.message);
          },
        });
      } else {
        await sendEvents();
      }
    } catch (error) {
      console.error('[DAP Analytics] Failed to flush events:', error);
      // Re-add events to buffer for retry
      if (!sync) {
        this.eventBuffer.unshift(...eventsToSend);
      }
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.trackSessionEnd();
    this.flush(true);
  }
}
