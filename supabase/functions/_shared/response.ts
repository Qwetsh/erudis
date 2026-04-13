import { corsHeaders } from './cors.ts';

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

export function errorResponse(code: string, message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ success: false, error: { code, message } }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}
