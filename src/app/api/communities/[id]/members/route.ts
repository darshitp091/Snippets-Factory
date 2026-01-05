import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all members of a community
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role'); // Filter by role

    let query = supabase
      .from('community_members')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        users:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .order('joined_at', { ascending: true });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    return NextResponse.json({ members: data || [] });
  } catch (error) {
    console.error('Error in GET /api/communities/[id]/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add a member to a community (join)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user_id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    // Add member
    const { data: member, error: insertError } = await supabase
      .from('community_members')
      .insert([
        {
          community_id: communityId,
          user_id,
          role: role || 'member',
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error adding member:', insertError);
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Member added successfully',
        member,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/communities/[id]/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a member from a community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');
    const requester_id = searchParams.get('requester_id');

    if (!user_id || !requester_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: user_id and requester_id' },
        { status: 400 }
      );
    }

    // Check if requester has permission (owner or moderator)
    const { data: requesterMembership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', requester_id)
      .single();

    // Get community owner
    const { data: community } = await supabase
      .from('communities')
      .select('owner_id')
      .eq('id', communityId)
      .single();

    const isOwner = community?.owner_id === requester_id;
    const isModerator =
      requesterMembership?.role === 'owner' || requesterMembership?.role === 'moderator';

    // Users can leave themselves, or owner/mods can remove others
    const canRemove = user_id === requester_id || isOwner || isModerator;

    if (!canRemove) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this member' },
        { status: 403 }
      );
    }

    // Cannot remove the community owner
    if (community?.owner_id === user_id) {
      return NextResponse.json({ error: 'Cannot remove community owner' }, { status: 400 });
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/communities/[id]/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const body = await request.json();
    const { user_id, new_role, requester_id } = body;

    if (!user_id || !new_role || !requester_id) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, new_role, and requester_id' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['member', 'moderator', 'owner'];
    if (!validRoles.includes(new_role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if requester is owner (only owner can change roles)
    const { data: community } = await supabase
      .from('communities')
      .select('owner_id')
      .eq('id', communityId)
      .single();

    if (!community || community.owner_id !== requester_id) {
      return NextResponse.json(
        { error: 'Only the community owner can change member roles' },
        { status: 403 }
      );
    }

    // Cannot change owner's role
    if (community.owner_id === user_id) {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
    }

    // Update role
    const { data: updatedMember, error: updateError } = await supabase
      .from('community_members')
      .update({ role: new_role })
      .eq('community_id', communityId)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully',
      member: updatedMember,
    });
  } catch (error) {
    console.error('Error in PATCH /api/communities/[id]/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
