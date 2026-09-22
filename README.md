# Sleepwalking Simon

A daily guessing game for a sprint team. Simon sleepwalks around his room; each
round the host puts three of the 10 objects up for a vote, the team picks one,
the host reveals the answer, and a sleepwalking fact appears for whichever
object he reached.

Live at **https://sleepwalking-simon.pages.dev**

## Running a session

- **Team members** get the plain link. They hit Start, enter a name, and wait in
  the lobby. Names are remembered per-device, so returning players only type it
  once.
- **The host** opens the same link with `?host=1` on the end. That view adds the
  host panel: who's joined, a target picker only the host can see, Reveal, and
  Reset Game.

A round goes: **Start Round** → host picks **the 3 options** the team votes
between (**Pick 3 For Me** chooses at random) → team clicks one of those three
and submits → host picks tonight's target from those same three → **Reveal**
(Simon walks there, the scene changes to him at that object, then the fact box
appears).

The three options are what the team sees light up on the room; everything else
is inert for that round, so the odds are always 1 in 3 rather than 1 in however
many locations are left. They're per-round: Start Round clears them and the host
picks a fresh three. Nobody can vote until all three are set, and swapping an
option out after picking the target clears the target too — the answer always
has to be something the team can actually choose.

Once a location has been revealed it is **out of play for the rest of the game**
— the team sees it shaded, and it drops out of the options the host can offer in
later rounds. The host panel counts what's left. **Put Locations Back** makes all
10 selectable again without touching names or scores, which is how you start a
fresh cycle (or recover if you use all ten).

## The finale round

**Start Finale Round** is the last night of the game, for when the wardrobe is
the only location left in play. It runs in **two parts, with two votes**, and
the point of the structure is that the team is told nothing about it until it
happens.

**Part one looks like an ordinary round.** The wardrobe is the only thing on the
board, and the team's panel says what it always says — *"Where will he go?"* —
with no mention of a finale, a portal or bonus points. The wardrobe is put up as
the option *and* set as the answer the moment the finale starts, so the host
doesn't pick a target here; the team just has to click the one location left.
Revealing walks him over, and he steps through the portal behind it and
vanishes. That is the surprise, and nothing on screen gives it away beforehand:
the status line reads only *"There he goes…"* until he is actually gone. It pays
the ordinary 1 point, which everyone gets, so it doesn't move the standings.

**Part two is the bet.** With him inside and the room left empty, the host
clicks **Open Second Vote** — a fresh round, so everyone's part-one vote is
cleared and the usual vote-and-reveal path runs again. The host picks three
places he might come back out at, drawn from the *spent* pile (the wardrobe he
went into is excluded), and secretly picks which one is right. The team votes
on a room that still shows the open portal and no Simon. Revealing holds that
empty room for a beat and then he is simply there, wherever the host chose,
worth **5 points**.

Starting the finale needs the wardrobe still in play and at least three used
locations for part two; the button checks both and says which is missing. Part
one spends the wardrobe. Part two spends nothing — he comes back out somewhere
already used, which is how it came to be an option.

No fact box on either part. He can only reappear somewhere already used, so its
fact was shown on the night it came up and would only be a repeat.

Every browser rebuilds each sequence from the moment the host hit Reveal, so
anyone whose poll lands part-way through drops into the right beat instead of
replaying it or skipping to the end. Nothing in the side panel gives a result
away while one plays: the correct/wrong ticks are held back until the beat
lands, and until then the team sees only who has voted, exactly as during the
vote itself.

About three seconds after he comes back out, a **Final Scores** podium fades up
over the scene: 1st, 2nd and 3rd, the winner starred and tagged in gold. It
covers the stage only, so the host panel stays reachable behind it, and `×`
closes it. Players level on points share a place and are named on the same row
(`JOINT WINNERS` if that place is first), so a tie can't quietly drop someone
off the board; the three places are the top three *distinct scores*, which is
why a team of two shows two rows rather than an empty third. The marks and
labels are `PODIUM_MARKS` / `PODIUM_PLACES` near the other finale constants.

Scores accumulate across rounds automatically. **Reset Game** wipes every player
and score, puts every location back, and returns everyone to the title screen;
the `×` beside a name removes just that person.

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
- **The finale frames** — `-portal.webp` (Simon at the open wardrobe) and
  `-vanished.webp` (the same room with him gone) are used only by the finale.
  He disappears by cross-fading the first away to reveal the second underneath,
  rather than by animating the sprite, so the two have to be the same shot with
  and without him or he'll appear to jump as he goes.
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
