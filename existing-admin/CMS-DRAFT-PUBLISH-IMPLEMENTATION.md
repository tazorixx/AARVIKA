# P3.1 CMS Draft / Preview / Publish

## Implemented
- Existing live homepage sections remain in `homepage_sections`.
- Admin edits are stored in `homepage_drafts` and do not change the public storefront.
- Existing published documents are automatically copied into a draft when first edited.
- Admin can save draft, preview combined published+draft content, publish immediately, unpublish, and schedule publication.
- Scheduled publication is processed by `/api/cron/publish-homepage` and uses `CRON_SECRET` when configured.
- Public `/api/homepage` only returns published, active sections.
- Homepage publish/unpublish/draft/schedule actions are written to admin audit logs.
- Partial updates such as reorder preserve the existing draft fields.

## Operational note
Configure a scheduler/cron provider to call `GET /api/cron/publish-homepage` periodically with `Authorization: Bearer $CRON_SECRET` in production.
