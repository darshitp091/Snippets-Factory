import { NextRequest, NextResponse } from 'next/server';
import { SnippetService } from '@/lib/snippetService';
import { rateLimiter } from '@/utils/security';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimiter.checkLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const result = await SnippetService.getSnippet(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /api/snippets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const result = await SnippetService.updateSnippet(params.id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in PUT /api/snippets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimiter.checkLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const result = await SnippetService.deleteSnippet(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Snippet deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/snippets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
