// 2048 Clone Game Data API
// Handles game-specific data (scores, stats, etc.)
// User authentication is handled by the unified auth API

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Submit score
      if (path === '/api/scores' && method === 'POST') {
        return handleSubmitScore(request, env.DB, env.AUTH_API_URL, corsHeaders);
      }
      
      // Get leaderboard
      if (path === '/api/scores' && method === 'GET') {
        return handleGetLeaderboard(request, env.DB, corsHeaders);
      }

      // Get user stats
      if (path === '/api/stats' && method === 'GET') {
        return handleGetStats(request, env.DB, env.AUTH_API_URL, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};

async function handleSubmitScore(request, db, authApiUrl, corsHeaders) {
  try {
    const body = await request.json();
    const { score, maxTile, moves, time } = body;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user with auth API
    const authResponse = await fetch(`${authApiUrl}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!authResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = await authResponse.json();
    const userId = user.id;

    // Insert score
    const id = crypto.randomUUID();
    const createdAt = Date.now();

    await db.prepare(
      `INSERT INTO scores (id, user_id, score, max_tile, moves, time, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, userId, score, maxTile || 0, moves || 0, time || 0, createdAt).run();

    return new Response(
      JSON.stringify({ success: true, id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Submit score error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetLeaderboard(request, db, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    const result = await db.prepare(
      `SELECT s.score, s.max_tile, s.moves, s.time, s.created_at, u.username, u.displayname
       FROM scores s
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.score DESC
       LIMIT ?`
    ).bind(limit).all();

    return new Response(
      JSON.stringify({ leaderboard: result.results || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetStats(request, db, authApiUrl, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user with auth API
    const authResponse = await fetch(`${authApiUrl}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!authResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = await authResponse.json();
    const userId = user.id;

    // Get user stats
    const statsResult = await db.prepare(
      `SELECT 
        COUNT(*) as games_played,
        MAX(score) as best_score,
        MAX(max_tile) as best_tile,
        AVG(score) as avg_score
       FROM scores
       WHERE user_id = ?`
    ).bind(userId).first();

    return new Response(
      JSON.stringify({ stats: statsResult || {} }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get stats error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

