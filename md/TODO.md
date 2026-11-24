# Technical Backlog

This file tracks remaining technical work. Active features are described in [Architecture](ARCHITECTURE.md), and upcoming pages are listed in the [roadmap](ROADMAP.md).

## Storage and image uploads

Category and product images use private Supabase Storage and authenticated server routes. The current implementation is documented in [Architecture: catalog management](ARCHITECTURE.md#catalog-management).

- [ ] Publish approved product images through a storefront delivery path while keeping drafts private.
- [ ] Support localized alternative text for storefront product images.
- [ ] Add a durable retry mechanism for cleanup of unreferenced category and product images. Current cleanup is best effort.
