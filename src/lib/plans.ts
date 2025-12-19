export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PlanFeatures {
  name: string;
  maxSnippets: number;
  maxTeamMembers: number;
  analytics: boolean;
  apiAccess: boolean;
  cloudSync: boolean;
  aiCategorization: boolean;
  advancedSearch: boolean;
  customCategories: boolean;
  prioritySupport: boolean;
  auditLogs: boolean;
  sso: boolean;
  customBranding: boolean;
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    name: 'Free',
    maxSnippets: 50,
    maxTeamMembers: 1,
    analytics: false,
    apiAccess: false,
    cloudSync: true,
    aiCategorization: false,
    advancedSearch: false,
    customCategories: false,
    prioritySupport: false,
    auditLogs: false,
    sso: false,
    customBranding: false,
  },
  pro: {
    name: 'Pro',
    maxSnippets: -1, // unlimited
    maxTeamMembers: 10,
    analytics: true,
    apiAccess: true,
    cloudSync: true,
    aiCategorization: true,
    advancedSearch: true,
    customCategories: true,
    prioritySupport: true,
    auditLogs: false,
    sso: false,
    customBranding: false,
  },
  enterprise: {
    name: 'Enterprise',
    maxSnippets: -1, // unlimited
    maxTeamMembers: -1, // unlimited
    analytics: true,
    apiAccess: true,
    cloudSync: true,
    aiCategorization: true,
    advancedSearch: true,
    customCategories: true,
    prioritySupport: true,
    auditLogs: true,
    sso: true,
    customBranding: true,
  },
};

export class PlanAccessControl {
  private plan: PlanType;
  private features: PlanFeatures;

  constructor(plan: PlanType = 'free') {
    this.plan = plan;
    this.features = PLAN_FEATURES[plan];
  }

  // Check if a specific feature is available
  hasFeature(feature: keyof Omit<PlanFeatures, 'name' | 'maxSnippets' | 'maxTeamMembers'>): boolean {
    return this.features[feature] as boolean;
  }

  // Check if user can create more snippets
  canCreateSnippet(currentCount: number): boolean {
    if (this.features.maxSnippets === -1) return true;
    return currentCount < this.features.maxSnippets;
  }

  // Check if user can add more team members
  canAddTeamMember(currentCount: number): boolean {
    if (this.features.maxTeamMembers === -1) return true;
    return currentCount < this.features.maxTeamMembers;
  }

  // Get remaining snippets quota
  getRemainingSnippets(currentCount: number): number {
    if (this.features.maxSnippets === -1) return Infinity;
    return Math.max(0, this.features.maxSnippets - currentCount);
  }

  // Get remaining team members quota
  getRemainingTeamMembers(currentCount: number): number {
    if (this.features.maxTeamMembers === -1) return Infinity;
    return Math.max(0, this.features.maxTeamMembers - currentCount);
  }

  // Get all features for the current plan
  getFeatures(): PlanFeatures {
    return this.features;
  }

  // Get plan name
  getPlanName(): string {
    return this.features.name;
  }

  // Get plan type
  getPlanType(): PlanType {
    return this.plan;
  }

  // Check if upgrade is needed for a feature
  needsUpgradeFor(feature: keyof Omit<PlanFeatures, 'name' | 'maxSnippets' | 'maxTeamMembers'>): boolean {
    return !this.hasFeature(feature);
  }

  // Get recommended plan for a feature
  getRecommendedPlan(feature: keyof Omit<PlanFeatures, 'name' | 'maxSnippets' | 'maxTeamMembers'>): PlanType | null {
    if (this.hasFeature(feature)) return null;

    if (PLAN_FEATURES.pro[feature]) return 'pro';
    if (PLAN_FEATURES.enterprise[feature]) return 'enterprise';

    return null;
  }
}

// Helper function to create access control instance
export function createAccessControl(plan: PlanType): PlanAccessControl {
  return new PlanAccessControl(plan);
}

// React hook for plan-based access control
export function usePlanAccess(plan: PlanType) {
  const accessControl = new PlanAccessControl(plan);

  return {
    hasFeature: (feature: keyof Omit<PlanFeatures, 'name' | 'maxSnippets' | 'maxTeamMembers'>) =>
      accessControl.hasFeature(feature),
    canCreateSnippet: (count: number) => accessControl.canCreateSnippet(count),
    canAddTeamMember: (count: number) => accessControl.canAddTeamMember(count),
    getRemainingSnippets: (count: number) => accessControl.getRemainingSnippets(count),
    getRemainingTeamMembers: (count: number) => accessControl.getRemainingTeamMembers(count),
    getFeatures: () => accessControl.getFeatures(),
    getPlanName: () => accessControl.getPlanName(),
    needsUpgradeFor: (feature: keyof Omit<PlanFeatures, 'name' | 'maxSnippets' | 'maxTeamMembers'>) =>
      accessControl.needsUpgradeFor(feature),
    getRecommendedPlan: (feature: keyof Omit<PlanFeatures, 'name' | 'maxSnippets' | 'maxTeamMembers'>) =>
      accessControl.getRecommendedPlan(feature),
  };
}

// Example usage:
/*
import { usePlanAccess } from '@/lib/plans';

function MyComponent() {
  const user = { plan: 'pro' }; // from Supabase
  const planAccess = usePlanAccess(user.plan);

  if (planAccess.hasFeature('analytics')) {
    // Show analytics dashboard
  }

  if (planAccess.canCreateSnippet(currentSnippetCount)) {
    // Allow snippet creation
  } else {
    // Show upgrade prompt
    const recommended = planAccess.getRecommendedPlan('apiAccess');
  }
}
*/
