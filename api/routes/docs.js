import { corsHeaders } from '../utils/response.js';
export async function handleDocs(request, env) {
  return new Response(JSON.stringify({
    name: 'profile-views',
    version: '1.0.0',
    endpoints: {
      badge: '/badge?user=USERNAME',
      stats: '/stats?user=USERNAME&days=7',
      views: '/api/v1/views?user=USERNAME',
      health: '/health'
    }
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
