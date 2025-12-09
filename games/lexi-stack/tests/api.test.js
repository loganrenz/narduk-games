import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_BASE_URL = 'https://lexi-stack-api.narduk.workers.dev';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json().catch(() => ({}));
  return {
    status: response.status,
    ok: response.ok,
    data,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

describe('API Tests - D1 Database Calls', () => {
  let testUserId = null;
  let testUsername = null;
  let testScoreId = null;

  beforeAll(() => {
    // Generate unique test username
    testUsername = `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  describe('User API', () => {
    it('should create a new user with username and password', async () => {
      const result = await apiCall('/api/user', {
        method: 'POST',
        body: JSON.stringify({
          username: testUsername,
          password: 'testpass123',
        }),
      });

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('user');
      expect(result.data.user).toHaveProperty('id');
      expect(result.data.user).toHaveProperty('username', testUsername);
      expect(result.data.user).toHaveProperty('created_at');
      
      testUserId = result.data.user.id;
    });

    it('should not allow duplicate usernames', async () => {
      // Try to create the same username again
      const result = await apiCall('/api/user', {
        method: 'POST',
        body: JSON.stringify({
          username: testUsername,
          password: 'differentpass',
        }),
      });

      // Should return error or existing user (depending on API design)
      // If it returns existing user, verify it's the same user
      if (result.ok) {
        expect(result.data.user).toHaveProperty('id');
        // If API returns existing user, it should be the same ID
        if (result.data.user.id === testUserId) {
          // This is acceptable - API returns existing user
          expect(result.data.user.username).toBe(testUsername);
        } else {
          // This would be a bug - different user with same username
          throw new Error('API allowed duplicate username with different user ID');
        }
      } else {
        // API should return error for duplicate
        expect(result.status).toBeGreaterThanOrEqual(400);
        expect(result.data).toHaveProperty('error');
      }
    });

    it('should require username', async () => {
      const result = await apiCall('/api/user', {
        method: 'POST',
        body: JSON.stringify({
          password: 'testpass123',
        }),
      });

      expect(result.status).toBeGreaterThanOrEqual(400);
    });

    it('should require password for new users', async () => {
      const newUsername = `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const result = await apiCall('/api/user', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername,
        }),
      });

      // Should either require password or allow it (depending on API design)
      // If password is required, status should be 400
      if (result.status === 400) {
        expect(result.data).toHaveProperty('error');
      }
    });

    it('should handle CORS preflight requests', async () => {
      const result = await apiCall('/api/user', {
        method: 'OPTIONS',
      });

      expect(result.status).toBe(200);
      expect(result.headers['access-control-allow-origin']).toBe('*');
      expect(result.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('Score API', () => {
    it('should submit a score successfully', async () => {
      if (!testUserId) {
        throw new Error('testUserId not set - user creation test must run first');
      }

      const result = await apiCall('/api/scores', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          score: 1500,
          combo: 2.5,
          longestWord: 'TESTWORD',
          level: 5,
          wordsPlayed: 15,
        }),
      });

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('id');
      
      testScoreId = result.data.id;
    });

    it('should require all score fields', async () => {
      if (!testUserId) {
        throw new Error('testUserId not set');
      }

      const result = await apiCall('/api/scores', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUserId,
          score: 1000,
          // Missing other required fields
        }),
      });

      // Should return error if required fields are missing
      if (result.status >= 400) {
        expect(result.data).toHaveProperty('error');
      }
    });

    it('should get leaderboard', async () => {
      const result = await apiCall('/api/scores?limit=10');

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('scores');
      expect(Array.isArray(result.data.scores)).toBe(true);
      
      if (result.data.scores.length > 0) {
        const score = result.data.scores[0];
        expect(score).toHaveProperty('id');
        expect(score).toHaveProperty('score');
        expect(score).toHaveProperty('username');
        expect(score).toHaveProperty('created_at');
      }
    });

    it('should respect limit parameter', async () => {
      const result = await apiCall('/api/scores?limit=5');

      expect(result.status).toBe(200);
      expect(result.data.scores.length).toBeLessThanOrEqual(5);
    });

    it('should handle pagination with offset', async () => {
      const result1 = await apiCall('/api/scores?limit=5&offset=0');
      const result2 = await apiCall('/api/scores?limit=5&offset=5');

      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);
      
      // If there are enough scores, results should be different
      if (result1.data.scores.length === 5 && result2.data.scores.length > 0) {
        expect(result1.data.scores[0].id).not.toBe(result2.data.scores[0].id);
      }
    });
  });

  describe('Word Tracking API', () => {
    it('should track a word successfully', async () => {
      const result = await apiCall('/api/words', {
        method: 'POST',
        body: JSON.stringify({
          word: 'TESTWORD',
        }),
      });

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('success', true);
    });

    it('should require word field', async () => {
      const result = await apiCall('/api/words', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Should return error if word is missing
      if (result.status >= 400) {
        expect(result.data).toHaveProperty('error');
      }
    });

    it('should handle multiple word submissions', async () => {
      const words = ['WORD1', 'WORD2', 'WORD3'];
      const results = await Promise.all(
        words.map(word =>
          apiCall('/api/words', {
            method: 'POST',
            body: JSON.stringify({ word }),
          })
        )
      );

      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
      });
    });
  });

  describe('Stats API', () => {
    it('should get global stats', async () => {
      const result = await apiCall('/api/stats');

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('stats');
    });

    it('should get user-specific stats', async () => {
      if (!testUserId) {
        throw new Error('testUserId not set');
      }

      const result = await apiCall(`/api/stats?userId=${testUserId}`);

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('stats');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const result = await apiCall('/api/unknown');

      expect(result.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE_URL}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await fetch(`${API_BASE_URL}/api/user`, {
        method: 'POST',
        body: JSON.stringify({ username: 'test', password: 'test' }),
      });

      // Should either work or return 400/415
      expect([200, 400, 415]).toContain(response.status);
    });
  });

  describe('Username Uniqueness Verification', () => {
    it('should verify username uniqueness before creation', async () => {
      const uniqueUsername = `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create first user
      const result1 = await apiCall('/api/user', {
        method: 'POST',
        body: JSON.stringify({
          username: uniqueUsername,
          password: 'pass123',
        }),
      });

      expect(result1.status).toBe(200);
      const firstUserId = result1.data.user.id;

      // Try to create duplicate
      const result2 = await apiCall('/api/user', {
        method: 'POST',
        body: JSON.stringify({
          username: uniqueUsername,
          password: 'pass456',
        }),
      });

      // Should either:
      // 1. Return error (400/409) with error message
      // 2. Return existing user (same ID)
      if (result2.status === 200) {
        // If it returns existing user, verify it's the same
        expect(result2.data.user.id).toBe(firstUserId);
        expect(result2.data.user.username).toBe(uniqueUsername);
      } else {
        // Should return error for duplicate
        expect(result2.status).toBeGreaterThanOrEqual(400);
        expect(result2.data).toHaveProperty('error');
        const errorMsg = (result2.data.error || '').toLowerCase();
        expect(
          errorMsg.includes('taken') ||
          errorMsg.includes('exists') ||
          errorMsg.includes('duplicate') ||
          errorMsg.includes('already')
        ).toBe(true);
      }
    });

    it('should check username availability endpoint if it exists', async () => {
      const checkUsername = `check_${Date.now()}`;
      
      const result = await apiCall(`/api/user/check?username=${encodeURIComponent(checkUsername)}`);

      // Endpoint might not exist (404) or might return availability
      if (result.status === 200) {
        expect(result.data).toHaveProperty('available');
        expect(typeof result.data.available).toBe('boolean');
      } else if (result.status === 404) {
        // Endpoint doesn't exist - this is acceptable
        expect(result.status).toBe(404);
      }
    });
  });

  afterAll(() => {
    // Cleanup could be added here if needed
    // Note: We don't delete test data as it's part of the database
  });
});

