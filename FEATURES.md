# DAP Overlay SDK - Advanced Features

This document outlines the advanced features available in the DAP Overlay SDK across versions 2.0 through 5.0.

## Version 2.0: Analytics & Insights Engine

### Overview
The Analytics Engine provides comprehensive event tracking, user behavior analytics, session management, and funnel analysis to help you understand how users interact with your overlays.

### Key Features

#### 1. Event Tracking
Track custom events automatically or manually:

```typescript
import { AnalyticsEngine, AnalyticsEventType } from '@dap-overlay/sdk-core';

const analytics = new AnalyticsEngine({
  apiEndpoint: '/api/analytics',
  enableAutoTracking: true,
  batchSize: 10,
  flushInterval: 5000,
});

// Track custom events
analytics.track('feature_discovered', AnalyticsEventType.CUSTOM, {
  featureName: 'dark_mode',
  source: 'settings_menu',
});

// Auto-tracked events
analytics.trackStepViewed('welcome-step-1');
analytics.trackStepCompleted('onboarding-step-3');
analytics.trackCtaClicked('signup-step', 'Get Started');
```

#### 2. User Behavior Analytics
Analyze user behavior patterns:

```typescript
// Get user behavior data
const behavior = analytics.getUserBehavior(userId);

console.log(`
  Session Duration: ${behavior.sessionDuration}ms
  Steps Viewed: ${behavior.stepsViewed.length}
  Steps Completed: ${behavior.stepsCompleted.length}
  Completion Rate: ${(behavior.stepsCompleted.length / behavior.stepsViewed.length) * 100}%
  CTA Clicks: ${behavior.ctaClicks}
`);
```

#### 3. Funnel Analysis
Define and analyze conversion funnels:

```typescript
import { FunnelStep } from '@dap-overlay/sdk-core';

// Define a funnel
analytics.defineFunnel('onboarding-funnel', [
  { stepId: 'welcome', eventType: AnalyticsEventType.STEP_VIEWED, required: true },
  { stepId: 'profile-setup', eventType: AnalyticsEventType.STEP_COMPLETED, required: true },
  { stepId: 'preferences', eventType: AnalyticsEventType.STEP_COMPLETED },
  { stepId: 'complete', eventType: AnalyticsEventType.STEP_COMPLETED, required: true },
]);

// Analyze funnel
const funnel = analytics.analyzeFunnel('onboarding-funnel');

console.log(`
  Completion Rate: ${funnel.completionRate}%
  Drop-off at Profile Setup: ${funnel.dropOffRates.get('profile-setup')}%
`);
```

#### 4. Session Management
Automatic session tracking with localStorage persistence:

```typescript
// Set user ID
analytics.setUserId('user_12345');

// Get session data
const session = analytics.getSessionData();
console.log(`Session started: ${new Date(session.startTime).toLocaleString()}`);
console.log(`Events tracked: ${session.events.length}`);
```

#### 5. Data Export
Export analytics data for external analysis:

```typescript
const data = analytics.exportData();

// data contains:
// - events: All tracked events
// - sessions: All session data
// - userBehaviors: User behavior summaries
// - funnels: Funnel analysis results
```

### Configuration Options

```typescript
interface AnalyticsConfig {
  apiEndpoint?: string; // Default: '/api/analytics'
  enableAutoTracking?: boolean; // Default: true
  sessionTimeout?: number; // Default: 30 minutes
  enableRateLimit?: boolean; // Default: true
  maxEventsPerSecond?: number; // Default: 50
  enableRetry?: boolean; // Default: true
  maxRetries?: number; // Default: 3
  batchSize?: number; // Default: 10
  flushInterval?: number; // Default: 5000ms
  enableLocalStorage?: boolean; // Default: true
  storageKey?: string; // Default: 'dap_analytics_session'
}
```

---

## Version 3.0: User Segmentation & Personalization

### Overview
The Segmentation Engine enables advanced user targeting, cohort management, and personalized experiences based on user attributes, behavior, and custom criteria.

### Key Features

#### 1. User Segmentation
Create dynamic segments based on user, company, and behavioral attributes:

```typescript
import { SegmentationEngine } from '@dap-overlay/sdk-core';

const segmentation = new SegmentationEngine();

// Define a segment
segmentation.defineSegment({
  id: 'power-users',
  name: 'Power Users',
  description: 'Users who have completed 10+ actions',
  rules: [
    {
      conditions: [
        {
          type: 'behavior',
          operator: 'greaterThanOrEqual',
          field: 'eventsTriggered',
          value: 10,
        },
        {
          type: 'user',
          operator: 'equals',
          field: 'plan',
          value: 'pro',
        },
      ],
      logic: 'AND',
    },
  ],
  enabled: true,
  priority: 1,
});

// Update user profile
segmentation.setUserProfile('user_123', {
  user: {
    userId: 'user_123',
    email: 'user@example.com',
    plan: 'pro',
  },
  behavior: {
    eventsTriggered: ['feature_a', 'feature_b', 'feature_c'],
    pageViews: 25,
  },
  segments: [],
  cohorts: [],
});

// Check if user is in segment
const profile = segmentation.getUserProfile('user_123');
const isPowerUser = profile.segments.includes('power-users');
```

