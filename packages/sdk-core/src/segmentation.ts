/**
 * V3 Feature: User Segmentation & Targeting Engine
 * Provides advanced user segmentation, cohort management, and personalized targeting
 */

// ==================== Types ====================

export interface UserAttributes {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  plan?: string;
  signupDate?: number;
  lastLoginDate?: number;
  customAttributes?: Record<string, unknown>;
}

export interface CompanyAttributes {
  companyId?: string;
  companyName?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  plan?: string;
  mrr?: number;
  customAttributes?: Record<string, unknown>;
}

export interface BehaviorAttributes {
  pageViews?: number;
  sessionCount?: number;
  featureUsage?: Record<string, number>;
  lastActivityDate?: number;
  totalTimeSpent?: number; // milliseconds
  eventsTriggered?: string[];
  stepsCompleted?: string[];
}

export interface UserProfile {
  user: UserAttributes;
  company?: CompanyAttributes;
  behavior: BehaviorAttributes;
  segments: string[];
  cohorts: string[];
  metadata?: Record<string, unknown>;
}

export interface SegmentCondition {
  type: 'user' | 'company' | 'behavior' | 'cohort';
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'in' | 'notIn' | 'exists' | 'notExists';
  field: string;
  value?: unknown;
}

export interface SegmentRule {
  conditions: SegmentCondition[];
  logic?: 'AND' | 'OR'; // Default: AND
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  priority?: number;
  enabled?: boolean;
}

export interface Cohort {
  id: string;
  name: string;
  description?: string;
  userIds: Set<string>;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface TargetingRule {
  segments?: string[]; // User must be in ANY of these segments
  cohorts?: string[]; // User must be in ANY of these cohorts
  excludeSegments?: string[]; // User must NOT be in any of these segments
  excludeCohorts?: string[]; // User must NOT be in any of these cohorts
  customLogic?: (profile: UserProfile) => boolean; // Custom targeting function
}

// ==================== Segmentation Engine ====================

export class SegmentationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private segments: Map<string, Segment> = new Map();
  private cohorts: Map<string, Cohort> = new Map();

  // ==================== User Profile Management ====================

  setUserProfile(userId: string, profile: Partial<UserProfile>): void {
    const existing = this.userProfiles.get(userId) || {
      user: { userId },
      behavior: {},
      segments: [],
      cohorts: [],
    };

    const updated: UserProfile = {
      user: { ...existing.user, ...profile.user },
      company: profile.company ? { ...existing.company, ...profile.company } : existing.company,
      behavior: { ...existing.behavior, ...profile.behavior },
      segments: profile.segments || existing.segments,
      cohorts: profile.cohorts || existing.cohorts,
      metadata: profile.metadata ? { ...existing.metadata, ...profile.metadata } : existing.metadata,
    };

    this.userProfiles.set(userId, updated);

    // Re-evaluate segments for this user
    this.evaluateUserSegments(userId);
  }

  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  updateUserAttributes(userId: string, attributes: Partial<UserAttributes>): void {
    const profile = this.getUserProfile(userId) || {
      user: { userId },
      behavior: {},
      segments: [],
      cohorts: [],
    };

    profile.user = { ...profile.user, ...attributes };
    this.userProfiles.set(userId, profile);
    this.evaluateUserSegments(userId);
  }

  updateCompanyAttributes(userId: string, attributes: Partial<CompanyAttributes>): void {
    const profile = this.getUserProfile(userId) || {
      user: { userId },
      behavior: {},
      segments: [],
      cohorts: [],
    };

    profile.company = { ...profile.company, ...attributes };
    this.userProfiles.set(userId, profile);
    this.evaluateUserSegments(userId);
  }

  updateBehaviorAttributes(userId: string, attributes: Partial<BehaviorAttributes>): void {
    const profile = this.getUserProfile(userId) || {
      user: { userId },
      behavior: {},
      segments: [],
      cohorts: [],
    };

    profile.behavior = { ...profile.behavior, ...attributes };
    this.userProfiles.set(userId, profile);
    this.evaluateUserSegments(userId);
  }

  trackEvent(userId: string, eventName: string): void {
    const profile = this.getUserProfile(userId);
    if (!profile) return;

    if (!profile.behavior.eventsTriggered) {
      profile.behavior.eventsTriggered = [];
    }

    if (!profile.behavior.eventsTriggered.includes(eventName)) {
      profile.behavior.eventsTriggered.push(eventName);
      this.evaluateUserSegments(userId);
    }
  }

  trackFeatureUsage(userId: string, featureName: string): void {
    const profile = this.getUserProfile(userId);
    if (!profile) return;

    if (!profile.behavior.featureUsage) {
      profile.behavior.featureUsage = {};
    }

    profile.behavior.featureUsage[featureName] = (profile.behavior.featureUsage[featureName] || 0) + 1;
    this.evaluateUserSegments(userId);
  }

  // ==================== Segment Management ====================

