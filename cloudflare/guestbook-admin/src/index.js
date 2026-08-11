function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function authorized(request, env) {
  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  const accessToken = request.headers.get('Cf-Access-Jwt-Assertion');
  return accessToken && email && email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
}

async function list(env, url) {
  const status = url.searchParams.get('status');
  const allowed = new Set(['pending', 'approved', 'rejected']);
  const result = allowed.has(status)
    ? await env.DB.prepare('SELECT id, nickname, email, body, status, created_at, reviewed_at FROM messages WHERE status = ? ORDER BY created_at DESC LIMIT 200').bind(status).all()
    : await env.DB.prepare('SELECT id, nickname, email, body, status, created_at, reviewed_at FROM messages ORDER BY created_at DESC LIMIT 200').all();
  return json({ messages: result.results || [] });
}

async function update(request, env) {
  let input;
  try { input = await request.json(); } catch (_) { return json({ error: 'Invalid request' }, 400); }
  const id = typeof input.id === 'string' ? input.id : '';
  const status = typeof input.status === 'string' ? input.status : '';
  if (!id || !new Set(['pending', 'approved', 'rejected']).has(status)) return json({ error: 'Invalid message or status' }, 400);
  const result = await env.DB.prepare(
    'UPDATE messages SET status = ?, reviewed_at = ? WHERE id = ?'
  ).bind(status, new Date().toISOString(), id).run();
  if (!result.meta.changes) return json({ error: 'Message not found' }, 404);
  return json({ ok: true });
}

async function remove(request, env) {
  let input;
  try { input = await request.json(); } catch (_) { return json({ error: 'Invalid request' }, 400); }
  if (typeof input.id !== 'string' || !input.id) return json({ error: 'Invalid message' }, 400);
  await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(input.id).run();
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401);
    if (url.pathname !== '/api/messages') return json({ error: 'Not found' }, 404);
    if (request.method === 'GET') return list(env, url);
    if (request.method === 'PATCH') return update(request, env);
    if (request.method === 'DELETE') return remove(request, env);
    return json({ error: 'Method not allowed' }, 405);
  }
};
