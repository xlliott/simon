// GET /api/data — returns the full shared game state in one shot,
// so the client can poll a single endpoint. Players are stored one per
// KV key ("player:<slug>"), so this lists that prefix and reads each one.
export async function onRequestGet(context) {
  const { env } = context;
  const [sessionRaw, list] = await Promise.all([
    env.GAME_KV.get("session"),
    env.GAME_KV.list({ prefix: "player:" }),
  ]);
  const session = sessionRaw ? JSON.parse(sessionRaw) : {};

  const players = {};
  await Promise.all(
    list.keys.map(async (k) => {
      const raw = await env.GAME_KV.get(k.name);
      if (raw) players[k.name.slice("player:".length)] = JSON.parse(raw);
    })
  );

  return new Response(JSON.stringify({ session, players }), {
    headers: { "Content-Type": "application/json" },
  });
}
