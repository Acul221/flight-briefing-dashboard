# Master Question Schema (v3) — SkyDeckPro

Version: 2025-10 (v3)

## Ringkasan
Skema ini adalah canonical representation untuk *quiz questions* di SkyDeckPro. Format JSON yang seragam memudahkan import/export, backfill, upsert, dan validasi.

## Top-level object
- `id` (string)  
  - Unique internal id (uuid or slug). Example: `s3-0001` or `legacy-1234`.
- `question` (string) — **required**  
  - Stem / prompt. Non-empty.
- `question_image` (string|null)  
  - URL after rehost. `null` jika tidak ada.

- `choices` (array[string]) — **required**, length must be 4  
  - Ordered choices A..D.
- `choice_images` (array[string|null]) — length 4 (image URL per choice) or `null`s.
- `explanations` (array[string|null]) — length 4 (explanation per choice) or `null`s.

- `correctIndex` (integer) — **required**  
  - 0..3 representing A..D.

- `aircraft` (array[string])  
  - Example: `["a320"]`, `["a320","a330"]`. Empty array means generic.

- `domain` (string)  
  - High-level domain, e.g., `systems`, `performance`, `operations`.

- `subject` (string)  
  - Subject within domain, e.g., `electrical`, `takeoff`.

- `subcategory` (string|null)  
  - Optional finer grouping.

- `ata` (string|null)  
  - ATA chapter code (optional).

- `level` (string)  
  - Curriculum level. Example: `foundation`, `line`, `captain`.

- `difficulty` (string)  
  - Engineered difficulty: `easy` | `medium` | `hard`.

- `source` (string)  
  - e.g., `FCOM`, `QRH`, `InstructorNotes`, `UserSubmitted`.

- `access_tier` (string) — `free` | `pro`

- `exam_pool` (boolean)  
  - If true, included in exam pools.

- `category_slugs` (array[string]) — **required**  
  - Path segments for category taxonomy, in kebab-case. Example: `["a320","systems","electrical"]`.
  - Derived from Category Path if present.

- `tags` (array[string]) — short keywords.

- `legacy_id` (string|null) — original id if migrated.

- `status` (string) — `active` | `draft` | `archived`.

- `is_active` (boolean)

- `qc_checklist` (array[string]) — notes from QC.

- `metadata` (object) — optional runtime metadata (e.g., `created_by`, `created_at`, `updated_at`).

## Validation Rules (must / should)
- `question` must be non-empty string (trimmed).
- `choices` must be array of length 4; each item non-empty string.
- `correctIndex` must be integer 0..3 and correspond to a non-empty choice.
- `category_slugs` must have at least one element (root category).
- `access_tier` default to `free` if absent.
- `aircraft` may be empty; if `requires_aircraft` is required by category, `aircraft` must be non-empty (importer/backfill enforces).
- `question_image` and `choice_images` must be rehosted URLs during apply-mode (dry-run must NOT change them).
- All external images must be rehosted via `rehostImage` before final upsert (dev stub allowed in local/test).

## Importer behavior expectations
- Dry-run: normalize inputs, validate & produce per-row report. Must not upsert or rehost images.
- Apply: call `rehostImage` for any remote images, and upsert canonical JSON into DB with `legacy_id` and `migration_status`.
- Idempotency: upsert must use `legacy_source` + `legacy_id` or deterministic keys to avoid duplicates.

## Example minimal object
```json
{
  "id": "s3-0001",
  "question": "What is the effect of selecting ALT FLAPS on approach?",
  "question_image": null,
  "choices": ["Increase lift", "Decrease lift", "No change", "Stall protection"],
  "choice_images": [null, null, null, null],
  "explanations": [null, null, null, null],
  "correctIndex": 0,
  "aircraft": ["a320"],
  "domain": "flight-controls",
  "subject": "flaps",
  "subcategory": null,
  "ata": "27",
  "level": "line",
  "difficulty": "medium",
  "source": "FCOM",
  "access_tier": "free",
  "exam_pool": false,
  "category_slugs": ["a320","systems","flight-controls"],
  "tags": ["flaps","approach"],
  "legacy_id": "legacy-201",
  "status": "active",
  "is_active": true,
  "qc_checklist": [],
  "metadata": {"created_by":"importer","created_at":"2025-10-01T08:00:00Z"}
}
```
