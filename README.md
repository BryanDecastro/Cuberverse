# CubeVerse

**Learn. Practice. Connect.** A speedcubing platform. Prototype.

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
- Routing for every section. Profile is still a placeholder. The Community section was removed (old `/community` links go to Home)
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

Route: `/learn/yellow-face`. One algorithm, the Sune: R U R′ U R U2 R′. Count the corners with
yellow on top and turn only the top so the front-left corner is right: none up, its yellow on the
left; one up, that corner at the front-left; two up, its yellow at the front. Sune, look again,
repeat. The Sune never touches the first two layers.

- Parts: Goal, the Sune (shown on the case it solves at once), every case (Sune, Anti-Sune, H, Pi,
  Headlights, T, Bowtie) with a top-view diagram, how to hold it and how many Sunes it takes,
  practice, quiz.
- `features/cube/yellowFace.ts` plans it. `yellowFace.test.ts` walks all 27 possible tops and
  proves the rule finishes within three Sunes whichever valid top turn is picked, that the seven
  lesson cases are distinct, held right and drawn correctly, and runs 500 practice mixes.
- All practice generators now retry instead of ever handing out an already-finished mix
  (`scrambles.test.ts` checks 1000 mixes per lesson).

## Stage 8: Lesson 7 "Final Solve" (done): the full beginner course

Route: `/learn/final-solve`. Corners: headlights at the back, then R′ F R′ B2 R F′ R′ B2 R2
(once from anywhere if there are no headlights), then turn U to match the centers. Edges: a
finished side at the back, then R U′ R U R U R U′ R′ U′ R2 once or twice. Finishing shows
"Congratulations! You solved your first Rubik’s Cube!" and "Start My First Timed Solve",
which opens the Timer's first timed solve (`/timer?first=1`).

- `features/cube/lastLayer.ts` plans it and checks a solved cube however it is held.
  `lastLayer.test.ts` proves both algorithms keep the yellow face and two layers, and that the
  cube is solved within 2 corner and 3 edge algorithms on 500 mixes.
- Practice is crash-proof: if a learner stops mid-algorithm, Hint explains how to continue
  instead of failing, and `scrambles.test.ts` fuzzes every status check on random cubes.

## Stage 9: Timer (done)

Route: `/timer`. Hold Space for 0.3 s until the clock turns green, release to start, and press any
key to stop. On a phone, touch and hold the timer, then tap anywhere. Escape cancels.

- **Scrambles:** WCA random-state scrambles from cubing.js for 3x3, 2x2 and 4x4. The next one is
  prepared during the solve. `scripts/copy-cubing.mjs` builds cubing.js's scramble module on its
  own with esbuild into `public/vendor/cubing` (runs before `dev` and `build`, git-ignored):
  bundled with the app by Vite, its search worker crashed in production builds.
- **Precision:** times come from the key and touch event timestamps, not from animation frames.
  Whether a press was held long enough is decided at release from the real hold length, so a quick
  tap can never start the clock. The running display is written straight to the DOM.
- **Stats (WCA rules):** best, ao5, ao12 (drop the best and worst, two DNFs make the average a DNF),
  +2 and DNF, delete, sessions per event, history, and a time chart. Saved in localStorage.
- **Modes:** Simple (big clock and scramble) and Advanced (stats, history, chart, session,
  achievements, and a 3D cube plus 2D net that show exactly the scrambled state).
- **WCA inspection (optional switch, remembered):** a tap starts 15 s of inspection, counting down
  with the judge's 8 and 12 second calls; hold and release to start. Starting after 15 s saves the
  solve with +2, after 17 s as a DNF (Regulations A3a, 10e). Escape abandons it. Off in the first
  timed solve.
- **First timed solve:** after the course, `/timer?first=1` explains the steps, then offers Save,
  Try again or Keep training, and unlocks the "First Timed Solve" achievement.
- **Achievements:** First Lesson Completed, First Cube Solved, First Timed Solve, Sub-60, Sub-30, Sub-20.
- `features/timer/timer.test.ts` covers the timing rules and the WCA averages.

## Stage 10: History (done)

