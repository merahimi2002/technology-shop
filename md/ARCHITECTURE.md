# Architecture and Implementation Status

This document describes the application structure, component responsibilities, interaction flows, and service status. Appearance and motion rules are in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), project workflows in [DEVELOPMENT.md](DEVELOPMENT.md), and dependency versions in [TECH_STACK.md](TECH_STACK.md).

## Application structure

### Catalog management

`categories/loading.tsx` renders the same `AdminCategories` component with `loading` and empty data; the dev switch activates that same skeleton branch. No parallel loading table is created. Initial loading does not pass an unknown count to Pagination.

Regenerate the no-image artwork with `node scripts/generate-no-image.mjs`. The script reads the current logo from `public/logo.svg` and produces only the selected circuit design with `NO IMAGE` text at `public/images/no-image{,-dark}.{svg,png}`. It does not create alternate designs or a comparison page.

Route loading for `/[locale]/admin/categories/new` (create and edit) uses `new/loading.tsx` and `CategoryEditorSkeleton`. The `DevSkeletonPreview` switch displays the same component, and the parent preserves name/image state. This form skeleton is independent of the category-list skeleton.

The no-image artwork is a local brand design with the `public/logo.svg` logo, `NO IMAGE` text, and transparent 512×512 light/dark outputs. It replaces the previous downloaded asset and has no external dependency. `ImagePreview` uses `components/ui/no-image.tsx` for missing or broken images in non-circular frames; this component selects the current theme asset through `useTheme` and the `SITE_THEMES` mapping. The placeholder is not stored as a selected image or Storage data.

The UI label for `slug` is “Unique name”; the database key and API contract remain `slug`. On product and category creation, a suggested unique name is generated from the English name by lowercasing, removing punctuation, and replacing spaces with hyphens, up to 120 characters. Each field has independent state: until manual editing, changes to the English name refresh the suggestion; after manual editing, including clearing the value, it is no longer overwritten automatically. Editing an existing record preserves its saved unique name from the start. Uniqueness is still enforced by the constraint and server action; the suggestion does not guarantee uniqueness.

The shared `ImageEditor` is used for accounts and categories. `undefined` means keep the image, `null` means delete it, and a Base64 string means a new PNG crop. Account output is 160×160 and category output is 640×640. The category adapter turns the local output into a `File` on form submission; the profile API keeps its existing contract. Base64 is temporary UI state and is not saved in the category database. Shared display uses `ImagePreview`, and accepted input types/size are configured in `lib/image-input.ts`. Server validation remains independent and mandatory.

The category create/edit form has one optional image. The selected image is sent to the server only after form confirmation; cancelling does not save local selection or deletion. After checking an ADMIN/OWNER session, the server validates the actual file with Sharp and converts it to WebP up to 640×640. Only the random file path is stored in `Category.imagePath`, not image bytes or Base64.

Category files live in the private `category-images` bucket in Supabase Storage. The server SDK uses `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`); the key never reaches the client. The bucket is created on the first valid upload, and an existing public bucket with that name is rejected. Retrieval is currently allowed only through `/api/admin/categories/[id]/image` with an admin session and `private, no-store`; there is no separate storefront publication route for category images yet.

Image replacement/deletion depends on a snapshot of the previous names, slug, and path; a conflict does not delete the current image. After a successful save, the previous file is removed. If the database save fails, cleanup of the new file is attempted. Cleanup is best effort; a Storage failure may leave a private unreferenced file, and durable retry is not implemented yet.

The product list is at `/[locale]/admin/products`, product creation at `/[locale]/admin/products/new`, and product editing at `/[locale]/admin/products/[id]`. Categories have a standalone page at `/[locale]/admin/categories` and a sidebar link. It lists bilingual names, slug, and product count; category creation is at `/[locale]/admin/categories/new`, reached from the list's create button. Product editing uses a full page, not a modal. Successful saves and cancellations return to the relevant list.

Every page checks an ADMIN/OWNER session before reading data, and save actions check authorization independently. A missing product ID returns 404. Variant prices remain integer IRR strings. Product version checks and preserving existing variants during edits prevent concurrent overwrites and broken order references.

