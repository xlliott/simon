// POST /api/session — writes the single shared session row.
// Body: { op: "set" | "update", data: {...} }
// "set" replaces the whole document; "update" merges into the existing one.
export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  await env.GAME_DB.prepare(
    "CREATE TABLE IF NOT EXISTS session (id INTEGER PRIMARY KEY, data TEXT)"
  ).run();

  let next = body.data;
  if (body.op === "update") {
    const row = await env.GAME_DB.prepare("SELECT data FROM session WHERE id = 1").first();
    const current = row ? JSON.parse(row.data) : {};
    next = Object.assign({}, current, body.data);
  }

  await env.GAME_DB.prepare("INSERT OR REPLACE INTO session (id, data) VALUES (1, ?)")
    .bind(JSON.stringify(next))
    .run();

  return new Response(JSON.stringify(next), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
