// netlify/functions/quiz-submit.js
import { createClient } from '@supabase/supabase-js';

const CORS = () => ({
  'Access-Control-Allow-Origin': process.env.ADMIN_ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
});

export const handler = async (event) => {
  const headers = CORS();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'server_misconfig' }) };
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

    // Verify user from Bearer
    const token = (event.headers.authorization || '').replace(/^Bearer\s+/i, '') || null;
    if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'missing_token' }) };

    const { data: userInfo, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !userInfo?.user?.id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'invalid_token' }) };
    }
    const userId = userInfo.user.id;

    // Parse payload
    const payload = JSON.parse(event.body || '{}');
    // Expected:
    // { aircraft, category_root_slug, category_slug, include_descendants, mode, duration_sec,
    //   meta, items:[{question_id, legacy_id?, answer_index, correct_index, time_spent_sec?, tags?, difficulty?, category_path?}] }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'items_required' }) };
    }

    const clamp = (n) => (typeof n === 'number' && n >= 0 && n <= 3 ? n : null);
    const cleanItems = payload.items.map((it) => ({
      question_id: it.question_id,
      legacy_id: it.legacy_id ?? null,
      answer_index: clamp(it.answer_index),
      correct_index: clamp(it.correct_index),
      time_spent_sec: Number.isFinite(it.time_spent_sec) ? Math.max(0, Math.floor(it.time_spent_sec)) : null,
      tags: Array.isArray(it.tags) ? it.tags.slice(0, 20) : [],
      difficulty: it.difficulty || null,
      category_path: Array.isArray(it.category_path) ? it.category_path.slice(0, 6) : null,
    }));

    if (cleanItems.some(ci => !ci.question_id || ci.answer_index === null || ci.correct_index === null)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid_items' }) };
    }

    const questionCount = cleanItems.length;
    const correctCount = cleanItems.filter(ci => ci.answer_index === ci.correct_index).length;

    const attemptInsert = {
      user_id: userId,
      aircraft: payload.aircraft || null,
      category_root_slug: payload.category_root_slug || null,
      category_slug: payload.category_slug || null,
      include_descendants: payload.include_descendants !== false,
      question_count: questionCount,
      correct_count: correctCount,
      mode: payload.mode || 'practice',
      duration_sec: Number.isFinite(payload.duration_sec) ? Math.max(0, Math.floor(payload.duration_sec)) : null,
      meta: payload.meta || {},
      submitted_at: new Date().toISOString(),
    };

    // Insert attempt
    const { data: attempt, error: e1 } = await admin
      .from('quiz_attempts')
      .insert(attemptInsert)
      .select('*')
      .single();

    if (e1) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'insert_attempt_failed', detail: e1.message }) };
    }

    // Insert items
    const itemsInsert = cleanItems.map(ci => ({ ...ci, attempt_id: attempt.id }));
    const { error: e2 } = await admin.from('quiz_attempt_items').insert(itemsInsert);

    if (e2) {
      // rollback sederhana
      await admin.from('quiz_attempts').delete().eq('id', attempt.id);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'insert_items_failed', detail: e2.message }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        attempt_id: attempt.id,
        question_count: attempt.question_count,
        correct_count: attempt.correct_count,
        score: attempt.score,
        mode: attempt.mode,
        submitted_at: attempt.submitted_at,
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server_error', detail: String(err?.message || err) }) };
  }
};