Category editing opens the create form with values populated at `/[locale]/admin/categories/new?edit=<id>`; invalid or missing IDs return 404. Edit and delete actions in `app/[locale]/admin/categories/actions.ts` check authorization independently. Update conditions include the ID and previous name/slug values so an old form cannot overwrite a newer change. Deletion is allowed only when no products reference the category; the relationship condition and foreign key also protect against a concurrent product addition. Before deletion, a modal shows the category name and explains that the operation cannot be undone.

| Path         | Responsibility                                                              |
| ------------ | --------------------------------------------------------------------------- |
| `app`        | App Router routes and APIs, layouts, metadata, and entry CSS                |
| `components` | Shared UI components and storefront compositions                            |
| `hooks`      | Shared client and animation logic                                           |
| `lib`        | Database connection, authentication, utilities, themes, and navigation data |
| `styles`     | Brand theme settings and special effects                                    |
| `public`     | Public files, logo, and product images                                      |
| `tests`      | Lightweight Vitest tests                                                    |
| `scripts`    | Asset generation, connection/auth checks, and offline owner provisioning    |
| `prisma`     | Database models and versioned migrations                                    |
| `generated`  | Generated Prisma Client; not in Git and not edited manually                 |
| `certs`      | Public CA certificate for database TLS validation                           |
| `md`         | Topic-based project documentation                                           |

## Current boundaries

The home page and storefront shell are implemented. PostgreSQL connectivity through Prisma has been confirmed. The initial storefront models and all three migrations have been applied to Supabase, and real NextAuth registration, sign-in, sessions, and sign-out were confirmed through API and browser flows. The catalog UI, inventory and cart APIs, payments, email verification, and SMS are not implemented yet. Installing a dependency does not mean its service is ready; technology choices are recorded in `TECH_STACK.md`.

## Database infrastructure

### Uploaded images and files

