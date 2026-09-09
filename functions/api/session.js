// POST /api/session — writes the single shared "session/state" document.
// Body: { op: "set" | "update", data: {...} }
// "set" replaces the whole document; "update" merges into the existing one,
// mirroring the semantics the client used with Firestore.
export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const currentRaw = await env.GAME_KV.get("session");
  const current = currentRaw ? JSON.parse(currentRaw) : {};

  const next = body.op === "set" ? body.data : Object.assign({}, current, body.data);

  await env.GAME_KV.put("session", JSON.stringify(next));
  return new Response(JSON.stringify(next), {
    headers: { "Content-Type": "application/json" },
  });
}
