export interface User {
  id: string
  email: string
  displayName?: string
  token?: string
}

export interface GameState {
  seedWord: string
  chain: string[]
  currentWord: string
  score: number
  lives: number
  gameMode: GameMode
  status: GameStatus
}

export type GameMode = 'endless' | 'timed' | 'zen' | 'hotseat' | 'async'

export type GameStatus = 'waiting' | 'playing' | 'paused' | 'ended'

export interface AsyncGame {
  id: string
  player1Id: string
  player2Id?: string
  seedWord: string
  chain: string[]
  currentTurn: string
  status: 'pending' | 'active' | 'completed'
  createdAt: number
  updatedAt: number
}

export interface Invite {
  id: string
  gameId: string
  inviterId: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: number
}

export interface Score {
  id?: number
  userId?: string
  gameMode: string
  score: number
  chainLength: number
  longestWord?: string
  createdAt: number
}

export interface TurnData {
  word: string
  insertedLetter: string
  insertPosition: number
  score: number
}