Profile photos are optional during registration. An authenticated PATCH to the account endpoint can replace or delete a photo. The form accepts JPEG, PNG, or WebP files up to 2 MB and sends a 160×160 crop to the API. The server checks the actual image type and size, then stores a 160×160 WebP in the user's `image` field. The NextAuth session receives only a versioned URL for uploaded photos. The image route returns only the current session owner's image. After saving, the editor refreshes the session so the header and account modal show the new photo. Product images are public. Future Supabase Storage work for private validation and publication of approved images is tracked in [TODO](TODO.md#storage-and-image-uploads). That plan is not part of the active feature set.

### Connection and generated code

`lib/db.ts` is the server-only boundary and shared Prisma entry point. `getDb()` lazily creates a client with the pg adapter; in development it uses a global to avoid creating pools during hot reload. The pool currently allows at most three connections, with a 10-second connection timeout and 30-second idle timeout. Static page generation does not open a database connection. The schema and CLI configuration are in `prisma/schema.prisma` and `prisma.config.ts`; generated client code in `generated/prisma` is excluded from Git.

Prisma does not own any Supabase-managed tables, and Supabase Auth has not replaced NextAuth. Check commands and connection status are in [Development: database connection](DEVELOPMENT.md#database-connection).

### Base models

`User`, `Account`, `Session`, and `VerificationToken` are compatible with the official NextAuth 4 adapter. `User` has a default `CUSTOMER` role, optional `passwordHash`, `disabledAt`, and `sessionVersion` for session revocation. `AuthRateLimit` stores shared database counters for sign-in and registration. `Category` and `Product` have Persian/English text; `ProductVariant` owns SKU, price, stock, and enabled status. `Cart` is unique per user and `CartItem` is unique per cart/variant pair. `Order` and `OrderItem` preserve snapshots of address, name, SKU, and price at purchase time. Deletion is restricted for a user with orders or a referenced product.

Money uses `Decimal(18,0)` and defaults to IRR (rial); display in toman requires an explicit conversion. These models do not yet implement sales APIs, inventory calculation, or payment. SQL constraints enforce non-negative price and stock, positive quantity, and normalized email. The migrations create tables with RLS and no Data API grants to `anon`/`authenticated`; current access is server-side.

### Owner and admins

`UserRole` includes `CUSTOMER`, `ADMIN`, and `OWNER`. SQL constraint `User_single_owner` makes only the OWNER row unique; there may be multiple admins. Adding the enum value and creating the index/trigger happen in separate migrations so the new value is committed before use. Public registration still creates only CUSTOMER accounts, and no public endpoint lets users choose or change their role.

`canManageUserRole` centralizes authorization for role changes: only OWNER can change non-owner users between CUSTOMER and ADMIN, or enable/disable their accounts. The owner's role and status cannot be changed in the panel. The session role is refreshed from the database each time; an old or client-supplied role is never an authorization source.

The database trigger rejects deleting the owner or changing the owner's `id`, role, email, password hash, or enabled state. Name/image changes and `sessionVersion` increments for revocation are allowed. The first owner is assigned only through an administrative operation outside the application; the owner account was created with the offline `owner:provision` command and private environment values, and sign-in was confirmed. The database guard cannot prevent a role with schema privileges from changing or disabling the trigger; the current postgres connection must be replaced by a restricted runtime role before commercial deployment.

### Authentication

The sign-in form sends a password-recovery link by email. A single-use 30-minute token is stored as a hash in the existing `VerificationToken` table. The link keeps the token in the URL fragment. Setting a new password consumes the token and invalidates previous sessions. Owner password recovery is part of account maintenance.

On the Edit profile tab, `PATCH /api/account/password` validates the current password, new password, and confirmation with Zod. After confirming the current password, the server stores the new hash and increments the session version in one conditional update. All previous sessions become invalid, and the user signs in again with the new password before returning to the account tab. Owner password changes are part of account maintenance.

`/api/register` validates the name, email, and password, hashes the password with scrypt and a random salt, then creates a CUSTOMER. Email is trimmed and lowercased; input role and other extra fields are ignored. New and duplicate email registration return the same response. This endpoint accepts only JSON from an Origin matching `NEXTAUTH_URL`, with a body up to 8 KB.

Sign-in and registration forms use the same Zod schemas as the server in `lib/auth/validation.ts`. On typing or blur, only that field is checked, and its warning clears as soon as the value becomes valid. Submission validates the full form. Invalid input is not submitted; translated errors appear beside their fields and focus moves to the first invalid field. Sign-in requires a valid email and non-empty password; registration also requires a name and a password of at least 8 characters. Warning timing and visual details are in the [design system: account page](DESIGN_SYSTEM.md#account-page).

`/api/auth/[...nextauth]` uses NextAuth 4, Credentials, and PrismaAdapter. Under the Credentials contract, JWT sessions have a max age of 24 hours; the Session table is ready for the adapter, but password sign-in does not write to it. The callback checks the user, `disabledAt`, and `sessionVersion` against the database each time and refreshes the role. Incrementing `sessionVersion` invalidates previous sessions. Passwords and hashes are not returned in the client session.

Before building NextAuth options and calling `getServerSession()`, `getCurrentUser()` waits for `connection()` from `next/server`. With Cache Components enabled, session reads and NextAuth's internal random value are deferred to the request and excluded from prerendering. Call this helper within a Next.js request context.

`getCurrentUser()` is the server-side authorization source; `/api/account` is a protected endpoint that returns 401 for guests. Check the role again in each admin endpoint; client-side display is not authorization. The client `AuthProvider` provides `SessionProvider` without making the server layout dynamic. For guests, the header account icon links to the account page in the current locale. For signed-in users, the modal displays the name and email from the NextAuth session and offers navigation to the same page and sign-out. `AccountPanel` displays sign-in, registration, session status, and sign-out on that page. The legacy address `?account=signin` still redirects the user to the account page. Email verification and external providers are not active at this stage.

Sign-in shows “Incorrect email or password” for an unknown email or incorrect password. It shows “Your account is disabled” only after verifying the correct password for a disabled account. Reaching the attempt limit shows the sign-in rate-limit message.

After successful sign-in, the default destination is the home page in the current locale. To request sign-in from another page, link to `/{locale}/account?callbackUrl=...` and encode the internal destination with `URLSearchParams`. The path, query parameters, and destination hash are preserved. External or invalid destinations return to the home page.

After successful registration, the sign-in form is populated with the submitted email and password, and the user clicks the sign-in button. This transition occurs on the same page so the return destination is preserved.

The registration form checks that the password and confirmation match. Registration sends only the name, email, and password.

A signed-in user can update their account name with `PATCH /api/account`. The server reads the ID from the session, checks Origin, JSON content type, and body size, and accepts only the name field. After saving, the session is refreshed so the page and account modal show the new name.

### Admin panel access

For an ADMIN viewer, emails of ADMIN and OWNER accounts are removed before the user list is sent to the client. Email search matches only CUSTOMER accounts for that viewer. OWNER can see emails for all roles.

User sorting uses bounded `sort=role|status` and `direction=asc|desc` parameters in the database before pagination; creation date and ID provide a stable order within tied groups. Ascending role order is customer to owner, and ascending status order is active to disabled. Search, filters, clearing filters, and pagination preserve sorting. The server session provides the current account ID to mark its row in the table.

All paginated lists use `components/pagination.tsx` and the `lib/pagination.ts` range logic. Each list's data and total page count are computed on the server. The single contract is in [shared pagination](DESIGN_SYSTEM.md#shared-pagination).

The `(store)` route group displays the storefront header on the home and account pages. Admin routes use an independent full-page layout with a sidebar and content area. Both layouts receive locale, theme, and session settings from the locale layout.

Sidebar collapsed state is held in the browser document's memory with `useSyncExternalStore`, so rebuilding the layout on the first navigation after a locale change does not reset the user's choice. A full document reload returns it to the open default.

`/[locale]/admin` is currently an empty dashboard. The user list and search are at `/[locale]/admin/users`; both pages check the session and role on the server.

Saved user images load from the protected `/api/admin/users/[id]/avatar` endpoint, which requires an admin or owner and uses `private, no-store`. The list gives the client this endpoint URL instead of the stored image string.

Site users are the first admin area. Prisma returns the list with name/email search, role/status filters, and pagination with selectable page sizes of 1, 10, 20, 50, or 100 rows. The default is 20; invalid values fall back to this default on the server. ADMIN and OWNER can view the list; only OWNER has controls to change roles/status or delete non-owner accounts. Permanent deletion requires a separate confirmation and an `updatedAt` version check; owner accounts and accounts with orders cannot be deleted. Sessions, sign-in accounts, and carts are removed by cascade rules; order history is preserved by `Restrict`. Each operation has its own confirmation modal. Changing role preserves the current status, and changing status preserves the current role. Each save action rechecks session and role and rejects a stale form. A real change increments the target account's session version so previous sessions are no longer valid after a role/status change.

`/fa/admin` and `/en/admin` are admin panel entry points. The server reads the session with `getCurrentUser()` and `canAccessAdmin` accepts only `ADMIN` and `OWNER`. Guests are sent to sign-in with the panel as the return destination; regular users return to the account page. The account modal and page use the same rule to display the admin link. Store-management tools are listed in the [roadmap](ROADMAP.md).

## Navigation and shell

The shared frame for users and theme settings is `components/admin/admin-page-frame.tsx`; their layouts install it. Heading, subtitle, and static description are outside the data-loading boundary. Suspense swaps only the content below the header between skeleton and data. Filter, sorting, and pagination updates do not remount the header. Motion rules and reserved space are documented in the [admin panel design](DESIGN_SYSTEM.md#admin-panel).

Admin sidebar items are defined as a tree. An item with children controls a group and has no page destination; only leaf items are links. The legacy `/[locale]/admin/settings` route redirects to `/[locale]/admin/settings/theme`, and the standalone settings view was removed. Access checks remain on the theme destination.

### Current structure

The desktop glass header is one row with the logo and Persian name, categories and menus, then controls. The English text beneath the logo was removed. Mobile uses a side menu and a separate controls row; the fixed search box was removed.

- `components/store/site-header.tsx`: navigation, `/` shortcut, search, and header modals.
- `lib/store-navigation.ts`: central category list.
- `components/theme-toggle.tsx`: shared light/dark control in the storefront header and admin top bar.
- `components/theme-switcher.tsx`: the six theme choices (fixed site theme, four admin themes, and custom color) in the appearance modal.
- `components/theme-provider.tsx` and `lib/site-theme.ts`: apply the user's selection, map light/dark modes, and store preferences locally.
- `components/modal-close-button.tsx`: shared close control for common modals and mobile menu; form uses `method=dialog`.
- `styles/header.css`: glass effect and browser fallback; layout is implemented with Tailwind.

### Interactions

The control group order is theme toggle, palette, cart, wishlist, account, and search. Icons have accessible names and tooltips. Search opens from the final header button or `/` key and focuses its field; the shortcut is disabled while typing in a field or while a dialog is open. Submitting the form closes the search modal and shows the result state.

Categories use native `details`, keyboard interaction, Escape, and focus exit. Modals use native `dialog` and daisyUI `modal`; Escape, the close button, and the backdrop close them. Skip link, focus behavior, and reduced-motion support are preserved.

The `site` record in `SiteSettings.themes` stores only the four official daisyUI themes. `TechLight` and `TechDark` are fixed brand options and are not valid in the admin list or stored input. Migration six removes brand themes from previous arrays and fills the space, while preserving official theme order, with `night`, `lemonade`, `halloween`, and `bumblebee`; the database default is also those four themes. The previous single `theme` column remains for compatibility but is not read.

The page is protected by `requireAdminUser`, and its Server Action rechecks the ADMIN/OWNER session. Saving accepts exactly four distinct official names. The UI shows a direct-selection circle on each card; the four selected themes appear first. Fewer than four choices remain a local draft; saving runs automatically when the fourth is selected. A fifth choice removes the oldest array entry and appends the new theme; array order is preserved in the database. The UI applies the theme before the server response, prevents concurrent submission while pending, and restores the last saved set on error. After upsert, `revalidatePath('/', 'layout')` refreshes layout data. Database reads are shared in the same request through React cache after `connection()`.

The admin “Site default theme” button calls `setTheme(brand)`; only the local appearance changes and the Server Action for saving the four themes does not run. Display names come from `siteSettings.themeNames`; the official theme ID remains stable in the database, form, and `data-theme`. Appearance, hover, and counter rules are in the [design system](DESIGN_SYSTEM.md#themes-and-color).

The user dialog has six choices: fixed `brand`, four admin themes, and fixed `custom`. `brand` and `custom` map to TechLight/TechDark based on light/dark mode. An official theme appears in its native mode and uses the paired brand theme in the opposite mode; the selected palette does not change. Initial choice is always brand with system mode.

The user's selection, mode, and four custom colors are stored in `tech-shop:theme-choice`. `parseCustomColors` accepts only six-digit hex values, with brand `DEFAULT_CUSTOM_COLORS` as its default. Bootstrap runs before hydration and the provider applies a valid choice, system mode, and custom colors. A removed official selection falls back to brand; the two fixed choices remain independent of admin settings. Resetting restores the four brand colors. The favicon is fixed, and text is translated on the client.

### Limitations and appearance reference

Search, categories, cart, and wishlist are not connected to a catalog or service and show empty/preparation states. The account page is connected to real registration and NextAuth routes. Registration, sign-in, and sign-out have been tested against the real database.

Sizing, color, and layout details are in the [design system: header and search](DESIGN_SYSTEM.md#header-and-search-layout). Temporary NavyPreview and TealPreview panels, test sliders, and their overrides have been removed; site-wide theme selection is managed in the admin panel.

## Home page and product display

This describes the current home page hero; earlier experimental settings have been replaced. Component and final motion contracts are in [DESIGN_SYSTEM.md: UI and motion rules](DESIGN_SYSTEM.md#ui-and-motion-rules).

### Content and controls

The hero has three products: Apple AirPods Max, Logitech MX Master 3S mouse, and Logitech MX Keys S keyboard. The main heading follows the UI language; the Latin name in the introduction modal comes from that locale's catalog. Images load from `public/products`; price and stock remain hidden until the catalog is connected.

Each slide uses a Subtitle with a Store icon, a Title, a Persian description, and a GradientButton with a conic gradient and horizontal arrow. The play/pause button, plus sign beside the image, caption below the image, decorative stand line, and experimental linear button were removed.

The three dots are closer to the stand: each button is 28 px, its inner dot is 9 px, and the buttons are 2 px apart. The dot and progress ring are concentric. Manual selection uses `aria-label` and `aria-pressed`.

### Layout and stand

The background spans the full width and has 40 px radii on its lower corners. The product image is shown without blur. A subtle conic gradient with primary and secondary colors and a radial mask extends behind the text and beneath the header to preserve readability in light and dark themes. The heading gradient is separate and uses only the primary palette.

The desktop scene is 520 px high and the tablet scene is 410 px; on mobile the scene ratio is 0.9. The desktop scene aligns with a `-35px` top margin. The product is scaled to 0.9 with a bottom transform origin. Each image has independent framing, including the keyboard image's transparent space.

The stand is an elliptical glass surface 94% wide and 64 px high, with a 58 px body, contact shadow, and fixed primary/secondary light. It has no additional decorative line. Raw CSS remains for glass, lighting, masks, and image framing; layout, sizing, and responsive behavior use Tailwind.

### Autoplay and transitions

- Every 6 seconds, automatic transitions coordinate text, image, and introduction with the selected product. Images are loaded in advance.
- Hover, focus, product dragging, an open dialog, the hero leaving the viewport, a hidden document, and reduced motion pause autoplay.
- A new product enters from the upper left and the previous product exits at the lower left. The shared timeline lasts 1.65 seconds with `power2.inOut`; travel depends on scene size and is capped at 230 px horizontally and 280 px vertically.
- A quick next selection is queued and runs after the current transition. The previous layer is removed at the end; outgoing text is `inert` and `aria-hidden`.
- Text groups enter from upper right and exit lower right. The next entrance begins after the previous text exits. The main heading has its own SplitText entrance and does not fade again with the group.
- Title uses scatter motion and a continuous primary gradient. Subtitle uses a special motion with 10 px translation, 25-degree rotation, and a spring curve. Details are in [DESIGN_SYSTEM.md: UI and motion rules](DESIGN_SYSTEM.md#ui-and-motion-rules).
- On hover, the button's conic gradient rotates for 300 ms. The arrow exits left and enters right over 500 ms while the text moves forward 24 px; the button width stays fixed.

### Product interaction

Pointer Events and pointer capture allow dragging by mouse or touch; travel is limited so the product does not overlap the text. Rotation follows horizontal movement and is capped at six degrees. The contact shadow moves with the product and becomes wider and fainter as it is raised; blur stays fixed.

On release, `pointercancel`, or `lostpointercapture`, the product and shadow return in 0.8 seconds with `power3.out`. Arrow keys move the product, and Home/Escape return it to center. Rotation is removed and return is immediate in reduced-motion mode.

### Structure

| File                                | Responsibility                                                           |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `components/store/product-hero.tsx` | Product data, selection, transitions, drag, and dialog                   |
| `components/title.tsx`              | Persian/English heading with continuous gradient                         |
| `components/subtitle.tsx`           | Subtitle with replaceable icon                                           |
| `components/gradient-button.tsx`    | Conic-gradient button with gradient hover, arrow, and text               |
| `hooks/use-text-reveal.ts`          | Shared GSAP and SplitText animation, cleanup, and reduced-motion support |
| `styles/hero.css`                   | Special effects and image framing                                        |
| `public/products`                   | Local product images and background                                      |

### Images and provenance

- The `hero-workspace.png` background was generated with imagegen: a quiet studio with sage/navy colors, window light, a stone desk, and a plant; no product, text, or logo.
- AirPods Max: official image downloaded during the initial implementation; the interface does not request it from the manufacturer's site.
- MX Master 3S: [official Logitech image](https://resource.logitech.com/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png).
- MX Keys S: [official Logitech image](https://resource.logitech.com/content/dam/logitech/en/products/keyboards/mx-keys-s/migration-assets-for-delorean-2025/gallery/mx-keys-s-top-view-graphite-us.png).

### Review and limitations

Manual and automatic transitions, all three product images, introductions, dragging, and shadow return were checked in the browser. In a Tailwind review, the 390 px mobile layout and centered dot rings were checked. After gradient fixes, six transitions among all three products were checked, including intermediate frames; a black arrow and repeated text rendering were fixed. Final button hover, 24 px text movement, and the arrow's full exit and re-entry were also confirmed in the browser.

Lint and TypeScript passed after the last button change. The production build succeeded after adding the conic type; the final arrow motion was checked in the browser, with lint and TypeScript, afterward. Existing project tests numbered 21 during the text-component review and passed. No physical phone or comprehensive accessibility review was performed.

### CSS integration with Next.js

Tailwind integration uses `@tailwindcss/postcss` 4.3.3 and `postcss.config.mjs`; the old direct loader was removed from `next.config.ts`. Local Next.js guide: `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`. Turbopack remains the dev and build engine.

## UI locales

The Persian version is served at `/` (and `/fa`) with `lang=fa` and `dir=rtl`; English is at `/en` with `lang=en` and `dir=ltr`. `proxy.ts` rewrites only the root path to `/fa`; browser language does not automatically change the route. The circular flag button in the header shows the destination locale and switches language without reloading the document; theme settings are shared by both locales.

The root layout in `app/[locale]/layout.tsx` validates the locale and prerenders both versions. `LocaleProvider` is the next-intl client boundary. Catalogs in `messages/fa.json` and `messages/en.json` use topic groups and meaningful keys. Translations cover product text, menus, search, dialogs, theme settings, and accessible labels. Complete both catalogs when adding text. Price, inventory, sign-in, and checkout are not connected to commercial services yet.

`ModalCloseButton` requires a translated label passed from its call site; it has no internal translation or fallback text. The initial theme script uses `next/script` with the `beforeInteractive` strategy. `LanguageSwitcher` uses the Next.js-compatible History API and `usePathname` to change route and locale catalog in the same document; browser Back/Forward also keeps the locale in sync. `ThemeProvider` remains outside `LocaleProvider`, so changing locale does not reset the theme or custom color. `lang` and `dir` are synchronized in `useLayoutEffect` before paint. Locale switching stays on the same page and preserves query parameters and hash. Internal page text is translated by `LocaleProvider`; admin access is checked on the server when entering the route.

Locale layout motion is coordinated in `lib/locale-motion.ts`: `LanguageSwitcher` records positions, and `LocaleProvider` starts the motion after translation commit and `dir` application in a layout effect. Temporary `localeMoving` state prevents text reveals from conflicting with layout movement and clears after all motion completes.

### Translation organization

Each locale catalog has groups for brand, common, header, navigation, search, categories, cart, wishlist, account, theme, hero, products, and language. Example keys include `common.closeDialog`, `theme.palettes.navy`, and `products.airpods.description`. Components use `useTranslations` directly; messages with variables such as `hero.moveProduct` and `search.resultsTitle` use ICU parameters. `messages/types.d.ts` connects the English catalog shape to next-intl `AppConfig` so TypeScript checks keys. Tests verify nested key parity, non-empty text, and matching parameters in both locales.

### Translatable text boundary

All interface copy lives in `messages/fa.json` and `messages/en.json`: body text, brand and product names, logo labels, image alt text, titles, placeholders, accessible labels, brand markers, search keyboard help, and composite formats. `Logo` and `ModalCloseButton` require a translated label prop. The hero category heading template and full color-selection label are also in the catalogs. Latin brand names are listed in both locale catalogs even when they are identical.

The tab title is set on the server by `generateMetadata` from the locale's `brand.name`, and during in-page locale changes from the same catalog. The logo generator also emits no default display text in the component. IDs, routes, CSS classes, event names, and API keys are not UI text; the ThemeProvider's programming error is an internal development message. User-entered search text is not translated and is placed inside a translated format.

Manual mode changes in `ThemeProvider` update only the state and daisyUI theme and keep `data-theme-changing` active for 1,000 ms. CSS animates colors independently from locale layout transforms; a later click replaces the previous cleanup timer. At the end, the temporary marker is removed and the browser toolbar color is synced to the final color. This transition does not use View Transition or a snapshot.
