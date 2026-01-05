import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch a single community by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: community, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    return NextResponse.json({ community });
  } catch (error) {
    console.error('Error in GET /api/communities/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a community
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, category, visibility, avatar_url, banner_url, user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Check if user is the owner
    const { data: community } = await supabase
      .from('communities')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (community.owner_id !== user_id) {
      return NextResponse.json(
        { error: 'Only the community owner can update settings' },
        { status: 403 }
      );
    }

    // Update community
    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (visibility !== undefined) updates.visibility = visibility;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (banner_url !== undefined) updates.banner_url = banner_url;

    const { data: updatedCommunity, error: updateError } = await supabase
      .from('communities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating community:', updateError);
      return NextResponse.json({ error: 'Failed to update community' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Community updated successfully',
      community: updatedCommunity,
    });
  } catch (error) {
    console.error('Error in PUT /api/communities/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Check if user is the owner
    const { data: community } = await supabase
      .from('communities')
      .select('owner_id, name')
      .eq('id', id)
      .single();

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (community.owner_id !== user_id) {
      return NextResponse.json(
        { error: 'Only the community owner can delete the community' },
        { status: 403 }
      );
    }

    // Delete community (cascade will handle related records)
    const { error: deleteError } = await supabase.from('communities').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting community:', deleteError);
      return NextResponse.json({ error: 'Failed to delete community' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Community deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/communities/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
