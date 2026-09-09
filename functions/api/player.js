// POST /api/player — writes one player's document under its own KV key
// ("player:<slug>"), rather than one shared blob for everyone. This matters
// because two players writing at once (voting close together, or a host
// reset deleting several at once) previously raced on a single shared key
// and could silently clobber each other's write. Separate keys per player
// mean those writes never touch the same key, so they can't collide.
// Body: { op: "set" | "update" | "delete", slug, data }
export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const key = "player:" + body.slug;

  if (body.op === "delete") {
    await env.GAME_KV.delete(key);
    return new Response(JSON.stringify(null), {
      headers: { "Content-Type": "application/json" },
    });
  }

  var next;
  if (body.op === "set") {
    next = body.data;
  } else {
    const currentRaw = await env.GAME_KV.get(key);
    const current = currentRaw ? JSON.parse(currentRaw) : {};
    next = Object.assign({}, current, body.data);
  }

  await env.GAME_KV.put(key, JSON.stringify(next));
  return new Response(JSON.stringify(next), {
    headers: { "Content-Type": "application/json" },
  });
}
