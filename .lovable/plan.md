## Goal

Make the sitter profile photo persist immediately on upload — no separate "Save" click required for the photo.

## Current behavior

On `/sitter`, uploading a photo:
1. Pushes the file to the `sitter-photos` storage bucket.
2. Updates local `draft.photo_url` only.
3. Toast says "click Save to publish" — the new photo is not visible to families until the user remembers to click Save.

This is confusing: the photo *appears* updated in the header preview, but families browsing `/` still see the old image.

## Change

In `src/routes/sitter.index.tsx`, after a successful upload:

1. Update the `sitters` row immediately with the new `photo_url` (`supabase.from("sitters").update({ photo_url }).eq("id", sitter.id)`).
2. Update local `draft.photo_url` so the preview reflects the new image.
3. Invalidate the `["my-sitter"]` and `["sitters"]` queries so the family-facing list refreshes.
4. Toast: "Photo updated" (drop the "click Save" hint).
5. Helper text under the button changes to "JPG or PNG, up to 5 MB."

The Save button continues to handle the other fields (name, bio, rate, etc.) exactly as today.

## Files

- `src/routes/sitter.index.tsx` — modify `handlePhotoUpload` and the helper caption.

No DB or storage changes — bucket + RLS already exist from the prior migration.