#### 2. Cohort Management
Create and manage user cohorts:

```typescript
// Create a cohort
const betaCohort = segmentation.createCohort(
  'beta-testers',
  'Beta Testers',
  'Early access users testing new features'
);

// Add users to cohort
segmentation.addUserToCohort('beta-testers', 'user_123');
segmentation.addUserToCohort('beta-testers', 'user_456');

// Check cohort membership
const isInBeta = segmentation.isUserInCohort('beta-testers', 'user_123');

// Get all users in cohort
const betaUsers = segmentation.getCohortUsers('beta-testers');
```

#### 3. Advanced Targeting
Target overlays to specific users based on segments and cohorts:

```typescript
import { TargetingRule } from '@dap-overlay/sdk-core';

const targetingRule: TargetingRule = {
  segments: ['power-users', 'enterprise-customers'],
  cohorts: ['beta-testers'],
  excludeSegments: ['churned-users'],
  customLogic: (profile) => {
    // Custom targeting logic
    return profile.user.plan === 'enterprise' && profile.behavior.pageViews > 100;
  },
};

// Evaluate targeting
const shouldShow = segmentation.evaluateTargeting('user_123', targetingRule);

// Get all users matching targeting
const targetedUsers = segmentation.getUsersMatchingTargeting(targetingRule);
```

#### 4. Segment Analytics
Analyze segment distribution and overlap:

```typescript
// Get segment size
const powerUserCount = segmentation.getSegmentSize('power-users');

// Get segment distribution
const distribution = segmentation.getSegmentDistribution();
distribution.forEach((count, segmentId) => {
  console.log(`${segmentId}: ${count} users`);
});

// Analyze segment overlap
const overlap = segmentation.getUserSegmentOverlap('power-users', 'enterprise-customers');
console.log(`${overlap} users are both power users and enterprise customers`);
```

### Internationalization (i18n)

Provide multi-language support for your overlays:

```typescript
import { I18n, createEnglishLocale, createSpanishLocale } from '@dap-overlay/sdk-core';

const i18n = new I18n({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  detectBrowserLocale: true,
  persistLocale: true,
});

// Register locales
i18n.registerLocales([
  createEnglishLocale({
    onboarding: {
      welcome: 'Welcome to our app!',
      getStarted: 'Get Started',
    },
  }),
  createSpanishLocale({
    onboarding: {
      welcome: '¡Bienvenido a nuestra aplicación!',
      getStarted: 'Comenzar',
    },
  }),
]);

// Use translations
const welcomeText = i18n.t('onboarding.welcome');
const buttonText = i18n.t('onboarding.getStarted');

// Interpolation
i18n.t('onboarding.greeting', { name: 'John' }); // "Hello, John!"

// Pluralization
i18n.plural('items.count', 5, { count: 5 }); // "5 items"

// Number formatting
i18n.formatNumber(1234.56, { style: 'currency', currency: 'USD' }); // "$1,234.56"

// Date formatting
i18n.formatDate(new Date(), { dateStyle: 'long' }); // "January 15, 2025"
```

---

## Version 4.0: Multi-step Flows & Tours

### Overview
The Flow Engine enables creation of complex, multi-step guided tours with branching logic, progress tracking, and checklists.

### Key Features

#### 1. Sequential Flows
Create step-by-step guided tours:

```typescript
import { FlowEngine } from '@dap-overlay/sdk-core';

const flows = new FlowEngine();

// Define a flow
flows.defineFlow({
  id: 'onboarding-flow',
  name: 'User Onboarding',
  description: 'Guide new users through the app',
  startStepId: 'welcome',
  steps: [
    {
      stepId: 'welcome',
      order: 1,
      required: true,
    },
    {
      stepId: 'profile-setup',
      order: 2,
      required: true,
    },
    {
      stepId: 'dashboard-tour',
      order: 3,
      required: false,
    },
    {
      stepId: 'complete',
      order: 4,
      required: true,
    },
  ],
  settings: {
    allowSkip: true,
    allowBack: true,
    showProgress: true,
    persistProgress: true,
    autoAdvance: false,
  },
});

// Start flow
const executionId = flows.startFlow('onboarding-flow', { userId: 'user_123' });

// Get current step
const currentStep = flows.getCurrentStep(executionId);

// Advance to next step
const nextStep = flows.advanceFlow(executionId, 'completed');

// Get progress
const progress = flows.getFlowProgress(executionId);
console.log(`Progress: ${progress.percentComplete}%`);
```

