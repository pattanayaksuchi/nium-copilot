import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'http://127.0.0.1:8000'
  : 'http://localhost:8000';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = request.headers.get('X-Client-Id');
    if (!clientId) {
      return NextResponse.json({ detail: 'X-Client-Id header is required' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/conversations/${params.id}`, {
      headers: {
        'X-Client-Id': clientId,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ detail: error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ detail: 'Internal proxy error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = request.headers.get('X-Client-Id');
    if (!clientId) {
      return NextResponse.json({ detail: 'X-Client-Id header is required' }, { status: 400 });
    }

    const body = await request.text();
    const response = await fetch(`${BACKEND_URL}/conversations/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId,
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ detail: error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ detail: 'Internal proxy error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = request.headers.get('X-Client-Id');
    if (!clientId) {
      return NextResponse.json({ detail: 'X-Client-Id header is required' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/conversations/${params.id}`, {
      method: 'DELETE',
      headers: {
        'X-Client-Id': clientId,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ detail: error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ detail: 'Internal proxy error' }, { status: 500 });
  }
}