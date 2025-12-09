// Unified Authentication API for all Narduk Games
// Handles user creation, authentication, and profile management

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Auth routes
      if (path === '/api/auth/user' && method === 'POST') {
        return handleCreateUser(request, env.AUTH_DB, corsHeaders);
      }
      if (path === '/api/auth/user' && method === 'GET') {
        return handleGetUser(request, env.AUTH_DB, corsHeaders);
      }
      if (path === '/api/auth/user' && method === 'PATCH') {
        return handleUpdateUser(request, env.AUTH_DB, corsHeaders);
      }
      if (path === '/api/auth/check-username' && method === 'GET') {
        return handleCheckUsername(request, env.AUTH_DB, corsHeaders);
      }
      if (path === '/api/auth/login' && method === 'POST') {
        return handleLogin(request, env.AUTH_DB, corsHeaders);
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
        await db.prepare('UPDATE users SET username = ?, updated_at = unixepoch() WHERE id = ?').bind(username, userId).run();
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
    // Hash password if provided
    let passwordHash = null;
    if (password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    await db.prepare(
      `INSERT INTO users (id, username, displayname, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, unixepoch(), unixepoch())`
    ).bind(id, username, username, passwordHash).run();

    const user = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE id = ?').bind(id).first();
    // Ensure displayname is set
    if (!user.displayname) {
      await db.prepare('UPDATE users SET displayname = ?, updated_at = unixepoch() WHERE id = ?').bind(username, id).run();
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

// Login user (verify password)
async function handleLogin(request, db, corsHeaders) {
  const data = await request.json();
  const { username, password } = data;

  if (!username || !password) {
    return new Response(
      JSON.stringify({ error: 'Username and password required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid username or password' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify password
  if (user.password_hash) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (user.password_hash !== passwordHash) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } else {
    // User doesn't have a password set
    return new Response(
      JSON.stringify({ error: 'Password not set for this account' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Return user (without password_hash)
  return new Response(
    JSON.stringify({ 
      user: { 
        id: user.id, 
        username: user.username, 
        displayname: user.displayname || user.username, 
        created_at: user.created_at 
      } 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
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

    await db.prepare('UPDATE users SET password_hash = ?, updated_at = unixepoch() WHERE id = ?').bind(newPasswordHash, userId).run();
  }

  // Update displayname if provided
  if (displayname !== undefined) {
    await db.prepare('UPDATE users SET displayname = ?, updated_at = unixepoch() WHERE id = ?').bind(displayname || user.username, userId).run();
  }

  // Return updated user (without password_hash)
  const updated = await db.prepare('SELECT id, username, displayname, created_at FROM users WHERE id = ?').bind(userId).first();
  return new Response(
    JSON.stringify({ user: updated }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

