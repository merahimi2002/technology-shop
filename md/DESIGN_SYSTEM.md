# Design System and UI Standards

This is the topic reference for appearance, color, brand identity, typography, motion, and reusable components. Do not create a separate Markdown file for every component; add guidance to this document or [ARCHITECTURE.md](ARCHITECTURE.md).

## UI and motion rules

### Shared form conventions

These rules are required for every existing and new project form:

- Mark required fields with a `primary`-colored asterisk beside the label. Use the shared `RequiredFieldLabel` and the native `required` attribute. Server validation must also enforce required values.
- Optional fields have no asterisk. Do not add a generic “asterisked fields are required” note; the marker beside each field is sufficient.
- Validation errors and warnings use the shared `FormError`, with a soft appearance, an icon the same size as the text, and content-sized width. Errors use the `error` color and `alert` role; correctable typing warnings use the `warning` color and `status` role.

### Shared image editing and display

Keep the selected circuit artwork with brand logo and `NO IMAGE` text in light and dark versions at `public/images/no-image{,-dark}.{svg,png}`. Outputs are transparent and 512×512, and logo geometry comes from `public/logo.svg`. Unselected designs and duplicate versions were removed. Artwork is native SVG with no external source.

The category-list skeleton uses `AdminCategories` itself and the shared table. It replaces the 40 px image, name, unique name, product count, and two controls in each row with placeholders. Header, column widths, and row heights are shared. The dev switch preserves the real row count and counter; initial loading without data temporarily shows at most five rows (one for `pageSize=1`). Pagination is non-interactive during loading. `aria-busy`, translated screen-reader status, and reduced-motion support are provided.

For image-free non-circular frames, the shared `NoImage` uses `public/images/no-image.png` in light mode and `public/images/no-image-dark.png` in dark mode. It follows the resolved app theme (`useTheme` and `SITE_THEMES`); changing theme immediately changes the image and does not depend on locale or a separate system setting. Missing or failed real images use this asset. Do not replace it with an image/folder icon in category forms or tables. Translate accessible alt text for the current locale. Account avatars retain the initial/icon fallback.

The category create/edit skeleton corresponds to three inputs, image controls, preview, and buttons. It follows the form's grid and responsive sizes, has `role="status"` and `aria-busy`, and does not animate in reduced-motion. Dev mode uses the route-loading skeleton.

Across the project, show and preview images with `components/ui/image-preview.tsx` (`ImagePreview`) and select/edit images with `components/ui/image-editor.tsx` (`ImageEditor`). Cropping uses shared `ImageCrop`. Extend these components for new behavior; do not create parallel controls or fallbacks. Logos and fixed decorative images are not user image inputs.

Use `components/ui/image-editor.tsx` for image inputs in forms; do not create a parallel account, category, or future-form control. Follow the shared account photo pattern: edit and delete/undo-delete buttons above the preview, a daisyUI modal with file selection, crop, zoom, and horizontal/vertical position controls. Profile frames are circular and category frames rounded. Confirming the modal updates only the local selection; the form confirmation saves the change.

Account and category image display/fallback uses shared `ImagePreview`. The account avatar keeps the name/icon and brand gradient; category images use `object-contain`. `ImageCrop` owns the canvas and crop controls. Text comes from the `imageEditor` catalog; direction and colors follow the current locale and theme.

This document describes the current implementation; earlier experiments have been replaced.

### Core rules

