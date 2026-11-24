# Tech Shop Documentation

Tech Shop is a bilingual Persian/English storefront built with Next.js App Router, React, and TypeScript. The home page, storefront shell, themes, Supabase database access through Prisma, and email/password authentication with NextAuth are active. Profile photo uploads are active. Sales and payment APIs are planned for the future.

## Reading guide

| Document                          | Topic                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------- |
| [Development](DEVELOPMENT.md)     | Setup, commands, tests, browser checks, and contribution rules                  |
| [Architecture](ARCHITECTURE.md)   | Application structure, responsibilities, interaction flows, and service status  |
| [Design system](DESIGN_SYSTEM.md) | Tailwind and daisyUI, themes, brand identity, typography, motion, and shared UI |
| [Technology stack](TECH_STACK.md) | Selected technologies, recorded versions, and dependency decisions              |
| [Security](SECURITY.md)           | Dated dependency review and known limitations                                   |
| [Technical backlog](TODO.md)      | Remaining image storage and publication work                                    |
| [Roadmap](ROADMAP.md)             | Remaining storefront pages and admin tools                                      |

Start with `DEVELOPMENT.md` and `TECH_STACK.md`. Update `ARCHITECTURE.md` when behavior changes and `DESIGN_SYSTEM.md` when appearance changes.

## Documentation conventions

Keep all project documentation in the root `md` directory. Organize files by topic and responsibility, not by page or component name. Add guidance for shared parts such as headings, buttons, or headers to the relevant existing document. Record current values once in their source of truth and link to them from other documents. Keep dated review results separate from current behavior, with their date and scope clearly stated.

Use npm as the only package manager and keep `package-lock.json`. Agent instructions live in the root `AGENTS.md`; the root `README.md` is only a quick entry point.

## Current UI status

Last documentation review: 2026-11-24. Recent checks and their scope are recorded in [Development: theme settings](DEVELOPMENT.md#theme-settings-review) and [Development: users](DEVELOPMENT.md#admin-users-review). `ROADMAP.md` and `TODO.md` contain only remaining work.

Global UI rules live in the design system: [required fields and errors](DESIGN_SYSTEM.md#shared-form-conventions), [shared image editing and theme-aware NO IMAGE artwork](DESIGN_SYSTEM.md#shared-image-editing-and-display), and [the shared table](DESIGN_SYSTEM.md#shared-table). These conventions apply to existing areas and future work.

Lists use the shared pagination component. The central contract is in [Design system: shared pagination](DESIGN_SYSTEM.md#shared-pagination).

Category image storage is active in a private bucket. A real upload, replacement, and deletion flow was tested on 2026-11-24. The Persian/English and light/dark review, along with the file picker test limitation, is recorded in [Development: category images](DEVELOPMENT.md#category-images).

The admin panel has an independent full-screen shell, collapsible sidebar, and glass top bar. “Settings” is a collapsible sidebar group; “Theme” is its child and has no standalone parent page. Heading and subtitle animations run on entry and do not replay when a skeleton becomes content. The dashboard is currently empty. Users appear at `/[locale]/admin/users`, with search, filters, role/status sorting, and pagination. The owner can manage roles and account status, and delete non-owner accounts; each operation has its own confirmation. Appearance, colored tooltips, particle effects, and locale transitions are documented in the [design system](DESIGN_SYSTEM.md#admin-panel); access control is documented in [architecture](ARCHITECTURE.md#admin-panel-access).

For guests, the header account icon opens the account page; for signed-in users, it opens an account summary modal. Sign-in and registration are tabs on the account page. After a successful sign-in, users go to the requested internal destination or the home page in the current locale. Admins and owners can reach the admin panel and user list from the modal and account page. Details are in [architecture](ARCHITECTURE.md#admin-panel-access) and the [design system](DESIGN_SYSTEM.md#admin-panel).

Service status as of 2026-11-06: three migrations were applied to the existing `tech-shop` project. Real registration, sign-in, sessions, and sign-out were tested. Roles are `CUSTOMER`, `ADMIN`, and `OWNER`; at most one `OWNER` is allowed, and the owner account was created using private environment variables. Passwords must be 8–128 characters. On that date, checks passed with 44 tests and a Webpack build. The known Turbopack limitation and workaround are documented in [Development: database connection](DEVELOPMENT.md#database-connection). Profile photos are documented in [Architecture: uploaded images and files](ARCHITECTURE.md#uploaded-images-and-files); admin product galleries are documented in [Architecture: catalog management](ARCHITECTURE.md#catalog-management).

The user theme dialog has six options: the fixed site theme (`TechLight`/`TechDark`), four themes selected by an admin, and the user's custom color. The admin theme page lists 35 official themes with translated names. Four direct selections appear above the list; choosing another theme automatically replaces the oldest selection. “Site default theme” restores the appearance without changing those four selections. Behavior is documented in [Architecture](ARCHITECTURE.md#navigation-and-shell) and appearance in [Design system: themes and color](DESIGN_SYSTEM.md#themes-and-color).

The UI copy audit was completed on 2026-11-05. Translation catalogs in Persian and English are the source for interface text. The translation contract is in [Architecture: translatable text boundary](ARCHITECTURE.md#translatable-text-boundary), and the check against hardcoded UI text is in [Development: UI copy check](DEVELOPMENT.md#ui-copy-check).
