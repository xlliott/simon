# Sleepwalking Simon

A daily guessing game for a sprint team. Simon sleepwalks around his room; the
team votes on which of 10 objects he'll interact with, the host reveals the
answer, and a sleepwalking fact appears for whichever object he reached.

Live at **https://sleepwalking-simon.pages.dev**

## Running a session

- **Team members** get the plain link. They hit Start, enter a name, and wait in
  the lobby. Names are remembered per-device, so returning players only type it
  once.
- **The host** opens the same link with `?host=1` on the end. That view adds the
  host panel: who's joined, a target picker only the host can see, Reveal, and
  Reset Game.

A round goes: **Start Round** (opens voting) → team clicks an object and submits
→ host picks tonight's target from the hidden grid → **Reveal** (Simon walks
there, the scene changes to him at that object, then the fact box appears).

Scores accumulate across rounds automatically. **Reset Game** wipes every player
and score and returns everyone to the title screen; the `×` beside a name
removes just that person.

## Editing the content

Everything lives in `index.html`.

- **Objects, facts and click areas** — the `ITEMS` array near the top. Each entry
  has the display name, its arrival photo, the clickable hotspot box as
  percentages of the room image (`left`/`top`/`w`/`h`), and the `fact` shown
  after the reveal. An object's position in this array *is* its id — votes and
  the chosen target are stored as that number — so reordering mid-round would
  reassign votes that are already in. Safe to reorder between rounds.
- **Artwork** — `assets/`. `sleepwalking-simon-01..10.JPG` are the arrival
  scenes, one per object in `ITEMS` order. `sleepwalking-simon-empty.png` is the
  room he walks around in, `-title.JPG` is the title screen, and
  `simon-idle/walk.png` are the sprite frames. All room images share the same
  1376×768 framing, which is what keeps the scene from jumping between states.
- **Re-exporting a sprite under the same filename** — bump the `?v=` number on
  its URL in `index.html`, or browsers will keep serving the old one.

## Deployment

Cloudflare Pages, deploying automatically on every push to `main`. Build settings
are: framework preset **None**, build command **blank**, output directory **`/`**
— it's plain static files, nothing to compile.

**It needs a D1 database bound to the Pages project under the variable name
`GAME_DB`** (Settings → Functions → D1 database bindings). Without it the
serverless functions error, the page quietly falls back to a local-only demo
mode, and nothing syncs between people. The tables create themselves on first
use, so there's no schema to set up.

## Why the backend looks like this

Shared state (who's joined, votes, the current round) lives in D1, reached
through three small functions in `functions/api/`. Browsers poll `/api/data`
every 1.5s and redraw when it changes.

This is deliberately not Firebase or a realtime database, and it's worth knowing
why before "improving" it:

- The team's corporate network blocks Google's API domains outright, which killed
  Firebase. Anything on a third-party domain risks the same fate — serving the
  backend from the site's own domain is what makes it work at all.
- It was on Cloudflare KV first. KV caches reads at the edge for up to 60s and
  propagates writes lazily, so deletes appeared to do nothing and rounds started
  ~45s late. D1's reads are strongly consistent, which is the whole point.
- Fonts are embedded in the page as base64 rather than loaded from Google Fonts,
  for the same blocking reason.
