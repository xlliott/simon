// POST /api/player — writes one player's row, keyed by name-slug.
// Body: { op: "set" | "update" | "delete" | "deleteAll", slug, data }
//
// "deleteAll" clears the whole roster in one statement, which is how the
// host's Reset Game works — sending one delete per player instead meant
// several writes landing at once and clobbering each other.
export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  await env.GAME_DB.prepare(
    "CREATE TABLE IF NOT EXISTS players (slug TEXT PRIMARY KEY, data TEXT)"
  ).run();

  if (body.op === "deleteAll") {
    await env.GAME_DB.prepare("DELETE FROM players").run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.op === "delete") {
    await env.GAME_DB.prepare("DELETE FROM players WHERE slug = ?").bind(body.slug).run();
    return new Response(JSON.stringify(null), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let next = body.data;
  if (body.op === "update") {
    const row = await env.GAME_DB.prepare("SELECT data FROM players WHERE slug = ?")
      .bind(body.slug)
      .first();
    const current = row ? JSON.parse(row.data) : {};
    next = Object.assign({}, current, body.data);
  }

  await env.GAME_DB.prepare("INSERT OR REPLACE INTO players (slug, data) VALUES (?, ?)")
    .bind(body.slug, JSON.stringify(next))
    .run();

  return new Response(JSON.stringify(next), {
    headers: { "Content-Type": "application/json" },
  });
}
