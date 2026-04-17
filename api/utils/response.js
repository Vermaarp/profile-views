export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
export function errorResponse(status, message) {
  return new Response(JSON.stringify({ error: message, status }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
