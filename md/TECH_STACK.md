# Approved Technology Stack

Implementation review: 2026-11-20. Recorded package versions are from 2026-11-06. The authoritative version list is the repository's `package.json` and `package-lock.json`; the initial npm registry review was performed on 2026-11-02.

NextAuth replaced Better Auth, and npm is the only package manager.

Although Prisma CLI labels the latest release as an RC, the project deliberately uses stable version 7.10.1 to match the client and adapter.

## Installed versions

| Package                   | Recorded version |
| ------------------------- | ---------------: |
| @fontsource/vazirmatn     |            5.3.0 |
| @gsap/react               |            2.1.2 |
| @hookform/resolvers       |            7.0.1 |
| @next/env                 |           16.4.6 |
| @next-auth/prisma-adapter |            1.0.7 |
| @prisma/adapter-pg        |           7.10.1 |
| @prisma/client            |           7.10.1 |
| @radix-ui/react-slot      |            1.5.0 |
| @tanstack/react-query     |          5.105.1 |
| class-variance-authority  |            0.7.1 |
| clsx                      |            2.1.1 |
| gsap                      |           3.15.0 |
| lenis                     |           1.3.27 |
| lucide-react              |           1.66.0 |
| next                      |           16.4.6 |
| next-auth                 |          4.24.15 |
| next-intl                 |           4.14.9 |
| pg                        |           8.23.1 |
| react                     |           19.3.1 |
| react-dom                 |           19.3.1 |
| react-hook-form           |           7.91.0 |
| server-only               |            0.0.1 |
| tailwind-merge            |            3.7.0 |
| zod                       |            4.6.7 |

## Development tools

| Package              | Recorded version                  |
| -------------------- | --------------------------------- |
| @tailwindcss/postcss | 4.3.3                             |
| @types/node          | 24.19.2                           |
| @types/pg            | 8.23.1                            |
| @types/react         | 19.3.0                            |
| @types/react-dom     | 19.3.0                            |
| @typescript/native   | npm:typescript@7.0.2              |
| oxlint               | 1.90.0                            |
| prettier             | 3.9.10                            |
| prisma               | 7.10.1                            |
| shadcn               | 4.23.0                            |
| tailwindcss          | 4.3.3                             |
| tsx                  | 4.23.15                           |
| tw-animate-css       | 1.4.0                             |
| typescript           | npm:@typescript/typescript6@6.0.2 |
| vitest               | 5.0.5                             |

## Decisions

The official `@supabase/supabase-js` SDK is pinned to 2.119.2 for category images. Existing Sharp support converts images before they are stored in a private bucket. See [Architecture: catalog management](ARCHITECTURE.md#catalog-management). Storage activation depends on a server-side key.

Pagination uses Next Link, the Next.js Form component, and standard daisyUI elements in one shared component. See [shared pagination](DESIGN_SYSTEM.md#shared-pagination).

The admin panel uses existing dependencies: daisyUI for tables, role badges, controls, colored tooltips, and native `details`/`summary` sidebar groups; native dialogs and `useActionState` for confirming operations; GSAP for results opacity transitions and the mobile drawer; SplitText for headings and subtitles in each route's stable layout; and the shared Web Animations API for locale transitions. Its particle waves reuse the account page's Canvas. Appearance specifications are in the [design system](DESIGN_SYSTEM.md#admin-panel).

- Next.js App Router and React with strict TypeScript.
- Tailwind and daisyUI for themes and standard components; Lucide icons and the Vazirmatn Persian font. shadcn tooling remains installed.
- Tailwind utilities are the primary way to style JSX directly. Use raw CSS only for specific complex cases. The full contract is in [DESIGN_SYSTEM.md: UI and motion rules](DESIGN_SYSTEM.md#ui-and-motion-rules).
- GSAP and `useGSAP` power product transitions and drag interactions; SplitText powers active Title/Subtitle animations. Button hover uses Tailwind transitions. ScrollTrigger and Lenis are installed but not used in the current hero. See [DESIGN_SYSTEM.md: UI and motion rules](DESIGN_SYSTEM.md#ui-and-motion-rules) and [Architecture: home page and product display](ARCHITECTURE.md#home-page-and-product-display).
- next-intl handles Persian/English and RTL/LTR. Topic-based catalogs live in `messages`; TypeScript checks keys, ICU formats messages, and Vitest checks the AST for hardcoded UI text. See [Architecture: translatable text boundary](ARCHITECTURE.md#translatable-text-boundary).
- TanStack Query, React Hook Form, and Zod.
- PostgreSQL on the existing Supabase project in Frankfurt. Server connections use Prisma 7.10.1 and `pg` with the Session pooler and full TLS validation; `SELECT 1` succeeded. Three initial migrations and owner protections have been applied. Twelve application tables and Prisma metadata exist, and real registration, sign-in, sessions, and sign-out have been tested. Commands and results are in [DEVELOPMENT.md: database connection](DEVELOPMENT.md#database-connection).
- Stable NextAuth 4.24.15; version 5 is still beta and is not installed.
- The official `@next-auth/prisma-adapter` 1.0.7 is installed for NextAuth 4. Email/password sign-in uses Credentials, JWT sessions, and Node's built-in scrypt hashing. Supabase Auth is not used.
- Oxlint and Prettier; the initial ESLint setup was removed.
- Lightweight Vitest setup; Playwright and axe are not part of the base installation.
- Nodemailer was removed because of a secure-version conflict with the authentication package's peer dependency.
- Sharp 0.35.5 validates and converts profile photos to WebP. Product images are validated with Sharp and stored in a private Supabase bucket. See [Architecture: catalog management](ARCHITECTURE.md#catalog-management).
- Application hosting, SMS, payment gateway, and AI provider have not been selected.

## References

- https://next-auth.js.org/getting-started/example
- https://authjs.dev/getting-started/installation
- Exact installed versions and transitive dependencies: `package-lock.json`

## Site identity and themes

All 35 official themes in daisyUI 5.7.50 are available for direct selection of the four admin themes; `TechLight`/`TechDark` are excluded from that page and the admin's saved choices. The user theme dialog always starts with the fixed site theme and ends with the custom color; the four admin choices appear between them. A custom color starts from the brand default for light or dark mode. next-intl translates theme names; React handles interaction and replacement of the oldest choice, while Tailwind handles opacity transitions. No new dependency was added. See [DESIGN_SYSTEM.md: themes and color](DESIGN_SYSTEM.md#themes-and-color).

## Migration to daisyUI

daisyUI 5.7.50 was added to `devDependencies`. Refer to the current design system for the theme list and light/dark mapping: [DESIGN_SYSTEM.md: themes and color](DESIGN_SYSTEM.md#themes-and-color).
