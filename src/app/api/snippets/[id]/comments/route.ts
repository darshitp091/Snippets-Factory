import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('snippet_comments')
      .select(`
        *,
        users:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('snippet_id', id)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ comments: data || [] });
  } catch (error: any) {
    console.error('Error loading comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content, user_id, parent_comment_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('snippet_comments')
      .insert([
        {
          snippet_id: id,
          user_id,
          content: content.trim(),
          parent_comment_id: parent_comment_id || null,
        },
      ])
      .select(`
        *,
        users:user_id (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}
