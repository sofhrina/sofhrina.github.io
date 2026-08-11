import { EmailMessage } from 'cloudflare:email';

const ALLOWED_ORIGINS = new Set([
  'http://sofhrina.com',
  'http://www.sofhrina.com',
  'https://sofhrina.com',
  'https://www.sofhrina.com',
  'https://sofhrina.github.io',
  'http://localhost:4173'
]);

function cors(request) {
  const origin = request.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://sofhrina.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors(request) }
  });
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(request, env, token, remoteip) {
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  if (remoteip) body.append('remoteip', remoteip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
}

async function notify(env, message) {
  const safeName = message.nickname.replace(/[\r\n]/g, ' ');
  const text = [
    'A new guestbook note is waiting for review.',
    '',
    `From: ${safeName}`,
    `Reply email: ${message.email || 'not provided'}`,
    '',
    message.body,
    '',
    'Review it at https://guestbook-admin.sofhrina.com'
  ].join('\n');
  const raw = [
    'From: Sofhrina Guestbook <guestbook@sofhrina.com>',
    'To: Sophia <sophiaisfhr0429@gmail.com>',
    `Subject: New guestbook note from ${safeName}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    text
  ].join('\r\n');
  await env.NOTIFY_EMAIL.send(new EmailMessage(
    'guestbook@sofhrina.com',
    'sophiaisfhr0429@gmail.com',
    raw
  ));
}

async function listMessages(request, env) {
  const result = await env.DB.prepare(
    "SELECT id, nickname, body, created_at FROM messages WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100"
  ).all();
  return json({ messages: result.results || [] }, 200, request);
}

async function createMessage(request, env) {
  let input;
  try {
    input = await request.json();
  } catch (_) {
    return json({ error: 'Please send a valid note.' }, 400, request);
  }

  const nickname = clean(input.nickname);
  const email = clean(input.email).toLowerCase();
  const body = clean(input.message);
  const honeypot = clean(input.website);
  const token = clean(input.turnstileToken);
  if (honeypot) return json({ ok: true }, 201, request);
  if (!nickname || nickname.length > 40) return json({ error: 'Nickname must be between 1 and 40 characters.' }, 400, request);
  if (!body || body.length > 1000) return json({ error: 'Your note must be between 1 and 1000 characters.' }, 400, request);
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return json({ error: 'That email address does not look quite right.' }, 400, request);
  }
  if (!token) return json({ error: 'Please complete the small human check.' }, 400, request);

  const remoteip = request.headers.get('CF-Connecting-IP') || '';
  if (!(await verifyTurnstile(request, env, token, remoteip))) {
    return json({ error: 'The human check expired. Please try it once more.' }, 400, request);
  }

  const ipHash = await sha256(`${env.RATE_LIMIT_SALT}:${remoteip}`);
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM messages WHERE ip_hash = ? AND created_at > datetime('now', '-10 minutes')"
  ).bind(ipHash).first();
  if (Number(recent?.count || 0) >= 3) {
    return json({ error: 'A few notes already arrived from here. Please try again in ten minutes.' }, 429, request);
  }

  const message = {
    id: crypto.randomUUID(),
    nickname,
    email: email || null,
    body,
    created_at: new Date().toISOString(),
    ip_hash: ipHash
  };
  await env.DB.prepare(
    "INSERT INTO messages (id, nickname, email, body, status, created_at, ip_hash) VALUES (?, ?, ?, ?, 'pending', ?, ?)"
  ).bind(message.id, message.nickname, message.email, message.body, message.created_at, message.ip_hash).run();

  try {
    await notify(env, message);
  } catch (error) {
    console.error('Email notification failed', error);
  }
  return json({ ok: true, status: 'pending' }, 201, request);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
    const url = new URL(request.url);
    if (url.pathname !== '/api/messages') return json({ error: 'Not found' }, 404, request);
    if (request.method === 'GET') return listMessages(request, env);
    if (request.method === 'POST') return createMessage(request, env);
    return json({ error: 'Method not allowed' }, 405, request);
  }
};
