import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import crypto from 'crypto';
import { verifyFeatureAccess } from '@/lib/middleware/planVerification';

// POST: Generate new API key (Pro/Enterprise only)
export async function POST(request: NextRequest) {
  try {
    // Verify user has API access feature
    const verification = await verifyFeatureAccess('api_access');
    if (!verification.authorized) {
      return verification.errorResponse!;
    }

    const userId = verification.userId!;
    const plan = verification.plan!;

    const supabase = createServerSupabaseClient();

    // Generate a unique API key
    const apiKey = `sf_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Determine rate limit based on plan
    let rateLimitPerHour = 100; // Default for Pro
    if (plan === 'enterprise') {
      rateLimitPerHour = 10000; // Enterprise gets higher limits
    }

    const body = await request.json();
    const { name = 'Default API Key' } = body;

    // Create API key record
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        rate_limit_per_hour: rateLimitPerHour,
        is_active: true,
        last_used_at: null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (keyError) {
      console.error('Error creating API key:', keyError);
      return NextResponse.json({ error: 'Error creating API key' }, { status: 500 });
    }

    // Return the full API key (only shown once!)
    return NextResponse.json({
      apiKey, // Full key - save this, it won't be shown again!
      keyId: keyData.id,
      name: keyData.name,
      rateLimit: rateLimitPerHour,
      createdAt: keyData.created_at,
      warning: 'Save this API key securely. You will not be able to see it again!',
    });
  } catch (error) {
    console.error('Error in POST /api/keys/generate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
