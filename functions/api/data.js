// GET /api/data — returns the full shared game state in one shot,
// so the client can poll a single endpoint.
export async function onRequestGet(context) {
  const { env } = context;
  const [sessionRaw, playersRaw] = await Promise.all([
    env.GAME_KV.get("session"),
    env.GAME_KV.get("players"),
  ]);
  const session = sessionRaw ? JSON.parse(sessionRaw) : {};
  const players = playersRaw ? JSON.parse(playersRaw) : {};
  return new Response(JSON.stringify({ session, players }), {
    headers: { "Content-Type": "application/json" },
  });
}
