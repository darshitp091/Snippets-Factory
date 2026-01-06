import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Get user's coin balance
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

    // Get coin balance
    const { data: coinData, error: coinError } = await supabase
      .from('user_coins')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (coinError && coinError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching coin balance:', coinError);
      return NextResponse.json({ error: 'Error fetching coin balance' }, { status: 500 });
    }

    // If no coin record exists, create one
    if (!coinData) {
      const { data: newCoinData, error: insertError } = await supabase
        .from('user_coins')
        .insert({
          user_id: userId,
          balance: 0,
          lifetime_purchased: 0,
          lifetime_spent: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating coin record:', insertError);
        return NextResponse.json({ error: 'Error creating coin record' }, { status: 500 });
      }

      return NextResponse.json(newCoinData);
    }

    return NextResponse.json(coinData);
  } catch (error) {
    console.error('Error in GET /api/coins/balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
