/**
 * Core types for DAP Overlay SDK
 */

export type StepType = 'tooltip' | 'banner' | 'modal';

export type PopperPlacement =
  | 'auto'
  | 'auto-start'
  | 'auto-end'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'left'
  | 'left-start'
  | 'left-end';

export type PopperStrategy = 'absolute' | 'fixed';

export interface PopperOptions {
  placement?: PopperPlacement;
  strategy?: PopperStrategy;
  offset?: [number, number];
}

export interface Content {
  title?: string;
  body: string;
  allowHtml?: boolean;
}

export type PredicateOp =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'and'
  | 'or'
  | 'not'
  | 'greaterThan'
  | 'lessThan';

export interface PredicateExpression {
  op: PredicateOp;
  field?: string;
  value?: unknown;
  operands?: PredicateExpression[];
}

export interface Conditions {
  errorId?: string | string[];
  pathRegex?: string;
  customExpr?: PredicateExpression;
}

export interface CallToAction {
  label: string;
  callbackId: string;
  dismissOnClick?: boolean;
}

export interface Actions {
  onShow?: string;
  onDismiss?: string;
  cta?: CallToAction;
}

export interface TelemetryHooks {
  onShowEvent?: string;
  onDismissEvent?: string;
  onCtaClickEvent?: string;
}

export interface Step {
  id: string;
  type: StepType;
  selector?: string;
  content: Content;
  when: Conditions;
  popper?: PopperOptions;
  actions?: Actions;
  telemetry?: TelemetryHooks;
}

export interface StepsDocument {
  version: string;
  steps: Step[];
}

export interface TelemetryContext {
  errorId?: string;
  errorCode?: string;
  [key: string]: unknown;
}

export interface RouteContext {
  path: string;
  [key: string]: unknown;
}

export interface EvaluationContext {
  telemetry: TelemetryContext;
  route: RouteContext;
  [key: string]: unknown;
}

export interface TelemetryEvent {
  eventName: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export type CallbackId = string;
export type CallbackFn = (context?: unknown) => void | Promise<void>;
export type CallbackMap = Map<CallbackId, CallbackFn>;

// Utility types for better TypeScript DX
export type TooltipStep = Step & { type: 'tooltip'; selector: string };
export type BannerStep = Step & { type: 'banner' };
export type ModalStep = Step & { type: 'modal' };

// Debug mode configuration
export interface DebugOptions {
  enabled: boolean;
  logConditionEvaluation?: boolean;
  logStepResolution?: boolean;
  logTelemetry?: boolean;
}
