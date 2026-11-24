# Development Guide

## Prerequisites and setup

Use Node.js 24 and npm 11, as specified by the `engines` field in `package.json`. npm is the only package manager; keep `package-lock.json` and do not replace it with another lockfile.

```bash
npm ci
npm run dev
```

Before starting the server, configure the local environment as described in [Database connection](#database-connection), then run `npm run db:generate`. `generated/prisma` is not tracked in Git and must be generated after cloning. The example environment file is only for setup; do not overwrite an existing private file.

The development server usually uses port 3000. If that port is busy, use the URL printed by Next.js. Package versions and dependency decisions are in [TECH_STACK.md](TECH_STACK.md); service status is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Deploying to Vercel

Import the GitHub repository into Vercel through Add New → Project. Set Framework to Next.js, Root Directory to the repository root, Node.js to 24.x, Install Command to `npm ci`, and Build Command to `npm run build -- --webpack`. Keep the default Output Directory. Webpack is currently the project's verified production build path.

Set the following privately in Production Environment Variables:

| Variable              | Value                                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Existing pooler connection with a percent-encoded password, `sslmode=verify-full`, and `sslrootcert=certs/supabase-prod-ca-2021.crt`; use a relative Linux path, not a Windows path |
| `NEXTAUTH_SECRET`     | Random production secret with at least 32 characters                                                                                                                                |
| `NEXTAUTH_URL`        | HTTPS origin of the final domain, with no extra path                                                                                                                                |
| `SUPABASE_URL`        | HTTPS URL of the Storage project                                                                                                                                                    |
| `SUPABASE_SECRET_KEY` | Private server key for category images; never use the `NEXT_PUBLIC_` prefix                                                                                                         |

The public CA certificate is added to the server output trace through `outputFileTracingIncludes` in `next.config.ts`, because its path comes from an environment variable and cannot be discovered statically. None of the variables above use the `NEXT_PUBLIC_` prefix. Do not upload local environment files or OWNER variables; the owner account already exists in the database. `DIRECT_URL` is not needed at runtime, and migrations or owner provisioning must not be added to the Build Command.

After choosing the domain, match `NEXTAUTH_URL` to it; an environment change requires a redeploy. Use a test database and a separate secret for Preview; do not automatically connect Preview to the production database. After deployment, check the home page, locale and theme changes, sign-in, session, and sign-out on the HTTPS domain. A successful local build does not verify the database connection in Vercel's runtime.

Official references: [Node.js on Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) and [Managing environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables).

## Routine commands

### Admin test account

The `test@gmail.com` account is provided for manual sign-in and product management checks. Obtain its password from the private information supplied by the project owner; do not record it in documentation or repository code. Check the account role and enabled status before testing. Create test products as drafts.

### Product management review

Category list skeleton review, 2026-11-24: the dev mode was checked in Persian/English and light/dark themes, including the return to real content. In the five-row sample, `tbody` remained 404 px high and retained five rows before and after the skeleton. This result applies to the current sample data; initial loading does not know the result count in advance. Three no-image vector concepts using the existing logo and light/dark versions were generated and visually reviewed; replacing the active artwork awaits the owner's choice.

After this change, `npm run check` passed with 136 tests in 18 files, and the production Webpack build succeeded.

Custom slug review, 2026-11-24: automatic generation from the English name and preservation of a manually edited value after changing the English name again were checked in product and category forms. Submitting a category with an existing custom slug produced a duplicate error and created no record. The soft error was reviewed in both languages and themes; computed text and icon sizes were both 14 px. The category table shows only the current locale's name. Required fields have a star; the contract is in the design system and custom slug behavior is documented in architecture.

`npm run check` passed with 136 tests in 18 files during this review. Two new tests cover English-name slug conversion, characters, and the custom slug length limit.

#### Category images

Skeleton and no-image review, 2026-11-24: the create/edit form was connected to `CategoryEditorSkeleton` and `new/loading.tsx`. The dev switch, skeleton, and return to the form were checked in Persian/English and both themes. Input, image, and button positions align with the form. The downloaded `public/images/no-image.png` was viewed in the form and in image-free table rows; `complete/naturalWidth` confirmed that the local file loaded. `npm run check` passed with 136 tests in 18 files. The asset source and specifications are recorded in architecture.

The production build with `npm run build -- --webpack` succeeded after adding form loading and the local image.

Shared component review, 2026-11-24: the account and category areas use `ImageEditor` and `ImagePreview`. The modal, no-image state, and shared controls were checked on both pages in Persian/English and both themes. Selecting a real file in the shared modal, previewing the crop, changing zoom, confirming the modal, and saving the category through return to the list all succeeded. The saved image appeared after reopening edit; image deletion and cancelling deletion were also checked. The internal file picker limitation recorded in an earlier test did not recur. The test account details were not changed during this review.

After extracting the shared component, `npm run check` passed with 134 tests in 17 files, and `npm run build -- --webpack` succeeded.

On 2026-11-23, migration seven added the nullable `Category.imagePath` column and was applied to the database; `db:migrate:status` confirmed synchronization. On 2026-11-24, the owner configured the private key in `.env.local`, and real Storage upload and retrieval succeeded. Forms without images do not need the key. In deployment, set the existing project key only in the host's private environment as `SUPABASE_SECRET_KEY`; the old `SUPABASE_SERVICE_ROLE_KEY` is also supported. See [API Keys](https://supabase.com/docs/guides/api/api-keys). Never record the key in Git, chat, or Markdown.

The form upload is multipart. The Server Action limit is 3 MB so the allowed 2 MB file plus form overhead fits. Sharp accepts only single-frame JPEG/PNG/WebP files up to 16 million pixels. The file key is random and the final format is WebP; the raw file is not stored in Storage. The private bucket is created on the first valid upload.

After adding images, `npm run check` passed with 134 tests in 17 files, and the Webpack build succeeded. Tests cover actual file type, size/pixel limits, WebP conversion, authorization, preserving the previous image, replacement and deletion, conflicts, and compensation for database failure. The retrieval route also tests authorization and prevention of public caching.

Real integration test, 2026-11-24: after signing in with the test account, a multipart request was sent to the Server Action. Creating a category with an image, storing its path in the database, returning WebP with `private, no-store`, replacing the image and removing the old file, deleting the image and receiving 404, uploading again, confirming the bucket is private, and rejecting public access all succeeded. “Test photo category / Image Test Category” with slug `category-image-check-20261124` and one sample image was left for review. The in-app browser file picker did not respond; the multipart request was sent over HTTP, so clicking the file picker was not counted as a successful test.

In the browser, the table image and edit preview were viewed in Persian/English and both light/dark themes. Changing locale preserved the edit ID. Submitting the English form while keeping the previous image returned to the list; deleting the image and then cancelling the Persian form preserved the saved image. Native Chrome file selection was not checked this time because the minimized-window tool was limited.

Category operation review, 2026-11-23: `npm run check` passed with 116 tests in 14 files, and the final Webpack build succeeded. New tests cover ADMIN/OWNER authorization, rejecting guests/customers, validation, edit conflicts, duplicate slugs, deletion only when no product references the category, and a foreign-key error when a product is added concurrently. In the browser, a populated edit form, saving without changing test account data and returning to the list, opening the delete confirmation, and cancelling it were checked; no real category was deleted. The result counter was moved to the start of shared pagination, and category cells are centered. The current contract is in [Design system: shared pagination](DESIGN_SYSTEM.md#shared-pagination).

Table and category review, 2026-11-23: the shared `components/ui/table.tsx` is used by users, products, and categories. The gradient create button beside the category heading links to `/[locale]/admin/categories/new`; the create form and products-return link were removed from the list. `npm run check` passed with 106 tests. The Webpack build succeeded before final cell alignment, header wrapping, and mobile search-width fixes; `check` passed again after those fixes.

The category list and create form were checked in the browser in Persian/English and light/dark themes. The users table and its skeleton switch, and the products table, were also checked after extracting the shared table. At 390 px width, RTL category horizontal scrolling moved from zero to -325 px while the first column stayed fixed. The browser size was restored after the test. This does not replace a physical-device test or a full accessibility audit.

Route review, 2026-11-23: categories, product creation, and product editing moved to separate pages. `npm run check` passed with 106 tests, and `npm run build -- --webpack` succeeded. Saving the same test product on its standalone page and returning to the list was confirmed in the browser.

On 2026-11-23, `npm run check` passed with 106 tests, and the Webpack build succeeded after correcting the loading-state translation. Like other admin panel components, the product skeleton uses the client-side translation provider.

In the in-app browser, signing in with the test account as ADMIN, creating category “Test accessories” (`test-accessories`), and creating the draft product “Tech Shop test headphones” (`tech-shop-test-headphones`) were confirmed. The product has one black variant with SKU `TEST-HEADPHONES-BLACK`, price 25,000,000 IRR, and stock 5. This data was kept for follow-up tests. Reopening the form showed saved values and bilingual names and descriptions. The list was checked in Persian/English and light/dark themes. This was not a performance measurement or full accessibility audit.

| Command                     | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `npm run dev`               | Start the Next.js development server                    |
| `npm run build`             | Create a production build                               |
| `npm start`                 | Run the production output after building                |
| `npm run lint`              | Run Oxlint with warnings denied                         |
| `npm run typecheck`         | Generate Next.js types and check TypeScript             |
| `npm test`                  | Run Vitest                                              |
| `npm run test:watch`        | Run tests in watch mode                                 |
| `npm run format`            | Format the project with Prettier                        |
| `npm run format:check`      | Check formatting without changing files                 |
| `npm run check`             | Run lint, typecheck, tests, and formatting check        |
| `npm run assets:generate`   | Generate the logo, favicon, and palette previews        |
| `npm run db:generate`       | Generate Prisma Client from the schema                  |
| `npm run db:validate`       | Validate the database schema                            |
| `npm run db:check`          | Test a real Prisma connection with `SELECT 1`           |
| `npm run db:migrate:status` | Show database migration status                          |
| `npm run db:migrate:deploy` | Apply reviewed migrations                               |
| `npm run auth:check`        | Optionally test authentication with a temporary account |
| `npm run owner:provision`   | Create or check an OWNER account offline                |

## Change conventions

- Before changing a Next.js API or convention, read the relevant guide in `node_modules/next/dist/docs`; do not rely on knowledge from earlier versions.
- Tailwind is the primary styling method and daisyUI is the component and theme reference. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- Choose stable, compatible direct dependencies. Do not use beta/RC releases, `--force`, or `legacy-peer-deps` to bypass incompatibilities.
- NextAuth is the selected authentication solution; do not replace it with Better Auth.
- Put shared components in `components` and shared logic in `lib` or `hooks`. Responsibilities are described in [ARCHITECTURE.md](ARCHITECTURE.md).
- Keep documentation organized by topic in `md`; do not create a separate document for every component.

## Change verification

Run checks appropriate to the scope of a code change. Before preparing a change set for commit, these commands are the project's full current check:

```bash
npm run check
npm run build
```

The lightweight Vitest setup uses the Node environment and one worker, without parallel test files. Tests live in `tests` and cover themes, bootstrap, color and contrast, translations, validation and password hashing, registration, session callbacks, and role authorization. The latest current result is recorded in [Admin panel review](#admin-panel-review); dated reports below describe results from their stated dates. The authentication integration test runs separately with `auth:check`; purchasing has not yet been implemented or tested.

Real browser checks are required for visual and animation changes. Check the initial state, motion in progress, final state, repeated interactions, and the main button path. For product transitions, switch between all three products several times. For responsive changes, check relevant widths and horizontal scrolling. Browser review does not replace physical-device testing or a comprehensive accessibility audit.

Playwright, axe, jsdom, and multi-stage CI are not part of the base dependencies. Add automated browser tests when implementing essential sign-in or purchase flows, based on their real behavior.

### Theme settings review

Last review: 2026-11-20. `npm run check` passed with 96 tests in 12 files, including lint, TypeScript, Vitest, and formatting. The latest Webpack build succeeded after layout and loading-state changes. The final hover, translation, and back-button changes were followed by `check`; no new build was run for those three changes.

Six migrations exist; migration six was applied to the database and separated the two fixed brand themes from the admin's four choices. Tests cover ADMIN/OWNER authorization, rejecting guests and customers, requiring four distinct official names, rejecting `TechLight`/`TechDark` in admin submissions, save failures, matching the list to daisyUI, restoring brand/custom themes, color validation, system mode, and broken or blocked storage.

Browser review confirmed:

- Six user options: fixed site theme first, four admin themes, and custom color last; immediate color change, persistence after reload, and brand color reset.
- Four direct-selection cards, replacing the oldest choice after a fifth selection, several consecutive selections, and order preservation after saving. Test selections were restored to the original array and order.
- Six columns on desktop with no internal grid scrolling; horizontal sidebar/content position and initial-page `scrollY` stayed fixed when switching between users and theme settings.
- Selected-card opacity 1 and other-card opacity 0.6; actual hover raised it to 1, and pointer exit returned it to 0.6 over 0.25 seconds in light and dark themes.
- Filter and count beside the divider, Latin `04/04` counter, no search, success message on the theme page, and Persian/English translations.
- “Site default theme” activated both `TechLight` and `TechDark`; the four-choice array was identical before and after.

Mobile visuals, independent ADMIN sign-in, and offline-network simulation were not checked in the browser; authorization and save failure have server tests. This report does not replace a full accessibility audit or physical-device test. Current behavior is detailed in the [design system](DESIGN_SYSTEM.md#themes-and-color) and [architecture](ARCHITECTURE.md#navigation-and-shell).

After a schema change, the old Prisma client in dev memory is no longer valid; `getDb` checks the current schema version before rebuilding the client.

### Admin panel review

#### Final UI state, 2026-11-20

The sidebar is a tree. “Settings” is a native `details`/`summary` control that opens and closes on click or Enter/Space; only the “Theme” child is a link. The standalone `SettingsOverview` page was removed, and `/[locale]/admin/settings` redirects to the theme page. The active route's group opens automatically. On mobile, the parent control keeps the drawer open and selecting a child closes it. The final gap between the parent and submenu is 8 px, measured in Persian/light and English/dark in the browser. Collapsed mode and tooltips were also checked.

Heading and subtitle live in the stable users and theme layouts and shared `AdminPageFrame`. Their main animation runs on entry but does not restart when skeleton data is replaced or sorting changes. Loading and data frames showed the motion continuing and the heading frame coordinates staying fixed; after entry, sorting did not create a new heading transform. The table frame uses a minimum of `min(70dvh, 30rem)`; the final measured height at the checked viewport was 480 px. The 464 px value belongs to an earlier version and is not current. The top-bar search row keeps its space when opening the theme page. Current rules are in the [design system](DESIGN_SYSTEM.md#admin-panel), and layout responsibilities are in [Navigation and shell](ARCHITECTURE.md#navigation-and-shell).

The no-photo avatar in the panel bar was checked with a signed-in account. Its gradient background uses theme color variables directly. The initial or icon is a separate span with its own one-second color transition. Removing that transition showed the initial and root changing color together, but the user preferred the previous behavior, so the independent transition was restored. Intermediate frames of the initial and background colors were checked separately; an earlier table-avatar check alone did not verify the panel-bar avatar or its initial color.

#### Validation scope for recent changes

The latest full code check was `npm run check`, with 96 tests in 12 files, covering lint, TypeScript, Vitest, and formatting. The Webpack build succeeded after changing the group behavior and settings-route redirect. The final group-arrow position, 8 px gap, and formatting were changed after that build; those adjustments were checked in the browser and with Prettier, but were not followed by a new build. No new application tests or build were run for this documentation update.

Browser checks covered desktop, 390 px width, Persian/English, light/dark, opening and closing the group, keyboard use, child navigation, the legacy route redirect, and collapsed mode. Only the browser's local theme preference changed; saved admin choices and account data were not changed. Physical phone testing, laboratory CLS measurement, and reduced-motion simulation were not performed.

#### Admin users review

Review, 2026-11-20: `npm run lint`, `npm run typecheck`, and `npm test` passed; Vitest reported 68 tests in 11 files. Prettier checked the changed files. No new production build or full database integration test was run for these changes; an older Webpack result is not a fresh build.

Panel tests use a mocked database to cover operation authorization, owner protection, request version checks, deleting users/admins, preserving orders when deletion is rejected, independent role/status changes, sorting before pagination, and omitting admin/owner emails from data sent to an ADMIN viewer. Sign-in tests show the disabled-account message only after a correct password and retain the generic error for an incorrect password.

In the in-app browser, the table and glass confirmation dialogs, numeric dates, current-account row, icons and tooltips, role/status sorting in both directions, preserving sort while filtering, and cancelling operations were checked. Visual review covered Persian/English, light/dark, and 390 px mobile width. Preserving the collapsed sidebar across locale changes and navigation was also checked. No real account was deleted; deletion results come from mock tests. The ADMIN email limitation was checked with server tests, not a separate browser sign-in as an admin. In the 2026-11-20 review, the mobile scrolling table using `table-pin-cols` was checked in both directions: after about 399 px of horizontal scroll, the first column stayed fixed. Also checked were removing the mobile divider, the soft-error filter reset button while preserving sorting, primary header icons, and a soft icon matching the modal title. Modal button alignment is right in English and left in Persian.

The 2026-11-20 mobile review checked the user column shrinking from 176 px to 72 px after horizontal scrolling and returning to its initial width at the start of the table. Expanded names and emails use a single line and ellipsis; collapsed mode shows only the avatar. Cancel-button hover was checked in Persian/English and light/dark themes. The full `npm run check` passed, including project-wide formatting and the same 68 tests.

After session reading moved to the request boundary, reloading the panel was checked with no NextAuth random-value prerender error. This boundary is documented in [Architecture: authentication](ARCHITECTURE.md#authentication).

## Assets and generated files

### Files to include in commits

Version the schema, all versioned migrations and `migration_lock.toml`, provisioning and verification scripts, `package-lock.json`, the example environment file without real values, and the public CA certificate along with their implementation. Never commit local environment files, real `OWNER_EMAIL` or `OWNER_PASSWORD`, `generated/prisma`, `.next`, `node_modules`, or `.taste-skill` outputs. Regenerate Prisma code with `db:generate`; the public CA certificate is not a private key. Current documentation is indexed in `md/README.md`, while future work is tracked in [TODO](TODO.md) and [ROADMAP](ROADMAP.md).

The logo geometry source is `scripts/generate-logo.mjs`; generate outputs with `assets:generate`. Site images are in `public` and should be committed with the related change. Do not commit `.next`, `node_modules`, TypeScript build-info files, or local design-review output in `.taste-skill`. Asset guidance and image provenance are in `DESIGN_SYSTEM.md` and `ARCHITECTURE.md`.

## Database connection

Use the existing Supabase project named `tech-shop` in Frankfurt; do not create a new project. Copy `.env.example` to `.env.local` and enter the percent-encoded password only in the local file. Git ignores every environment file except the example without secrets. The connection variable must not use the `NEXT_PUBLIC_` prefix.

`DATABASE_URL` is for the application and `DIRECT_URL` is optional for Prisma CLI; without `DIRECT_URL`, the CLI uses `DATABASE_URL`. The current connection uses the Session pooler on port 5432 because the direct route requires IPv6. Use `sslmode=verify-full` in both URLs. Do not bypass an invalid certificate by disabling TLS; specify the official CA with `sslrootcert` if needed. Next.js, the CLI, and test scripts read environment variables in the same order as standard Next.js.

```bash
npm run db:generate
npm run db:validate
npm run db:check
npm run db:migrate:status
```

For the authentication integration test, run the local server with `NEXTAUTH_URL` set to the same origin, then run `npm run auth:check`. The test origin defaults to `http://localhost:3100` and can be changed with `AUTH_TEST_URL`; only `localhost` or `127.0.0.1` is accepted. The test creates a `CUSTOMER` with a random `example.invalid` email and deletes that user and its dedicated buckets afterward. It does not print a secret, cookie, or test password. This opt-in command is not part of the routine check because it writes test data to the real database. Repeated runs still count toward the global sign-in limit.

`db:check` loads the same server module as the application and runs a real Prisma/pg `SELECT 1`; it does not print raw errors. The script runs with the `react-server` condition so the server-only boundary works in Node. There is no public database-health endpoint. Build and typecheck generate the client before running; generation does not need a password or database network access.

The public certificate `certs/supabase-prod-ca-2021.crt` came from the [official Supabase download repository](https://supabase-downloads.s3.ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt) and is not a secret. The application URL loads it through `sslrootcert`; the path must exist on the host. CLI configuration makes the path absolute and maps TLS options to `sslcert` and `sslaccept=strict` so the schema engine also verifies the CA and hostname. Its SHA-256 fingerprint is `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`; it is valid through 2031-04-26. Review it before expiry or a server certificate change.

The schema currently has 12 initial storefront and NextAuth models. All three migrations were applied to the existing Supabase project with owner approval on 2026-11-06. Prisma migrate status reported “up to date”; migrate diff from database to schema reported “No difference detected.” The unique OWNER index and protection trigger exist in the database, and the trigger is active. Supabase-owned `auth` and `storage` schemas were not changed. Do not run `db push` or `reset` on this project; `migrate dev` requires an independent development database and shadow database.

NextAuth requires a random `NEXTAUTH_SECRET` with at least 32 characters and `NEXTAUTH_URL` set to the full application origin in the private environment. The local secret was generated without printing it. For a public deployment, obtain the secret from a secret manager and change `NEXTAUTH_URL` to the HTTPS domain. When testing on another port, override the variable only for that process so registration Origin validation remains correct.

Final review, 2026-11-06: `npm run check` passed with 44 tests, and the Webpack build succeeded. `npm run auth:check` against a local production server and real Supabase confirmed rejecting guests, invalid Origin, and a 7-character password; accepting an 8-character password; password hashing; ignoring an input OWNER role; preventing password and role overwrite through duplicate registration; rejecting an incorrect password; successful sign-in; session persistence; protected access; sign-out; revocation through `sessionVersion`; and sign-in rate limiting. Browser review also confirmed registration, incorrect-password error, sign-in, session persistence after reload, and sign-out. Test accounts and dedicated counters were deleted; no test accounts remained.

Previously confirmed build limitation: `npm run build` with Turbopack failed before connecting because the CSS processing worker exited with an internal error. The failure also reproduced outside the sandbox. A fresh `npm run build -- --webpack` succeeded; the default engine was not changed. The TLS connection issue was resolved with the official CA, and the Prisma/PostgreSQL test succeeds.

## Owner role review

The OWNER account was created on 2026-11-06 using private local environment values. Exactly one owner, enabled status, hash match, and real sign-in/sign-out with an OWNER session role on ports 3000 and 3100 were confirmed. No email or password was recorded in output or documentation.

For provisioning outside the application, set `OWNER_EMAIL` and `OWNER_PASSWORD` only in the local environment, then run `npm run owner:provision -- --check` followed by `npm run owner:provision`. The script does not allow a second owner or overwrite a password. If the email already has an account, its password must match and it must be enabled; upgrading it increments `sessionVersion`. Rerunning for the same owner only validates it. After changing the schema and regenerating Prisma, restart the dev server so the client cached in `global` does not keep the old schema.

On 2026-11-06, migrations `20261106123211_add_owner_role` and `20261106123212_protect_single_owner` were prepared; the previous initial migration was not rewritten. All migrations were applied to a local temporary PostgreSQL database with PGlite 0.5.15. Creating one OWNER and two ADMIN users succeeded; creating or promoting a second owner was rejected with 23505; deleting, demoting, changing email/password, or disabling the owner was rejected with 42501; incrementing the owner's `sessionVersion` and deleting a CUSTOMER succeeded. This test was not run against Supabase.

`npm run check` passed with 44 tests covering registration attempts with ADMIN and OWNER roles, refreshing an old OWNER role from the database, and role-change authorization rules. Temporary test tooling was installed only in `.taste-skill`; base dependencies did not change. The owner migrations are now applied to Supabase, and the index and active trigger have been confirmed. The real OWNER account was created outside public registration using private environment values.

## Dependency security

The dated development dependency report is in [SECURITY.md](SECURITY.md). Do not report an old audit result as a fresh run. Upgrading the component installation tool or changing registries requires checking compatibility ranges and reviewing inputs. shadcn CLI remains installed; the current UI uses daisyUI.

## English version review

On 2026-11-05, `npm run check` passed with 24 tests and `npm run build` succeeded. The production English version was checked in the browser at widths 390 and 1440: locale switching in both directions, document direction, mobile menu, category and search results, theme settings, and product introduction. Repeated transitions among all three products and intermediate frames were checked; no horizontal scrolling appeared at width 390. No physical phone was tested.

In a later locale-transition review, the dark navy theme and cobalt palette were preserved while switching between Persian and English. Light mode, browser Back, repeated transitions among all three products, and intermediate RTL/LTR frames at width 390 were also checked. Locale switching does not reload the page and preserves the selected product.

After replacing the fade with layout movement, an intermediate locale-transition frame was checked in the browser: body opacity stayed at 1 while text and product had active transforms. Switching locales both ways, changing products afterward, and mobile width 390 were checked; lint, TypeScript, 24 tests, and the build succeeded.

## UI copy check

Before adding visible text, add a meaningful key to both translation catalogs and read it with `useTranslations` in the component. Use ICU parameters for sentences with variables; do not join separate language fragments in JSX. Translate labels for generic components at the call site and pass them in. The full contract is in [Architecture](ARCHITECTURE.md#translatable-text-boundary).

`tests/ui-copy.test.ts` uses the AST to check component and TSX files for direct JSX text, literals in text attributes, display-data fields, and default label values. This is not full data-flow analysis; computed strings and future service data still need review. Catalog tests also check nested key parity, non-empty text, English values, and parameter parity.

Review, 2026-11-05: the Latin names of three products, the default logo label, and tab title were moved to catalogs; color label formatting and text markers are also read from catalogs. `npm run check` passed with 26 tests, and `npm run build` succeeded.

### Combined locale and theme test

On 2026-11-05, the theme transition was changed to 1,000 ms. In the production browser, six combined locale/theme changes on desktop, six rapid consecutive mode changes, and four combined changes at width 390 were checked. An intermediate sample simultaneously showed `transitionDuration` of 1s, distinct intermediate colors, and `localeMoving` active. At the end, `data-theme-changing` and `data-locale-moving` were cleared, the checkbox matched the final theme, mobile had no horizontal scrolling, and there were no console errors. These results apply to the browser tested; no physical phone or reduced-motion simulation was used.

## Password recovery email

To deliver email, set `RESEND_API_KEY` and `RECOVERY_EMAIL_FROM` in the private environment. The sender address must belong to a domain verified in Resend. Recovery links are built from `NEXTAUTH_URL`. If any of these three variables is empty, “Forgot password” is hidden on the sign-in form.

## Using pagination

Use `components/pagination.tsx` for new lists; do not duplicate page-range calculations in the page. Prop names and visual rules are in the [shared pagination reference](DESIGN_SYSTEM.md#shared-pagination). Range logic is tested in `tests/pagination.test.ts`. Check browser changes in both languages, both themes, and mobile widths.

Skeleton review, 2026-11-20: `npm run check` passed with 68 tests. Account and user loading components were viewed in a temporary preview route in Persian/English and light/dark themes; the temporary route was removed afterward. This was a visual component review; network throttling and full session/panel navigation were not tested in that pass.

The panel top bar also shows skeletons in place of the name and avatar while initially reading the session. The production Webpack build succeeded after adding loading boundaries.

### Development skeleton test switch

In `npm run dev`, a fixed “Test skeleton (dev)” button appears at the bottom of the page. Clicking it switches the account area, header account icon, panel-bar name and avatar, and user list to skeletons; “Show content (dev)” restores them. The switch changes presentation only; it does not bypass requests or server authorization. Its state is in memory and resets on refresh. In production, the test provider is not installed and the hook always returns false; there is no button or URL parameter to enable it.

Development switch review, 2026-11-20: `npm run check` passed with 68 tests. The account switch and return to real content were checked in both languages and themes; the user list and panel account bar were also checked. The button sits above the Next.js indicator so they do not overlap.

The account's initial Suspense fallback also uses `AccountPageSkeleton`, with a two-column frame, tab row, and the same minimum page height. Review, 2026-11-20: the account summary and skeleton were compared in the browser in Persian/English and light/dark; avatar and row positions match the real content. `npm run check` passed with 68 tests. After completing the fallback frame and accessible labels for disabled tabs, lint and typecheck passed again. No laboratory CLS measurement was performed.

Users table skeleton review, 2026-11-20: skeleton and real data were rendered in the same table. DOM measurements in Persian/English on desktop and at width 390 showed equal widths for five columns and equal heights for four rows during the dev switch. The compact mobile column also matched (first-column width changed from 176 to 72 px). Light/dark and RTL/LTR were checked in the browser. This comparison uses available data and is not a laboratory CLS measurement or network-throttling test. `npm run check` passed with 68 tests.

The production build with `npm run build -- --webpack` also succeeded after integrating the table and skeleton.

Selected no-image review, 2026-11-24: the first design with `NO IMAGE` text was checked in the Persian/English category form and light/dark themes. Two image-free table rows were checked with both light and dark assets, and both loaded successfully; changing the theme changed the image path. After adding the dark asset, the dev server was restarted so the table would detect the new file. `npm run check` passed with 136 tests in 18 files, and `npm run build -- --webpack` succeeded.
