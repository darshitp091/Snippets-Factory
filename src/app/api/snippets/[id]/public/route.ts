import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snippetId = params.id;

    // Fetch snippet with creator info
    const { data: snippet, error } = await supabase
      .from('snippets')
      .select(`
        *,
        users!created_by (
          full_name,
          avatar_url
        )
      `)
      .eq('id', snippetId)
      .single();

    if (error || !snippet) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      );
    }

    // Check if snippet is private
    if (snippet.is_private) {
      return NextResponse.json(
        { error: 'This snippet is private' },
        { status: 403 }
      );
    }

    // Format response
    const response = {
      snippet: {
        id: snippet.id,
        title: snippet.title,
        description: snippet.description,
        code: snippet.code,
        language: snippet.language,
        category: snippet.category_id,
        tags: snippet.tags || [],
        usage_count: snippet.usage_count || 0,
        created_at: snippet.created_at,
        is_private: snippet.is_private,
        created_by: snippet.created_by,
        creator: snippet.users ? {
          full_name: snippet.users.full_name,
          avatar_url: snippet.users.avatar_url,
        } : null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching public snippet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to increment usage count when code is copied
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const snippetId = params.id;

    // Increment usage count
    const { error } = await supabase
      .from('snippets')
      .update({ usage_count: supabase.raw('usage_count + 1') })
      .eq('id', snippetId);

    if (error) {
      console.error('Error incrementing usage count:', error);
      return NextResponse.json(
        { error: 'Failed to update usage count' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/snippets/[id]/public:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
