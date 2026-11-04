# FitGenius Web App — Build Progress Tracker

## Architecture

- Stack: React + TypeScript + Tailwind + Vite (web frontend) | FastAPI + Python + SQLAlchemy (web backend) | Supabase PostgreSQL + Redis | Expo/React Native mobile app
- Root: `/Users/7parth/Developer/Projects/FitGenius/web/`
- Frontend: `web/frontend/` | Backend: `web/backend/` | Docker: `web/`
- Expo/React Native app in `fitgenius/` — separate client; coordinate shared auth/schema changes across both apps
- Git Remote: `https://github.com/7parth/FitGenius.git` (branch: `master`)

---

## Overall Status: Web platform and post-launch features through Feature 22 complete; web backend migrated to Supabase. Cross-app Supabase integration and mobile production readiness remain next goals.

### Core 17-Task Plan:

- [x] Task 1: Project scaffold & dev environment — **DONE**
- [x] Task 2: Database schema & Alembic migrations — **DONE**
- [x] Task 3: Auth & authorization (JWT, RBAC, rate limiting) — **DONE**
- [x] Task 4: User onboarding flow (5-step wizard) — **DONE**
- [x] Task 5: Exercise database & API — **DONE**
- [x] Task 6: Recommendation engine (rule-based + content-based) — **DONE**
- [x] Task 7: Workout session management — **DONE**
- [x] Task 8: Real-time pose analysis (MediaPipe, 5 exercises) — **DONE: browser-based landmark tracking, rep counting, voice cues, set persistence, and history**
- [x] Task 9: AI fitness coach (Groq → OpenAI → Simulation provider fallback) — **DONE**
- [x] Task 10: Voice interaction (Web Speech API) — **DONE** (PoseAnalysisPage)
- [x] Task 11: Accessibility settings page — **DONE**
- [x] Task 12: Gamification pages (achievements, leaderboard, challenges) — **DONE**
- [x] Task 13: Progress analytics dashboard — **DONE**
- [x] Task 14: ML recommendation engine Stage 3 (scikit-learn) — **DONE**
- [x] Task 15: Admin dashboard — **DONE**
- [x] Task 16: Wearable & fatigue module — **DONE**
- [x] Task 17: PWA, production hardening, E2E tests — **DONE**

### Post-Launch Feature Extensions:

- [x] Feature 18: Real-time notification center (Backend API + NotificationBell popover) — **DONE & PUSHED**
- [x] Feature 19: GDPR personal data export module (Backend JSON export + Profile action) — **DONE & PUSHED**
- [x] Feature 20: AI Nutrition & Macro Planner (Daily macros, meal logging, AI recipe suggestions) — **DONE & PUSHED**
- [x] Feature 21: Stitch UI Redesign (design tokens, telemetry layout, and page refreshes) — **DONE & PUSHED**
- [x] Feature 22: Groq AI coach integration, nutrition migration fix, and Markdown responses — **DONE & PUSHED**

---

## Post-Launch Extensions — Completed Deliverables

### Feature 18 — Real-Time Notification Center
- **Backend Schema (`app/schemas/notification.py`)**: `NotificationResponse`, `NotificationListResponse`, and `UnreadCountResponse`.
- **Backend Router (`app/api/notifications.py`)**:
  - `GET /api/notifications` — paginated user notification retrieval with `unread_only` filter.
  - `GET /api/notifications/unread-count` — lightweight badge counter.
  - `PATCH /api/notifications/{id}/read` — mark single notification as read.
  - `POST /api/notifications/read-all` — mark all notifications as read.
  - `DELETE /api/notifications/{id}` — remove notification.
- **Frontend Component (`src/components/layout/NotificationBell.tsx`)**:
  - Popover dropdown with unread counter badge and pulse effect.
  - Category iconography (`achievement_unlocked`, `streak_milestone`, `workout_reminder`, `recommendation_ready`, `system`).
  - Quick action to mark all read or delete individual items with outside-click dismissal.
  - Embedded into desktop [`Sidebar.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/components/layout/Sidebar.tsx) and mobile [`AppLayout.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/components/layout/AppLayout.tsx).
