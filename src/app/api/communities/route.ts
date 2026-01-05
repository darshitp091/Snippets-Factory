import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all public communities or user's communities
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all'; // all, my, public
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'members'; // members, recent, snippets
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get current user (optional for public communities)
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader) {
      const {
        data: { user },
      } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    let query = supabase.from('communities').select('*');

    // Apply filters
    if (filter === 'my' && userId) {
      // Get communities where user is a member or owner
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);

      const communityIds = memberships?.map((m) => m.community_id) || [];
      query = query.in('id', communityIds);
    } else if (filter === 'public') {
      query = query.eq('visibility', 'public');
    } else {
      // All public communities
      query = query.eq('visibility', 'public');
    }

    // Search
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Sorting
    switch (sortBy) {
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'snippets':
        query = query.order('snippet_count', { ascending: false });
        break;
      case 'members':
      default:
        query = query.order('member_count', { ascending: false });
        break;
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching communities:', error);
      return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
    }

    return NextResponse.json({ communities: data || [] });
  } catch (error) {
    console.error('Error in GET /api/communities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new community
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, category, visibility, avatar_url, banner_url, user_id } = body;

    // Validation
    if (!name || !slug || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, and user_id' },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens, underscores)
    if (!/^[a-z0-9_-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use lowercase letters, numbers, hyphens, and underscores only.' },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const { data: existingCommunity } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCommunity) {
      return NextResponse.json({ error: 'This community slug is already taken' }, { status: 409 });
    }

    // Create community
    const { data: community, error: insertError } = await supabase
      .from('communities')
      .insert([
        {
          name,
          slug,
          description: description || null,
          category: category || null,
          visibility: visibility || 'public',
          avatar_url: avatar_url || null,
          banner_url: banner_url || null,
          owner_id: user_id,
          is_verified: false,
          verification_tier: 'none',
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating community:', insertError);
      return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Community created successfully',
        community,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/communities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
