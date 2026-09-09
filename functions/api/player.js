// POST /api/player — writes one player's document, keyed by name-slug, into
// a single "players" KV entry (an object map of slug -> player data).
// Body: { op: "set" | "update" | "delete", slug, data }
export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const currentRaw = await env.GAME_KV.get("players");
  const players = currentRaw ? JSON.parse(currentRaw) : {};

  if (body.op === "delete") {
    delete players[body.slug];
  } else if (body.op === "set") {
    players[body.slug] = body.data;
  } else if (body.op === "update") {
    players[body.slug] = Object.assign({}, players[body.slug] || {}, body.data);
  }

  await env.GAME_KV.put("players", JSON.stringify(players));
  return new Response(JSON.stringify(players[body.slug] || null), {
    headers: { "Content-Type": "application/json" },
  });
}