- **Backend Test Suite (`tests/test_notifications.py`)**:
  - `test_get_notifications_empty`
  - `test_notifications_lifecycle` (unread check, list, mark-read, delete)

### Feature 19 — GDPR Personal Data Export
- **Backend Endpoint (`GET /api/profile/export`)**:
  - Aggregates user profile, fitness goals, accessibility preferences, workout history, wearable metrics, and unlocked achievements.
  - Sets `Content-Disposition: attachment; filename="fitgenius_user_data.json"`.
- **Frontend Action**:
  - Added "Export My Data (JSON)" button in [`ProfilePage.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/pages/settings/ProfilePage.tsx).
  - Helper [`exportUserData()`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/lib/api.ts) creates temporary blob link for instant machine-readable JSON download.
- **Test Coverage**:
  - `test_export_user_data` in [`tests/test_notifications.py`](file:///Users/7parth/Developer/Projects/FitGenius/web/backend/tests/test_notifications.py).

### Feature 20 — AI Nutrition & Macro Planner
- **Database Models (`app/models/nutrition.py`)**:
  - `NutritionLog` — daily meal tracking (`user_id`, `log_date`, `meal_type`, `name`, `calories`, `protein_g`, `carbs_g`, `fat_g`).
  - `UserNutritionGoal` — target macronutrients and dietary preference (`anything`, `vegetarian`, `vegan`, `keto`, `paleo`, `high_protein`).
  - Relationships connected to `User` in [`app/models/user.py`](file:///Users/7parth/Developer/Projects/FitGenius/web/backend/app/models/user.py).
- **Backend Schemas (`app/schemas/nutrition.py`)**:
  - Goal updates, log creation, daily nutrition summaries, and AI meal recommendations.
- **Backend Router (`app/api/nutrition.py`)**:
  - `GET /api/nutrition/today` — macro summary against daily goals with logged meal items.
  - `POST /api/nutrition/log` & `DELETE /api/nutrition/log/{id}` — log meal and delete meal entries.
  - `GET /api/nutrition/goals` & `PUT /api/nutrition/goals` — target macro management.
  - `POST /api/nutrition/ai-recommend` — AI-curated recipes matching target calories and dietary preferences.
- **Frontend Page (`src/pages/nutrition/NutritionPage.tsx`)**:
  - Visual macro progress cards (Calories, Protein, Carbs, Fats) with dynamic percentages.
  - Log Meal modal supporting Breakfast, Lunch, Dinner, Snack with macro inputs.
  - AI Recipe Ideas tab displaying prep time, ingredients, dietary tags, and 1-click "Log Entry".
  - Routing added to [`App.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/App.tsx) and navigation in [`Sidebar.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/components/layout/Sidebar.tsx).
- **Backend Test Suite (`tests/test_nutrition.py`)**:
  - `test_get_nutrition_today_empty`
  - `test_log_and_delete_meal`
  - `test_update_goals_and_ai_recommend`

### Feature 22 — AI Coach Provider Integration & Nutrition Migration
- **AI providers**: Groq primary, OpenAI fallback, and simulation fallback; provider/model configuration is server-side.
- **Coach API**: Engine status endpoint, conversation CRUD, richer profile context, and timestamp serialization.
- **Frontend**: Coach messages render Markdown and GitHub-flavored Markdown.
- **Database**: Alembic migration `003_add_nutrition_tables.py` creates nutrition tables and safely creates enum types.
- **Tests**: `tests/test_coach.py` covers engine status and conversation operations.

### Pose Tracker — Live Functionality
- **Frontend (`src/pages/pose/PoseAnalysisPage.tsx`)**: Live browser camera with MediaPipe landmark overlay; exercise selection for squat, push-up, bicep curl, shoulder press, and lunge; joint-angle-driven rep detection; pause/resume, counter reset, optional spoken cues, live landmark-visibility confidence score, rest timer, and session ending.
- **Persistence (`app/api/pose.py`)**: Pose set submission creates a workout session for the selected pose-supported exercise, stores reps/form score/feedback, and returns session identifiers. Existing ownership checks remain in place. Recent saved sets display in page history.
- **Tests (`tests/test_pose.py`)**: Covers set recording/history, unknown exercise rejection, and score validation.

### Dashboard — Live Data & Working Actions
- **Frontend (`src/pages/dashboard/DashboardPage.tsx`)**: Replaced static/mock telemetry with progress summary, weekly completed-workout history, recommendation, nutrition totals/macros, gamification milestones, and latest wearable/recovery data.
- **Actions**: Generate/refresh recommendation with loading/error state; navigate to workout planner, progress analytics, nutrition, coach, achievements, and Pose Tracker.
- **Data states**: Handles loading, unavailable wearable data, missing recommendations, and request errors without invented metric values.

### Nutrition — Complete Tracking & Sample Data
- **Frontend (`src/pages/nutrition/NutritionPage.tsx`)**: Live daily/selected-date meal history and macro totals; log/delete meals; edit calorie/macro/dietary goals; recipe suggestions with working filters, ingredient details, and quick logging; barcode product lookup via Open Food Facts with editable values before save.
- **Seed script (`scripts/seed_nutrition_demo.py`)**: Idempotently adds sample goals if missing and breakfast/lunch/snack examples for an explicitly selected existing account/date.
- **Database populated**: Selected local development account has 3 sample meals for 2026-09-26 (1,450 kcal total; 124g protein). Existing 2,200 kcal goal was preserved. Re-running seed added 0 duplicates.

### AI Coach — Reference-Aligned Functional Studio
- **Frontend (`src/pages/coach/CoachPage.tsx`)**: Rebuilt around the Stitch chat studio with real coach-engine status, saved conversation history/select/delete/new-chat flows, Markdown replies, quick prompts, voice input/replies, text/CSV/JSON attachment drafts, and a working telemetry refresh.
- **Context sidebar**: Live profile, fatigue assessment, supported wearable metrics, and recent workout history; removed fabricated sample messages and biometric values.
- **Actions**: Telemetry detail dialog, wearable settings navigation, workout planner navigation, engine status refresh, and error/loading states.

### Groq Runtime Configuration Fix
- **Root cause**: Backend settings used a cwd-relative `.env`; launching from `web/backend` ignored `web/.env` and silently selected simulation.
- **Fix**: Resolve the shared env file from the config module path; engine status now reports the selected provider's actual model. Startup diagnostics check both Groq and OpenAI. Tests explicitly disable external API keys unless mocked.
- **Verified live**: Current Coach endpoint reports Groq active with `openai/gpt-oss-120b`; a service-level request returned a Groq reply.

### Supabase Database Migration — Web Backend (2026-11-04)
- **Connection**: `web/.env` now uses the Supabase IPv4 session pooler; credentials remain local and ignored by Git. Direct database DNS resolved to IPv6-only, so use the Supabase session pooler for IPv4-only environments.
- **Compose/config**: Docker Compose honors `DATABASE_URL`; `web/.env.example` documents direct and pooler URL formats. Alembic escapes percent-encoded URL credentials before ConfigParser interpolation.
- **Remote schema**: Alembic revisions `001`–`003` applied and verified at `003 (head)`. Seeded 44 exercises, 10 achievements, and 15 workout templates.
- **Data**: The Supabase database was empty before migration. No existing local user/workout data was transferred; only schema migrations and reference/catalog seed data were applied.
- **Important integration gap**: The web backend's custom-JWT schema is not the Expo app's schema. The Expo client expects Supabase Auth-backed `profiles`, `workouts`, and `workout_sets`, while the web migration created its own `users`, `user_profiles`, workout/session tables, and an incompatible `exercises` table. Do not apply `fitgenius/supabase/schema.sql` unchanged to this database.
- **Verification**: Remote Alembic revision and catalog counts verified. Local backend suite in this environment: 78 passed, 17 failed because Redis was not running; Docker was unavailable locally.

---

## Core Task Completed Deliverables

### Task 2 — Database Schema & Migrations
- **Migration 001 (`alembic/versions/001_initial_schema.py`)**: All 17 tables + 18 enum types in correct FK order.
- **Migration 002 (`alembic/versions/002_perf_indexes.py`)**: 8 composite/single-column performance indexes:
  - `ix_workout_sessions_user_status` — (user_id, status)
  - `ix_workout_sessions_user_completed_at` — (user_id, completed_at)
  - `ix_wearable_data_user_recorded_at` — (user_id, recorded_at)
  - `ix_recommendations_user_created_at` — (user_id, created_at)
  - `ix_challenge_participants_challenge_status` — (challenge_id, status)
  - `ix_exercise_performances_set_number` — (set_number)
  - `ix_exercise_performances_pose_score` — (pose_score)
  - `ix_notifications_user_is_read` — (user_id, is_read)

### Task 3 — Auth & RBAC
- **Test File (`tests/test_rbac.py`)**: 18 test cases covering Admin RBAC (403/401), token rotation, logout, and protected routes.
- **Bug Fix**: Coerced `RecommendationResponse.created_at` to `datetime` in schema to resolve ORM serialization.

### Task 14 — ML Recommendation Engine (Stage 3)
- **Engine**: 3-stage engine (rule-based -> content-based -> ML hybrid).
- **Singleton Wrapper**: `ml_recommender.py` utilizing `TruncatedSVD`.
- **Model Trainer**: `model_trainer.py` log1p interaction matrix to pickle serializer.
- **Test File (`tests/test_recommendations.py`)**: 13 test cases covering stage selection, unit fallback, and trainer matrix generation.

### Task 17 — PWA, Production Hardening & E2E Testing
- **E2E Specs**:
  - `frontend/e2e/auth.spec.ts` (6 tests)
  - `frontend/e2e/accessibility.spec.ts` (21 tests)
  - `frontend/e2e/navigation.spec.ts` (8 tests)
  - `frontend/e2e/pwa.spec.ts` (10 tests)
  - `frontend/e2e/workout_flow.spec.ts` (14 tests)
- **CI Workflow (`.github/workflows/ci.yml`)**: Multi-job automated pipeline (Backend test/lint, Frontend tsc/build, Playwright Chromium E2E, Docker prod build).

### Feature 21 — Pixel-Perfect Stitch UI Redesign
- **Design Tokens & Fonts**:
  - Configured Google Fonts `Outfit` and `Inter` with optical variable weights.
  - Implemented Google `Material Symbols Outlined` icon font.
  - Set up Stitch dark palette in [`tailwind.config.ts`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/tailwind.config.ts) (`surface-container-low`, `primary-container` `#00f0ff`, `secondary` `#4edea3`, `tertiary-container` `#e1d2ff`, `error-container`).
- **Telemetry Shell**:
  - Aside Sidebar with glowing cyan active states, Precision Bio-AI logo, and `Neural Engine v4.2.0-ULTRA • 60 FPS` status chip.
  - Telemetry Header with real-time sync status, `Recovery: 94% • Optimal`, and quick workout launcher.
- **5 Master Studio Pages Redesigned**:
  1. [`DashboardPage.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/pages/dashboard/DashboardPage.tsx): Bio-Readiness radial SVG arc, 7-day micro bar cadence, Hero AI workout with muscle tokens, nutrient intake ring.
  2. [`PoseAnalysisPage.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/pages/pose/PoseAnalysisPage.tsx): 16:9 dark camera viewport with glowing SVG skeletal tracking, 110° depth marker, 92% Form gauge, rep counter, rest timer, and kinetic symmetry telemetry.
  3. [`NutritionPage.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/pages/nutrition/NutritionPage.tsx): 4 Bento Macro KPI cards, meal timeline, AI Chef recipes with high protein / low carb filters, and quick modal logging.
  4. [`CoachPage.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/pages/coach/CoachPage.tsx): Chat studio with Modified Routine: Low-Impact Lower Body interactive card, prompt pills, voice toggle, and biometric vitals aside.
  5. [`LeaderboardPage.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/pages/gamification/LeaderboardPage.tsx): Top 3 podium (Marcus K. champion, Elena V., David S.), contender ranking table, and active community challenges.
  6. [`WorkoutPlayerPage.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/pages/workout/WorkoutPlayerPage.tsx) & [`WorkoutSummaryPage.tsx`](file:///Users/7parth/Developer/Projects/FitGenius/web/frontend/src/pages/workout/WorkoutSummaryPage.tsx): Live session timer, expandable sets logging matrix, and post-workout bento telemetry card.

---

## Complete Verification Results

| Check | Result | Scope |
|---|---|---|
| `pytest tests/` | ✅ **94 passed** | Full backend suite including Pose Tracker persistence and Groq routing tests |
| Frontend E2E specs | 59 discovered statically | auth (6), accessibility (21), navigation (8), PWA (10), workout flow (14); runtime pass count not re-verified |
| `npm run build` | ✅ **0 errors** | Production frontend bundle built after Pose Tracker and Nutrition work |
| `npx tsc --noEmit` | ✅ **0 errors** | Strict frontend TypeScript check |
| `python3 -m py_compile app/api/pose.py tests/test_pose.py scripts/seed_nutrition_demo.py` | ✅ **0 errors** | Pose API and nutrition seed script compile |
| `python3 -m py_compile app/api/pose.py tests/test_pose.py` | ✅ **0 errors** | Pose API and tests compile |
| Alembic Migrations | 001, 002, and 003 present | Migration 003 adds nutrition tables |

---

## Git Commit & Push Log

| Commit | Date | Message |
|---|---|---|
| `77d76d6` | 2026-11-04 | `feat: add Expo mobile app and Supabase migration` |
| `1c2891e` | 2026-09-25 | `feat(web): complete Web App implementation with ML recommendation engine, RBAC, PWA hardening, real-time notifications, and GDPR export` |
| `4a28fe2` | 2026-09-26 | `feat(nutrition): add AI Nutrition & Macro Planner with daily tracking and AI meal ideas` |
| `712ebb4` | 2026-09-26 | `feat(web): replicate pixel-perfect Stitch UI design across all pages` |
| `a6ab3cc` | 2026-09-26 | `feat(workout): restyle workout player and summary with Stitch design tokens` |
| `55d23c4` | 2026-09-26 | `feat(ui): integrate Stitch design system across Wearables, Workouts, Analytics, Exercises, and Auth modules` |
| `eeed74d` | 2026-09-26 | `feat(coach): integrate LangChain Groq AI, fix nutrition DB migration, render markdown` |

---

## Key Design Decisions & Constraints

1. **AI provider keys server-side ONLY** — Groq/OpenAI keys never in frontend bundles or API responses.
2. **Medical disclaimers required on**: onboarding step 4 (accessibility), pose analysis page, fatigue recommendations, wearable widget.
3. **Disability info = user preference, not medical diagnosis** — careful and respectful language throughout.
4. **No dangerouslySetInnerHTML** anywhere — XSS prevention.
5. **All DB queries via SQLAlchemy ORM** — no raw SQL string interpolation.
6. **Redis used for**: leaderboard sorted sets (ZADD/ZREVRANGE), recommendation cache (30min TTL), token blacklist (logout), rate limit counters.
7. **Alembic only for schema changes** — no manual ALTER TABLE.
8. **Expo `fitgenius/` directory**: treat as a separate app, but coordinate shared data, auth, secrets, and release changes with the web app.
9. **WCAG 2.1 AA**: min 4.5:1 contrast, visible focus rings (2px outline), no color-only encoding, keyboard navigable, ARIA live regions for dynamic content.
10. **Gamification points formula**: `base(difficulty) × duration_multiplier × streak_multiplier`.
11. **Recommendation stages**: Stage 1 = rule-based (cold start), Stage 2 = content-based (3+ sessions), Stage 3 = ML hybrid (20+ sessions).
12. **Fatigue levels**: NORMAL / REDUCED / RECOVERY — fed into recommendation engine to adjust intensity.
13. **Pose analysis exercises**: squat, push_up, bicep_curl, shoulder_press, lunge (`supports_pose_analysis=true`).
14. **Leaderboard**: Redis sorted sets, expose display_name NEVER email, user's rank always included even if outside top 50.
15. **Notifications**: In-memory and persisted notifications with automatic polling and unread badge calculation.
16. **Nutrition & Macro Tracking**: Goal-based daily totals, interactive macro cards, and AI-curated recipes.

---

## Next Goals — Project Review (Prioritized)

### Goal 1 — Unify Supabase Auth and Data Across Web + Mobile (P0)
- Decide on one supported identity model: migrate web auth to Supabase Auth or provide a deliberate, secure bridge between the web JWT users and `auth.users` used by Expo.
- Reconcile the incompatible web and mobile table contracts, especially `exercises`, profiles, and workout history. Produce a canonical schema and versioned Alembic/Supabase migrations; do not apply the existing mobile SQL file wholesale because it conflicts with the live web schema.
- Add the Expo app's required Supabase URL and anon/publishable key through local/deployment secrets, then verify registration, login, onboarding, profile load/update, workout save, and history against Supabase with per-user RLS tests.
- Confirm whether a legacy local database contains records; if so, export/import user-owned data with ID/FK mapping and row-count checks before retiring it.

### Goal 2 — Remove Client-Exposed AI Secrets and Complete Mobile Runtime Configuration (P1)
- Remove `EXPO_PUBLIC_OPENAI_API_KEY` from mobile configuration and route AI requests through an authenticated server-side API/Edge Function with rate limits and usage/error handling.
- Add validated environment setup and startup diagnostics for both apps. Never put service-role or provider keys in Expo `EXPO_PUBLIC_*` variables.
- Verify the mobile app builds and can complete its primary Supabase flows using only public client credentials.

### Goal 3 — Replace Simulated Mobile Pose Tracking (P1)
- `fitgenius/app/ai/camera.tsx` currently animates a simulated joint angle and generated form score while showing a live camera preview; it does not analyze camera landmarks.
- Implement real on-device pose estimation and exercise-specific rep/form evaluation, handle permissions/device performance safely, and persist session results to the canonical workout schema.
- Add meaningful tests for rep-state transitions and validation; clearly label any unsupported or estimated metrics.

### Goal 4 — Make CI Cover the Actual Repository and Deployment Topology (P1)
- Align GitHub Actions branch filters with the repository's active default branch (`master` per tracker/remote history) and ensure changes outside `web/**` trigger checks.
- Add Expo lint/typecheck/doctor/build checks and mobile tests; retain backend PostgreSQL + Redis integration tests and add API-to-database smoke coverage.
- `web/README.md` is currently empty; document local setup, Supabase/pooler configuration, migrations/seeding, CI checks, and production deployment.
- Update production Compose so a Supabase `DATABASE_URL` does not require booting/depending on an unused local PostgreSQL service. Keep Redis requirements explicit and verify production migrations, health checks, and secret injection in a deployment smoke test.
- Re-run the complete backend, frontend, E2E, and mobile checks and replace the historical verification table with current results.