#### 2. Branching Logic
Create conditional flows with branching:

```typescript
flows.defineFlow({
  id: 'conditional-flow',
  name: 'Conditional Onboarding',
  startStepId: 'role-selection',
  steps: [
    {
      stepId: 'role-selection',
      order: 1,
      branches: [
        {
          condition: {
            type: 'userAction',
            action: 'clicked',
          },
          targetStepId: 'admin-setup',
          priority: 1,
        },
        {
          condition: {
            type: 'customLogic',
            customLogic: (context) => {
              return context.userData?.role === 'user';
            },
          },
          targetStepId: 'user-setup',
          priority: 0,
        },
      ],
    },
    {
      stepId: 'admin-setup',
      order: 2,
    },
    {
      stepId: 'user-setup',
      order: 2,
    },
  ],
});
```

#### 3. Progress Tracking
Track user progress through flows:

```typescript
// Get detailed progress
const progress = flows.getFlowProgress(executionId);

console.log(`
  Total Steps: ${progress.totalSteps}
  Completed Steps: ${progress.completedSteps}
  Current Step: ${progress.currentStepIndex + 1}
  Progress: ${progress.percentComplete}%
  Is Complete: ${progress.isComplete}
`);

// Get all active executions
const activeExecutions = flows.getActiveExecutions();

// Get flow completion rate
const completionRate = flows.getFlowCompletionRate('onboarding-flow');
console.log(`${completionRate}% of users complete onboarding`);

// Get average duration
const avgDuration = flows.getAverageFlowDuration('onboarding-flow');
console.log(`Average completion time: ${avgDuration}ms`);
```

#### 4. Checklists
Create and manage progress checklists:

```typescript
// Create a checklist
const checklist = flows.createChecklist('setup-checklist', 'Account Setup', [
  {
    id: 'verify-email',
    title: 'Verify your email',
    description: 'Check your inbox for verification link',
    required: true,
    order: 1,
  },
  {
    id: 'complete-profile',
    title: 'Complete your profile',
    stepId: 'profile-setup',
    required: true,
    order: 2,
  },
  {
    id: 'invite-team',
    title: 'Invite team members',
    required: false,
    order: 3,
  },
]);

// Update checklist items
flows.updateChecklistItem('setup-checklist', 'verify-email', true);

// Get updated checklist
const updated = flows.getChecklist('setup-checklist');
console.log(`Progress: ${updated.progress}%`);
console.log(`Completed: ${updated.completed}/${updated.required} required items`);
```

#### 5. Flow Callbacks
React to flow events:

```typescript
// Listen for step completion
flows.onStepComplete('profile-setup', (stepId, context) => {
  console.log(`User completed ${stepId}`);
  // Trigger analytics, unlock features, etc.
});

// Listen for flow completion
flows.onFlowComplete('onboarding-flow', (flowId, context) => {
  console.log(`User completed ${flowId}`);
  console.log(`Completed in ${context.lastUpdateTime - context.startTime}ms`);
  // Award badge, update user status, etc.
});
```

---

## Version 5.0: A/B Testing & Experimentation

### Overview
The Experiment Engine provides a complete A/B testing framework with variant management, statistical analysis, and automatic winner selection.

### Key Features

#### 1. Experiment Creation
Create A/B tests for overlays:

```typescript
import { ExperimentEngine } from '@dap-overlay/sdk-core';

const experiments = new ExperimentEngine();

// Create an experiment
const experiment = experiments.createExperiment({
  id: 'cta-button-test',
  name: 'CTA Button Color Test',
  description: 'Test which button color drives more conversions',
  hypothesis: 'Green buttons will increase conversions by 10%',
  variants: [
    {
      id: 'control',
      name: 'Blue Button (Control)',
      weight: 50,
      isControl: true,
      config: {
        buttonColor: 'blue',
        buttonText: 'Get Started',
      },
    },
    {
      id: 'variant-a',
      name: 'Green Button',
      weight: 50,
      config: {
        buttonColor: 'green',
        buttonText: 'Get Started',
      },
    },
  ],
  goals: [
    {
      id: 'signup',
      name: 'User Signup',
      type: 'conversion',
      metric: 'signup_completed',
      isPrimary: true,
    },
    {
      id: 'engagement',
      name: 'Time on Page',
      type: 'engagement',
      metric: 'time_spent',
    },
  ],
  settings: {
    autoWinner: true,
    requiredConfidence: 95,
    minimumSampleSize: 100,
    persistAssignment: true,
  },
});

// Start the experiment
experiments.startExperiment('cta-button-test');
```

