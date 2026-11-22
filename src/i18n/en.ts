/**
 * English copy, the source of truth for every viewer-facing string.
 * Every other locale must match this shape (enforced by the Dictionary type).
 */
import { learnEn } from './learn.en'

export const en = {
  meta: {
    langName: 'English',
    short: 'EN',
  },
  nav: {
    home: 'Home',
    learn: 'Learn',
    timer: 'Timer',
    history: 'History',
    wca: 'WCA & Legends',
    community: 'Community',
    signIn: 'Sign In',
    profile: 'My Profile',
    signOut: 'Sign out',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
    skip: 'Skip to content',
    demo: 'Demo',
  },
  hero: {
    kicker: 'The speedcubing platform',
    title: ['Learn.', 'Practice.', 'Connect.'],
    subtitle: 'From your first move to your first timed solve. Discover the world of speedcubing.',
    ctaLearn: 'Start Learning',
    ctaTimer: 'Open Timer',
    ctaSignIn: 'Sign In',
    cubeLabel: 'Interactive 3D Rubik’s Cube',
    nowPlaying: 'Live moves',
    scramble: 'Scramble it',
    solve: 'Solve it',
    dragHint: 'Drag to spin',
    stats: [
      { value: '7', label: 'steps to your first solve' },
      { value: '43', label: 'quintillion possible states' },
      { value: '1', label: 'cube is all you need' },
    ],
  },
  paths: {
    kicker: 'Choose your path',
    title: 'Where do you want to start?',
    subtitle: 'Pick the one that sounds like you. You can switch anytime.',
    beginner: {
      title: "I'm a Beginner",
      text: 'Never solved it? Start from zero with seven short, interactive lessons.',
      cta: 'Start the lessons',
    },
    solver: {
      title: 'I Already Know How to Solve',
      text: 'Grab a fresh scramble, start the clock and watch your averages drop.',
      cta: 'Open the timer',
    },
    explore: {
      title: 'Explore the Cube',
      text: 'The story behind the puzzle, the WCA and the legends of speedcubing.',
      cta: 'Explore the story',
    },
  },
  features: [
    { title: 'Step-by-step lessons', text: 'Seven steps, every turn shown on a 3D cube.' },
    { title: 'Pro timer', text: 'Spacebar control, valid scrambles, ao5 and ao12.' },
    { title: 'Your progress', text: 'Every solve saved, every personal best counted.' },
    { title: 'History & legends', text: 'From a classroom in Budapest to the world stage.' },
  ],
  journey: {
    kicker: 'The CubeVerse path',
    title: 'From a scrambled cube to your first timed solve.',
    subtitle: 'No experience needed. Just a cube and a few evenings.',
    steps: [
      { title: 'Learn the 7 steps', text: 'Short lessons with a 3D cube that shows every turn, slow enough to follow.' },
      { title: 'Solve it yourself', text: 'Follow along with your own cube until the last layer clicks into place.' },
      { title: 'Time your first solve', text: 'Get a real scramble, start the clock and save the time that starts it all.' },
    ],
    badgeLabel: 'Achievement',
    badgeTitle: 'First Timed Solve',
    badgeText: 'Unlocked when you finish the tutorial and stop the clock.',
  },
  notation: {
    kicker: 'Speak cube',
    title: 'Every move has a name.',
    text: 'R means turn the right face clockwise. Add an apostrophe and it goes the other way. Add a 2 and it turns twice. Six letters and you can read any algorithm.',
    moves: [
      { move: 'R', label: 'Right' },
      { move: 'L', label: 'Left' },
      { move: 'U', label: 'Up' },
      { move: 'D', label: 'Down' },
      { move: 'F', label: 'Front' },
      { move: 'B', label: 'Back' },
    ],
    tryHint: "Tap a move and watch the cube turn. Switch on prime (') to turn it the other way.",
  },
  coming: {
    kicker: 'On the roadmap',
    title: 'Built to grow with you.',
    community: {
      title: 'Community',
      text: 'Language channels, shared scrambles and training rooms with cubers around the world.',
      tag: 'Coming soon',
    },
    pro: {
      title: 'CubeVerse Pro',
      text: 'Advanced algorithm libraries, personal training plans and deeper stats.',
      tag: 'Planned',
    },
  },
  finalCta: {
    title: 'Your first solve starts with one move.',
    text: 'Free to start. No account needed to explore.',
    primary: 'Start Learning',
    secondary: 'Open Timer',
  },
  footer: {
    tagline: 'Learn. Practice. Connect.',
    description: 'A home for everyone who loves the Rubik’s Cube, from the first move to the podium.',
    columns: {
      learn: 'Learn',
      practice: 'Practice',
      explore: 'Explore',
    },
    links: {
      tutorial: '3x3 Tutorial',
      timer: 'Timer',
      profile: 'My Profile',
      history: 'History',
      wca: 'WCA & Legends',
      community: 'Community',
      signIn: 'Sign In',
    },
    prototype: 'Prototype build. Sign-in and profile use demo data stored only in this browser.',
    trademark:
      'Rubik’s Cube is a registered trademark of Spin Master Ltd. CubeVerse is an independent project, not affiliated with Rubik’s or the World Cube Association.',
    rights: '© 2026 CubeVerse',
  },
  auth: {
    asideKicker: 'CubeVerse account',
    asideTitle: 'Your cubing journey starts here.',
    asideText: 'Save your times, track your lessons and earn achievements as you improve.',
    asidePoints: ['Lessons that remember where you stopped', 'Every solve, average and best in one place', 'Achievements from your first move to sub-20'],
    demoBanner: 'Demo mode. No real account is created and nothing leaves this browser.',
    tabSignIn: 'Sign in',
    tabSignUp: 'Create account',
    signInTitle: 'Welcome back',
    signInSub: 'Sign in to keep your times and progress together.',
    signUpTitle: 'Create your account',
    signUpSub: 'Takes 30 seconds. The basics stay free.',
    google: 'Continue with Google',
    or: 'or',
    name: 'Name',
    namePh: 'What should we call you?',
    email: 'Email',
    emailPh: 'you@example.com',
    password: 'Password',
    passwordPh: 'At least 8 characters',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    forgot: 'Forgot password?',
    submitIn: 'Sign in',
    submitUp: 'Create account',
    working: 'One moment…',
    guest: 'Explore without an account',
    errEmail: 'Enter a valid email address.',
    errPassword: 'Use at least 8 characters.',
    errName: 'Tell us what to call you.',
    forgotTitle: 'Reset your password',
    forgotSub: 'Enter your email and we will send you a reset link.',
    forgotSubmit: 'Send reset link',
    forgotSent: 'Demo mode: in the full version, a reset link would be sent to {email}.',
    backToSignIn: 'Back to sign in',
    toSignUp: 'New to CubeVerse?',
    toSignUpLink: 'Create an account',
    toSignIn: 'Already have an account?',
    toSignInLink: 'Sign in',
    welcome: 'Signed in as {name}. Demo account.',
    terms: 'By continuing you agree to the Terms and Privacy Policy (coming with the full launch).',
  },
  comingSoon: {
    kicker: 'Next stage',
    title: '{page} is on its way.',
    text: 'This part of CubeVerse is being built in the next stage. The home page and sign-in are ready to explore right now.',
    back: 'Back to home',
    other: 'Or take a look at',
    demoProfile: 'You are signed in with a demo account. Your real profile, stats and achievements arrive in a later stage.',
  },
  learn: learnEn,
  notFound: {
    title: 'This face is not on the cube.',
    text: 'The page you are looking for does not exist.',
    back: 'Back to home',
  },
}

export type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T

export type Dictionary = Widen<typeof en>