  defineSegment(segment: Segment): void {
    this.segments.set(segment.id, {
      ...segment,
      enabled: segment.enabled !== false,
      priority: segment.priority || 0,
    });

    // Re-evaluate all users for this segment
    this.evaluateAllUsersForSegment(segment.id);
  }

  getSegment(segmentId: string): Segment | undefined {
    return this.segments.get(segmentId);
  }

  getAllSegments(): Segment[] {
    return Array.from(this.segments.values());
  }

  removeSegment(segmentId: string): void {
    this.segments.delete(segmentId);

    // Remove segment from all user profiles
    this.userProfiles.forEach((profile) => {
      profile.segments = profile.segments.filter((id) => id !== segmentId);
    });
  }

  private evaluateUserSegments(userId: string): void {
    const profile = this.getUserProfile(userId);
    if (!profile) return;

    const matchedSegments: string[] = [];

    this.segments.forEach((segment) => {
      if (!segment.enabled) return;

      if (this.evaluateSegment(segment, profile)) {
        matchedSegments.push(segment.id);
      }
    });

    profile.segments = matchedSegments;
  }

  private evaluateAllUsersForSegment(segmentId: string): void {
    const segment = this.segments.get(segmentId);
    if (!segment || !segment.enabled) return;

    this.userProfiles.forEach((profile, _userId) => {
      const matches = this.evaluateSegment(segment, profile);

      if (matches && !profile.segments.includes(segmentId)) {
        profile.segments.push(segmentId);
      } else if (!matches && profile.segments.includes(segmentId)) {
        profile.segments = profile.segments.filter((id) => id !== segmentId);
      }
    });
  }

  private evaluateSegment(segment: Segment, profile: UserProfile): boolean {
    // Segment rules are evaluated with OR logic (any rule can match)
    return segment.rules.some((rule) => this.evaluateRule(rule, profile));
  }

  private evaluateRule(rule: SegmentRule, profile: UserProfile): boolean {
    const logic = rule.logic || 'AND';

    if (logic === 'AND') {
      // All conditions must match
      return rule.conditions.every((condition) => this.evaluateCondition(condition, profile));
    } else {
      // Any condition can match
      return rule.conditions.some((condition) => this.evaluateCondition(condition, profile));
    }
  }

  private evaluateCondition(condition: SegmentCondition, profile: UserProfile): boolean {
    let actualValue: unknown;

    // Get the actual value based on condition type
    switch (condition.type) {
      case 'user':
        actualValue = this.getNestedValue(profile.user as Record<string, unknown>, condition.field);
        break;
      case 'company':
        actualValue = profile.company ? this.getNestedValue(profile.company as Record<string, unknown>, condition.field) : undefined;
        break;
      case 'behavior':
        actualValue = this.getNestedValue(profile.behavior as Record<string, unknown>, condition.field);
        break;
      case 'cohort':
        return this.evaluateCohortCondition(condition, profile);
    }

    // Evaluate based on operator
    return this.evaluateOperator(condition.operator, actualValue, condition.value);
  }

  private evaluateCohortCondition(condition: SegmentCondition, profile: UserProfile): boolean {
    const cohortId = condition.value as string;
    const inCohort = profile.cohorts.includes(cohortId);

    switch (condition.operator) {
      case 'equals':
      case 'in':
        return inCohort;
      case 'notEquals':
      case 'notIn':
        return !inCohort;
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let value: unknown = obj;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private evaluateOperator(operator: SegmentCondition['operator'], actualValue: unknown, expectedValue: unknown): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'notEquals':
        return actualValue !== expectedValue;
      case 'contains':
        if (typeof actualValue === 'string' && typeof expectedValue === 'string') {
          return actualValue.includes(expectedValue);
        }
        if (Array.isArray(actualValue)) {
          return actualValue.includes(expectedValue);
        }
        return false;
      case 'notContains':
        if (typeof actualValue === 'string' && typeof expectedValue === 'string') {
          return !actualValue.includes(expectedValue);
        }
        if (Array.isArray(actualValue)) {
          return !actualValue.includes(expectedValue);
        }
        return true;
      case 'greaterThan':
        return typeof actualValue === 'number' && typeof expectedValue === 'number' && actualValue > expectedValue;
      case 'lessThan':
        return typeof actualValue === 'number' && typeof expectedValue === 'number' && actualValue < expectedValue;
      case 'greaterThanOrEqual':
        return typeof actualValue === 'number' && typeof expectedValue === 'number' && actualValue >= expectedValue;
      case 'lessThanOrEqual':
        return typeof actualValue === 'number' && typeof expectedValue === 'number' && actualValue <= expectedValue;
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      case 'notIn':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
      case 'exists':
        return actualValue !== undefined && actualValue !== null;
      case 'notExists':
        return actualValue === undefined || actualValue === null;
      default:
        return false;
    }
  }

  // ==================== Cohort Management ====================