#### 2. Variant Assignment
Automatically assign users to variants:

```typescript
// Assign user to variant
const assignment = experiments.assignVariant('cta-button-test', 'user_123');

console.log(`User assigned to variant: ${assignment.variantId}`);

// Get variant configuration
const config = experiments.getVariantConfig('cta-button-test', 'user_123');

// Use configuration
const buttonColor = config.buttonColor; // 'blue' or 'green'
const buttonText = config.buttonText; // 'Get Started'
```

#### 3. Goal Tracking
Track conversion events:

```typescript
// Track goal achievement
experiments.trackGoalEvent('cta-button-test', 'signup', 'user_123');

// Track additional goals
experiments.trackGoalEvent('cta-button-test', 'engagement', 'user_123');
```

#### 4. Statistical Analysis
Analyze experiment results with statistical significance:

```typescript
// Get results
const results = experiments.getResults('cta-button-test');

results.forEach((result) => {
  console.log(`Variant: ${result.variantId}`);
  console.log(`Participants: ${result.participantCount}`);
  console.log(`Conversions: ${result.goalConversions.get('signup')}`);
  console.log(`Conversion Rate: ${result.conversionRates.get('signup')}%`);
});

// Get detailed analysis
const analysis = experiments.analyzeExperiment('cta-button-test');

console.log(`Status: ${analysis.status}`);
console.log(`Winner: ${analysis.winner}`);
console.log(`Confidence: ${analysis.confidence}%`);
console.log(`Statistical Significance: ${analysis.statisticalSignificance}`);
console.log(`Recommendation: ${analysis.recommendedAction}`);

// View insights
analysis.insights.forEach((insight) => {
  console.log(insight);
});
```

#### 5. Variant Performance
Compare variant performance:

```typescript
const performance = experiments.getVariantPerformance('cta-button-test');

performance.forEach((variant) => {
  console.log(`
    ${variant.variantName}:
    - Participants: ${variant.participants}
    - Conversions: ${variant.conversions}
    - Conversion Rate: ${variant.conversionRate.toFixed(2)}%
    - Lift vs Control: ${variant.lift ? `${variant.lift.toFixed(1)}%` : 'N/A'}
  `);
});
```

#### 6. Auto Winner Selection
Automatically select and scale winners:

```typescript
// Check for auto-winner
const winner = experiments.checkAutoWinner('cta-button-test');

if (winner) {
  console.log(`Winner detected: ${winner}`);
  console.log('Experiment automatically stopped');

  // Deploy winner to all users
  const winningConfig = experiments.getVariantConfig('cta-button-test', null, winner);
  // Apply winning configuration globally
}
```

---

## Integration with Guide Engine

All new features integrate seamlessly with the existing Guide Engine:

```typescript
import {
  GuideEngine,
  AnalyticsEngine,
  SegmentationEngine,
  FlowEngine,
  ExperimentEngine,
} from '@dap-overlay/sdk-core';

// Initialize engines
const analytics = new AnalyticsEngine({ /* config */ });
const segmentation = new SegmentationEngine();
const flows = new FlowEngine();
const experiments = new ExperimentEngine();

// Create guide engine with analytics
const guideEngine = new GuideEngine({
  steps: stepsDocument,
  analyticsEngine: analytics,
});

// Analytics automatically tracks step views, dismissals, and CTA clicks
// No additional code required!
```

## Best Practices

### Analytics
- Use funnel analysis to identify drop-off points
- Set appropriate session timeouts for your use case
- Export data regularly for external analysis
- Monitor event rate limits to avoid data loss

### Segmentation
- Start with broad segments and refine based on data
- Use behavioral attributes for dynamic segmentation
- Combine segments and cohorts for precise targeting
- Regularly audit segment overlap to avoid redundancy

### Internationalization
- Provide translations for all user-facing text
- Use interpolation for dynamic content
- Test all locales before deploying
- Monitor missing translation keys

### Flows
- Keep flows concise (3-7 steps ideal)
- Use branching sparingly to avoid complexity
- Always provide a way to exit or skip
- Track completion rates and optimize low-performing flows

### Experiments
- Run one experiment at a time per feature
- Wait for statistical significance before declaring a winner
- Set clear success metrics before starting
- Document all experiment results for future reference

## Security Considerations

- All engines include rate limiting to prevent abuse
- User data is never sent to third parties without explicit configuration
- Sensitive data should be sanitized before tracking
- Use environment variables for API endpoints
- Enable retry logic for production deployments

## Performance

- Analytics events are batched and flushed periodically
- Segmentation evaluation is cached and optimized
- Flow state is stored in memory for fast access
- Experiment assignments use deterministic hashing

## Browser Support

All features support:
- Chrome/Edge 88+
- Firefox 86+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - See LICENSE file for details
