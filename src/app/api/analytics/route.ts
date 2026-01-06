import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Fetch analytics data (Pro/Enterprise only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // SERVER-SIDE PLAN VERIFICATION (cannot be bypassed!)
    const { data: hasFeature, error: featureError } = await supabase.rpc(
      'user_has_feature',
      {
        p_user_id: userId,
        p_feature: 'analytics',
      }
    );

    if (featureError) {
      console.error('Error checking feature access:', featureError);
      return NextResponse.json({ error: 'Error checking permissions' }, { status: 500 });
    }

    if (!hasFeature) {
      return NextResponse.json(
        {
          error: 'Analytics is a Pro feature',
          message: 'Upgrade to Pro or Enterprise to access analytics',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    // Track usage for metered billing
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_feature: 'analytics',
      p_usage_type: 'dashboard_view',
    });

    // Fetch analytics data
    const [snippetsResult, communitiesResult, votesResult, viewsResult] = await Promise.all([
      // User's snippets
      supabase
        .from('snippets')
        .select('id, title, upvote_count, view_count, comment_count, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false }),

      // Communities user belongs to
      supabase
        .from('community_members')
        .select(`
          community:communities (
            id,
            name,
            slug,
            member_count
          )
        `)
        .eq('user_id', userId),

      // Total votes received
      supabase
        .from('snippet_votes')
        .select('vote_type, snippets!inner(created_by)')
        .eq('snippets.created_by', userId),

      // Community snippets shared
      supabase
        .from('community_snippets')
        .select('snippet_id, community_id, posted_at')
        .eq('posted_by', userId),
    ]);

    if (snippetsResult.error) {
      console.error('Error fetching snippets:', snippetsResult.error);
      return NextResponse.json({ error: 'Error fetching snippets' }, { status: 500 });
    }

    const snippets = snippetsResult.data || [];
    const communities = communitiesResult.data?.map((c: any) => c.community).filter(Boolean) || [];
    const votes = votesResult.data || [];
    const communitySnippets = viewsResult.data || [];

    // Calculate analytics metrics
    const totalSnippets = snippets.length;
    const totalUpvotes = votes.filter((v: any) => v.vote_type === 'upvote').length;
    const totalDownvotes = votes.filter((v: any) => v.vote_type === 'downvote').length;
    const totalViews = snippets.reduce((sum, s) => sum + (s.view_count || 0), 0);
    const totalComments = snippets.reduce((sum, s) => sum + (s.comment_count || 0), 0);
    const totalCommunities = communities.length;
    const totalReach = communitySnippets.length * 10; // Estimate: each community share reaches ~10 people

    // Top performing snippets
    const topSnippets = [...snippets]
      .sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))
      .slice(0, 5);

    // Engagement rate (upvotes + comments / views)
    const engagementRate =
      totalViews > 0 ? ((totalUpvotes + totalComments) / totalViews) * 100 : 0;

    // Activity over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSnippets = snippets.filter(
      (s) => new Date(s.created_at) >= thirtyDaysAgo
    );

    const activityByDay: { [key: string]: number } = {};
    recentSnippets.forEach((s) => {
      const day = new Date(s.created_at).toLocaleDateString();
      activityByDay[day] = (activityByDay[day] || 0) + 1;
    });

    // Get user reputation data
    const { data: userData } = await supabase
      .from('users')
      .select('reputation, reputation_level, total_upvotes_received, total_downvotes_received, badges')
      .eq('id', userId)
      .single();

    // Get user's rank
    const { data: rankData } = await supabase.rpc('get_user_rank', {
      p_user_id: userId,
    });

    return NextResponse.json({
      summary: {
        totalSnippets,
        totalUpvotes,
        totalDownvotes,
        totalViews,
        totalComments,
        totalCommunities,
        totalReach,
        engagementRate: Math.round(engagementRate * 100) / 100,
        reputation: userData?.reputation || 0,
        reputationLevel: userData?.reputation_level || 'Beginner',
        globalRank: rankData || null,
      },
      topSnippets: topSnippets.map((s) => ({
        id: s.id,
        title: s.title,
        upvotes: s.upvote_count || 0,
        views: s.view_count || 0,
        comments: s.comment_count || 0,
        createdAt: s.created_at,
      })),
      activityChart: Object.entries(activityByDay).map(([date, count]) => ({
        date,
        snippets: count,
      })),
      communities: communities.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        memberCount: c.member_count || 0,
      })),
      reputation: {
        current: userData?.reputation || 0,
        level: userData?.reputation_level || 'Beginner',
        upvotesReceived: userData?.total_upvotes_received || 0,
        downvotesReceived: userData?.total_downvotes_received || 0,
        badges: userData?.badges || [],
        rank: rankData || null,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
