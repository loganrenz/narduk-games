// TapWeave Cloudflare Worker API
// Handles authentication, invites, and async multiplayer
/// <reference path="./worker-types.d.ts" />

interface Env {
  DB: D1Database
  JWT_SECRET: string
  AUTH_API_URL: string
}

interface User {
  id: string
  email: string
  password_hash: string
  display_name: string
  created_at: number
  last_login: number | null
}

interface Game {
  id: string
  player1_id: string
  player2_id: string | null
  seed_word: string
  chain: string
  current_turn: string
  status: string
  created_at: number
  updated_at: number
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // Auth routes
      if (path === '/api/auth/register' && method === 'POST') {
        return handleRegister(request, env.DB, corsHeaders)
      }
      if (path === '/api/auth/login' && method === 'POST') {
        return handleLogin(request, env.DB, corsHeaders)
      }

      // Scores routes
      if (path === '/api/scores' && method === 'POST') {
        return handleSubmitScore(request, env.DB, corsHeaders)
      }
      if (path === '/api/scores' && method === 'GET') {
        return handleGetScores(request, env.DB, corsHeaders)
      }

      // Invite routes
      if (path === '/api/invite/create' && method === 'POST') {
        return handleCreateInvite(request, env.DB, corsHeaders)
      }
      if (path.startsWith('/api/invite/') && method === 'GET') {
        const inviteId = path.split('/').pop()
        return handleGetInvite(inviteId!, env.DB, corsHeaders)
      }

      // Game routes
      if (path === '/api/game/update' && method === 'POST') {
        return handleUpdateGame(request, env.DB, corsHeaders)
      }
      if (path.startsWith('/api/game/') && method === 'GET') {
        const gameId = path.split('/').pop()
        return handleGetGame(gameId!, env.DB, corsHeaders)
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders })
    } catch (error: any) {
      console.error('Error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  },
}

// Auth handlers
async function handleRegister(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  const { email, password, displayName } = await request.json() as { email: string; password: string; displayName?: string }

  // Simple validation
  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: 'Email and password required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if user exists
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) {
    return new Response(
      JSON.stringify({ error: 'User already exists' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create user
  const userId = crypto.randomUUID()
  const passwordHash = await hashPassword(password) // In production, use proper hashing
  
  await db.prepare(
    'INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)'
  ).bind(userId, email, passwordHash, displayName || email.split('@')[0]).run()

  // Generate token (simplified - use proper JWT in production)
  const token = btoa(userId + ':' + Date.now())

  return new Response(
    JSON.stringify({
      user: { id: userId, email, displayName: displayName || email.split('@')[0] },
      token
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleLogin(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  const { email, password } = await request.json() as { email: string; password: string }

  const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as User | null
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid credentials' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // In production, verify password hash properly
  const passwordHash = await hashPassword(password)
  if (user.password_hash !== passwordHash) {
    return new Response(
      JSON.stringify({ error: 'Invalid credentials' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Generate token
  const token = btoa(user.id + ':' + Date.now())

  await db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
    .bind(Math.floor(Date.now() / 1000), user.id).run()

  return new Response(
    JSON.stringify({
      user: { id: user.id, email: user.email, displayName: user.display_name },
      token
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Score handlers
async function handleSubmitScore(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  const { userId, gameMode, score, chainLength, longestWord } = await request.json() as {
    userId?: string
    gameMode: string
    score: number
    chainLength: number
    longestWord?: string
  }

  await db.prepare(
    'INSERT INTO scores (user_id, game_mode, score, chain_length, longest_word) VALUES (?, ?, ?, ?, ?)'
  ).bind(userId || null, gameMode, score, chainLength, longestWord || null).run()

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetScores(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  const url = new URL(request.url)
  const gameMode = url.searchParams.get('mode') || 'endless'
  const limit = parseInt(url.searchParams.get('limit') || '10')

  const scores = await db.prepare(
    'SELECT s.*, u.display_name, u.email FROM scores s LEFT JOIN users u ON s.user_id = u.id WHERE s.game_mode = ? ORDER BY s.score DESC LIMIT ?'
  ).bind(gameMode, limit).all()

  return new Response(
    JSON.stringify({ scores: scores.results }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Invite handlers
async function handleCreateInvite(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  const { inviterId, inviteeEmail, seedWord } = await request.json() as {
    inviterId: string
    inviteeEmail: string
    seedWord: string
  }

  const gameId = crypto.randomUUID()
  const inviteId = crypto.randomUUID()

  // Create game
  await db.prepare(
    'INSERT INTO games (id, player1_id, seed_word, chain, current_turn, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(gameId, inviterId, seedWord, JSON.stringify([]), inviterId, 'pending').run()

  // Create invite
  await db.prepare(
    'INSERT INTO invites (id, game_id, inviter_id, invitee_email, status) VALUES (?, ?, ?, ?, ?)'
  ).bind(inviteId, gameId, inviterId, inviteeEmail, 'pending').run()

  return new Response(
    JSON.stringify({
      inviteId,
      gameId,
      inviteLink: `https://tapweave.narduk.games/invite/${inviteId}`
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetInvite(inviteId: string, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  const invite = await db.prepare('SELECT * FROM invites WHERE id = ?').bind(inviteId).first()

  if (!invite) {
    return new Response(
      JSON.stringify({ error: 'Invite not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ invite }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Game handlers
async function handleUpdateGame(request: Request, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  const { gameId, newWord } = await request.json() as {
    gameId: string
    userId: string
    newWord: string
  }

  const game = await db.prepare('SELECT * FROM games WHERE id = ?').bind(gameId).first() as Game | null

  if (!game) {
    return new Response(
      JSON.stringify({ error: 'Game not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update chain
  const chain = JSON.parse(game.chain as string)
  chain.push(newWord)

  // Switch turns
  const nextTurn = game.current_turn === game.player1_id ? game.player2_id : game.player1_id

  await db.prepare(
    'UPDATE games SET chain = ?, current_turn = ?, updated_at = ? WHERE id = ?'
  ).bind(JSON.stringify(chain), nextTurn, Math.floor(Date.now() / 1000), gameId).run()

  return new Response(
    JSON.stringify({ success: true, chain, nextTurn }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetGame(gameId: string, db: D1Database, corsHeaders: Record<string, string>): Promise<Response> {
  const game = await db.prepare('SELECT * FROM games WHERE id = ?').bind(gameId).first()

  if (!game) {
    return new Response(
      JSON.stringify({ error: 'Game not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ game }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper: Simple password hashing (use proper library in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}
