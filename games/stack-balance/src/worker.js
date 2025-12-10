// Stack & Balance Game Data API
// Handles game-specific data (scores, stats, high scores)
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
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Game data routes
      if (path === '/api/scores' && method === 'POST') {
        return handleSubmitScore(request, env.DB, env.AUTH_API_URL, corsHeaders);
      }
      if (path === '/api/scores' && method === 'GET') {
        return handleGetLeaderboard(request, env.DB, corsHeaders);
      }
      if (path === '/api/stats' && method === 'GET') {
        return handleGetStats(request, env.DB, corsHeaders);
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

// Submit a score
async function handleSubmitScore(request, db, authApiUrl, corsHeaders) {
  const data = await request.json();
  const { userId, score, height, combo, blocksPlaced } = data;

  if (!userId || score === undefined) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate user exists in auth database
  if (authApiUrl) {
    try {
      const authResponse = await fetch(`${authApiUrl}/api/auth/user?userId=${userId}`);
      if (!authResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Invalid user' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error validating user:', error);
    }
  }

  const id = crypto.randomUUID();
  const result = await db.prepare(
    `INSERT INTO scores (id, user_id, score, height, combo, blocks_placed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, unixepoch())`
  ).bind(id, userId, score, height || 0, combo || 1.0, blocksPlaced || 0).run();

  return new Response(
    JSON.stringify({ success: true, id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get leaderboard
async function handleGetLeaderboard(request, db, corsHeaders) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const results = await db.prepare(
    `SELECT * 
     FROM scores
     ORDER BY score DESC
     LIMIT ? OFFSET ?`
  ).bind(limit, offset).all();

  return new Response(
    JSON.stringify({ scores: results.results || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get user statistics
async function handleGetStats(request, db, corsHeaders) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing userId parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const result = await db.prepare(
    `SELECT * FROM stats WHERE user_id = ?`
  ).bind(userId).first();

  if (!result) {
    return new Response(
      JSON.stringify({ 
        best_height: 0,
        best_score: 0,
        total_games: 0,
        best_combo: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

