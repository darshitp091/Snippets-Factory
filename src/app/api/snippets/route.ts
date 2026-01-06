import { NextRequest, NextResponse } from 'next/server';
import { SnippetService } from '@/lib/snippetService';
import { rateLimiter, containsSQLInjection } from '@/utils/security';
import { verifySnippetLimit, trackUsage } from '@/lib/middleware/planVerification';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimiter.checkLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('team_id');
    const query = searchParams.get('query') || '';
    const language = searchParams.get('language') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // SQL injection check
    if (containsSQLInjection(query)) {
      return NextResponse.json(
        { error: 'Invalid search query' },
        { status: 400 }
      );
    }

    const result = await SnippetService.searchSnippets(
      teamId,
      { query, language, category },
      { page, limit }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /api/snippets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimiter.checkLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.code || !body.team_id || !body.created_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // SQL injection check on title and code
    if (containsSQLInjection(body.title) || containsSQLInjection(body.code)) {
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      );
    }

    // SERVER-SIDE SNIPPET LIMIT VERIFICATION
    const limitCheck = await verifySnippetLimit(body.created_by);
    if (!limitCheck.authorized && limitCheck.errorResponse) {
      return limitCheck.errorResponse;
    }

    const result = await SnippetService.createSnippet(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Track snippet creation
    await trackUsage(body.created_by, 'snippets', 'create');

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/snippets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
