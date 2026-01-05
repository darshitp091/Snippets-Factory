import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Advanced search across snippets, communities, and users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // all, snippets, communities, users
    const language = searchParams.get('language');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, recent, popular
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Search query too short (minimum 2 characters)' }, { status: 400 });
    }

    const results: any = {
      snippets: [],
      communities: [],
      users: [],
      total: 0,
    };

    // Search Snippets
    if (type === 'all' || type === 'snippets') {
      let snippetsQuery = supabase
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
          comment_count,
          created_at,
          created_by,
          users:created_by (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('is_private', false);

      // Full-text search on title, description, and code
      snippetsQuery = snippetsQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%`
      );

      // Language filter
      if (language) {
        snippetsQuery = snippetsQuery.eq('language', language);
      }

      // Tags filter
      if (tags && tags.length > 0) {
        snippetsQuery = snippetsQuery.contains('tags', tags);
      }

      // Sorting
      switch (sortBy) {
        case 'recent':
          snippetsQuery = snippetsQuery.order('created_at', { ascending: false });
          break;
        case 'popular':
          snippetsQuery = snippetsQuery.order('upvote_count', { ascending: false });
          break;
        case 'relevance':
        default:
          // For relevance, we order by upvote_count as a proxy
          snippetsQuery = snippetsQuery.order('upvote_count', { ascending: false });
          break;
      }

      snippetsQuery = snippetsQuery.limit(limit);

      const { data: snippetsData, error: snippetsError } = await snippetsQuery;

      if (snippetsError) {
        console.error('Error searching snippets:', snippetsError);
      } else {
        results.snippets = snippetsData || [];
      }
    }

    // Search Communities
    if (type === 'all' || type === 'communities') {
      let communitiesQuery = supabase
        .from('communities')
        .select('*')
        .eq('visibility', 'public');

      // Search in name and description
      communitiesQuery = communitiesQuery.or(
        `name.ilike.%${query}%,description.ilike.%${query}%`
      );

      // Sorting
      switch (sortBy) {
        case 'recent':
          communitiesQuery = communitiesQuery.order('created_at', { ascending: false });
          break;
        case 'popular':
          communitiesQuery = communitiesQuery.order('member_count', { ascending: false });
          break;
        case 'relevance':
        default:
          communitiesQuery = communitiesQuery.order('member_count', { ascending: false });
          break;
      }

      communitiesQuery = communitiesQuery.limit(limit);

      const { data: communitiesData, error: communitiesError } = await communitiesQuery;

      if (communitiesError) {
        console.error('Error searching communities:', communitiesError);
      } else {
        results.communities = communitiesData || [];
      }
    }

    // Search Users
    if (type === 'all' || type === 'users') {
      let usersQuery = supabase
        .from('users')
        .select('id, full_name, email, avatar_url, bio, reputation, reputation_level');

      // Search in full name and email
      usersQuery = usersQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);

      // Sorting
      switch (sortBy) {
        case 'popular':
          usersQuery = usersQuery.order('reputation', { ascending: false });
          break;
        case 'recent':
          usersQuery = usersQuery.order('created_at', { ascending: false });
          break;
        case 'relevance':
        default:
          usersQuery = usersQuery.order('reputation', { ascending: false });
          break;
      }

      usersQuery = usersQuery.limit(limit);

      const { data: usersData, error: usersError } = await usersQuery;

      if (usersError) {
        console.error('Error searching users:', usersError);
      } else {
        results.users = usersData || [];
      }
    }

    // Calculate total results
    results.total =
      results.snippets.length + results.communities.length + results.users.length;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
