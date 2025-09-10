import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization header
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${process.env.TRIGGER_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Forward to GitHub's repository_dispatch API
    const gh = await fetch(`https://api.github.com/repos/${process.env.GH_OWNER}/${process.env.GH_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'product-updated',
        client_payload: {
          action: body.action || 'product-updated',
          urls: body.urls || [],
          site: body.site || 'https://www.mydiy.ie',
          changes: body.changes || [],
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!gh.ok) {
      const error = await gh.text();
      console.error('GitHub API error:', error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
    
    console.log('✅ Successfully triggered GitHub Action');
    return NextResponse.json({ ok: true, message: 'GitHub Action triggered' });
    
  } catch (error) {
    console.error('Trigger error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
