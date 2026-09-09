// GET /api/data — returns the full shared game state in one shot, so the
// client can poll a single endpoint.
//
// Backed by D1 rather than KV: KV caches reads at the edge for up to 60s and
// propagates writes lazily, so a delete or a new player could stay invisible
// long enough to look broken. D1 reads are strongly consistent.
export async function onRequestGet(context) {
  const { env } = context;

  const results = await env.GAME_DB.batch([
    env.GAME_DB.prepare("CREATE TABLE IF NOT EXISTS session (id INTEGER PRIMARY KEY, data TEXT)"),
    env.GAME_DB.prepare("CREATE TABLE IF NOT EXISTS players (slug TEXT PRIMARY KEY, data TEXT)"),
    env.GAME_DB.prepare("SELECT data FROM session WHERE id = 1"),
    env.GAME_DB.prepare("SELECT slug, data FROM players"),
  ]);

  const sessionRows = results[2].results || [];
  const playerRows = results[3].results || [];

  const session = sessionRows.length ? JSON.parse(sessionRows[0].data) : {};
  const players = {};
  for (const row of playerRows) players[row.slug] = JSON.parse(row.data);

  return new Response(JSON.stringify({ session, players }), {
    headers: { "Content-Type": "application/json" },
  });
}
