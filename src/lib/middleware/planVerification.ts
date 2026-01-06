import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Plan verification middleware for API routes
 * Ensures users have the required feature access before proceeding
 */

export interface VerificationResult {
  authorized: boolean;
  userId?: string;
  plan?: string;
  error?: string;
  errorResponse?: NextResponse;
}

/**
 * Verify if the current user has access to a specific feature
 * @param feature - Feature name (analytics, team_management, ai_generation, etc.)
 * @returns VerificationResult object
 */
export async function verifyFeatureAccess(
  feature: string
): Promise<VerificationResult> {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return {
        authorized: false,
        error: 'Unauthorized',
        errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    const userId = session.user.id;

    // Get user plan
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    if (userError) {
      return {
        authorized: false,
        error: 'Error fetching user data',
        errorResponse: NextResponse.json(
          { error: 'Error fetching user data' },
          { status: 500 }
        ),
      };
    }

    // SERVER-SIDE PLAN VERIFICATION using database function
    const { data: hasFeature, error: featureError } = await supabase.rpc(
      'user_has_feature',
      {
        p_user_id: userId,
        p_feature: feature,
      }
    );

    if (featureError) {
      console.error('Error checking feature access:', featureError);
      return {
        authorized: false,
        error: 'Error checking permissions',
        errorResponse: NextResponse.json(
          { error: 'Error checking permissions' },
          { status: 500 }
        ),
      };
    }

    if (!hasFeature) {
      const featureNames: { [key: string]: string } = {
        analytics: 'Analytics',
        team_management: 'Team Management',
        ai_generation: 'AI Code Generation',
        advanced_export: 'Advanced Export',
        api_access: 'API Access',
        sso: 'Single Sign-On',
        white_label: 'White Label',
        priority_support: 'Priority Support',
      };

      return {
        authorized: false,
        userId,
        plan: userData.plan,
        error: `${featureNames[feature] || feature} is not available on your plan`,
        errorResponse: NextResponse.json(
          {
            error: `${featureNames[feature] || feature} is not available on your plan`,
            message: 'Upgrade to Pro or Enterprise to access this feature',
            currentPlan: userData.plan,
            upgradeUrl: '/pricing',
          },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      userId,
      plan: userData.plan,
    };
  } catch (error) {
    console.error('Error in verifyFeatureAccess:', error);
    return {
      authorized: false,
      error: 'Internal server error',
      errorResponse: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    };
  }
}

/**
 * Track feature usage for metered billing
 * @param userId - User ID
 * @param feature - Feature name
 * @param usageType - Type of usage (view, create, export, etc.)
 * @param quantity - Quantity of usage (default: 1)
 * @param metadata - Additional metadata
 */
export async function trackUsage(
  userId: string,
  feature: string,
  usageType: string,
  quantity: number = 1,
  metadata: any = {}
) {
  try {
    const supabase = createServerSupabaseClient();

    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_feature: feature,
      p_usage_type: usageType,
      p_quantity: quantity,
      p_metadata: metadata,
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't fail the request if usage tracking fails
  }
}

/**
 * Verify snippet creation limit
 * @param userId - User ID
 * @returns VerificationResult object
 */
export async function verifySnippetLimit(userId: string): Promise<VerificationResult> {
  try {
    const supabase = createServerSupabaseClient();

    // Get user's current snippet count and limit
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('snippet_count, max_snippets, plan')
      .eq('id', userId)
      .single();

    if (userError) {
      return {
        authorized: false,
        error: 'Error fetching user data',
        errorResponse: NextResponse.json(
          { error: 'Error fetching user data' },
          { status: 500 }
        ),
      };
    }

    const currentCount = userData.snippet_count || 0;
    const maxSnippets = userData.max_snippets || 0;

    // -1 means unlimited
    if (maxSnippets !== -1 && currentCount >= maxSnippets) {
      return {
        authorized: false,
        userId,
        plan: userData.plan,
        error: 'Snippet limit reached',
        errorResponse: NextResponse.json(
          {
            error: 'Snippet limit reached',
            message: `You have reached your limit of ${maxSnippets} snippets. Upgrade your plan for more.`,
            currentCount,
            maxSnippets,
            currentPlan: userData.plan,
            upgradeUrl: '/pricing',
          },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      userId,
      plan: userData.plan,
    };
  } catch (error) {
    console.error('Error in verifySnippetLimit:', error);
    return {
      authorized: false,
      error: 'Internal server error',
      errorResponse: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    };
  }
}

/**
 * Verify team member limit
 * @param userId - User ID (team owner)
 * @returns VerificationResult object
 */
export async function verifyTeamMemberLimit(userId: string): Promise<VerificationResult> {
  try {
    const supabase = createServerSupabaseClient();

    // Get user's current team count and limit
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('team_member_count, max_team_members, plan')
      .eq('id', userId)
      .single();

    if (userError) {
      return {
        authorized: false,
        error: 'Error fetching user data',
        errorResponse: NextResponse.json(
          { error: 'Error fetching user data' },
          { status: 500 }
        ),
      };
    }

    const currentCount = userData.team_member_count || 0;
    const maxMembers = userData.max_team_members || 0;

    if (currentCount >= maxMembers) {
      return {
        authorized: false,
        userId,
        plan: userData.plan,
        error: 'Team member limit reached',
        errorResponse: NextResponse.json(
          {
            error: 'Team member limit reached',
            message: `You have reached your limit of ${maxMembers} team members. Upgrade to add more.`,
            currentCount,
            maxMembers,
            currentPlan: userData.plan,
            upgradeUrl: '/pricing',
          },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      userId,
      plan: userData.plan,
    };
  } catch (error) {
    console.error('Error in verifyTeamMemberLimit:', error);
    return {
      authorized: false,
      error: 'Internal server error',
      errorResponse: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    };
  }
}

/**
 * Check if user's subscription is active
 * @param userId - User ID
 * @returns boolean
 */
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status, subscription_expires_at, plan')
      .eq('id', userId)
      .single();

    if (!userData) return false;

    // Free plan is always "active"
    if (userData.plan === 'free') return true;

    // Check subscription status
    if (userData.subscription_status !== 'active') return false;

    // Check expiry date
    if (userData.subscription_expires_at) {
      const expiryDate = new Date(userData.subscription_expires_at);
      if (expiryDate < new Date()) return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}
