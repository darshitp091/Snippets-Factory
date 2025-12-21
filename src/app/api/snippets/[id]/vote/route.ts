import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { vote_type, user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!['upvote', 'downvote'].includes(vote_type)) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('snippet_votes')
      .select('*')
      .eq('snippet_id', id)
      .eq('user_id', user_id)
      .single();

    if (existingVote) {
      // If same vote type, remove vote
      if (existingVote.vote_type === vote_type) {
        const { error } = await supabase
          .from('snippet_votes')
          .delete()
          .eq('id', existingVote.id);

        if (error) throw error;

        return NextResponse.json({ success: true, action: 'removed' });
      } else {
        // Change vote type
        const { error } = await supabase
          .from('snippet_votes')
          .update({ vote_type })
          .eq('id', existingVote.id);

        if (error) throw error;

        return NextResponse.json({ success: true, action: 'changed' });
      }
    } else {
      // Create new vote
      const { error } = await supabase
        .from('snippet_votes')
        .insert([
          {
            snippet_id: id,
            user_id,
            vote_type,
          },
        ]);

      if (error) throw error;

      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error: any) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process vote' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's vote for this snippet
    const { data, error } = await supabase
      .from('snippet_votes')
      .select('vote_type')
      .eq('snippet_id', id)
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ vote_type: data?.vote_type || null });
  } catch (error: any) {
    console.error('Error getting vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get vote' },
      { status: 500 }
    );
  }
}
