# Deutsch Duo 🇩🇪

A mobile-first German vocabulary PWA built from the uploaded `Sicher_B2_1_Daily_Vocabulary_with_Sentences.xlsx` workbook.

## Included

- 300 workbook entries, organised as 30 days × 10 entries.
- Front/back flashcards with flip animation and German text-to-speech.
- Previous/next navigation and shuffle.
- Per-word states: new, known, and needs practice.
- Separate revision deck and all-vocabulary revision.
- Five quiz modes: German → English, English → German, article challenge, missing word, and mixed revision.
- Immediate answer feedback and end-of-quiz score.
- Two separate local learner profiles.
- Per-profile mastered words, daily progress, quiz accuracy, quiz history and activity streak.
- Local persistence with `localStorage`.
- Export/import progress JSON to manually move a learner's progress.
- PWA manifest, app icons, service worker and offline asset cache.

## Run locally

The app must be served over HTTP; opening `index.html` directly as a `file://` URL will not load the vocabulary JSON or register the service worker.

With Python installed:

```bash
cd deutsch-duo
python3 -m http.server 8000
```

Then open `http://localhost:8000` on the computer. This is for local development/testing. For iPhone Safari installation and offline use, deploy the folder to an HTTPS host.

## Host for iPhone Safari

Any static HTTPS host works. For example:

### GitHub Pages
1. Create a private or public GitHub repository.
2. Upload the contents of this folder to the repository root.
3. In repository Settings → Pages, select the deployment branch and root folder.
4. Wait for GitHub Pages to publish the HTTPS address.

### Netlify / Cloudflare Pages
1. Create a new static site.
2. Upload this folder or connect its Git repository.
3. Set the publish directory to the folder containing `index.html`.
4. Use the HTTPS URL provided by the host.

Do not rename or separate `vocabulary.json`, `app.js`, `styles.css`, `manifest.webmanifest`, or `sw.js` from `index.html`.

## Add to iPhone Home Screen

On each iPhone:
1. Open the deployed HTTPS URL in **Safari** (not an in-app browser).
2. Tap the Share icon.
3. Choose **Add to Home Screen**.
4. Keep the name `Deutsch Duo` and tap **Add**.
5. Launch it from the new Home Screen icon.

Open the hosted URL once while online so the service worker can cache the app files. The first visit requires an internet connection; subsequent visits can use the cached app offline. Browser speech synthesis availability and voice selection depend on iOS.

## Two learners and device synchronisation

The two profiles are local profiles stored in the browser's `localStorage`. They are separate on one browser installation, but local browser storage does **not** synchronise between phones.

For now, each learner can use Profile → Export progress on the old device, then Profile → Import progress on the other device. This is a manual transfer and is not a shared online database. Avoid importing one learner's file into the other learner's profile.

### Cloud sync upgrade (Supabase)

To enable automatic sharing across both iPhones, create a Supabase project and add:
- Supabase Auth (each learner signs in with their own account).
- A `learner_progress` table keyed by `user_id`.
- Row Level Security so each user can read/write only their own progress.
- A small sync layer in `app.js` that uploads the active profile's progress after changes and fetches it after sign-in.

Suggested SQL starter (run in Supabase SQL Editor):

```sql
create table public.learner_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.learner_progress enable row level security;

create policy "read own progress"
on public.learner_progress for select
using (auth.uid() = user_id);

create policy "insert own progress"
on public.learner_progress for insert
with check (auth.uid() = user_id);

create policy "update own progress"
on public.learner_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

No Supabase project URL or keys were supplied, so this build intentionally does not pretend cloud sync is connected. Do not put a Supabase service-role key in browser JavaScript. A production sync implementation should use the public anon key with Auth and the RLS policies above.

## Workbook notes

The workbook contains exactly 300 data rows (excluding the header), with all eight columns populated:
- Day
- Daily word
- Lesson
- German (with article)
- Word type
- English meaning
- German example sentence
- English translation

Every day is numbered 1–30 and contains 10 entries. The original Lesson column contains a few boundary inconsistencies (for example Day 5 contains entries labelled both `1 – Freunde` and `2 – In der Firma`; Day 30 contains entries labelled `6 – Städte erleben` and `1 – Freunde`). The app preserves the workbook's labels and content as supplied. It does not silently correct them.

The app uses the German string in the workbook as the card prompt. Where the workbook provides a noun with an article, the article is included in that string. The article quiz is offered for entries whose German field begins with `der`, `die`, or `das`.

## Testing performed

The source bundle was checked for:
- JSON parsing and exactly 300 vocabulary records.
- Exactly 10 records for each of Days 1–30.
- Presence of all eight workbook fields on every record.
- JavaScript syntax (`node --check`).
- PWA manifest and service worker asset references.

A headless browser run was attempted, but the runtime did not have a browser binary installed. A full browser/iPhone Safari end-to-end test therefore remains outstanding and requires deployment to an HTTPS origin and testing on physical devices. No claim of completed physical-device testing is made.
