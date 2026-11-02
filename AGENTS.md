<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

Use npm only. Keep package-lock.json. Read md/README.md and md/TECH_STACK.md before changes. Use stable compatible releases, NextAuth (not Better Auth), Oxlint, and a lightweight Vitest setup. Keep project documentation in root md/.

Use daisyUI themes and standard component classes. Keep only brand color overrides in styles/brand-themes.css. Do not recreate a parallel token generator or global input/button styles.
