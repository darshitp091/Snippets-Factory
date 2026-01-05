import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all snippets from a community
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'hot';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('community_snippets')
      .select(`
        id,
        snippet_id,
        posted_at,
        is_pinned,
        snippets:snippet_id (
          id,
          title,
          description,
          code,
          language,
          tags,
          upvote_count,
          downvote_count,
          comment_count,
          view_count,
          created_at,
          created_by,
          users:created_by (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('community_id', communityId)
      .limit(limit);

    // Apply sorting
    switch (sortBy) {
      case 'new':
        query = query.order('posted_at', { ascending: false });
        break;
      case 'top':
        // Note: Can't directly sort by nested field in Supabase
        // Will need to sort on client or use a view
        query = query.order('posted_at', { ascending: false });
        break;
      case 'hot':
      default:
        query = query.order('is_pinned', { ascending: false }).order('posted_at', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching community snippets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community snippets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ snippets: data || [] });
  } catch (error) {
    console.error('Error in GET /api/communities/[id]/snippets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Share a snippet to a community
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const body = await request.json();
    const { snippet_id, user_id } = body;

    // Validation
    if (!snippet_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: snippet_id and user_id' },
        { status: 400 }
      );
    }

    // Check if user is a member of the community
    const { data: memberData, error: memberError } = await supabase
      .from('community_members')
      .select('id, role')
      .eq('community_id', communityId)
      .eq('user_id', user_id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: 'You must be a member of this community to post snippets' },
        { status: 403 }
      );
    }

    // Check if snippet exists and user owns it
    const { data: snippetData, error: snippetError } = await supabase
      .from('snippets')
      .select('id, created_by, share_count')
      .eq('id', snippet_id)
      .single();

    if (snippetError || !snippetData) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      );
    }

    if (snippetData.created_by !== user_id) {
      return NextResponse.json(
        { error: 'You can only share your own snippets' },
        { status: 403 }
      );
    }

    // Check if snippet is already shared to this community
    const { data: existingShare } = await supabase
      .from('community_snippets')
      .select('id')
      .eq('community_id', communityId)
      .eq('snippet_id', snippet_id)
      .single();

    if (existingShare) {
      return NextResponse.json(
        { error: 'This snippet is already shared to this community' },
        { status: 409 }
      );
    }

    // Insert into community_snippets
    const { data: communitySnippet, error: insertError } = await supabase
      .from('community_snippets')
      .insert([
        {
          community_id: communityId,
          snippet_id: snippet_id,
          posted_by: user_id,
          is_pinned: false,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error sharing snippet:', insertError);
      return NextResponse.json(
        { error: 'Failed to share snippet to community' },
        { status: 500 }
      );
    }

    // Update snippet share count (use COALESCE to handle NULL values)
    const currentShareCount = (snippetData as any).share_count || 0;
    await supabase
      .from('snippets')
      .update({ share_count: currentShareCount + 1 })
      .eq('id', snippet_id);

    return NextResponse.json(
      {
        success: true,
        message: 'Snippet shared to community successfully',
        data: communitySnippet,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/communities/[id]/snippets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a snippet from a community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const snippet_id = searchParams.get('snippet_id');
    const user_id = searchParams.get('user_id');

    if (!snippet_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: snippet_id and user_id' },
        { status: 400 }
      );
    }

    // Check if user posted this snippet or is a moderator/owner
    const { data: communitySnippet, error: fetchError } = await supabase
      .from('community_snippets')
      .select('id, posted_by')
      .eq('community_id', communityId)
      .eq('snippet_id', snippet_id)
      .single();

    if (fetchError || !communitySnippet) {
      return NextResponse.json(
        { error: 'Community snippet not found' },
        { status: 404 }
      );
    }

    // Check permissions: user must be the poster, moderator, or owner
    const { data: memberData } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user_id)
      .single();

    const canDelete =
      communitySnippet.posted_by === user_id ||
      memberData?.role === 'owner' ||
      memberData?.role === 'moderator';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this snippet' },
        { status: 403 }
      );
    }

    // Delete the community snippet
    const { error: deleteError } = await supabase
      .from('community_snippets')
      .delete()
      .eq('id', communitySnippet.id);

    if (deleteError) {
      console.error('Error removing snippet from community:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove snippet from community' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Snippet removed from community successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/communities/[id]/snippets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
