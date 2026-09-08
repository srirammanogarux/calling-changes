# calling-changes

A click-through prototype of **only the parts of the Stimuler calling tab that
are changing**, built to be shown and argued about in a browser rather than a
simulator.

Live: **https://calling-changes.vercel.app**

Nothing here is wired to anything: **no microphone, no LiveKit, no backend, no
analytics**. Every state is picked from the panel on the right.

## What is in it

Three groups, chosen because each is a decision someone has to make. The live
call, the post-call summary and the rest of the flow sit in the full prototype;
putting them here would bury the changes in a flow nobody is being asked to
review.

### 1. Greeting slot

The bubble on the calling tab, as a control plus four versions of a
memory-driven opener — a question built from what the user actually talked
about on their last call.

| | |
|---|---|
| **Static greeting** | The same line for everyone, forever. The control arm. |
| **v1 · One bubble, rotating** | Sarah talks; the card inside the bubble hands over and each question lights word by word. Full width, so the question is a sentence. Which card is on screen at the tap depends partly on how fast the thumb arrived. |
| **v2 · Two cards, side by side** | Nothing moves and nothing is pre-selected, so every start is a real choice. Which topic sits left is drawn per session and logged with the tap. Costs half the copy width. |
| **v3 · Two cards, stacked** | The same pick at full width, so the copy is a sentence again. Costs height: the big heading goes. |
| **v4 · Survey, not a call** | Asks which topic they would prefer, banks the answer, then hands over to today's greeting with the promise under it. Personalises nothing yet, so it can ship before the memory pipeline exists. |

Every card state is in there too: fresh, covered (the tick), deepened (the
second visit), still being written, and the three-line copy ceiling.

**The reason there are four.** v1's rotation confounds topic appeal with
reaction time. v2 and v3 remove that but introduce position and default bias,
both handled by drawing independently per session and logging the draw with the
tap. v4 sidesteps the pipeline entirely: it measures what people *say* rather
than what they *do*, which is weaker evidence but available months earlier.

### 2. Failure screens

Seven, one per reason code the app can fail with: out of talktime, line busy,
rate limited, connection lost, Sarah couldn't pick up, the call broke off, the
call timed out.

Each has its own illustration and motion. The talktime screen's reset clock
actually runs, counted off a deadline rather than by decrementing a number, and
its CTA carries a purchase glyph and a gloss because it opens a paywall.

### 3. Recent Calls

The history list, redesigned, in five states: loaded, loading, empty,
first-load failure, and next-page failure.

The argument: **time leads the row**. The list used to open with the award,
which reads as a scoreboard of things you did badly. Here the date is the
headline, the duration sits under it, and the stars are a small right-hand
lane. Rows are separated by a hairline instead of being boxed, and each section
carries its own talk total, which is the one number a learner wants.

## How it is built

* **Next.js 16 / React 19 / TypeScript.** Almost all styling is inline: this is
  a prototype whose job is to be read and edited in one place, not a codebase.
* **412 × 917 design pixels**, scaled by one CSS transform inside a device
  mockup, so what you see is what the phone gets.
* `src/lib/theme.ts` is a port of the app's `calling_v3_theme.dart`, and
  `src/lib/types.ts` mirrors its sealed state union. Copy is lifted verbatim
  where the screen already exists in the app.
* The failure art and the history screen are ports of Paper frames at the
  values Paper holds, not eyeballed from a screenshot.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```
