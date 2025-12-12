// Traffic Bench API (placeholder)
// This game is primarily a static benchmark viewer.

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // No API routes yet.
    return new Response(`Not Found: ${url.pathname}`,
      { status: 404, headers: corsHeaders }
    );
  },
};