  createCohort(id: string, name: string, description?: string): Cohort {
    const cohort: Cohort = {
      id,
      name,
      description,
      userIds: new Set(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.cohorts.set(id, cohort);
    return cohort;
  }

  getCohort(cohortId: string): Cohort | undefined {
    return this.cohorts.get(cohortId);
  }

  getAllCohorts(): Cohort[] {
    return Array.from(this.cohorts.values());
  }

  addUserToCohort(cohortId: string, userId: string): void {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return;

    cohort.userIds.add(userId);
    cohort.updatedAt = Date.now();

    // Update user profile
    const profile = this.getUserProfile(userId);
    if (profile && !profile.cohorts.includes(cohortId)) {
      profile.cohorts.push(cohortId);
      this.evaluateUserSegments(userId);
    }
  }

  removeUserFromCohort(cohortId: string, userId: string): void {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return;

    cohort.userIds.delete(userId);
    cohort.updatedAt = Date.now();

    // Update user profile
    const profile = this.getUserProfile(userId);
    if (profile) {
      profile.cohorts = profile.cohorts.filter((id) => id !== cohortId);
      this.evaluateUserSegments(userId);
    }
  }

  isUserInCohort(cohortId: string, userId: string): boolean {
    const cohort = this.cohorts.get(cohortId);
    return cohort ? cohort.userIds.has(userId) : false;
  }

  getCohortUsers(cohortId: string): string[] {
    const cohort = this.cohorts.get(cohortId);
    return cohort ? Array.from(cohort.userIds) : [];
  }

  removeCohort(cohortId: string): void {
    this.cohorts.delete(cohortId);

    // Remove cohort from all user profiles
    this.userProfiles.forEach((profile) => {
      profile.cohorts = profile.cohorts.filter((id) => id !== cohortId);
    });
  }

  // ==================== Targeting ====================

  evaluateTargeting(userId: string, rule: TargetingRule): boolean {
    const profile = this.getUserProfile(userId);
    if (!profile) return false;

    // Evaluate segment inclusion
    if (rule.segments && rule.segments.length > 0) {
      const inSegment = rule.segments.some((segmentId) => profile.segments.includes(segmentId));
      if (!inSegment) return false;
    }

    // Evaluate cohort inclusion
    if (rule.cohorts && rule.cohorts.length > 0) {
      const inCohort = rule.cohorts.some((cohortId) => profile.cohorts.includes(cohortId));
      if (!inCohort) return false;
    }

    // Evaluate segment exclusion
    if (rule.excludeSegments && rule.excludeSegments.length > 0) {
      const inExcludedSegment = rule.excludeSegments.some((segmentId) => profile.segments.includes(segmentId));
      if (inExcludedSegment) return false;
    }

    // Evaluate cohort exclusion
    if (rule.excludeCohorts && rule.excludeCohorts.length > 0) {
      const inExcludedCohort = rule.excludeCohorts.some((cohortId) => profile.cohorts.includes(cohortId));
      if (inExcludedCohort) return false;
    }

    // Evaluate custom logic
    if (rule.customLogic) {
      return rule.customLogic(profile);
    }

    return true;
  }

  getUsersMatchingTargeting(rule: TargetingRule): string[] {
    const matchedUsers: string[] = [];

    this.userProfiles.forEach((_profile, userId) => {
      if (this.evaluateTargeting(userId, rule)) {
        matchedUsers.push(userId);
      }
    });

    return matchedUsers;
  }

  // ==================== Analytics ====================

  getSegmentSize(segmentId: string): number {
    let count = 0;

    this.userProfiles.forEach((profile) => {
      if (profile.segments.includes(segmentId)) {
        count++;
      }
    });

    return count;
  }

  getCohortSize(cohortId: string): number {
    const cohort = this.cohorts.get(cohortId);
    return cohort ? cohort.userIds.size : 0;
  }

  getSegmentDistribution(): Map<string, number> {
    const distribution = new Map<string, number>();

    this.segments.forEach((segment) => {
      distribution.set(segment.id, this.getSegmentSize(segment.id));
    });

    return distribution;
  }

  getUserSegmentOverlap(segmentId1: string, segmentId2: string): number {
    let overlap = 0;

    this.userProfiles.forEach((profile) => {
      if (profile.segments.includes(segmentId1) && profile.segments.includes(segmentId2)) {
        overlap++;
      }
    });

    return overlap;
  }

  // ==================== Data Export ====================

  exportData(): {
    userProfiles: Array<{ userId: string; profile: UserProfile }>;
    segments: Segment[];
    cohorts: Array<{ id: string; name: string; description?: string; userIds: string[]; createdAt: number; updatedAt: number }>;
  } {
    return {
      userProfiles: Array.from(this.userProfiles.entries()).map(([userId, profile]) => ({ userId, profile })),
      segments: this.getAllSegments(),
      cohorts: this.getAllCohorts().map((cohort) => ({
        ...cohort,
        userIds: Array.from(cohort.userIds),
      })),
    };
  }

  clearData(): void {
    this.userProfiles.clear();
    this.segments.clear();
    this.cohorts.clear();
  }
}
