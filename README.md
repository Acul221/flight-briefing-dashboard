# SkyDeckPro — Quiz/Exam Runtime (v3)

This repository contains the web app and Netlify Functions powering the quiz/exam experience.

## Quiz Data Migration (v3)

- Master question source is the new Notion database `NOTION_DB_QUESTION` (v3). The legacy `NOTION_DB_MASTER` is deprecated.
- Admin submit (netlify/functions/submit-question.js) writes to Notion v3 and mirrors to Supabase tables (`questions`, `question_categories`).
- Runtime quiz pulls questions from Supabase via `/.netlify/functions/quiz-pull` (not from Notion).
- The legacy endpoint `/.netlify/functions/fetch-notion-questions` is deprecated and returns 410.

### Runtime Data Path

1. Admin creates/updates question → `submit-question` → Notion v3 + Supabase mirror.
2. Client calls `/.netlify/functions/quiz-pull?category_slug=...&include_descendants=1&aircraft=A320`.
3. Function resolves category → collects linked questions → filters `status = 'published'` → returns normalized items.

`quiz-pull` response (shape):

```
{
  items: [
    {
      id: number,
      legacy_id: string|null,
      question: string,
      image: string|null,
      choices: string[4],
      choiceImages: (string|null)[4],
      correctIndex: 0..3,
      explanation: string,
      explanations: string[4],
      difficulty: 'easy'|'medium'|'hard'|null,
      source: string|null,
      aircraft: string|null,
      tags: string[]
    }
  ],
  count: number,
  category_id: number,
  include_descendants: boolean
}
```

## Health Check

- `/.netlify/functions/quiz-health` returns a small JSON describing the expected `quiz-pull` contract and env readiness flags.
- Use this to quickly verify that the deployment has `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `NOTION_TOKEN`, and `NOTION_DB_QUESTION` set.

## Local Development

```
npm install
npm run dev
# or
netlify dev
```

Ensure the following env vars are configured (in `.env` or Netlify UI):

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `NOTION_TOKEN`, `NOTION_DB_QUESTION`

## Notes

- Importer `notion-import-v3.js` requires `NOTION_DB_QUESTION` and no longer falls back to the legacy DB.
- The deprecated function `fetch-notion-questions.js` intentionally returns 410 to avoid accidental use.
