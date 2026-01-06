import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// GET: Fetch team members (Pro/Enterprise only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // SERVER-SIDE PLAN VERIFICATION
    const { data: hasFeature, error: featureError } = await supabase.rpc(
      'user_has_feature',
      {
        p_user_id: userId,
        p_feature: 'team_management',
      }
    );

    if (featureError) {
      console.error('Error checking feature access:', featureError);
      return NextResponse.json({ error: 'Error checking permissions' }, { status: 500 });
    }

    if (!hasFeature) {
      return NextResponse.json(
        {
          error: 'Team Management is a Pro feature',
          message: 'Upgrade to Pro or Enterprise to manage teams',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    // Track usage
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_feature: 'team_management',
      p_usage_type: 'view_members',
    });

    // Fetch team members
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        role,
        permissions,
        invited_at,
        joined_at,
        status,
        user:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('team_owner_id', userId)
      .order('joined_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      return NextResponse.json({ error: 'Error fetching team members' }, { status: 500 });
    }

    // Get team statistics
    const { data: userData } = await supabase
      .from('users')
      .select('plan, max_team_members, team_member_count')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      members: members || [],
      stats: {
        currentCount: userData?.team_member_count || 0,
        maxMembers: userData?.max_team_members || 0,
        plan: userData?.plan || 'free',
        canAddMore: (userData?.team_member_count || 0) < (userData?.max_team_members || 0),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/team/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add team member (Pro/Enterprise only with limit enforcement)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // SERVER-SIDE PLAN VERIFICATION
    const { data: hasFeature, error: featureError } = await supabase.rpc(
      'user_has_feature',
      {
        p_user_id: userId,
        p_feature: 'team_management',
      }
    );

    if (featureError) {
      console.error('Error checking feature access:', featureError);
      return NextResponse.json({ error: 'Error checking permissions' }, { status: 500 });
    }

    if (!hasFeature) {
      return NextResponse.json(
        {
          error: 'Team Management is a Pro feature',
          message: 'Upgrade to Pro or Enterprise to manage teams',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = 'member', permissions = [] } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const { data: invitedUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !invitedUser) {
      return NextResponse.json(
        { error: 'User not found. They need to sign up first.' },
        { status: 404 }
      );
    }

    // Check if already a team member
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_owner_id', userId)
      .eq('user_id', invitedUser.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Add team member - Database trigger will enforce limits!
    const { data: newMember, error: insertError } = await supabase
      .from('team_members')
      .insert({
        team_owner_id: userId,
        user_id: invitedUser.id,
        role,
        permissions,
        status: 'active',
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      })
      .select(`
        id,
        role,
        permissions,
        invited_at,
        joined_at,
        status,
        user:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (insertError) {
      // Check if it's a limit error
      if (insertError.code === '23514') {
        return NextResponse.json(
          {
            error: 'Team member limit reached',
            message: insertError.message,
            upgradeUrl: '/pricing',
          },
          { status: 403 }
        );
      }

      console.error('Error adding team member:', insertError);
      return NextResponse.json({ error: 'Error adding team member' }, { status: 500 });
    }

    // Track usage
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_feature: 'team_management',
      p_usage_type: 'add_member',
    });

    return NextResponse.json({
      message: 'Team member added successfully',
      member: newMember,
    });
  } catch (error) {
    console.error('Error in POST /api/team/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove team member
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // SERVER-SIDE PLAN VERIFICATION
    const { data: hasFeature } = await supabase.rpc('user_has_feature', {
      p_user_id: userId,
      p_feature: 'team_management',
    });

    if (!hasFeature) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Delete team member (trigger will decrement count)
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_owner_id', userId);

    if (deleteError) {
      console.error('Error removing team member:', deleteError);
      return NextResponse.json({ error: 'Error removing team member' }, { status: 500 });
    }

    // Track usage
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_feature: 'team_management',
      p_usage_type: 'remove_member',
    });

    return NextResponse.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/team/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
