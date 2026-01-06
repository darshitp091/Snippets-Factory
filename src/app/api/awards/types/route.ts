import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Get all available award types
export async function GET(request: NextRequest) {
  try {
    const { data: awardTypes, error } = await supabase
      .from('award_types')
      .select('*')
      .order('coin_cost', { ascending: true });

    if (error) {
      console.error('Error fetching award types:', error);
      return NextResponse.json({ error: 'Error fetching award types' }, { status: 500 });
    }

    return NextResponse.json({
      awardTypes: awardTypes || [],
    });
  } catch (error) {
    console.error('Error in GET /api/awards/types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
