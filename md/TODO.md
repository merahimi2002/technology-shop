# Technical Backlog

Last reviewed: 2026-11-20. This file tracks remaining technical work only. Active features are described in [Architecture](ARCHITECTURE.md); future pages and admin tools are listed in the [roadmap](ROADMAP.md).

## Storage and image uploads

Category images use a separate server route, and private local storage has been enabled and tested with a secret key. Test results and the browser file-picker limitation are recorded in [Development: category images](DEVELOPMENT.md#category-images). Deployment also requires a private key. The following items are still planned for product images. Cleanup of unreferenced category images needs a durable retry mechanism; current cleanup is best effort.

This section tracks planned Supabase Storage support for product images and files. Product image buckets, upload APIs, and the `ProductImage` model have not been implemented. Active profile photo support is documented in [Architecture: uploaded images and files](ARCHITECTURE.md#uploaded-images-and-files).

- [ ] Design buckets: private storage for newly uploaded and personal files, and public storage for approved product images.
- [ ] Check the NextAuth session and authorization in the server API. Only `OWNER` or `ADMIN` may upload product images; personal images are limited to their owner.
- [ ] Generate signed upload URLs with random file paths chosen by the server. Keep Storage secrets in server-only environment variables. A NextAuth session does not automatically grant Supabase Storage access.
- [ ] After private upload, validate the actual file type, size, dimensions, and pixel count. Do not trust only the extension or browser-reported MIME type. Set final limits during implementation.
- [ ] Generate an optimized version, publish approved images, and serve them with `next/image`. Never make an unapproved file public.
- [ ] Add a `ProductImage` model and migration for the Storage path, related product, Persian/English alt text, and display order. Do not store image bytes or Base64 in PostgreSQL.
- [ ] Implement replacement and deletion with authorization checks and cleanup of temporary, failed, or orphaned files. Prevent accidental overwrites of existing files.
- [ ] Add image selection and preview, upload progress, and error messages using the project's translations.
- [ ] Test invalid and oversized files, unauthorized users, access to another user's file, upload failures, and the full upload-to-display-and-delete flow.

Recheck current service limits and capabilities when implementation begins: [buckets and access](https://supabase.com/docs/guides/storage/buckets/fundamentals), [signed upload URLs](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl).
