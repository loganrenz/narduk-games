// Lexi-Stack Game Data API
// Handles only game-specific data (scores, leaderboards, stats, words)
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
      // Game data routes only (auth routes removed - use unified auth API)
      if (path === '/api/scores' && method === 'POST') {
        return handleSubmitScore(request, env.DB, env.AUTH_API_URL, corsHeaders);
      }
      if (path === '/api/scores' && method === 'GET') {
        return handleGetLeaderboard(request, env.DB, env.AUTH_API_URL, corsHeaders);
      }
      if (path === '/api/words' && method === 'POST') {
        return handleTrackWord(request, env.DB, corsHeaders);
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
  const { userId, score, combo, longestWord, level, wordsPlayed } = data;

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
      // Continue anyway - don't block score submission if auth API is down
    }
  }

  const id = crypto.randomUUID();
  const result = await db.prepare(
    `INSERT INTO scores (id, user_id, score, combo, longest_word, level, words_played, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`
  ).bind(id, userId, score, combo || 1.0, longestWord || '', level || 1, wordsPlayed || 0).run();

  return new Response(
    JSON.stringify({ success: true, id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get leaderboard
async function handleGetLeaderboard(request, db, authApiUrl, corsHeaders) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  // Get scores from game database
  const results = await db.prepare(
    `SELECT * 
     FROM scores
     ORDER BY score DESC
     LIMIT ? OFFSET ?`
  ).bind(limit, offset).all();

  const scores = results.results || [];

  // Fetch usernames from auth API
  if (authApiUrl && scores.length > 0) {
    const userIds = [...new Set(scores.map(s => s.user_id))];
    const userMap = new Map();

    // Fetch usernames in parallel
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const authResponse = await fetch(`${authApiUrl}/api/auth/user?userId=${userId}`);
          if (authResponse.ok) {
            const authData = await authResponse.json();
            userMap.set(userId, authData.user?.username || 'Unknown');
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          userMap.set(userId, 'Unknown');
        }
      })
    );

    // Add usernames to scores
    scores.forEach(score => {
      score.username = userMap.get(score.user_id) || 'Unknown';
    });
  }

  return new Response(
    JSON.stringify({ scores }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Auth endpoints removed - use unified auth API at /api/auth/*

// Track word usage
async function handleTrackWord(request, db, corsHeaders) {
  const data = await request.json();
  const { word } = data;

  if (!word) {
    return new Response(
      JSON.stringify({ error: 'Word required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const upperWord = word.toUpperCase();
  
  // Try to update existing word
  const updateResult = await db.prepare(
    `UPDATE words 
     SET times_used = times_used + 1, last_used_at = unixepoch()
     WHERE word = ?`
  ).bind(upperWord).run();

  // If no rows updated, insert new word
  if (updateResult.meta.changes === 0) {
    await db.prepare(
      `INSERT INTO words (word, times_used, last_used_at)
       VALUES (?, 1, unixepoch())`
    ).bind(upperWord).run();
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get stats
async function handleGetStats(request, db, corsHeaders) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  let stats = {};

  if (userId) {
    // User-specific stats
    const userScores = await db.prepare(
      `SELECT COUNT(*) as total_games, 
              MAX(score) as best_score,
              AVG(score) as avg_score,
              MAX(combo) as best_combo,
              MAX(longest_word) as longest_word
       FROM scores
       WHERE user_id = ?`
    ).bind(userId).first();

    stats = {
      totalGames: userScores?.total_games || 0,
      bestScore: userScores?.best_score || 0,
      avgScore: Math.round(userScores?.avg_score || 0),
      bestCombo: userScores?.best_combo || 0,
      longestWord: userScores?.longest_word || '',
    };
  } else {
    // Global stats
    const globalStats = await db.prepare(
      `SELECT COUNT(*) as total_games,
              COUNT(DISTINCT user_id) as total_players,
              MAX(score) as best_score,
              AVG(score) as avg_score
       FROM scores`
    ).first();

    stats = {
      totalGames: globalStats?.total_games || 0,
      totalPlayers: globalStats?.total_players || 0,
      bestScore: globalStats?.best_score || 0,
      avgScore: Math.round(globalStats?.avg_score || 0),
    };
  }

  return new Response(
    JSON.stringify({ stats }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

