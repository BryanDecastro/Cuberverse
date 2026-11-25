/**
 * Build cubing.js's scramble module into public/vendor/cubing, separately from
 * the app, so the Timer can load it at runtime untouched by Vite.
 *
 * Why: cubing.js runs its scramble search in a module web worker it starts
 * itself. When Vite bundles cubing.js together with the app, that worker ends up
 * importing the main app chunk, which touches `document` and crashes inside the
 * worker, so production builds fell back to random-move scrambles. Bundled on its
 * own with esbuild (code splitting, ESM, as cubing.js documents), every chunk is
 * cubing.js code only and the worker starts cleanly.
 *
 * Runs before `dev` and `build` (see package.json). The output is git-ignored.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dest = join(root, 'public', 'vendor', 'cubing')
const version = JSON.parse(readFileSync(join(root, 'node_modules', 'cubing', 'package.json'), 'utf8')).version
const stamp = join(dest, '.version')
const STAMP = `${version}+esbuild-1`

if (existsSync(stamp) && readFileSync(stamp, 'utf8') === STAMP) {
  console.log(`cubing.js ${version} already built in public/vendor/cubing`)
} else {
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })
  await build({
    absWorkingDir: root,
    stdin: { contents: "export { randomScrambleForEvent } from 'cubing/scramble'", resolveDir: root, loader: 'js', sourcefile: 'scramble.js' },
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    outdir: dest,
    entryNames: 'scramble',
    chunkNames: 'chunks/[name]-[hash]',
    logLevel: 'warning',
  })
  writeFileSync(stamp, STAMP)
  console.log(`built cubing.js ${version} scramble bundle in public/vendor/cubing`)
}
