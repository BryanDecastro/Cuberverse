# CubeVerse

**Learn. Practice. Connect.** A speedcubing platform. Prototype, stage 1.

## Run it

```bash
cd cubeverse
npm install      # first time only
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Stage 1 (done)

- Design system (tokens in `src/styles/index.css`), Header, Footer, environment background
- Home: 3D hero cube that scrambles and solves itself with real layer turns, three paths, features, journey, interactive notation pad, roadmap, final CTA
- Sign in / Create account / Forgot password (demo auth, clearly labeled)
- Routing for every section. Learn, Timer, History, WCA, Community and Profile are placeholders for later stages
- English and Português (BR), auto-detected, switchable in the header

## Stage 2: Learn, Lesson 1 "Understanding Cube Notation" (done)

Route: `/learn` redirects to `/learn/notation`. Five parts: faces, symbols (R, R′, R2),
free practice (18 moves + undo / reset / replay, keyboard R L U D F B with Shift for prime),
the R U R′ U′ player (play, pause, previous, next, replay, 0.5x/1x/2x) and a 4-exercise quiz.
Finishing the quiz saves progress in localStorage and opens "Next Lesson: White Cross".

How correctness is guaranteed:

- `features/cube/model.ts` is a pure 54-sticker model. `npm test` checks every move
  direction against standard WCA notation, plus group facts (R U has order 105,
  R U R′ U′ has order 6, every move is undone by its inverse).
- The 3D cube turns real geometry and can read its own stickers back (`readState()`).
  The browser test compares it with the model after random sequences, and the quiz
  checks the learner's R U R′ U′ against the real cube state, not just the buttons pressed.

Why not cubing.js here: its TwistyPlayer has its own renderer, its own copy of three.js
and its own styling, and it cannot highlight a face from outside, which Part 1 needs.
The plan keeps cubing.js for the Timer, where its official-style random-state scrambles matter.

## Stage 3: Lesson 2 "White Cross" (done)

Route: `/learn/white-cross`. Daisy method, held yellow on top. Five parts: the goal
(before/after, with non-cross pieces greyed out), the three daisy cases with step-by-step
demos, daisy to cross, practice on a real scramble with Hint / Show me, and a 4-exercise quiz.

- `features/cube/crossSolver.ts` plans the daisy and the drops for any position. Demos,
  hints and quiz answers all come from it. `crossSolver.test.ts` checks the lesson positions
  match their descriptions, the taught moves match the planner, 500 random scrambles solve,
  and step-by-step re-planning (how "Show me" works) always finishes.
- The engine gained whole-cube rotations (x y z), `setState()` for instant setups and
  a `focus` option that greys out pieces a step does not use.
- `features/learn/shell/LessonShell.tsx` is the shared lesson frame (cube, part stepper,
  panel, navigation, progress, completion). New lessons only supply their parts.

## Stage 4: Lesson 3 "First Layer" (done)

Route: `/learn/first-layer`. The four white corners with the move from Lesson 1: turn U until
a corner is above its spot, turn the whole cube (y) so the spot is front-right, repeat
R U R′ U′ until it drops in (1, 3 or 5 rounds); a stuck corner is popped out with one round.

- `features/cube/firstLayer.ts` plans it for any cross-solved position, and `cornerScramble()`
  makes practice mixes that keep the cross. `firstLayer.test.ts` proves R U R′ U′ leaves the
  cross and other corners alone, checks each case's round count, and solves 500 mixes.
- Shared lesson pieces now live in `features/learn/shell/`: `StepPlayer` (step-by-step demos),
  `PlannerPractice` (practice with Hint / Show me for any planner) and `TaskQuiz`
  (choice questions plus hands-on tasks checked on the real cube state).

## Stage 5: Lesson 4 "Second Layer" (done)

Route: `/learn/second-layer`. The four middle edges: turn U to make an upside-down T, turn the
cube (y) so the T faces you, then send the edge right (U R U′ R′ U′ F′ U F) or left
(U′ L′ U L U F U′ F′) by its top color; a stuck edge is popped out with the right-hand move.

- `features/cube/secondLayer.ts` plans it for any first-layer-solved position; `middleScramble()`
  makes practice mixes that keep the white layer. `secondLayer.test.ts` proves both moves keep
  the first layer, checks each case, and solves 500 mixes, including step-by-step re-planning.
- Vitest's per-test timeout is 30s (`vite.config.ts`): the solver suites run hundreds of mixes.

## Stage 6: Lesson 5 "Yellow Cross" (done)

Route: `/learn/yellow-cross`. One algorithm, F R U R′ U′ F′, moves the top shape forward:
dot, L (held back-left), line (held left to right), cross.

- `features/cube/yellowCross.ts` reads the top shape and plans the steps; `topScramble()` mixes
  only the top layer. `yellowCross.test.ts` proves the algorithm keeps two layers, that each
  round moves the shape exactly one step forward (500 mixes), and checks every lesson position.

## Stage 7: Lesson 6 "Yellow Face" (done)

Route: `/learn/yellow-face`. Put a twisted corner at the top front-right and repeat R′ D′ R D
until yellow faces up (yellow on the right: 2 rounds; yellow facing you: 4), then turn only
the top to the next one. The bottom looks broken mid-way and returns after the last corner.

- `features/cube/yellowFace.ts` plans it, also from the middle of the process.
  `yellowFace.test.ts` proves the 2/4 rule on 500 mixes and that the bottom always comes back.
- All practice generators now retry instead of ever handing out an already-finished mix
  (`scrambles.test.ts` checks 1000 mixes per lesson).

## Stage 8: Lesson 7 "Final Solve" (done): the full beginner course

Route: `/learn/final-solve`. Corners: headlights at the back, then R′ F R′ B2 R F′ R′ B2 R2
(once from anywhere if there are no headlights), then turn U to match the centers. Edges: a
finished side at the back, then R U′ R U R U R U′ R′ U′ R2 once or twice. Finishing shows
"Congratulations! You solved your first Rubik’s Cube!" and "Start My First Timed Solve",
which opens `/timer` (the Timer itself is the next stage).

- `features/cube/lastLayer.ts` plans it and checks a solved cube however it is held.
  `lastLayer.test.ts` proves both algorithms keep the yellow face and two layers, and that the
  cube is solved within 2 corner and 3 edge algorithms on 500 mixes.
- Practice is crash-proof: if a learner stops mid-algorithm, Hint explains how to continue
  instead of failing, and `scrambles.test.ts` fuzzes every status check on random cubes.

## Structure

```
src/
  config/routes.ts            every path in one place
  i18n/en.ts, pt.ts           all viewer-facing copy (pt must match en's shape)
  i18n/I18nProvider.tsx       useI18n() -> { t, locale, setLocale }
  features/auth/              AuthService interface + DemoAuthService (swap for Supabase)
  features/cube/              CubeScene (three.js / R3F), move notation, state model + tests, SVG fallback, LazyCube
  features/learn/             lesson list, saved progress, sidebar, move pad, notation lesson (5 parts)
  i18n/learn.en.ts, learn.pt.ts  all lesson copy
  components/layout/          Header, Footer, Layout, menus
  components/ui/              Button, Reveal, Kicker, Logo, StickerStrip
  pages/                      Home (+ home/ sections), Auth, ComingSoon, NotFound
  lib/                        storage (safe localStorage), hooks, helpers
```

## Ready for later

- **Supabase Auth:** implement `AuthService` in `features/auth/` and change one line in `AuthProvider.tsx`.
- **Timer and Tutorial:** add `cubing` (cubing.js) for WCA-grade random-state scrambles and the 2D/3D scramble views. `CubeScene` already plays any move sequence on a real-geometry cube.
- **History page:** GSAP ScrollTrigger plus video slots for the Higgsfield clips.
- **Stripe / Pro:** not implemented. Env placeholders are in `.env.example`.
- **PWA:** `public/manifest.webmanifest` is in place.

Rubik's Cube is a registered trademark of Spin Master Ltd. CubeVerse is an independent project.
