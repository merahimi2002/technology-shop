# Security and Dependency Review

This document records database and authentication controls and their current limitations. The dependency review in later sections is dated 2026-11-02; it is not a claim that a new audit was run.

## Server-side database connection

### Category images

Retrieving or changing category images requires an `ADMIN` or `OWNER` session. Sharp decodes the source again and converts it to WebP; SVG, animated images, files over 2 MB, and images over 16 million pixels are rejected. Files are not sent to Storage before validation. Paths are random, do not use the submitted filename, and are never overwritten. The bucket is private, and its key is read only from the server environment. The image route sets `nosniff` and `private, no-store`. If Storage does not have a valid key, a request containing an image fails without creating a new record. Cleanup of unreferenced files is best effort; durable retries still need implementation.

After the SDK was installed, a dependency review on 2026-11-23 reported seven findings (three high and four moderate) in existing Prisma/effect and shadcn/ts-morph/minimatch chains. It reported no finding for the new SDK. `audit fix --force` was not run because the proposed changes included incompatible downgrades.

The database connection infrastructure was prepared on 2026-11-06 with a private `DATABASE_URL`, a server-only boundary, `verify-full` TLS, a limited pool, and no query logging. Passwords and service keys must never appear in chat, documentation, Git, `NEXT_PUBLIC_` variables, or API responses. `.env.example` contains placeholders only; real values belong only in local environment files or the host's secret manager. The diagnostic script does not print raw driver errors.

The dashboard template uses the `postgres` role. This is an administrative role, not a suitable production runtime role. Before commercial features are connected, define a least-privilege runtime role and a separate migration connection. NextAuth handles application authentication; Prisma's connection as `postgres` does not automatically enforce user authorization or RLS. When creating a table in a schema exposed to the Data API, review RLS and grants in the migration for that table.

## Registration and sessions

