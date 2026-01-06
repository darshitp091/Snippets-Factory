import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// POST: Give an award to a snippet
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
    const body = await request.json();
    const { snippetId, awardTypeId } = body;

    if (!snippetId || !awardTypeId) {
      return NextResponse.json(
        { error: 'Snippet ID and Award Type ID are required' },
        { status: 400 }
      );
    }

    // Check if snippet exists
    const { data: snippet, error: snippetError } = await supabase
      .from('snippets')
      .select('id, created_by')
      .eq('id', snippetId)
      .single();

    if (snippetError || !snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    // Check if user is trying to award their own snippet
    if (snippet.created_by === userId) {
      return NextResponse.json(
        { error: 'You cannot give awards to your own snippets' },
        { status: 400 }
      );
    }

    // Give the award using database function
    const { data: awardData, error: awardError } = await supabase.rpc('give_award', {
      p_snippet_id: snippetId,
      p_award_type_id: awardTypeId,
      p_given_by: userId,
    });

    if (awardError) {
      // Check if it's an insufficient coins error
      if (awardError.message?.includes('Insufficient coins')) {
        return NextResponse.json(
          {
            error: 'Insufficient coins',
            message: 'You do not have enough coins to give this award',
            purchaseUrl: '/coins/buy',
          },
          { status: 403 }
        );
      }

      console.error('Error giving award:', awardError);
      return NextResponse.json({ error: awardError.message }, { status: 500 });
    }

    // Get the award details for response
    const { data: awardDetails } = await supabase
      .from('snippet_awards')
      .select(`
        *,
        award_type:award_types(*),
        giver:users!given_by(id, full_name, avatar_url)
      `)
      .eq('id', awardData)
      .single();

    return NextResponse.json({
      message: 'Award given successfully',
      award: awardDetails,
    });
  } catch (error) {
    console.error('Error in POST /api/awards/give:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
