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
      // Routes
      if (path === '/api/scores' && method === 'POST') {
        return handleSubmitScore(request, env.DB, corsHeaders);
      }
      if (path === '/api/scores' && method === 'GET') {
        return handleGetLeaderboard(request, env.DB, corsHeaders);
      }
      if (path === '/api/user' && method === 'POST') {
        return handleCreateUser(request, env.DB, corsHeaders);
      }
      if (path === '/api/user' && method === 'GET') {
        return handleGetUser(request, env.DB, corsHeaders);
      }
      if (path === '/api/user/check' && method === 'GET') {
        return handleCheckUsername(request, env.DB, corsHeaders);
      }
      if (path === '/api/user' && method === 'PATCH') {
        return handleUpdateUser(request, env.DB, corsHeaders);
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
async function handleSubmitScore(request, db, corsHeaders) {
  const data = await request.json();
  const { userId, score, combo, longestWord, level, wordsPlayed } = data;

  if (!userId || score === undefined) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
async function handleGetLeaderboard(request, db, corsHeaders) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const results = await db.prepare(
    `SELECT s.*, u.username 
     FROM scores s
     JOIN users u ON s.user_id = u.id
     ORDER BY s.score DESC
     LIMIT ? OFFSET ?`
  ).bind(limit, offset).all();

  return new Response(
    JSON.stringify({ scores: results.results || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Check username availability
async function handleCheckUsername(request, db, corsHeaders) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');

  if (!username) {
    return new Response(
      JSON.stringify({ error: 'Username parameter required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

    const user = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE username = ?').bind(username).first();
  
  return new Response(
    JSON.stringify({ available: !user, exists: !!user, taken: !!user }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get user by username or ID
async function handleGetUser(request, db, corsHeaders) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  const userId = url.searchParams.get('userId');

  if (!username && !userId) {
    return new Response(
      JSON.stringify({ error: 'Username or userId parameter required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let user;
  if (username) {
    user = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE username = ?').bind(username).first();
  } else {
    user = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE id = ?').bind(userId).first();
  }

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ user }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Create or get user
async function handleCreateUser(request, db, corsHeaders) {
  const data = await request.json();
  const { username, password, userId } = data;

  if (!username) {
    return new Response(
      JSON.stringify({ error: 'Username required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // If userId provided, check if exists (updating existing user)
  if (userId) {
    const existing = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (existing) {
      // Update username if different
      if (existing.username !== username) {
        // Check if new username is taken
        const usernameTaken = await db.prepare('SELECT * FROM users WHERE username = ? AND id != ?').bind(username, userId).first();
        if (usernameTaken) {
          return new Response(
            JSON.stringify({ error: 'Username already taken' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Update username
        await db.prepare('UPDATE users SET username = ? WHERE id = ?').bind(username, userId).run();
        const updated = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE id = ?').bind(userId).first();
        return new Response(
          JSON.stringify({ user: updated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ user: { id: existing.id, username: existing.username, displayname: existing.displayname || existing.username, created_at: existing.created_at } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Check if username already exists (for new users)
  const existingUser = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE username = ?').bind(username).first();
  if (existingUser) {
    return new Response(
      JSON.stringify({ error: 'Username already taken', user: existingUser }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create new user
  const id = userId || crypto.randomUUID();
  try {
    // Hash password if provided (using a simple hash for now - should use bcrypt in production)
    let passwordHash = null;
    if (password) {
      // Simple hash - in production, use proper password hashing (bcrypt, argon2, etc.)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    await db.prepare(
      `INSERT INTO users (id, username, displayname, password_hash, created_at)
       VALUES (?, ?, ?, ?, unixepoch())`
    ).bind(id, username, username, passwordHash).run();

    const user = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE id = ?').bind(id).first();
    // Ensure displayname is set
    if (!user.displayname) {
      await db.prepare('UPDATE users SET displayname = ? WHERE id = ?').bind(username, id).run();
      user.displayname = username;
    }
    return new Response(
      JSON.stringify({ user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Fallback: Username might already exist (race condition)
    if (error.message.includes('UNIQUE')) {
      const user = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE username = ?').bind(username).first();
      if (user) {
        return new Response(
          JSON.stringify({ error: 'Username already taken', user }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    throw error;
  }
}

// Update user (displayname, password)
async function handleUpdateUser(request, db, corsHeaders) {
  const data = await request.json();
  const { userId, displayname, password, currentPassword } = data;

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'UserId required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // If updating password, verify current password
  if (password) {
    if (!currentPassword) {
      return new Response(
        JSON.stringify({ error: 'Current password required to change password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify current password
    const encoder = new TextEncoder();
    const data = encoder.encode(currentPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const currentPasswordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (user.password_hash && user.password_hash !== currentPasswordHash) {
      return new Response(
        JSON.stringify({ error: 'Current password is incorrect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash new password
    const newData = encoder.encode(password);
    const newHashBuffer = await crypto.subtle.digest('SHA-256', newData);
    const newHashArray = Array.from(new Uint8Array(newHashBuffer));
    const newPasswordHash = newHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newPasswordHash, userId).run();
  }

  // Update displayname if provided
  if (displayname !== undefined) {
    await db.prepare('UPDATE users SET displayname = ? WHERE id = ?').bind(displayname || user.username, userId).run();
  }

  // Return updated user (without password_hash)
  const updated = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE id = ?').bind(userId).first();
  return new Response(
    JSON.stringify({ user: updated }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

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

