# Luminora Learning — PRD

## Original Problem Statement
Build a world-class AI-native SaaS "Learning Operating System" (NOT a traditional LMS). Premium, venture-backed, dark-theme glassmorphism. Surfaces: AI Teacher/Tutor, AI Learning Studio (lessons + interactive 3D), AI Exam Engine, AI Evaluation, Study Planner, Career Advisor, Learning Analytics, Personalized Paths. Signature floating AI Orb. Mobile-first. Quality bar: OpenAI / Linear / Stripe / Notion / Arc.

## Architecture
- Backend: FastAPI + MongoDB (motor). Files: server.py, db.py, auth.py (JWT, bcrypt, roles), llm_routes.py (studio/tutor/career/exam via emergentintegrations LlmChat), app_routes.py (dashboard/notes/planner/admin).
- AI: OpenAI **gpt-5.2** via EMERGENT_LLM_KEY (Emergent universal key). Tutor uses SSE streaming.
- Frontend: React + Tailwind + framer-motion + recharts + react-three-fiber/drei (3D). AuthContext, AppShell (sidebar + mobile bottom nav + floating orb).
- Design: deep-space #030712, primary #2563EB, secondary #7C3AED, accent #06B6D4. Fonts Outfit/Manrope. Glassmorphism + aurora.

## User Personas
- Student (primary): learns via Studio/Tutor, takes exams, plans study.
- Parent: monitors progress (dashboard exists; dedicated parent view = backlog).
- Admin: platform analytics (role-gated).

## Implemented (2026-06-02)
- JWT auth (register/login/me), roles student/parent/admin. Seed: admin@luminora.ai/Admin@123, demo@luminora.ai/Demo@123.
- Landing page (hero + AI Orb + live 3D model tabs + features + pricing CTA), Pricing page (4 glass tiers, Best Value).
- Student Dashboard: AI readiness ring, streak/lessons/minutes/goals, weekly area chart, weak topics, recommended lessons.
- AI Learning Studio: prompt -> structured lesson (objectives/sections/examples/flashcards/summary/revision) + interactive Three.js 3D model (heart/dna/atom/solar_system/molecule/brain/earth) with clickable parts -> real-time AI explanation.
- AI Tutor: conversations sidebar, streaming SSE responses, persisted history, suggested prompts.
- AI Exam Engine: generate MCQ exam, focus-mode timer + navigator, submit -> score/breakdown/weak topics/improvement plan.
- Notes Center (CRUD, colors, bookmark, export txt), Study Planner (shadcn calendar, task types, exam countdown), Career Advisor (careers/degrees/skill gaps/roadmap).
- Admin Dashboard: users/revenue/subscriptions/growth charts (role-gated).
- Tested: backend 21/21 pytest pass; frontend critical flows pass.

## Backlog (P1/P2)
- P1: Real Stripe checkout for plans; dedicated Parent dashboard with child linking + weekly reports.
- P1: Voice input + image/document upload in AI Tutor (UI hooks exist, wiring pending).
- P2: Personalized recommendations (replace hardcoded list); retry-once on LLM JSON parse; richer 3D models + part-level labels; lesson save-to-notes; analytics deep-dive page.

## Test Credentials
See /app/memory/test_credentials.md

## Update 2026-06-02 — Curriculum-Aware Academic Intelligence Layer
- Student academic profile: grade/level (Grade 5-12, UG/PG/Cert), education board (14 Indian + 4 international), country, target exam (NEET/JEE/CUET/UPSC/SSC/Banking/CAT/GATE), learning depth, language (English + 10 Indian languages: Malayalam/Hindi/Tamil/Telugu/Kannada/Marathi/Bengali/Gujarati/Punjabi/Urdu).
- Backend: academic.py (GET /api/academic/options, GET/PUT /api/academic/profile, academic_context() builder with input validation/sanitization). Every AI prompt (studio lesson, 3D explain-part, tutor chat, exam, career) now injects the profile + language instruction block, so all content adapts to grade/board/exam pattern and is generated in the chosen language (verified: Malayalam lesson round-trip via gpt-5.2).
- Frontend: 4-step Onboarding wizard (forced for new users via onboarded gate), reused as /app/profile editor; ProfileBadge with one-tap language switcher + edit link shown across Dashboard/Studio/Tutor/Exam/Career.
- Tested: backend 6/6 academic + 21/21 regression green; frontend 5/5 academic flows pass.
- Note: Previous-Year-Question intelligence is delivered as AI pattern-mimicry (original questions in board/exam style); a curated PYQ database is NOT yet stored — backlog item.

## Backlog additions
- P1: Curated previous-year question bank (real papers metadata) to ground exam generation further.
- P2: Per-subject chapter awareness (current chapter tracking) and curriculum citation surfacing in the UI.
