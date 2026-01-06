import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * Public API v1 - Snippets Endpoint
 *
 * Requires API key authentication
 * Rate limited based on user's plan
 *
 * Usage:
 * GET /api/v1/snippets?api_key=sf_xxxxx&language=javascript&limit=10
 */

interface ApiKeyData {
  id: string;
  user_id: string;
  rate_limit_per_hour: number;
  is_active: boolean;
  last_used_at: string | null;
}

/**
 * Verify API key and check rate limit
 */
async function verifyApiKey(apiKey: string): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
  errorResponse?: NextResponse;
}> {
  if (!apiKey || !apiKey.startsWith('sf_')) {
    return {
      valid: false,
      error: 'Invalid API key format',
      errorResponse: NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      ),
    };
  }

  // Hash the API key to match database
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Look up API key
  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (keyError || !keyData) {
    return {
      valid: false,
      error: 'Invalid or inactive API key',
      errorResponse: NextResponse.json(
        { error: 'Invalid or inactive API key' },
        { status: 401 }
      ),
    };
  }

  const typedKeyData = keyData as unknown as ApiKeyData;

  // Check rate limit
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const { data: recentCalls, error: callError } = await supabase
    .from('usage_tracking')
    .select('id')
    .eq('user_id', typedKeyData.user_id)
    .eq('feature', 'api')
    .gte('created_at', oneHourAgo.toISOString());

  if (callError) {
    console.error('Error checking rate limit:', callError);
  }

  const callCount = recentCalls?.length || 0;

  if (callCount >= typedKeyData.rate_limit_per_hour) {
    return {
      valid: false,
      userId: typedKeyData.user_id,
      error: 'Rate limit exceeded',
      errorResponse: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: typedKeyData.rate_limit_per_hour,
          resetsIn: '1 hour',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': typedKeyData.rate_limit_per_hour.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString(),
          },
        }
      ),
    };
  }

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', typedKeyData.id);

  return {
    valid: true,
    userId: typedKeyData.user_id,
  };
}

// GET: List snippets with filtering
export async function GET(request: NextRequest) {
  try {
    // Get API key from header or query param
    const apiKey =
      request.headers.get('x-api-key') ||
      request.nextUrl.searchParams.get('api_key') ||
      '';

    // Verify API key
    const verification = await verifyApiKey(apiKey);
    if (!verification.valid) {
      return verification.errorResponse!;
    }

    const userId = verification.userId!;

    // Get query parameters
    const language = request.nextUrl.searchParams.get('language') || '';
    const tags = request.nextUrl.searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const search = request.nextUrl.searchParams.get('search') || '';
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('snippets')
      .select(`
        id,
        title,
        description,
        code,
        language,
        tags,
        upvote_count,
        view_count,
        created_at,
        updated_at
      `)
      .eq('created_by', userId)
      .eq('is_private', false);

    // Apply filters
    if (language) {
      query = query.eq('language', language);
    }

    if (tags.length > 0) {
      query = query.contains('tags', tags);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,code.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: snippets, error: snippetsError, count } = await query;

    if (snippetsError) {
      console.error('Error fetching snippets:', snippetsError);
      return NextResponse.json({ error: 'Error fetching snippets' }, { status: 500 });
    }

    // Track API usage
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_feature: 'api',
      p_usage_type: 'snippets_list',
      p_quantity: 1,
    });

    return NextResponse.json({
      snippets: snippets || [],
      pagination: {
        limit,
        offset,
        total: count || snippets?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/v1/snippets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new snippet via API
export async function POST(request: NextRequest) {
  try {
    // Get API key
    const apiKey =
      request.headers.get('x-api-key') ||
      request.nextUrl.searchParams.get('api_key') ||
      '';

    // Verify API key
    const verification = await verifyApiKey(apiKey);
    if (!verification.valid) {
      return verification.errorResponse!;
    }

    const userId = verification.userId!;

    const body = await request.json();
    const { title, description, code, language, tags = [], is_private = false } = body;

    // Validate required fields
    if (!title || !code || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: title, code, language' },
        { status: 400 }
      );
    }

    // Create snippet
    const { data: snippet, error: createError } = await supabase
      .from('snippets')
      .insert({
        title,
        description,
        code,
        language,
        tags,
        is_private,
        created_by: userId,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating snippet:', createError);
      return NextResponse.json({ error: 'Error creating snippet' }, { status: 500 });
    }

    // Track API usage
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_feature: 'api',
      p_usage_type: 'snippet_create',
      p_quantity: 1,
    });

    return NextResponse.json({
      message: 'Snippet created successfully',
      snippet,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/v1/snippets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
