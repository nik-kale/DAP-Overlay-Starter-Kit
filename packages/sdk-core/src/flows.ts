/**
 * V4 Feature: Multi-step Flows & Tours Engine
 * Provides sequential flows, branching logic, progress tracking, and checklists
 */

// ==================== Types ====================

export interface FlowStep {
  stepId: string;
  order: number;
  required?: boolean;
  completionCriteria?: FlowCompletionCriteria;
  branches?: FlowBranch[];
  delay?: number; // milliseconds to wait before showing next step
  metadata?: Record<string, unknown>;
}

export interface FlowBranch {
  condition: {
    type: 'event' | 'userAction' | 'customLogic';
    eventName?: string;
    action?: 'clicked' | 'dismissed' | 'completed' | 'skipped';
    customLogic?: (context: FlowExecutionContext) => boolean;
  };
  targetStepId: string;
  priority?: number; // Higher priority branches evaluated first
}

export interface FlowCompletionCriteria {
  type: 'viewed' | 'clicked' | 'dismissed' | 'timeout' | 'custom';
  timeout?: number; // milliseconds
  customCheck?: (context: FlowExecutionContext) => boolean;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  steps: FlowStep[];
  startStepId: string;
  endStepId?: string;
  settings?: FlowSettings;
  metadata?: Record<string, unknown>;
}

export interface FlowSettings {
  allowSkip?: boolean;
  allowBack?: boolean;
  showProgress?: boolean;
  persistProgress?: boolean;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number; // milliseconds
  maxRetries?: number;
  timeout?: number; // milliseconds for entire flow
  onComplete?: string; // callback ID
  onAbort?: string; // callback ID
}

export interface FlowExecutionContext {
  flowId: string;
  currentStepId: string;
  previousSteps: string[];
  completedSteps: Set<string>;
  skippedSteps: Set<string>;
  userData?: Record<string, unknown>;
  startTime: number;
  lastUpdateTime: number;
}

export interface FlowProgress {
  flowId: string;
  totalSteps: number;
  completedSteps: number;
  currentStepIndex: number;
  percentComplete: number;
  isComplete: boolean;
  context: FlowExecutionContext;
}

export interface FlowExecution {
  flowId: string;
  executionId: string;
  context: FlowExecutionContext;
  status: 'active' | 'completed' | 'aborted' | 'paused';
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  stepId?: string;
  completed: boolean;
  required?: boolean;
  order: number;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  progress: number; // 0-100
  required: number;
  completed: number;
}

// ==================== Flow Engine ====================

export class FlowEngine {
  private flows: Map<string, Flow> = new Map();
  private executions: Map<string, FlowExecution> = new Map();
  private activeFlows: Set<string> = new Set();
  private checklists: Map<string, Checklist> = new Map();
  private stepCompletionCallbacks: Map<string, ((stepId: string, context: FlowExecutionContext) => void)[]> = new Map();
  private flowCompleteCallbacks: Map<string, ((flowId: string, context: FlowExecutionContext) => void)[]> = new Map();

  // ==================== Flow Definition ====================

  defineFlow(flow: Flow): void {
    // Validate flow
    this.validateFlow(flow);

    this.flows.set(flow.id, flow);
  }

  private validateFlow(flow: Flow): void {
    if (!flow.id || !flow.steps || flow.steps.length === 0) {
      throw new Error('[DAP Flow] Flow must have an ID and at least one step');
    }

    if (!flow.startStepId) {
      throw new Error('[DAP Flow] Flow must have a start step ID');
    }

    const stepIds = new Set(flow.steps.map((s) => s.stepId));
    if (!stepIds.has(flow.startStepId)) {
      throw new Error(`[DAP Flow] Start step "${flow.startStepId}" not found in flow steps`);
    }

    // Validate branches point to valid steps
    flow.steps.forEach((step) => {
      step.branches?.forEach((branch) => {
        if (!stepIds.has(branch.targetStepId)) {
          throw new Error(`[DAP Flow] Branch target "${branch.targetStepId}" not found in flow steps`);
        }
      });
    });
  }

  getFlow(flowId: string): Flow | undefined {
    return this.flows.get(flowId);
  }

  getAllFlows(): Flow[] {
    return Array.from(this.flows.values());
  }

  removeFlow(flowId: string): void {
    this.flows.delete(flowId);
    this.stopFlow(flowId);
  }

  // ==================== Flow Execution ====================

