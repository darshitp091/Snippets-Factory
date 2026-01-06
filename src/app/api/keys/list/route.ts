import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { verifyFeatureAccess } from '@/lib/middleware/planVerification';

// GET: List user's API keys
export async function GET(request: NextRequest) {
  try {
    // Verify user has API access feature
    const verification = await verifyFeatureAccess('api_access');
    if (!verification.authorized) {
      return verification.errorResponse!;
    }

    const userId = verification.userId!;
    const supabase = createServerSupabaseClient();

    // Fetch API keys (without revealing the actual keys)
    const { data: keys, error: keysError } = await supabase
      .from('api_keys')
      .select('id, name, rate_limit_per_hour, is_active, last_used_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (keysError) {
      console.error('Error fetching API keys:', keysError);
      return NextResponse.json({ error: 'Error fetching API keys' }, { status: 500 });
    }

    // Get usage stats for each key
    const keysWithStats = await Promise.all(
      (keys || []).map(async (key) => {
        // Get usage in last hour
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const { data: recentUsage } = await supabase
          .from('usage_tracking')
          .select('id')
          .eq('user_id', userId)
          .eq('feature', 'api')
          .gte('created_at', oneHourAgo.toISOString());

        return {
          ...key,
          usageThisHour: recentUsage?.length || 0,
          remaining: key.rate_limit_per_hour - (recentUsage?.length || 0),
        };
      })
    );

    return NextResponse.json({
      keys: keysWithStats,
    });
  } catch (error) {
    console.error('Error in GET /api/keys/list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    // Verify user has API access feature
    const verification = await verifyFeatureAccess('api_access');
    if (!verification.authorized) {
      return verification.errorResponse!;
    }

    const userId = verification.userId!;
    const supabase = createServerSupabaseClient();

    const searchParams = request.nextUrl.searchParams;
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    // Deactivate the key
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', userId); // Ensure user owns the key

    if (updateError) {
      console.error('Error revoking API key:', updateError);
      return NextResponse.json({ error: 'Error revoking API key' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/keys/list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
