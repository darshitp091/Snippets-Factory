import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all followers of a community
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;

    const { data, error } = await supabase
      .from('community_followers')
      .select(`
        id,
        user_id,
        followed_at,
        users:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .order('followed_at', { ascending: false });

    if (error) {
      console.error('Error fetching followers:', error);
      return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
    }

    return NextResponse.json({ followers: data || [] });
  } catch (error) {
    console.error('Error in GET /api/communities/[id]/followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Follow a community
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('community_followers')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user_id)
      .single();

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this community' }, { status: 409 });
    }

    // Follow community
    const { data: follower, error: insertError } = await supabase
      .from('community_followers')
      .insert([
        {
          community_id: communityId,
          user_id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error following community:', insertError);
      return NextResponse.json({ error: 'Failed to follow community' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Community followed successfully',
        follower,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/communities/[id]/followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Unfollow a community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Unfollow community
    const { error: deleteError } = await supabase
      .from('community_followers')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Error unfollowing community:', deleteError);
      return NextResponse.json({ error: 'Failed to unfollow community' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Community unfollowed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/communities/[id]/followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
