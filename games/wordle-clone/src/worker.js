// Wordle Clone Game Data API
// Handles game-specific data (scores, stats, game history by day)
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
        return handleGetScores(request, env.DB, env.AUTH_API_URL, corsHeaders);
      }
      if (path === '/api/stats' && method === 'GET') {
        return handleGetStats(request, env.DB, corsHeaders);
      }
      if (path === '/api/stats' && method === 'POST') {
        return handleUpdateStats(request, env.DB, env.AUTH_API_URL, corsHeaders);
      }
      if (path === '/api/games' && method === 'GET') {
        return handleGetPlayedGames(request, env.DB, env.AUTH_API_URL, corsHeaders);
      }
      if (path === '/api/daily-word' && method === 'GET') {
        return handleGetDailyWord(request, env.DB, corsHeaders);
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

// Submit a game score
async function handleSubmitScore(request, db, authApiUrl, corsHeaders) {
  const data = await request.json();
  const { userId, attempts, won, targetWord, dayNumber } = data;

  if (!userId || attempts === undefined || !targetWord || dayNumber === undefined) {
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
    `INSERT INTO wordle_scores (id, user_id, attempts, won, target_word, day_number, created_at)
     VALUES (?, ?, ?, ?, ?, ?, unixepoch())`
  ).bind(id, userId, attempts, won ? 1 : 0, targetWord, dayNumber).run();

  return new Response(
    JSON.stringify({ success: true, id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get scores for a user
async function handleGetScores(request, db, authApiUrl, corsHeaders) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const dayNumber = url.searchParams.get('dayNumber');

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing userId parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let query = `SELECT * FROM wordle_scores WHERE user_id = ?`;
  let params = [userId];

  if (dayNumber) {
    query += ` AND day_number = ?`;
    params.push(parseInt(dayNumber, 10));
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const results = await db.prepare(query).bind(...params).all();

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
    `SELECT * FROM wordle_stats WHERE user_id = ?`
  ).bind(userId).first();

  if (!result) {
    return new Response(
      JSON.stringify({ 
        games_played: 0, 
        games_won: 0, 
        current_streak: 0, 
        max_streak: 0,
        last_played: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Update user statistics
async function handleUpdateStats(request, db, authApiUrl, corsHeaders) {
  const data = await request.json();
  const { userId, gamesPlayed, gamesWon, currentStreak, maxStreak, lastPlayed } = data;

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing userId' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Upsert stats
  const result = await db.prepare(
    `INSERT INTO wordle_stats (user_id, games_played, games_won, current_streak, max_streak, last_played, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, unixepoch())
     ON CONFLICT(user_id) DO UPDATE SET
       games_played = ?,
       games_won = ?,
       current_streak = ?,
       max_streak = ?,
       last_played = ?,
       updated_at = unixepoch()`
  ).bind(
    userId, gamesPlayed || 0, gamesWon || 0, currentStreak || 0, maxStreak || 0, lastPlayed || null,
    gamesPlayed || 0, gamesWon || 0, currentStreak || 0, maxStreak || 0, lastPlayed || null
  ).run();

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get played games (completed day numbers) for a user
async function handleGetPlayedGames(request, db, authApiUrl, corsHeaders) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing userId parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const results = await db.prepare(
    `SELECT day_number, attempts, won, created_at 
     FROM wordle_scores 
     WHERE user_id = ?
     ORDER BY day_number DESC`
  ).bind(userId).all();

  // Convert to object format: { dayNumber: { completed: true, attempts, won, date } }
  const playedGames = {};
  for (const row of results.results || []) {
    playedGames[row.day_number] = {
      completed: true,
      attempts: row.attempts,
      won: row.won === 1,
      date: new Date(row.created_at * 1000).toISOString()
    };
  }

  return new Response(
    JSON.stringify({ playedGames }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get daily word for a specific day number
async function handleGetDailyWord(request, db, corsHeaders) {
  const url = new URL(request.url);
  const dayNumber = url.searchParams.get('dayNumber');

  if (!dayNumber) {
    return new Response(
      JSON.stringify({ error: 'Missing dayNumber parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const result = await db.prepare(
    `SELECT word FROM daily_words WHERE day_number = ?`
  ).bind(parseInt(dayNumber, 10)).first();

  if (!result) {
    return new Response(
      JSON.stringify({ error: 'Word not found for this day' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ word: result.word, dayNumber: parseInt(dayNumber, 10) }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