- In category forms, place the image input below the name fields. Do not show generic notes about asterisks or automatic unique-name generation; keep behavior in documentation. Shared errors use content-fit `w-fit` and `max-w-full`, not a full-width bar; long text wraps inside the same container.
- Names shown in lists depend only on the current locale: Persian uses `nameFa` and English uses `nameEn`. Do not show the other-language name below it or in a duplicate column. Keep both name inputs in admin forms for bilingual content.
- Mark required fields with `RequiredFieldLabel` and a primary-colored asterisk, and use the native `required` attribute. In categories, Persian name, English name, and unique name are required; image is optional. In products, names, unique name, category, status, and each variant's name/code/price/stock are required; descriptions are optional.
- Form errors use the shared `FormError` with `alert alert-soft alert-error`. `CircleAlert` is decorative and `1em`, matching the text size. The message has `role="alert"`, and multiline text sits beside the icon. Catalog and image-editor errors follow this convention.
- Tailwind CSS is the primary styling method; write utility classes directly in JSX.
- daisyUI is the source for themes, semantic colors, and standard components such as buttons, inputs, menus, and modals.
- Prefer shared project components and standard daisyUI components. If they do not cover a needed component, use shadcn with the page direction and daisyUI semantic colors.
- By default, follow the page locale: Persian is RTL/right-aligned and English is LTR/left-aligned. Use logical Tailwind utilities such as `text-start`, `justify-start`, and `ms-*`. Keep email readable LTR in both languages.
- Every UI change must work in light and dark modes. Use daisyUI semantic colors for text, background, borders, and states. Prefer standard daisyUI components and shared project components for buttons, forms, and modals.
- Implement layout, spacing, sizing, typography, color, responsive behavior, and interaction states with Tailwind. Custom values and variants are allowed when needed.
- Keep raw CSS for complex effects, masks, glass surfaces, browser compatibility, and image framing. Do not hide ordinary layout in CSS classes or `@apply`.
- Keep `styles/brand-themes.css` for theme settings and brand color overrides only; do not create a parallel token system or global button/input styles.
- Preserve semantic classes used by GSAP and custom selectors.
- Follow the [pre-commit UI checks](DEVELOPMENT.md#pre-commit-ui-checks) for browser verification of visual and motion changes.

### Shared pagination

All site lists use `components/pagination.tsx` and the range logic in `lib/pagination.ts`. This is the single reference for pagination behavior and appearance.

- Required props are `page`, `pageCount`, and `pathname`. `query` carries URL filters, `pageParam` names the page parameter, `scroll` controls scrolling, and `className` sets placement layout.
- Optional `pageSize` enables row-count selection; `pageSizeOptions` supplies choices and `pageSizeParam` names its URL parameter. Shared options are 1, 10, 20, 50, and 100; the default in `lib/pagination.ts` is 20. Changing page size resets to page 1 and preserves search and filters.
- `total` displays the total result count for the current filter. All admin lists (users, products, categories) pass it to pagination. The counter is at the start, page numbers in the middle, and page-size selector at the end; at narrow widths these sections stack. Do not add a separate counter above the table.
- Show the current page and its immediate previous and next pages when available. Every gap outside that range uses an ellipsis, even if it represents only one page. On page 1 of a longer list, the visible range is 1, 2, and an ellipsis.
- First/last use double arrows; previous/next use single arrows. Boundary buttons are disabled. Empty and single-page lists retain page 1 and four disabled arrows.
- Number and navigation buttons use `btn-soft btn-primary`. Mark the current page with `aria-current="page"` and the shared primary/secondary/primary conic gradient. Links have accessible names; numbers and arrow directions follow the locale.
- Keep numbers centered and allow them to wrap when narrow. On wide screens the page-size selector sits beside the numbers; at smaller widths it moves to a separate centered row. The consuming page sets distance from the frame edge.

### Shared table

The category form has an optional image selector, a 96 px preview, and a delete control. Removal/replacement remains local until the form is confirmed. The category table shows a 40 px thumbnail beside the name. Missing or failed images use the selected brand artwork and `NO IMAGE` from shared `NoImage`, with light/dark selected by the current theme. Name and slug fields remain compact. Previews and thumbnails use `next/image` with `unoptimized` so requests to private image routes include the browser session.

Every project table, including users, products, categories, and future tables, must use `components/ui/table.tsx` and its compound components. Do not create a parallel table or skeleton. User, product, and category tables already use it. `TableViewport` owns the scroll frame, minimum height, maximum height, and compact mobile-column state. `Table` and `TableHeader` share row spacing, borders, and gradient header. `TableBody`, `TableRow`, `TableHead`, and `TableCell` are compound components; cell content, widths, sorting, and operations stay in the consumer. Preserve the result ref and user skeleton props. Do not build a visually parallel table. Categories, like users, place pagination below the frame.

Category table cells and headers follow locale direction: Persian is right-aligned, English left-aligned. The operation column has a primary pencil and error-colored trash button with matching tooltips. Edit opens the same form with existing data; delete has a separate confirmation modal. Category form buttons follow profile editing: cancel with an X using `btn-soft btn-error rounded-full`, then confirm with a check using `btn-success rounded-full`. The group is at the inline end (left in Persian, right in English). Name and slug fields are at most 18 rem wide; three columns on wide screens, two at medium widths, and one on mobile. Delete button and tooltip text simply say “Delete.”

### Admin panel

Categories have a separate list page; the products-return link and create form were removed from the list. An icon-bearing GradientButton opposite the heading links to the standalone category creation page. Product creation and editing also use a full page in the shared admin frame; the new-product and row-pencil controls are real links. The bilingual product form has two columns on large screens and one on narrow screens; descriptions and variants span the full width. A back link is above the form and save/cancel buttons are at the end. This flow does not use a modal.

The sidebar is a tree. Parent nodes use daisyUI's standard `details/summary` menu behavior and are not links. Click or Enter/Space toggles the group without changing the URL. The active route's group opens on entry or child navigation. In collapsed mode, parent and child remain accessible by icon and tooltip; the parent control does not close the mobile drawer, while selecting a child link does. “Theme” is a child of “Settings”; the vertical gap between parent and submenu is 8 px.

The AccountAvatar fallback initial/icon sits in a separate span with `text-primary-content` and its own one-second color transition. It is independent from the root color transition and may finish after the root; perfect synchronization with the root is not the current contract. The local transition is disabled in reduced-motion.

AccountAvatar's background directly uses `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`. It consumes the current theme frame's colors; intermediate `--tw-gradient-*` variables are not involved. This is shared for photo-free avatars in the admin bar, storefront, and account page.

The sidebar's “Back to store” link has a fixed height of 44 px, single-line truncated text, and a non-shrinking icon. This prevents wrapping or movement while the sidebar width transitions.

Users and theme headings/subtitles live in the stable layout for each route and the shared AdminPageFrame; the main Title/Subtitle animation runs on page entry. Only content below the heading changes within the loading boundary. Data arrival, filters, and pagination do not remount the heading or restart its animation. Color, typography, and independent locale motion remain. The top-bar search row retains its 40 px space even on the theme page so mobile bar height stays fixed. “Settings” is a collapsible sidebar group, not a standalone view.

The user table area reserves at least `min(70dvh, 30rem)` from initial skeleton through real content so pagination does not jump when data arrives. It grows for longer content, up to 70% of viewport height. While moving between pages of the same list, the greatest observed height is retained. Changing filters, sort, row count, or frame width recalculates the reserved height; long content scrolls inside the area. Real results enter only with a 240 ms opacity transition; filters and table have no vertical entrance motion.

Sidebar and back-to-store tooltips use `tooltip-primary`, with primary background and primary-content text. They appear on the sidebar's left in Persian and right in English.

The content area moves with the sidebar and top bar during locale changes. In collapsed mode, sidebar labels and the back-to-store link use standard daisyUI tooltips on hover/focus. The wave canvas color reads the current theme color on every frame so it follows light/dark transitions.

Locale changes move the sidebar and top-bar groups with the home-page layout transition over 620 ms. Parent movement is subtracted from child movement so top-bar groups do not move twice. Under reduced motion, direction and language update immediately.

The shared account avatar is 40 px beside user names; without a photo it shows a name initial or icon. Table rows use translucent backgrounds, subtle separators, and soft hover feedback. Sidebar item spacing is 8 px. The wave button is 24 px, matching the visual surface of the locale flag.

The users page uses the shared frame. It shows Subtitle “Account administration” and Title “People & access” with the home page's shared motion and color; filters and table follow, with pagination at the bottom of the same frame. Role and status follow daisyUI's “Filter using HTML form, radio buttons and reset button” example. Each has its own `filter` form with radios and a `type="reset"` button using `btn-soft btn-error`. Group labels are bold and large, aligned with their options. A `divider-secondary` divider appears vertically between groups on desktop only; mobile has no line between filters. Clear-all uses `btn-soft btn-error` beside the groups, with a separate desktop divider. Selecting or resetting a group submits the Next.js form immediately and refreshes the table while preserving search and the other group. Clear-all restores the full user list.

Role badges show only the role name: owner uses the brand gradient, customer uses `badge-soft badge-info`, and admin uses `badge-soft badge-primary`. Membership dates use fully numeric day/month with leading zeros and LTR direction in both locales. The current account row uses `primary/12`. Role and status headers have ascending/descending sort controls and `aria-sort`; the sort control remains in the header and accessible on mobile.

The operation column is titled “Edit” with a pencil icon. Each non-owner row has three soft icon buttons, ordered by locale direction, for role change, enable/disable, and delete. Promotion uses a keyed user icon and success color; demotion uses a crossed-out user and error color; status uses a checked/crossed user; deletion uses a trash icon. Each tooltip matches its button, appears on hover/focus, and opens above the control. Operation controls follow locale direction: right-aligned in Persian and left-aligned in English. Each icon frame is 32 px with 8 px between icons. The owner row shows a non-clickable key and shield with an account-protection explanation.

Each operation has its own confirmation modal with the shared `glass-header` surface and 24 px corners. The operation icon appears before the title on a soft, matching surface. The modal shows action, account name, and effect. Cancel/confirm buttons are right-aligned in English and left-aligned in Persian. Cancel uses `btn-soft btn-neutral` so it remains distinct from the glass surface on hover in both themes. During submission, buttons and Escape-close are disabled. Errors appear inside the modal; success closes it. Deletion separately explains permanence and the restriction on accounts with orders.

The background toggle uses the shared brand gradient and changes its icon with wave state. Search follows locale direction and alignment. The collapse control uses `btn-soft btn-secondary` and double arrows. The back-to-store area is separated from navigation by a top border.

The user table header uses a medium gradient from `primary/16` to `secondary/16`, `base-content` text, primary icons and bold titles, a `primary/15` separator, and 14 px bold labels aligned to the locale start. The users, shield, status, calendar, and pencil icons are 16 px and decorative to screen readers. A 16 px vertical gap separates the header from rows; the header remains visible on mobile. The table frame has 16 px corners and a subtle border. Filters sit beneath the heading divider; the table frame is 16 px below filters and 12 px from mobile edges or 20 px on wider screens.

The dedicated admin top bar shows section title, user search, theme control, locale switch, and admin profile on a glass surface. Search navigates to the users page, preserves active filters, and moves to a second row on mobile. The wave button toggles the shared dotted background from the sign-in page. Dot size and contrast are stronger for the full-page admin surface. Turning the waves off removes the canvas and movement ring. Reduced-motion draws the wave statically.

The panel fills the viewport. The sidebar collapses to an icon rail at desktop widths and opens as a drawer from the same side on mobile. Sidebar, users content header, filters, and results use the storefront menu's glass surface. Heading and subtitle use Title and Subtitle. The daisyUI table retains its table structure on mobile and scrolls horizontally inside its frame; `table-pin-cols` keeps the first column (name, email, avatar) fixed at the locale start. On mobile, the initial first-column width is 176 px; name/email are single-line and truncated. After 12 px of horizontal scrolling, the column collapses to 72 px and shows only the avatar. Returning to the start restores details. Other headers scroll and do not appear beneath the pinned column. Desktop columns are not pinned. Email remains LTR regardless of page direction, and operations use confirmation modals.

Desktop sidebar width transitions over 240 ms. GSAP animates the mobile drawer and filters on entry and results when filters, sort, or page change. Motion runs only when `prefers-reduced-motion: no-preference`. The Next.js form sends filters through client navigation to the URL.

### Shared heading: Title

Path: `components/title.tsx`. Client component that can also render from a server page.

| Property      | Current behavior                                   |
| ------------- | -------------------------------------------------- |
| Element       | `h2` by default; `as` accepts `h1`–`h6`            |
| Size          | `clamp(1.5rem, 2.5vw, 2.25rem)`; normally 24–36 px |
| Direction     | `auto` by default; configurable                    |
| Persian       | Vazirmatn, natural tracking, line-height 1.6       |
| LTR           | Arial, `-0.025em` tracking, line-height 1.25       |
| Color         | Continuous gradient from the primary palette only  |
| Active motion | Scatter; asymmetric word translation and rotation  |

Gradient runs from `color-mix(in srgb, var(--color-primary) 65%, black)` to `color-mix(in srgb, var(--color-primary) 45%, white)`; secondary is not used. Each word's background uses the full shared heading width and an origin based on its position, so the gradient does not restart per word. `autoSplit` recalculates dimensions on resize and font load.

When split, `data-text-split` disables the parent's gradient and enables gradient only on words. `onRevert` removes the attribute and restores the plain text gradient. This prevents a black flash during transition and duplicate/overlapping text rendering.

Motion uses SplitText with `words,lines`; only words move. X range is ±48 px, y ±60 px, 2D rotation ±16 degrees, and `rotationX` ±65 degrees. Duration is 0.8 seconds with `power3.out`; randomized stagger spans 0.24 seconds.

```tsx
import { Title } from '@/components/title';

<Title as="h1">A choice for your desk</Title>;
```

Accepts `children`, `className`, and standard heading props. `active` defaults to true and `delay` to zero for sliders. The hero Title uses the selected product as `active` and a 0.58-second delay. Its entrance is separate from the grouped text animation; its exit is coordinated with the text.

### Shared subtitle: Subtitle

Path: `components/subtitle.tsx`. Client component for short copy and a replaceable icon. Accepts `children`, `icon`, `className`, paragraph props, `active`, and `delay`. The 16 px icon is fixed and decorative; the hero uses Store.

Special motion is based on [Split Special Characters](https://codepen.io/GreenSock/pen/KoJOJb); repeated and exploding text behavior is not used.

| Motion setting        | Current value                                                 |
| --------------------- | ------------------------------------------------------------- |
| Split                 | `chars`, grouping connected Persian parts with `specialChars` |
| Initial y translation | 10 px                                                         |
| Initial rotation      | 25 degrees                                                    |
| Duration              | 1.4 seconds                                                   |
| Stagger               | 0.1 seconds                                                   |
| Ease                  | `elastic.out(1, 0.3)`                                         |
| Hero delay            | 0.52 seconds                                                  |

The `specialChars` list is built from the text's words; spaces, diacritics, and half-spaces are preserved so Persian character connections do not break. Other characters use the standard SplitText split.

```tsx
import { Store } from 'lucide-react';
import { Subtitle } from '@/components/subtitle';

<Subtitle icon={<Store />}>The Tech Shop choice</Subtitle>;
```

### Shared text logic

Path: `hooks/use-text-reveal.ts`. Uses GSAP, `useGSAP`, SplitText, and IntersectionObserver. Motion begins only when active and in view. Cleanup runs when the component changes or unmounts. `aria: auto` keeps the full text for screen readers; text is readable without JavaScript, and entrance motion is disabled for reduced-motion.

Words and animated units use `inline-block`; transforms on an `inline` span do not render visually. The hook also supports `rotate`, but Title and Subtitle do not enable it.

### Shared button: GradientButton

Path: `components/gradient-button.tsx`. Built on daisyUI `btn btn-primary` and Tailwind utilities; the raw CSS hero button rule was removed.

The button content frame uses `inline-flex items-center justify-center gap-2` to keep text and icon fixed and vertically centered. The account-menu edit button uses the same shared frame.

The conic gradient's start position on the button and `before` layer is explicitly `from-0%`. In production, a zero default for a `length-percentage` property may compute to `0px`, which is invalid in `conic-gradient`; keep the explicit percentage. A 2026-11-06 browser review of the Webpack build confirmed valid `background-image` on all three buttons and their `before` layers.

| Property         | Current value                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Default gradient | Conic, primary / secondary / primary                                                       |
| Alternate        | `gradient="linear"`; not used in the hero                                                  |
| Size             | 40 px high, 16 px horizontal and 8 px vertical padding                                     |
| Corners          | Fully rounded                                                                              |
| Icon             | Optional, 16 px; hero uses `ArrowLeft`                                                     |
| Type             | Defaults to `button`                                                                       |
| Other props      | `children`, `className`, `ref`, and standard button props such as `onClick` and `disabled` |

Each slide has one “Discover product” button, which opens that product's introduction. The second experimental button was removed.

On hover, the gradient rotates 180 degrees over 300 ms with `cubic-bezier(0.23, 1, 0.32, 1)`. It returns when the pointer leaves. This is independent of arrow and text motion.

The horizontal arrow starts to the left of the label. On hover it exits the button's left edge, and a second copy enters from beyond its right edge to the position before the label. Text also moves 24 px left. Arrow and text motion lasts 500 ms with `cubic-bezier(0.77, 0, 0.175, 1)`. The button itself clips the movement and keeps a fixed width. Both arrow copies are decorative and are not repeated for screen readers.

Hover runs only for precise pointers that support hover, on an enabled button, and with motion-safe. Reduced-motion and disabled state turn off the motion. Current arrow geometry is designed for the RTL hero button.

```tsx
import { ArrowLeft } from 'lucide-react';
import { GradientButton } from '@/components/gradient-button';

<GradientButton icon={<ArrowLeft />} onClick={openDetails}>
  Discover product
</GradientButton>;
```

### Completed reviews

- Six repeated transitions among all three products with intermediate-frame sampling: gradient remained intact and no extra word layer appeared.
- Browser review confirmed the conic gradient and its 180-degree hover rotation.
- Final arrow motion: first copy's position relative to the button's left edge moved from 16 to -32 px; second copy entered from beyond the right edge and text moved 24 px. Button width and 300 ms gradient duration stayed fixed.
- Clicking the button opened the introduction. Touch interaction on a physical phone was not checked.

## Themes and color

Installed daisyUI version is 5.7.50. This is the current theme appearance reference. Save flow and authorization are in [Architecture](ARCHITECTURE.md#navigation-and-shell); test results are in [Development: theme settings review](DEVELOPMENT.md#theme-settings-review).

### User options

The storefront appearance dialog has six cards in this order:

1. **Site default theme** — fixed first option, pairing `TechLight` and `TechDark`.
2. **Four admin themes** — the four saved official selections, in the same order.
3. **Custom color** — fixed last option, defaulting to brand colors.

`TechLight` and `TechDark` are not in the admin selection list and are not part of the four admin choices. Initial selection is `brand` with `mode=system`; a valid previous user choice is restored. Clicking an option changes appearance immediately. The header toggle changes light/dark mode while preserving the palette selection; official themes use the paired brand theme in the opposite mode.

Custom color exposes native primary and secondary inputs for both modes. Initial values are brand `DEFAULT_CUSTOM_COLORS`; changes apply immediately and are stored locally. Reset restores all four defaults. The custom card previews saved dark colors. Text color over a custom color is selected by black/white contrast.

### Choosing four admin themes

`/[locale]/admin/settings/theme` is under “Settings → Theme” for ADMIN and OWNER and lists 35 official daisyUI themes. Names come from `siteSettings.themeNames` in the Persian/English catalogs; data IDs and `data-theme` remain the official names. The same translations are used in the user dialog.

- Each card uses a native checkbox with a rounded radio appearance so four themes can be selected at once; there are no separate numbered positions.
- Selected themes appear first in selection order. Choosing a fifth removes the oldest entry and adds the new theme at the end.
- A click immediately previews the whole page. The four-item array saves automatically; fewer than four remain a draft.
- During save, cards are disabled and a spinner appears beside the counter. A real error is shown and the last saved set restored; no success message is shown.
- Selected-card opacity is 100%, other cards 60%. Hover or keyboard focus raises an unselected card to 100%; exit returns it to 60%. Opacity transitions over 250 ms with ease-out and is disabled in reduced-motion.

### Layout and controls

The page uses the shared `glass-header` frame, Title/Subtitle, and spacing of the users page. The grid has six columns on wide desktop, then four, three, and two at smaller widths. Internal grid scrolling was removed; only normal page scrolling remains.

All/light/dark filters and result count sit together with a vertical divider. **Site default theme** beside the count activates the provider's `brand` option without changing the four admin choices. A counter at the end of the same row uses LTR, Latin digits, and leading zeros such as `01/04` through `04/04`. Local search and user search were removed from this page; user search remains on the users page.

Root scrollbar space is fixed and sidebar links use `scroll=false`. Theme loading uses the same component, provider settings order, and final card sizes. Persian is RTL and English is LTR; colors and components come from daisyUI, with no parallel token generator.

### Main files

- `lib/site-theme.ts`: official list, rejecting Tech themes in admin selection, restoring choice, and bootstrap.
- `lib/theme.ts`: custom color defaults/validation and color stylesheet.
- `components/admin/theme-settings.tsx`: direct selection, oldest-theme replacement, filter, and reset to site default.
- `components/theme-switcher.tsx`: six options and custom color edit/reset.
- `components/theme-provider.tsx`: mode, color transition, local storage, and tab synchronization.
- `components/site-theme-provider.tsx` and `lib/site-settings.ts`: read shared settings at request boundary.
- `styles/brand-themes.css`: official theme activation and brand overrides.

## Visual identity

The approved mark is an angled wheeled cart with a TS monogram and translucent body. The circuit texture and fixed dotted-wave view from the sign-in page sit inside the body. Gradient endpoints use the active theme's primary and secondary colors. The monogram and dots use the active theme's `base-content`. The logo's CSS gradient sits behind the cart's SVG mask and transitions with day/night theme colors.

Brand geometry and base colors are retained; current theme-selection behavior is in [Themes and color](#themes-and-color). Experimental six-palette previews and inactive options 4–6 were removed from the generator; only site-used assets are produced.

### Usage

```tsx
import { Logo } from '@/components/logo';

// Follows the active site theme.
<Logo label={brandName} width={96} height={96} />;
```

The standalone SVG and generated favicon read TechLight colors from the same theme file and convert them to sRGB for image conversion compatibility.

### Files

- `public/logo.svg`: transparent SVG with `viewBox="0 0 140 140"`, no font or bitmap.
- `components/logo.tsx`: React version with two color props.
- `scripts/generate-logo.mjs`: shared generation source; change geometry here.
- `app/icon.svg` and `app/favicon.ico`: default brand versions; ICO sizes 16, 32, and 48.
- `public/favicons`: brand favicon assets; current provider uses `navy.svg`.

The favicon has a fixed light background so it remains visible in light and dark browser tabs. Current favicon stays fixed when the theme changes; the in-page logo follows the active theme.

Regenerate with `npm run assets:generate`. Real checks and limitations are in [Themes and color](#themes-and-color).

### Header and search layout

Desktop categories and menus sit in the main row between logo and controls. The English text below the logo was removed. The last control button opens search in a modal and focuses the field; `/` also opens it. The fixed desktop/mobile search field was removed. Submission closes the modal and shows the existing result state.

### Final selected color

Primary colors for light and dark are defined with OKLCH in the theme file. The secondary color is recorded in the next section. The comparison panel, sliders, and temporary overrides were removed; selected colors are in the main `TechLight` and `TechDark` themes.

### Secondary color and custom theme

This section records brand colors through 2026-11-05. The color interface was replaced by [global theme settings](#themes-and-color).

| Mode  | Final primary       | Final secondary           |
| ----- | ------------------- | ------------------------- |
| Light | `hsl(244 100% 36%)` | `#008879`                 |
| Dark  | `hsl(190 100% 55%)` | `hsl(169.49 100% 53.53%)` |

The internal default palette ID remains `navy`. Logo geometry is preserved; the SVG and default favicon were regenerated with the new primary color.

- Four theme cards use a two-by-two grid with 12 px gaps: three preset palettes and “Custom color.”
- Theme modal is at most 440 px wide, with 20 px padding and compact gaps.
- The custom card previews the saved primary and secondary colors for the active mode in the logo and swatches.
- Four native color pickers sit in one row; light/dark groups and reset icon fill the modal's inner width. Each group's pickers are centered with 4 px spacing.
- Swatches are 40 px squares with 8 px rounded corners. Border, inner padding, and native swatch shadow were removed in WebKit and Firefox; Firefox was not directly checked.
- Explanatory text above colors was removed; hue/saturation/lightness sliders and temporary test panels are not in the final version.
- Reset is an 18 px `RotateCcw` inside a 32 px circle. Background is `base-content/7`, with a header-like gradient hover. It restores all four `DEFAULT_CUSTOM_COLORS` and saves automatically.

Custom color is stored and validated as six-digit hex; text is black or white based on contrast. Save flow and bootstrap details are in [Architecture: interactions](ARCHITECTURE.md#interactions). A custom theme uses the default favicon.

The header, account modal, and main account page show the signed-in user's profile photo. On the main account page, the avatar precedes the heading/subtitle group. If the photo is absent or fails to load, show the name's first initial, or an account icon when the name is empty. The fallback has a primary/secondary gradient. The header uses daisyUI `avatar-online`. The account edit form has edit and delete buttons above the photo; edit opens the image selection/crop modal. The modal preview is at the start of the file-selection row and crop bars use the active primary color. Modal “Save” updates the preview beside the heading; form save commits it. Photo deletion is applied with form save and can be cancelled until then. Registration photo is optional and uses the same edit/delete buttons and image modal. Account create/edit forms show a circular crop preview to the left of the heading/subtitle. Dragging or position controls move the crop; a slider adjusts zoom. Saved image uses the same crop shown in preview. A standard daisyUI role badge sits opposite name/email in the modal. Name and email are single-line and truncate long text. Account modal buttons have standard size for every role and wrap at narrow width. Each modal button has an icon; at 360 px and below, the admin link label shortens. `CUSTOMER` is shown as “User” in English and Persian. On the account page, role appears in the same icon row as name and email. Admin and owner see the admin link in both locations. On the account page, the gradient admin link with dashboard icon comes before the error-colored sign-out button. The account summary uses `modal` and `modal-box`; the gradient “Edit” button with pencil sits beside sign-out and opens the Edit profile tab.

### Shared modal close button

All header, product-introduction, and mobile-menu dialogs use `components/modal-close-button.tsx`. Shared appearance is `btn btn-circle btn-soft btn-error`, with a 32 px button and an 18 px X at `strokeWidth=1.7`. Accessible name is a required prop translated at the call site; there is no separate default label. Placement can be customized with `className`; closing uses native `form method=dialog`.

### Account form

`AccountPanel` shows sign-in, registration, and signed-in status on the account page. Fields and buttons use standard daisyUI classes and Tailwind layout. Labels and success/error messages come from Persian/English catalogs; email and password are LTR, while text and layout follow the UI locale. Pending state uses `aria-busy` and disables fields; messages use status or alert. Registration passwords are 8–128 characters. Fields are 36 px high, input text is 14 px, and placeholder text is 12 px. Name, email, and lock icons sit at the logical start and take the field's error/warning color. Password visibility control is circular; primary form buttons size to content.

### Final header and color review — 2026-11-05

`npm run check` and `npm run build` succeeded; 22 existing tests, including secure custom-color recovery and brand contrast, passed. Production-browser review covered modal search and Persian submission, final light/dark colors, selecting custom color and persistence after reload, preview-card matching, resetting all four colors, mobile layout, rounded swatches, and the shared button in theme and product-introduction modals. Lint and build also succeeded after the final visual change. This does not replace physical-phone testing, Firefox testing, or a comprehensive accessibility evaluation.

### Asset cleanup

Experimental previews in `md/assets/logo-palettes` (SVG, PNG, and JSON) and duplicate `public/logo-mark.svg` were removed. `assets:generate` now creates only the used logo and favicon assets for three palettes; internal IDs and brand geometry are preserved.

## English version

The `/en` version uses LTR layout and system Arial. Heading and body align to the text start; arrow direction and button motion follow the locale. The hero studio background and lighting are mirrored in English to keep text over the quiet part of the image; product images are not mirrored. Colors and standard daisyUI classes are shared across locales.

The header locale control uses a local SVG flag inside a 24 px circular icon and a 32 px circular button: Iran's flag in English and the UK flag in Persian indicate the destination. The link's accessible name identifies the destination locale; flag rendering does not depend on emoji support.

Locale changes use WAAPI and the FLIP pattern: positions of animated sections are captured before change and moved to their new positions with transforms over 620 ms after locale commit and direction update; easing is `cubic-bezier(0.77, 0, 0.175, 1)`. The header on all pages and sections marked `data-locale-motion` on internal pages use this motion. For text and product to cross on desktop, the text path passes slightly higher and product path lower. The body has no fade; theme and selected product remain unchanged. Reduced-motion and keyboard activation change directly. Letter reveals are paused during locale movement to avoid overlapping animations. Normal product transition direction still follows RTL/LTR.

### Light/dark transition

Manual light/dark changes, palette selection, and custom-color updates all transition over 300 ms with `cubic-bezier(0.7, 0.5, 0.8, 0.5)`. The photo-free avatar gradient uses the same changing colors and has no separate instant color path. Standard daisyUI colors are registered with `@property` as `color` and transition only on the root; colors move continuously in the UI, gradients, text, and logo. No fixed image or View Transition snapshot exists, so product motion and locale FLIP stay live at the same time. A rapid mode change redirects the CSS transition from its current intermediate color to the new target. Reduced-motion changes directly, and initial theme restoration does not animate. Property registration supports transition behavior only; values and brand colors remain in `brand-themes.css`.

## Shared backgrounds

The Canvas particle wave and SVG circuit texture are part of the storefront's shared visual identity. Use both on other pages and sections to keep the experience cohesive.

- For an interactive animated background, use the shared [Canvas particle wave](../components/particle-terrain.tsx).
- For a static background on forms, cards, and glass panels, use the [circuit texture](../components/circuit-backdrop.tsx) with the same [SVG asset](../public/circuit-traces.svg).

Place the wave and texture behind content, and tune their intensity so controls and text remain readable. The wave is static under reduced-motion.

## Account page

The “Forgot password” link on sign-in opens the email-request modal. The email link opens the set-new-password page in the request locale.

The Edit profile tab canvas shows a pending state while saving, an error state for validation/save failures, then a success state in the account summary after saving. The password-change modal heading uses the shared Title.

On the Edit profile tab, a centered gradient “Change password” button below a divider opens the modal. Each time it opens, its three fields and save button appear with the sign-in form's staggered animation. Each field has its own show/hide control. Closing clears form values and errors. Validation errors appear beside their field while typing. After successful save, the sign-in form shows the password-change message.

In profile editing, Zod rejects an empty or whitespace-only name and displays the error beside that field. Email is read-only and dimmed for all accounts, with a not-allowed cursor on hover.

After sign-in, the Account and Edit profile tabs use the same crop, transition, and tab surfaces as sign-in and registration. The first tab shows the account summary; the second opens name/email fields. Save uses `btn-success`; cancel uses `btn-soft btn-error`. Successful save returns to Account and shows refreshed data with a status message. Cancel discards the draft.

Account subtitle and heading use the home-page shared effect. On initial load, the first row starts moving 440 ms after form readiness. After each tab change, row entrance restarts after the frame's 270 ms transition. Each row moves up 14 px over 460 ms and is revealed from behind the clipped edge. Rows stagger by 160 ms. Button motion starts 260 ms after the final row begins. Under reduced-motion, the form appears without animation.

Sign-in and registration forms share a minimum height of 33.5 rem below the `sm` breakpoint and 36.5 rem from `sm` upward. Required account fields have a theme-primary asterisk beside their labels. Confirm password has a separate visibility control, and a mismatch appears beneath that field while typing. Each form's content is vertically centered. When tabs change, the diagonal edge, corners, and side spacing transition over 270 ms. The frame can grow if content needs more room. Rapid tab changes continue the height and diagonal motion from the current state. Theme gradient spans the shared frame to its border, and translucent tabs reveal the dots behind them. `CircuitBackdrop` shows soft fixed diagonal tracks and ring nodes from the right side of the form box and tabs. A translucent glass layer covers the folder box; circuit texture sits over glass and behind content. Active tab and its form use white in light mode and black in dark mode. The active tab, diagonal edge, and form use translucent color over the frame glass. A 3 px blur is applied to active tab and form panel; opacity is 30% in light and 45% in dark. The folder frame has no border or shadow. Its outer corners and Canvas match the header menu: 20 px through 1023 px and 24 px above. Account headings and primary buttons use shared Title and GradientButton. Sign-in, registration, and sign-out buttons each have a matching icon and normally sit 28, 28, and 24 px from the content above, respectively. The registration icon points upward in both locales.

`ParticleTerrain` is a transparent Canvas in a shared frame behind both account sections. Perspective dots are white in dark mode and black in light mode, continuing beneath the form and tabs. Distant wave rows reach both upper canvas corners. Desktop's visual area shows the store mark or a status icon depending on form state. Mouse and touch raise the wave at the interaction point. The wave moves gently while visible and pauses offscreen or on an inactive tab. Reduced-motion displays a static wave and changes tab shape/frame height immediately.

Each status icon and dotted word is centered on one vertical axis in the visual area. Error, warning, and success icons use a circular badge with a soft daisyUI background. Error shows an X and dotted “Error” label; canvas dots use the theme `error` color. If a field is invalid, after 400 ms without typing or immediately on blur, a circled exclamation and dotted “Warning” label appear; dots use the theme warning color. After successful registration or when viewing the account page with a session, a checkmark and dotted “Success” label appear; dots use `success`. As the logo fades and canvas changes color, some canvas dots detach from the wave over 1,000 ms to form letters. Nearby dots arrive at scattered empty positions with slight delays and curved paths; the wave stays still behind the letters. On status change, dots move from their current position to the new shape or back to the wave. Mobile keeps the status area below the form fixed. Sign-in and account cards share the same minimum height. User name uses normal weight. Name/email icons are 16 px and primary-colored. Email remains LTR and aligns right in Persian and left in English. While checking session or submitting, a daisyUI spinner replaces visible wait text while accessible status text remains. Under reduced-motion, transitions are immediate and the spinner is static.

Warning and warning-text colors for light `TechLight` are defined with daisyUI semantic tokens in `styles/brand-themes.css`. In account forms, warning appears beside a field and clears immediately when input becomes valid. Submitting invalid input shows the message and a red field border.

### Backend data loading

Use shared `AccountSkeleton` while reading account session and `AdminUsersLoading` for the user list. The header account icon also shows a circular skeleton while checking session. Skeletons use standard daisyUI classes, semantic theme colors, page direction, translated screen-reader text, and `aria-busy`; they stop moving under reduced-motion.

The users list has a route-loading and Suspense fallback. The boundary key uses search params so filter, sort, and page changes also show loading. Previous data remains during background session refresh. Form submission and save/delete actions use pending states and disabled buttons; skeletons are for data reads. Current home-page products are static and do not have backend-request skeletons.

Account summary skeleton preserves the final content order and spacing: 64/96 px avatar beside a fixed heading, name/email/role rows, and 40 px buttons. Tab positions remain while reading the initial session; tabs are disabled until data is ready. In preview mode, a real photo is also replaced by a placeholder. Shared minimum frame height prevents overall page-height changes; long text or transition from unknown state to guest form can still change internal layout.

The users table skeleton comes from `AdminUsers` and uses the same table, headers, column widths, filters, and pagination; there is no parallel frame or table. Only cell content is replaced: 40 px avatar, name/email, role/status badges, date, and 32 px buttons. Row padding and pinned/compact mobile-column behavior are shared. The dev switch preserves row count, name/email line count, pagination, and scroll position. To preserve multiline height, existing text remains invisible beneath the placeholder and outside the accessibility tree. Filters, sorting, and pagination are inert while loading.

On initial loading, before result and total are known, show at most five temporary rows (one when `pageSize=1`); replace them with the actual count when it arrives. Initial row and page counts are estimates and do not guarantee zero layout shift when the result count changes. Internal fallback filters and sort use the same valid route parameters; the management column follows the session role.
