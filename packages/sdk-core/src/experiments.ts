/**
 * V5 Feature: A/B Testing & Experimentation Framework
 * Provides variant management, statistical analysis, and experiment reporting
 */

// ==================== Types ====================

export interface ExperimentVariant {
  id: string;
  name: string;
  description?: string;
  weight: number; // 0-100, allocation percentage
  config: Record<string, unknown>; // Variant-specific configuration
  isControl?: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  hypothesis?: string;
  variants: ExperimentVariant[];
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  startDate?: number;
  endDate?: number;
  targetSampleSize?: number;
  goals: ExperimentGoal[];
  targetingRules?: ExperimentTargeting;
  settings?: ExperimentSettings;
  metadata?: Record<string, unknown>;
}

export interface ExperimentGoal {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'revenue' | 'custom';
  metric: string; // Event name or metric to track
  targetValue?: number;
  isPrimary?: boolean;
}

export interface ExperimentTargeting {
  segments?: string[];
  cohorts?: string[];
  userPercentage?: number; // 0-100, what % of users to include
  customLogic?: (userId: string) => boolean;
}

export interface ExperimentSettings {
  autoWinner?: boolean; // Automatically select winner based on confidence
  requiredConfidence?: number; // 0-100, default 95%
  minimumSampleSize?: number;
  minimumDuration?: number; // milliseconds
  trafficRampUp?: boolean; // Gradually increase traffic
  persistAssignment?: boolean; // Keep users in same variant
  storageKey?: string;
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  assignedAt: number;
  persistent: boolean;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  participantCount: number;
  goalConversions: Map<string, number>; // goalId -> conversion count
  conversionRates: Map<string, number>; // goalId -> rate (0-100)
  revenue?: number;
  avgEngagementTime?: number;
  customMetrics?: Map<string, number>;
}

export interface ExperimentAnalysis {
  experimentId: string;
  status: 'insufficient_data' | 'running' | 'significant' | 'no_significant_difference';
  results: ExperimentResult[];
  winner?: string; // variantId
  confidence?: number; // 0-100
  statisticalSignificance?: boolean;
  recommendedAction?: 'continue' | 'stop' | 'scale_winner' | 'inconclusive';
  insights: string[];
  generatedAt: number;
}

export interface VariantPerformance {
  variantId: string;
  variantName: string;
  participants: number;
  conversions: number;
  conversionRate: number; // 0-100
  lift?: number; // % improvement over control
  confidence?: number; // 0-100
}

// ==================== Experiment Engine ====================

export class ExperimentEngine {
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment> = new Map();
  private results: Map<string, Map<string, ExperimentResult>> = new Map(); // experimentId -> variantId -> result
  private participantCounts: Map<string, Map<string, number>> = new Map(); // experimentId -> variantId -> count
  private goalEvents: Map<string, Map<string, Map<string, number>>> = new Map(); // experimentId -> variantId -> goalId -> count

  constructor() {
    // Initialize
  }

  // ==================== Experiment Management ====================

  createExperiment(experiment: Omit<Experiment, 'status'>): Experiment {
    // Validate variants
    this.validateExperiment(experiment as Experiment);

    const newExperiment: Experiment = {
      ...experiment,
      status: 'draft',
    };

    this.experiments.set(newExperiment.id, newExperiment);
    this.initializeExperimentData(newExperiment.id);

    return newExperiment;
  }