Route: `/history`. A hero with a solved 3D cube on its pedestal, then "The Cube Timeline": 1974
(Ernő Rubik's wooden prototype), 1977 (the Bűvös kocka in Budapest shops), 1980 (Ideal Toy's world
launch), 1982 (first World Championship, Minh Thai, 22.95 s), 1997 (Fridrich's CFOP online),
2003–2004 (Toronto and the founding of the WCA) and today (sub-5 in 2015, sub-4 in 2018). It ends
with a bridge to WCA & Legends.

- **Motion:** GSAP + ScrollTrigger (`gsap` 3.13, loaded only on this page). The spine fills as you
  scroll and lights each year, cards slide in from their side, artwork drifts slightly, the hero cube
  eases away. With reduced motion only the progress fill and lit years remain. Everything is
  reverted when you leave the page.
- **Artwork:** `features/history/EraArt.tsx` draws every era as original SVG, with no photos of real
  people and no logos. To use licensed photos instead, put them in `public/history/` and list them
  in `PHOTOS` in `pages/History.tsx`.
- Copy lives in `i18n/history.en.ts` and `history.pt.ts`.

## Stage 11: WCA & Legends (done)

Route: `/wca`. A stage hero (3D cube on a drawn competition timer), "What is the WCA?", the 9
main events with drawn puzzle icons plus the other 8 official ones, how a competition works
(registration, 15 s inspection, solving, judging, results), legends, every current world record,
a live competition finder, and a link to the Timer.

- **Records:** `features/wca/records.ts` holds the official single and average records for all 17
  events (checked against the WCA records page; update `RECORDS_CHECKED` with them). History reads
  its 3x3 record from the same file.
- **Legends:** Feliks Zemdegs, Max Park, Yiheng Wang and Tymon Kolasiński, each claim checked against
  the WCA podium and records pages, each linking to their WCA profile. No photos; initials only.
- **Competition finder:** live data from the public WCA API
  (`/api/v0/competitions`, fetched in the browser only when the section scrolls into view). Country
  (guessed from the browser language), city (filtered locally) and date range, with registration
  status, dates and limits; every card opens the competition on the WCA site.
- Copy lives in `i18n/wca.en.ts` and `wca.pt.ts`.

## Turning the cube by hand (all lessons)

Wherever a lesson asks the learner to move the cube, they can drag a row or column of the 3D cube
with the mouse or a finger to turn that layer; dragging beside the cube still looks around.
Every move (drag, keyboard, button or demo) pops up its letter with what it means, for example
"R′: turn the right face 90° counterclockwise", and it stays readable for a moment after the turn.

- Lesson 1 (notation) keeps the 18 move buttons, since learning the letters is the point there.
  Lessons 2 to 7 drop them: practice and quiz tasks are done on the cube itself (or the keyboard).
- `gestureMove` in `features/cube/CubeScene.tsx` names the move from the grabbed point and drag
  direction; `gestures.test.ts` checks it on every sticker of every face against the cube model.
  Middle rows do nothing (slice moves are not part of this notation).
- Parts opt in through `useMoveKeys`, which now registers both the keyboard and dragging.

## Accounts: Supabase Auth (email and password)

Sign-up, sign-in, email confirmation, password reset, sign-out and a persistent session, all
handled by Supabase Auth (`features/auth/supabaseAuthService.ts`, client in `lib/supabase.ts`).
Passwords go straight to Supabase over HTTPS and are stored there hashed; the app never keeps them.
Users appear in Supabase under Authentication > Users.

- Configure with `.env.local` (see `.env.example`): `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY` (public by design). Never add the service_role / secret key.
  Without them the app falls back to the old local demo sign-in.
- Routes: `/signin`, `/signup`, `/forgot-password`, `/reset-password` (link from the reset email),
  `/auth/callback` (link from the confirmation email).
- In Supabase: Authentication > URL Configuration must list the site URL and
  `<site>/auth/callback` and `<site>/reset-password` as redirect URLs. The built-in email service
  only sends to team members, a few per hour: set up custom SMTP before real users sign up.
- The Google button only shows in demo mode (Google sign-in is not part of this stage).

## Account sync: times and lesson progress

Signed-in users keep their Timer sessions and solves (with +2 / DNF) and their lesson progress in
their account, so they see the same history, chart, achievements and course progress on any device.

- Tables (`supabase/migrations/20261127000000_timer_and_progress.sql`): `timer_sessions`,
  `timer_solves`, `user_progress` (lesson progress + active session per event). Row level
  security: each user can only read and change their own rows; anonymous requests get nothing.
- `features/sync/`: `SyncProvider` downloads the account once per sign-in; `cloud.ts` keeps a
  per-user outbox in localStorage and uploads changes in batches (retries when back online, every 30 s).
- The site always works from a local copy (fast and offline). Local changes still queued win over
  the download; a solve deleted on another device disappears everywhere.
- Guests keep everything on the device. At sign-in, a guest's times and lessons on that device are
  added to the account. Signing out shows the device's own data again.

## Structure

```
src/
  config/routes.ts            every path in one place
  i18n/en.ts, pt.ts           all viewer-facing copy (pt must match en's shape)
  i18n/I18nProvider.tsx       useI18n() -> { t, locale, setLocale }
  features/auth/              AuthService interface + DemoAuthService (swap for Supabase)
  features/cube/              CubeScene (three.js / R3F), move notation, state model + tests, SVG fallback, LazyCube
  features/timer/             timer engine, stats, store, scrambles, visualizer, chart, panels
  features/achievements/      achievement rules
  features/history/           timeline artwork (SVG)
  features/wca/               world records, event icons, competition finder (WCA API)
  features/sync/              account sync for times and lesson progress (Supabase)
  features/learn/             lesson list, saved progress, sidebar, move pad, notation lesson (5 parts)
  i18n/learn.en.ts, learn.pt.ts  all lesson copy
  components/layout/          Header, Footer, Layout, menus
  components/ui/              Button, Reveal, Kicker, Logo, StickerStrip
  pages/                      Home (+ home/ sections), Auth, ComingSoon, NotFound
  lib/                        storage (safe localStorage), hooks, helpers
```

## Ready for later

- **Supabase Auth:** implement `AuthService` in `features/auth/` and change one line in `AuthProvider.tsx`.
- **Synced solves:** the Timer store (`features/timer/TimerStore.tsx`) is the one place to swap localStorage for Supabase.
- **History photos:** licensed photos or video clips can replace the drawn artwork per year (`PHOTOS` in `pages/History.tsx`).
- **Stripe / Pro:** not implemented. Env placeholders are in `.env.example`.
- **PWA:** `public/manifest.webmanifest` is in place.

Rubik's Cube is a registered trademark of Spin Master Ltd. CubeVerse is an independent project.