  startFlow(flowId: string, userData?: Record<string, unknown>): string {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`[DAP Flow] Flow "${flowId}" not found`);
    }

    const executionId = this.generateExecutionId(flowId);
    const now = Date.now();

    const context: FlowExecutionContext = {
      flowId,
      currentStepId: flow.startStepId,
      previousSteps: [],
      completedSteps: new Set(),
      skippedSteps: new Set(),
      userData: userData || {},
      startTime: now,
      lastUpdateTime: now,
    };

    const execution: FlowExecution = {
      flowId,
      executionId,
      context,
      status: 'active',
      startTime: now,
    };

    this.executions.set(executionId, execution);
    this.activeFlows.add(flowId);

    return executionId;
  }

  private generateExecutionId(flowId: string): string {
    return `flow_${flowId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  getCurrentStep(executionId: string): FlowStep | null {
    const execution = this.executions.get(executionId);
    if (!execution) return null;

    const flow = this.flows.get(execution.flowId);
    if (!flow) return null;

    return flow.steps.find((s) => s.stepId === execution.context.currentStepId) || null;
  }

  advanceFlow(executionId: string, action?: 'completed' | 'skipped' | 'clicked' | 'dismissed'): FlowStep | null {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'active') {
      return null;
    }

    const flow = this.flows.get(execution.flowId);
    if (!flow) return null;

    const currentStep = this.getCurrentStep(executionId);
    if (!currentStep) return null;

    // Mark current step as completed/skipped
    if (action === 'completed') {
      execution.context.completedSteps.add(currentStep.stepId);
    } else if (action === 'skipped') {
      execution.context.skippedSteps.add(currentStep.stepId);
    }

    // Update context
    execution.context.previousSteps.push(currentStep.stepId);
    execution.context.lastUpdateTime = Date.now();

    // Trigger step completion callbacks
    this.triggerStepCompletionCallbacks(currentStep.stepId, execution.context);

    // Determine next step
    const nextStep = this.determineNextStep(flow, currentStep, execution.context, action);

    if (!nextStep) {
      // Flow completed
      this.completeFlow(executionId);
      return null;
    }

    // Update current step
    execution.context.currentStepId = nextStep.stepId;

    return nextStep;
  }

  private determineNextStep(
    flow: Flow,
    currentStep: FlowStep,
    context: FlowExecutionContext,
    action?: string
  ): FlowStep | null {
    // Check for branches
    if (currentStep.branches && currentStep.branches.length > 0) {
      // Sort branches by priority (higher first)
      const sortedBranches = [...currentStep.branches].sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const branch of sortedBranches) {
        if (this.evaluateBranch(branch, context, action)) {
          const targetStep = flow.steps.find((s) => s.stepId === branch.targetStepId);
          if (targetStep) return targetStep;
        }
      }
    }

    // No branches matched, get next sequential step
    const currentIndex = flow.steps.findIndex((s) => s.stepId === currentStep.stepId);
    if (currentIndex < 0 || currentIndex >= flow.steps.length - 1) {
      return null; // No more steps
    }

    // Return next step in order
    const nextSteps = flow.steps.filter((s) => s.order > currentStep.order).sort((a, b) => a.order - b.order);
    return nextSteps[0] || null;
  }

  private evaluateBranch(branch: FlowBranch, context: FlowExecutionContext, action?: string): boolean {
    const condition = branch.condition;

    switch (condition.type) {
      case 'userAction':
        return condition.action === action;

      case 'event':
        // Check if event was triggered (would need to integrate with analytics)
        return false;

      case 'customLogic':
        if (condition.customLogic) {
          return condition.customLogic(context);
        }
        return false;

      default:
        return false;
    }
  }

  goToPreviousStep(executionId: string): FlowStep | null {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'active') {
      return null;
    }

    const flow = this.flows.get(execution.flowId);
    if (!flow || !flow.settings?.allowBack) {
      return null;
    }

    if (execution.context.previousSteps.length === 0) {
      return null; // Already at first step
    }

    // Get previous step
    const previousStepId = execution.context.previousSteps.pop();
    if (!previousStepId) return null;

    const previousStep = flow.steps.find((s) => s.stepId === previousStepId);
    if (!previousStep) return null;

    // Update current step
    execution.context.currentStepId = previousStepId;
    execution.context.lastUpdateTime = Date.now();

    return previousStep;
  }

  skipCurrentStep(executionId: string): FlowStep | null {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'active') {
      return null;
    }

    const flow = this.flows.get(execution.flowId);
    if (!flow || !flow.settings?.allowSkip) {
      return null;
    }

    return this.advanceFlow(executionId, 'skipped');
  }

  pauseFlow(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'active') {
      execution.status = 'paused';
    }
  }

  resumeFlow(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'active';
    }
  }

  stopFlow(flowId: string): void {
    this.activeFlows.delete(flowId);

    // Abort all active executions of this flow
    this.executions.forEach((execution, executionId) => {
      if (execution.flowId === flowId && execution.status === 'active') {
        this.abortFlow(executionId);
      }
    });
  }

  abortFlow(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'aborted';
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;

    this.activeFlows.delete(execution.flowId);

    // Trigger abort callback
    const flow = this.flows.get(execution.flowId);
    if (flow?.settings?.onAbort) {
      // Would invoke callback here
    }
  }

  private completeFlow(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'completed';
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;

    this.activeFlows.delete(execution.flowId);

    // Trigger completion callbacks
    this.triggerFlowCompleteCallbacks(execution.flowId, execution.context);

    // Trigger flow complete callback
    const flow = this.flows.get(execution.flowId);
    if (flow?.settings?.onComplete) {
      // Would invoke callback here
    }
  }

  // ==================== Progress Tracking ====================

  getFlowProgress(executionId: string): FlowProgress | null {
    const execution = this.executions.get(executionId);
    if (!execution) return null;

    const flow = this.flows.get(execution.flowId);
    if (!flow) return null;

    const totalSteps = flow.steps.length;
    const completedSteps = execution.context.completedSteps.size;
    const currentStepIndex = flow.steps.findIndex((s) => s.stepId === execution.context.currentStepId);
    const percentComplete = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const isComplete = execution.status === 'completed';

    return {
      flowId: execution.flowId,
      totalSteps,
      completedSteps,
      currentStepIndex,
      percentComplete,
      isComplete,
      context: execution.context,
    };
  }

  getFlowExecution(executionId: string): FlowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(flowId?: string): FlowExecution[] {
    const executions = Array.from(this.executions.values());

    if (flowId) {
      return executions.filter((e) => e.flowId === flowId);
    }

    return executions;
  }

  getActiveExecutions(): FlowExecution[] {
    return Array.from(this.executions.values()).filter((e) => e.status === 'active');
  }

  // ==================== Checklist Management ====================

  createChecklist(id: string, title: string, items: Omit<ChecklistItem, 'completed'>[]): Checklist {
    const checklistItems: ChecklistItem[] = items.map((item) => ({
      ...item,
      completed: false,
    }));

    const checklist: Checklist = {
      id,
      title,
      items: checklistItems,
      progress: 0,
      required: items.filter((i) => i.required).length,
      completed: 0,
    };

    this.checklists.set(id, checklist);
    return checklist;
  }

  getChecklist(id: string): Checklist | undefined {
    return this.checklists.get(id);
  }

  updateChecklistItem(checklistId: string, itemId: string, completed: boolean): Checklist | null {
    const checklist = this.checklists.get(checklistId);
    if (!checklist) return null;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) return null;

    item.completed = completed;

    // Recalculate progress
    const completedCount = checklist.items.filter((i) => i.completed).length;
    checklist.completed = completedCount;
    checklist.progress = Math.round((completedCount / checklist.items.length) * 100);

    return checklist;
  }

  resetChecklist(checklistId: string): Checklist | null {
    const checklist = this.checklists.get(checklistId);
    if (!checklist) return null;

    checklist.items.forEach((item) => {
      item.completed = false;
    });

    checklist.progress = 0;
    checklist.completed = 0;

    return checklist;
  }

  // ==================== Callbacks ====================

  onStepComplete(stepId: string, callback: (stepId: string, context: FlowExecutionContext) => void): void {
    const callbacks = this.stepCompletionCallbacks.get(stepId) || [];
    callbacks.push(callback);
    this.stepCompletionCallbacks.set(stepId, callbacks);
  }

  onFlowComplete(flowId: string, callback: (flowId: string, context: FlowExecutionContext) => void): void {
    const callbacks = this.flowCompleteCallbacks.get(flowId) || [];
    callbacks.push(callback);
    this.flowCompleteCallbacks.set(flowId, callbacks);
  }

  private triggerStepCompletionCallbacks(stepId: string, context: FlowExecutionContext): void {
    const callbacks = this.stepCompletionCallbacks.get(stepId);
    if (callbacks) {
      callbacks.forEach((callback) => callback(stepId, context));
    }
  }

  private triggerFlowCompleteCallbacks(flowId: string, context: FlowExecutionContext): void {
    const callbacks = this.flowCompleteCallbacks.get(flowId);
    if (callbacks) {
      callbacks.forEach((callback) => callback(flowId, context));
    }
  }

  // ==================== Analytics ====================

  getFlowCompletionRate(flowId: string): number {
    const executions = this.getAllExecutions(flowId);
    if (executions.length === 0) return 0;

    const completed = executions.filter((e) => e.status === 'completed').length;
    return Math.round((completed / executions.length) * 100);
  }

  getAverageFlowDuration(flowId: string): number {
    const executions = this.getAllExecutions(flowId).filter((e) => e.duration !== undefined);
    if (executions.length === 0) return 0;

    const totalDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0);
    return Math.round(totalDuration / executions.length);
  }

  getStepDropOffRate(flowId: string, stepId: string): number {
    const executions = this.getAllExecutions(flowId);
    if (executions.length === 0) return 0;

    const reachedStep = executions.filter(
      (e) => e.context.completedSteps.has(stepId) || e.context.currentStepId === stepId
    ).length;

    const droppedOff = executions.length - reachedStep;
    return Math.round((droppedOff / executions.length) * 100);
  }

  // ==================== Data Export ====================

  exportData(): {
    flows: Flow[];
    executions: FlowExecution[];
    checklists: Checklist[];
  } {
    return {
      flows: this.getAllFlows(),
      executions: Array.from(this.executions.values()),
      checklists: Array.from(this.checklists.values()),
    };
  }

  clearData(): void {
    this.flows.clear();
    this.executions.clear();
    this.activeFlows.clear();
    this.checklists.clear();
    this.stepCompletionCallbacks.clear();
    this.flowCompleteCallbacks.clear();
  }
}
