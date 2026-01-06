import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Subscription Expiry Cron Job Endpoint
 *
 * This endpoint should be called by an external cron service (Vercel Cron, cron-job.org, etc.)
 * to check and downgrade expired subscriptions.
 *
 * Security: Requires CRON_SECRET environment variable to match authorization header
 *
 * Setup with Vercel Cron:
 * 1. Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/subscription-check",
 *     "schedule": "0 2 * * *"  // 2 AM daily
 *   }]
 * }
 *
 * 2. Add to .env:
 * CRON_SECRET=your-random-secret-key-here
 */

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run subscription expiry check
    const { data, error } = await supabase.rpc('run_subscription_expiry_check', {
      p_api_key: cronSecret,
    });

    if (error) {
      console.error('Error running subscription check:', error);
      return NextResponse.json(
        { error: 'Error running subscription check', details: error.message },
        { status: 500 }
      );
    }

    console.log('Subscription check completed:', data);

    return NextResponse.json({
      success: true,
      message: 'Subscription expiry check completed',
      result: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in subscription check cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also allow POST for some cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
