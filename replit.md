# Mky — Mobile-first fitness tracking web app

## Overview
Mky is a mobile-first fitness tracking web app with workout tracking, weekly scheduling, in-app reminders, an AI personal trainer (calorie + macro guidance), and a streak-based gamification loop. Dark forest-green theme with sage/mint accents and minimalist high-contrast UI.

Single-user app (no auth) — a profile is auto-created on first request.

## Architecture
- **Monorepo:** pnpm workspaces.
- **Frontend artifact** — `artifacts/mky` (React + Vite, wouter routing, TanStack Query, framer-motion, Tailwind, shadcn/ui, lucide-react). Mounted at `/`.
- **API server** — `artifacts/api-server` (Express 5, pino, Drizzle ORM). Mounted at `/api/*`.
- **Shared libs:**
  - `lib/api-spec` — OpenAPI 3.1 spec (source of truth).
  - `lib/api-zod` — Orval-generated Zod schemas + TS types.
  - `lib/api-client-react` — Orval-generated TanStack Query hooks.
  - `lib/db` — Drizzle schema + connection (Neon Postgres via `DATABASE_URL`).
- **AI** — Replit OpenAI integration (`AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY`). Trainer chat uses `gpt-5.4`.

## Domain model (lib/db/src/schema/mky.ts)
- `profile` — single row; sex, age, height, weight, goal, activity level, target weight.
- `workout` — name, description, category enum, estimated minutes, `exercises` jsonb (array of `{ id, name, sets, reps, weightKg, durationSeconds, notes }`).
- `session` — completed workout log with duration / calories / notes / `completed_date` (ISO date) for streak math.
- `schedule_entry` — weekday + time-of-day → workout id.

## Key business logic
- **Calorie engine** (`api-server/src/lib/calories.ts`): Mifflin–St Jeor BMR × activity factor (sedentary 1.2 → very_active 1.9), then goal offset (lose −500, build +300, endurance +150, maintain 0). Macros: protein 1.6–2.0 g/kg, fat 25 % of kcal, remainder carbs.
- **Streak** (`api-server/src/lib/dashboardLib.ts`): consecutive distinct dates in `session.completed_date`, anchored to today (or yesterday if no session yet today).
- **Reminders**: derived live from today's schedule entries; flagged `missed` if scheduled time has passed and no matching session exists today, otherwise `upcoming`.
- **Trainer chat**: system prompt + injected profile + calorie summary + recent message history.

## Routes (frontend)
- `/` Dashboard — greeting, today's workout card, streak ring, week dots, weekly stats, recent sessions, missed/upcoming reminder banner.
- `/workouts` list, `/workouts/new`, `/workouts/:id` detail / step-through, `/workouts/:id/edit`.
- `/schedule` — weekly grid (Mon–Sun) with workout + time pickers per day.
- `/trainer` — chat with AI trainer; daily calorie + macro target panel.
- `/profile` — edit stats, goal, activity level (recalculates calorie target on save).

## Conventions
- All API responses are validated with `@workspace/api-zod` schemas before sending.
- Frontend never imports from `@workspace/api-zod/src/...` deep paths — only from the package root.
- Vite base URL via `import.meta.env.BASE_URL.replace(/\/$/, "")` for wouter.
- No emojis in UI copy (per design spec).

## Workflows
- `artifacts/api-server: API Server` — `pnpm --filter @workspace/api-server run dev`.
- `artifacts/mky: web` — `pnpm --filter @workspace/mky run dev`.

## Useful commands
- `pnpm --filter @workspace/api-spec run codegen` — regenerate Zod schemas + React Query hooks after editing `lib/api-spec/openapi.yaml`.
- `pnpm --filter @workspace/db run push` — sync Drizzle schema to Postgres (use `--force` only when safe).
- `pnpm run typecheck:libs` — build composite TS project references for all libs.