In the admin list, an `ADMIN` viewer does not receive `ADMIN` or `OWNER` account emails in the server response. Email search is also limited to `CUSTOMER` accounts so it cannot be used to discover hidden addresses. `OWNER` has access to all listed emails. This rule was checked by a server test; its result and scope are recorded in [Development: admin users review](DEVELOPMENT.md#admin-users-review).

Deleting an account from the panel requires an `OWNER` session and a separate confirmation. Requests to delete the owner or a stale account version are rejected. The delete statement also checks role and `updatedAt` so a concurrent change cannot bypass the guard. The database restriction for accounts with orders remains in place; this flow does not delete any order or payment history.

Sign-in is rejected for disabled accounts. Only after the password is verified is the public `ACCOUNT_DISABLED` code mapped to the Persian or English disabled-account message; unknown users and incorrect passwords receive the same generic sign-in error. Internal errors are still mapped to `UNAVAILABLE`.

NextAuth 4 with Credentials and JWT was checked through real API and browser flows after migrations were applied to Supabase. The check covered registration, sign-in, sessions, and sign-out only. Password hashing uses scrypt with N=131072, r=8, p=1, a random 16-byte salt, and a 64-byte output. Passwords from 8 to 128 characters are accepted without trimming or changing letter case. Hash comparison is timing-safe, and derivation is also performed for unknown users. Name and email input are bounded, and email is normalized before lookup and storage.

Registration accepts requests only from the official Origin, with JSON and a body no larger than 8 KB. NextAuth provides built-in CSRF protection for sign-in and sign-out. The current shared database rate limits are 60 attempts per minute for the entire service, 10 sign-in attempts per email, and 3 registrations per email in 15 minutes. The email key is made with an HMAC secret and expired buckets are removed. Counters are atomic and do not depend on one process's memory. This global ceiling is for the prototype and must be tuned to capacity and edge rate limits before real traffic. Forwarded IP headers are not trusted.

Unknown email and incorrect password produce the same sign-in message; duplicate registration also has a uniform response. Registration never accepts an admin role from input. The session callback checks the user's role, enabled status, and session version against the database. Incrementing `sessionVersion` revokes all sessions; normal sign-out clears only that browser's cookie. Account responses use `Cache-Control: no-store`. Passwords, hashes, and driver error details are not included in responses or authentication logs.

The initial migration protects all public tables and Prisma metadata with RLS and grants no access to `anon` or `authenticated`. No Supabase user policy was created because NextAuth is the identity provider. The current `postgres` role bypasses RLS, so server-side authorization checks are mandatory and a restricted runtime role is still needed before commercial deployment. Registration does not prove email ownership at this stage. Email verification, password recovery, breached-password policy, and MFA are not yet active; do not claim verified email or production readiness.

Password change requests require the official Origin and are limited to three attempts per account in 15 minutes, within the shared authentication ceiling. The server checks the current password against the stored hash and updates the new hash and session version together. A concurrent password change or account disable causes the update to be rejected.

## Owner protection

Real verification after the migration on 2026-11-06: RLS is enabled on all 13 public tables, including Prisma metadata, and `anon`/`authenticated` have no `SELECT` grants. Supabase Security reported only 13 informational [RLS Enabled No Policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) messages. This is intentional for the current server-only access model; do not resolve it by adding public policies. No WARN or ERROR messages were reported. Temporary test accounts were deleted.

`OWNER` is more than a privileged JWT role. SQL enforces owner uniqueness with a partial unique index, so concurrent requests cannot create a second owner. A trigger using `SECURITY INVOKER` and an empty `search_path` blocks deletion of the owner and changes to the owner's identity, password, role, or enabled state. Direct execution of the function is not granted to `PUBLIC`, `anon`, or `authenticated`. A database owner can still change these protections, so the trigger does not replace a restricted runtime role.

To preserve a recovery path, changing the owner's password or email is not a normal panel operation. Perform it only as secure maintenance outside the application: in a controlled transaction, temporarily disable the trigger, make the necessary change, increment `sessionVersion`, and re-enable the trigger. Do not expose this operation through an application endpoint or to `ADMIN`. Create the owner account outside public registration and verify identity. An email address claimed in a `User` record does not by itself prove ownership of that address.

No system is guaranteed to be impenetrable. Current protections prevent a second owner, role changes through public registration, and owner identity changes through ordinary routes. MFA for the owner is not implemented. Given the current password sign-in, MFA and database access separation are required before commercial use.

## Dependency review result

The currently published releases cannot fully resolve these six findings while staying within the packages' declared compatibility ranges. `package.json` and `package-lock.json` were not changed for this review; no override, downgrade, or `audit fix --force` was applied.

Six audit findings do not represent six independent vulnerabilities: the two root vulnerabilities are in `deepmerge` and `minimatch`; four other packages are reported because they depend on them. Current status: two low and four moderate, with no high or critical findings.

## Actual installed chain

```text
shadcn@4.23.0
├── deepmerge@4.3.1
├── @shadcn/registry@0.2.1 → deepmerge@4.3.1
└── ts-morph@26.0.0
    └── @ts-morph/common@0.27.0
        └── minimatch@10.2.6
```

| Reported package | Audit severity | Reason                                                            |
| ---------------- | -------------- | ----------------------------------------------------------------- |
| deepmerge        | low            | Prototype poisoning; GHSA-gcqx-w48m-w2h4                          |
| @shadcn/registry | low            | Depends on deepmerge                                              |
| minimatch        | moderate       | Excessive resource use with an input pattern; GHSA-g3hv-75wg-m249 |
| @ts-morph/common | moderate       | Depends on minimatch                                              |
| ts-morph         | moderate       | Depends on common                                                 |
| shadcn           | moderate       | Depends on the chains above                                       |

## Options reviewed

### deepmerge

The latest published version is 4.3.1. The official advisory marks versions 4.2.0 through 4.3.1 as vulnerable and lists no patched version. shadcn requests `^4.3.1`, so there is no compatible fixed patch or minor release to install. Downgrading to 4.1.1 would violate shadcn's contract; being outside the advisory's affected range does not prove the older release is secure. No downgrade was made.

### minimatch

The latest version on major 10 is 10.2.6; the latest stable release is 11.0.4. The advisory lists 11.0.1 and later as fixed. `@ts-morph/common@0.27.0` requests `^10.0.1`, and even the latest `common@0.29.0` requests the same range. The latest `ts-morph@28.0.0` also depends on `common@~0.29.0` and falls outside the `^26.0.0` range required by shadcn.

The project's Node 24 runtime is compatible with minimatch major 11, but that does not establish compatibility with ts-morph's contract. Overriding to version 11 would exceed the requested range. Without upstream confirmation and tests of code-editing and pattern flows, compatibility cannot be guaranteed, so no override was applied. This review does not claim or prove an operational failure with version 11; the current blocker is the lack of a fix within the declared supported range.

### npm recommendation

`npm audit fix --dry-run --json` proposed no packages to add, remove, or change, and the same six findings remained. The `--force` proposal for deepmerge reverted shadcn to 1.0.0, several major versions behind the current Tailwind 4 and CLI 4 stack; it was not applied.

## Impact and current action

This chain belongs to the shadcn development CLI. At review time, `npm audit --omit=dev --json` reported zero vulnerabilities. That does not remove risk when the CLI runs or prove the whole application is secure. An untrusted registry or configuration could provide problematic input while a development tool is running.

Until upstream publishes a fix, use the CLI only to add required components from the official registry and inspect its input. Recheck shadcn dependencies and audit results after a new release. Removing the CLI would remove the findings from the installed tree, but would not fix the vulnerabilities themselves; it was not part of this work.

## Checks performed

- `npm audit --json`: the same six findings; two vulnerability roots.
- `npm audit fix --dry-run --json`: no compatible changes proposed.
- `npm audit --omit=dev --json`: no findings.
- `npm view` for versions and dependencies of shadcn, deepmerge, minimatch, ts-morph, and common.
- `npm ls deepmerge minimatch @shadcn/registry ts-morph @ts-morph/common`: confirmed the chain above.
- `npm exec shadcn -- --version`: version 4.23.0 ran successfully.
- `npm exec shadcn -- info`: identified Next.js 16.4.3, Tailwind 4, App Router, and RTL; no component files were added.
- No product test or rebuild was needed; no code or package versions changed.

## Sources

- [Official deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
- [Official minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- Version and dependency metadata from the npm registry, checked against this project's `package-lock.json`.
