## Goal
Make name editable (already works) and replace the brittle "Photo URL" text input on `/sitter` with a real photo upload backed by Lovable Cloud storage.

## Current state
`src/routes/sitter.index.tsx` already renders editable inputs for `name` and `photo_url` and saves via `supabase.from("sitters").update(draft)` (RLS allows the sitter to update their own row). The pain point is that `photo_url` requires the sitter to paste a hosted image URL — there's no way to upload a photo from their device.

## Changes

### 1. Create a public storage bucket for sitter photos (migration)
- Bucket id: `sitter-photos`, public read.
- RLS on `storage.objects`:
  - Public SELECT on objects in `sitter-photos`.
  - Authenticated INSERT/UPDATE/DELETE only when the first path segment equals `auth.uid()::text` (so each sitter can only write under their own folder, e.g. `sitter-photos/{user_id}/avatar-<timestamp>.jpg`).

### 2. Update `src/routes/sitter.index.tsx`
- Keep the Display name input as-is.
- Replace the Photo URL field with a photo uploader:
  - Show current photo preview (use `draft.photo_url` or placeholder).
  - "Upload photo" button → hidden `<input type="file" accept="image/*">`.
  - On file select: validate type + size (≤ 5 MB), upload to `sitter-photos/{user.id}/avatar-{Date.now()}.{ext}` with `upsert: true`, get the public URL via `supabase.storage.from("sitter-photos").getPublicUrl(path)`, set `draft.photo_url`, and toast success.
  - Show a small inline spinner while uploading; disable the button during upload.
  - Keep an optional "Use image URL instead" collapsed advanced field so power users can still paste a URL (small, secondary). If you'd rather drop this, easy to remove.
- The existing Save button still persists `draft` (including the new `photo_url`) to the `sitters` row — no change to save logic.

### 3. No other files need changes
Auth, RLS on `sitters`, and the admin/listing UIs already read `photo_url` as a plain string, so the new uploaded URL works everywhere automatically.

## Technical notes
- Bucket is public so `<img src=...>` works directly without signed URLs.
- Path convention `{user_id}/...` is enforced both by client code and by the storage RLS policy, preventing one sitter from overwriting another's photos.
- `upsert: true` + timestamped filename keeps history-free behavior while avoiding cache issues.
- File-size guard is client-side only; that's fine for a mock/MVP.