  private validateExperiment(experiment: Experiment): void {
    if (!experiment.id || !experiment.variants || experiment.variants.length < 2) {
      throw new Error('[DAP Experiments] Experiment must have an ID and at least 2 variants');
    }

    // Check variant weights sum to 100
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`[DAP Experiments] Variant weights must sum to 100, got ${totalWeight}`);
    }

    // Ensure exactly one control
    const controlCount = experiment.variants.filter((v) => v.isControl).length;
    if (controlCount !== 1) {
      throw new Error('[DAP Experiments] Experiment must have exactly one control variant');
    }
  }

  private initializeExperimentData(experimentId: string): void {
    if (!this.participantCounts.has(experimentId)) {
      this.participantCounts.set(experimentId, new Map());
    }

    if (!this.goalEvents.has(experimentId)) {
      this.goalEvents.set(experimentId, new Map());
    }

    if (!this.results.has(experimentId)) {
      this.results.set(experimentId, new Map());
    }
  }

  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  getActiveExperiments(): Experiment[] {
    return this.getAllExperiments().filter((e) => e.status === 'running');
  }

  updateExperimentStatus(experimentId: string, status: Experiment['status']): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    experiment.status = status;

    if (status === 'running' && !experiment.startDate) {
      experiment.startDate = Date.now();
    }

    if (status === 'completed' && !experiment.endDate) {
      experiment.endDate = Date.now();
    }
  }

  startExperiment(experimentId: string): void {
    this.updateExperimentStatus(experimentId, 'running');
  }

  pauseExperiment(experimentId: string): void {
    this.updateExperimentStatus(experimentId, 'paused');
  }

  stopExperiment(experimentId: string): void {
    this.updateExperimentStatus(experimentId, 'completed');
  }

  // ==================== Variant Assignment ====================

  assignVariant(experimentId: string, userId?: string, sessionId?: string): ExperimentAssignment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check for existing assignment
    const assignmentKey = this.getAssignmentKey(experimentId, userId, sessionId);
    let assignment = this.assignments.get(assignmentKey);

    if (assignment) {
      return assignment;
    }

    // Create new assignment
    const variant = this.selectVariant(experiment, userId);
    if (!variant) return null;

    assignment = {
      experimentId,
      variantId: variant.id,
      userId,
      sessionId: sessionId || '',
      assignedAt: Date.now(),
      persistent: experiment.settings?.persistAssignment ?? true,
    };

    this.assignments.set(assignmentKey, assignment);

    // Update participant count
    this.incrementParticipantCount(experimentId, variant.id);

    // Persist to localStorage if needed
    if (assignment.persistent && typeof window !== 'undefined') {
      try {
        const storageKey = experiment.settings?.storageKey || `dap_experiment_${experimentId}`;
        localStorage.setItem(storageKey, JSON.stringify(assignment));
      } catch (error) {
        console.warn('[DAP Experiments] Failed to persist assignment:', error);
      }
    }

    return assignment;
  }

  private getAssignmentKey(experimentId: string, userId?: string, sessionId?: string): string {
    if (userId) {
      return `${experimentId}:user:${userId}`;
    }
    if (sessionId) {
      return `${experimentId}:session:${sessionId}`;
    }
    return `${experimentId}:anonymous:${Date.now()}`;
  }

  private selectVariant(experiment: Experiment, userId?: string): ExperimentVariant | null {
    // Use deterministic assignment based on userId if available
    if (userId) {
      return this.deterministicVariantSelection(experiment, userId);
    }

    // Random assignment
    return this.randomVariantSelection(experiment);
  }

  private deterministicVariantSelection(experiment: Experiment, userId: string): ExperimentVariant {
    // Use hash of userId + experimentId for deterministic selection
    const hash = this.hashString(`${userId}:${experiment.id}`);
    const bucket = hash % 100;

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant;
      }
    }

    // Fallback to control
    return experiment.variants.find((v) => v.isControl) || experiment.variants[0];
  }

  private randomVariantSelection(experiment: Experiment): ExperimentVariant {
    const random = Math.random() * 100;

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (random < cumulative) {
        return variant;
      }
    }

    // Fallback to control
    return experiment.variants.find((v) => v.isControl) || experiment.variants[0];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  getAssignment(experimentId: string, userId?: string, sessionId?: string): ExperimentAssignment | undefined {
    const assignmentKey = this.getAssignmentKey(experimentId, userId, sessionId);
    return this.assignments.get(assignmentKey);
  }

  getVariantConfig(experimentId: string, userId?: string, sessionId?: string): Record<string, unknown> | null {
    const assignment = this.getAssignment(experimentId, userId, sessionId);
    if (!assignment) return null;

    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const variant = experiment.variants.find((v) => v.id === assignment.variantId);
    return variant?.config || null;
  }

  // ==================== Event Tracking ====================

  trackGoalEvent(experimentId: string, goalId: string, userId?: string, sessionId?: string): void {
    const assignment = this.getAssignment(experimentId, userId, sessionId);
    if (!assignment) return;

    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return;

    const variantId = assignment.variantId;

    // Initialize data structures if needed
    if (!this.goalEvents.has(experimentId)) {
      this.goalEvents.set(experimentId, new Map());
    }

    const experimentGoals = this.goalEvents.get(experimentId)!;
    if (!experimentGoals.has(variantId)) {
      experimentGoals.set(variantId, new Map());
    }

    const variantGoals = experimentGoals.get(variantId)!;
    const currentCount = variantGoals.get(goalId) || 0;
    variantGoals.set(goalId, currentCount + 1);
  }

  private incrementParticipantCount(experimentId: string, variantId: string): void {
    if (!this.participantCounts.has(experimentId)) {
      this.participantCounts.set(experimentId, new Map());
    }

    const variantCounts = this.participantCounts.get(experimentId)!;
    const currentCount = variantCounts.get(variantId) || 0;
    variantCounts.set(variantId, currentCount + 1);
  }

  getParticipantCount(experimentId: string, variantId?: string): number {
    const variantCounts = this.participantCounts.get(experimentId);
    if (!variantCounts) return 0;

    if (variantId) {
      return variantCounts.get(variantId) || 0;
    }

    // Return total count across all variants
    let total = 0;
    variantCounts.forEach((count) => {
      total += count;
    });
    return total;
  }

  // ==================== Results & Analysis ====================

  getResults(experimentId: string): ExperimentResult[] {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return [];

    const results: ExperimentResult[] = [];

    experiment.variants.forEach((variant) => {
      const participantCount = this.getParticipantCount(experimentId, variant.id);
      const goalConversions = new Map<string, number>();
      const conversionRates = new Map<string, number>();

      // Calculate conversions and rates for each goal
      const experimentGoals = this.goalEvents.get(experimentId);
      const variantGoals = experimentGoals?.get(variant.id);

      experiment.goals.forEach((goal) => {
        const conversions = variantGoals?.get(goal.id) || 0;
        const rate = participantCount > 0 ? (conversions / participantCount) * 100 : 0;

        goalConversions.set(goal.id, conversions);
        conversionRates.set(goal.id, rate);
      });

      results.push({
        experimentId,
        variantId: variant.id,
        participantCount,
        goalConversions,
        conversionRates,
      });
    });

    return results;
  }

  analyzeExperiment(experimentId: string): ExperimentAnalysis {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return {
        experimentId,
        status: 'insufficient_data',
        results: [],
        insights: ['Experiment not found'],
        generatedAt: Date.now(),
      };
    }

    const results = this.getResults(experimentId);
    const totalParticipants = results.reduce((sum, r) => sum + r.participantCount, 0);

    // Check if we have enough data
    const minSampleSize = experiment.settings?.minimumSampleSize || 100;
    if (totalParticipants < minSampleSize) {
      return {
        experimentId,
        status: 'insufficient_data',
        results,
        insights: [`Need at least ${minSampleSize} participants, currently have ${totalParticipants}`],
        generatedAt: Date.now(),
      };
    }

    // Get primary goal
    const primaryGoal = experiment.goals.find((g) => g.isPrimary) || experiment.goals[0];
    if (!primaryGoal) {
      return {
        experimentId,
        status: 'insufficient_data',
        results,
        insights: ['No goals defined for experiment'],
        generatedAt: Date.now(),
      };
    }

    // Find control and variants
    const control = experiment.variants.find((v) => v.isControl);
    if (!control) {
      return {
        experimentId,
        status: 'insufficient_data',
        results,
        insights: ['No control variant defined'],
        generatedAt: Date.now(),
      };
    }

    const controlResult = results.find((r) => r.variantId === control.id);
    if (!controlResult) {
      return {
        experimentId,
        status: 'insufficient_data',
        results,
        insights: ['Control variant has no data'],
        generatedAt: Date.now(),
      };
    }

    // Analyze each variant against control
    const insights: string[] = [];
    let winner: string | undefined;
    let maxLift = 0;

    const controlRate = controlResult.conversionRates.get(primaryGoal.id) || 0;

    results.forEach((result) => {
      if (result.variantId === control.id) return; // Skip control

      const variant = experiment.variants.find((v) => v.id === result.variantId);
      if (!variant) return;

      const variantRate = result.conversionRates.get(primaryGoal.id) || 0;
      const lift = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0;

      // Calculate statistical significance using Z-test
      const significance = this.calculateSignificance(
        controlResult.participantCount,
        controlResult.goalConversions.get(primaryGoal.id) || 0,
        result.participantCount,
        result.goalConversions.get(primaryGoal.id) || 0
      );

      const isSignificant = significance.pValue < 0.05;

      if (isSignificant && lift > maxLift) {
        maxLift = lift;
        winner = result.variantId;
      }

      insights.push(
        `${variant.name}: ${variantRate.toFixed(2)}% conversion (${lift > 0 ? '+' : ''}${lift.toFixed(1)}% vs control)${
          isSignificant ? ' ✓ Significant' : ''
        }`
      );
    });

    const requiredConfidence = experiment.settings?.requiredConfidence || 95;
    const hasWinner = winner !== undefined;

    return {
      experimentId,
      status: hasWinner ? 'significant' : 'no_significant_difference',
      results,
      winner,
      confidence: hasWinner ? requiredConfidence : undefined,
      statisticalSignificance: hasWinner,
      recommendedAction: hasWinner ? 'scale_winner' : 'continue',
      insights,
      generatedAt: Date.now(),
    };
  }

  private calculateSignificance(
    n1: number,
    x1: number,
    n2: number,
    x2: number
  ): { zScore: number; pValue: number } {
    // Two-proportion z-test
    const p1 = n1 > 0 ? x1 / n1 : 0;
    const p2 = n2 > 0 ? x2 / n2 : 0;
    const pPooled = (x1 + x2) / (n1 + n2);

    const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));
    const zScore = se > 0 ? (p2 - p1) / se : 0;

    // Calculate p-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    return { zScore, pValue };
  }

  private normalCDF(z: number): number {
    // Approximation of standard normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return z > 0 ? 1 - p : p;
  }

  getVariantPerformance(experimentId: string): VariantPerformance[] {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return [];

    const results = this.getResults(experimentId);
    const primaryGoal = experiment.goals.find((g) => g.isPrimary) || experiment.goals[0];
    if (!primaryGoal) return [];

    const control = experiment.variants.find((v) => v.isControl);
    const controlResult = results.find((r) => r.variantId === control?.id);
    const controlRate = controlResult?.conversionRates.get(primaryGoal.id) || 0;

    return results.map((result) => {
      const variant = experiment.variants.find((v) => v.id === result.variantId);
      const rate = result.conversionRates.get(primaryGoal.id) || 0;
      const lift = controlRate > 0 && result.variantId !== control?.id ? ((rate - controlRate) / controlRate) * 100 : 0;

      return {
        variantId: result.variantId,
        variantName: variant?.name || result.variantId,
        participants: result.participantCount,
        conversions: result.goalConversions.get(primaryGoal.id) || 0,
        conversionRate: rate,
        lift: result.variantId !== control?.id ? lift : undefined,
      };
    });
  }

  // ==================== Auto Winner Selection ====================

  checkAutoWinner(experimentId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !experiment.settings?.autoWinner) {
      return null;
    }

    const analysis = this.analyzeExperiment(experimentId);

    if (analysis.status === 'significant' && analysis.winner) {
      // Auto-stop experiment and return winner
      this.stopExperiment(experimentId);
      return analysis.winner;
    }

    return null;
  }

  // ==================== Data Export ====================

  exportData(): {
    experiments: Experiment[];
    assignments: ExperimentAssignment[];
    results: Array<{ experimentId: string; results: ExperimentResult[] }>;
  } {
    return {
      experiments: this.getAllExperiments(),
      assignments: Array.from(this.assignments.values()),
      results: Array.from(this.experiments.keys()).map((experimentId) => ({
        experimentId,
        results: this.getResults(experimentId),
      })),
    };
  }

  clearData(): void {
    this.experiments.clear();
    this.assignments.clear();
    this.results.clear();
    this.participantCounts.clear();
    this.goalEvents.clear();
  }
}
