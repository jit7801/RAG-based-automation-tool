# Disclosure Log

**Team:** 2 developers
**Event:** Offline Round 2 — Trials 1 & 2
**Date:** 2026-08-23

This log records tools used, the substance of key prompts, and the division between
AI-generated output and human decisions. Entries are appended as work happens, not
reconstructed afterward. Where AI produced a recommendation that we rejected, the
rejection and its reasoning are recorded too — those are the decisions that shaped
the build most.

---

## Tools used

| Tool | Purpose |
|---|---|
| Claude (Anthropic) | Strategy, architecture decisions, code generation, this log |
| Swytchcode | Mandated execution layer for all external API calls |
| OpenAI API | Primary LLM; Whisper speech-to-text and embeddings if needed |
| Weaviate | Retrieval / grounding layer, accessed via Swytchcode |
| Gemini API | Fallback only — not on the organizers' sanctioned API list (see D-009) |
| React + Vite + Tailwind | Frontend prototype |

Rows will be corrected to reflect what was actually used once the problem statements are
released and the Swytchcode manifests are inspected.

---

## Phase 0 — Pre-problem-statement planning

No problem statement had been released during this phase. Work was limited to
constraint gathering and PS-agnostic decisions.

### D-001 — Scope ceiling set by time budget
**Decision:** Target one core user flow plus a single memorable feature per prototype. No multi-feature dashboards.
**Origin:** Human-set constraint (6–12h total across two trials, two developers); AI-calculated implication.
**Reasoning:** With roughly 2.5–5h of build time per prototype, a second feature can only be added by leaving the first unpolished. Reliability and finish score better than breadth.
**Status:** Adopted.

### D-002 — Rejected OpenAI Realtime API for voice interaction
**Decision:** If voice input is needed, use Whisper transcription on a recorded clip rather than a live realtime voice session.
**Origin:** AI proposed the option set and flagged the risk; human accepted.
**Reasoning:** Realtime voice is the highest-perceived-magic feature available to us, but it degrades badly in noisy rooms and is time-expensive to debug. Whisper on a short recording delivers most of the perceived capability at a fraction of the failure risk.
**Status:** Adopted as a standing constraint.

### D-003 — Rejected vector database for retrieval — **REVERSED, see D-008**
**Original decision:** If semantic search is required, use in-memory cosine similarity over OpenAI embeddings instead of a vector database.
**Origin:** AI recommendation; human accepted.
**Original reasoning:** Provisioning and seeding a vector store would consume a significant share of a single trial's budget. Cosine similarity over a few hundred embedded items is roughly thirty lines, needs no infrastructure, and is fully explainable to a judge.
**Status:** **Reversed** on receipt of the organizers' prep guide, which names Weaviate as the endorsed retrieval layer and features it in nearly every reference architecture. Recorded rather than deleted, because the reversal is itself a decision. See D-008.

### D-004 — Architecture constrained to what both developers can explain
**Decision:** Reject any framework, abstraction, or library that either developer cannot explain on demand.
**Origin:** Human reading of the published rubric; AI concurred and generalized it into an architecture rule.
**Reasoning:** Trial 2 explicitly scores "the team's understanding of the solution." Unexplainable code is a scored liability regardless of how well it works, so simplicity is a scoring advantage here, not merely a speed one.
**Status:** Adopted as a standing constraint.

### D-005 — README and demo video treated as first-class deliverables
**Decision:** Reserve dedicated time for the README and the Trial 2 video rather than producing them from leftover time at the end.
**Origin:** AI inference from the submission format; human accepted.
**Reasoning:** Submission is by GitHub repository, so a judge may evaluate the project without ever executing it. A judge without our API keys sees nothing running, which means written framing and recorded footage carry the demonstration.
**Status:** Adopted.

### D-006 — Pre-build a problem-statement-agnostic scaffold
**Decision:** Build project setup, design tokens, app shell, state components, and the AI provider wrapper before the problem statement is released.
**Origin:** AI proposal; human accepted.
**Reasoning:** Setup work is identical regardless of problem domain and is reusable across both trials. Doing it inside a trial window would consume a large fraction of that trial's build time, twice over.
**Status:** Pending — awaiting go-ahead.

### D-007 — API keys proxied rather than bundled
**Decision:** Route AI calls through a small dev-server middleware proxy instead of calling providers directly from the browser with a `VITE_`-prefixed key.
**Origin:** AI recommendation; human accepted.
**Reasoning:** A `VITE_` key is inlined into the client bundle. Since the deliverable is a public repository, the proxy costs roughly fifteen lines and removes any path by which a key reaches committed or bundled output.
**Status:** Pending — to be implemented with the scaffold.

### D-008 — Adopt Weaviate for retrieval, reversing D-003
**Decision:** Use Weaviate as the retrieval layer when the problem statement calls for grounding or persistent knowledge, accessed through Swytchcode rather than provisioned directly.
**Origin:** Organizers' prep guide; human forwarded it, AI identified the conflict with the standing D-003 constraint and recommended reversal.
**Reasoning:** The guide names Weaviate as the RAG layer and uses it in nine of ten reference architectures, so retrieval is an expected competency rather than an optional flourish. The original objection to vector stores was setup cost, and that objection weakens substantially if Swytchcode brokers the connection — which is the stated purpose of the execution layer. Cost must still be verified against the actual manifests before committing.
**Status:** Adopted, conditional on manifest verification.

### D-009 — OpenAI as primary LLM; Gemini demoted to fallback
**Decision:** Build against OpenAI as the model provider. Do not architect around Gemini-specific capabilities.
**Origin:** AI observation from the sanctioned API list; human accepted.
**Reasoning:** Gemini does not appear anywhere in the organizers' toolbox — the listed LLMs are OpenAI, Mistral, and Cohere — and the guide states "be comfortable with one LLM integration: preferably OpenAI." Designing around Gemini's multimodal input would build the product on an unsanctioned dependency. Our earlier plan to lean on Gemini for video and audio handling is therefore dropped.
**Status:** Adopted.

### D-010 — No relational database, retained from earlier scope decision
**Decision:** No Supabase or Postgres. Application state stays in memory; durable knowledge lives in Weaviate.
**Origin:** AI recommendation; consistent with the toolbox.
**Reasoning:** No relational database appears in the sanctioned toolbox, which suggests none is expected. Weaviate covers grounding and retrieval, and a schema plus auth layer would consume a full trial window for capability the rubric does not ask for. The distinction to hold: a retrieval store is in scope, a relational backend is not.
**Status:** Adopted as a standing constraint.

### D-011 — Product shape is a pipeline with a thin UI, not a feature-rich application
**Decision:** Architect around an orchestration layer that executes an ordered agent workflow, with the interface as a comparatively thin presentation surface over it.
**Origin:** AI inference from the guide's reference architectures; supersedes the earlier assumption that a React SPA with an AI helper module was the right frame.
**Reasoning:** Every reference architecture in the guide is a pipeline of the form input → agent → Swytchcode → services → action. The organizers' closing rule assigns each stage a distinct role. A product built as a conventional app with AI features bolted on would not match the pattern the event is built around.
**Status:** Adopted.

### D-012 — Minimum viable API count, deliberately resisting breadth
**Decision:** Use the fewest APIs that make one workflow genuinely useful. Reject additional integrations added for the appearance of sophistication.
**Origin:** Explicit organizer instruction; AI flagged it as a differentiation opportunity, human accepted.
**Reasoning:** The guide states this twice — "use the minimum number of APIs needed" and "prefer one coherent workflow over a collection of disconnected API demos." Organizers rarely name an anti-pattern twice unless they expect to see it. Most teams will chain many integrations to look impressive, so restraint is a scored advantage here rather than a compromise.
**Status:** Adopted as a standing constraint.

---

## Phase 1 — Trial 1

**Problem statement received:** Build a RAG-based automation tool that retrieves current
trends (news, social chatter, emerging topics), generates content grounded in them, and
posts it automatically at a fixed time each day.

### D-013 — Concept options generated and ranked before any implementation
**Decision:** Spend the opening minutes on analysis rather than setup. Six candidate concepts were generated and scored, and three were rejected on explicit grounds.
**Origin:** AI generated the option set and the ranking; human set the evaluation criteria and holds the final selection.
**Reasoning:** The problem statement closely matches two reference architectures in the organizers' own prep guide, so the default implementation is heavily commoditized and differentiation had to be chosen deliberately rather than discovered mid-build.
**Rejected, with reasons:**
- *Trend-timing / velocity arbitrage* (detect trends before they peak) — rejected as infeasible, not as a bad idea. Demonstrating velocity requires time-series data collected over hours; inside a single trial window the central claim could only be shown with fabricated data.
- *One trend → many audience formats* — rejected as breadth without a thesis. The guide explicitly warns against disconnected API demos, and additional output formats solve no stated problem.
- *Post-hoc retraction when a story changes* — strong concept, deferred. Its demo depends on simulating a source changing mid-run, which reads as staged. Retained as a stretch feature or Trial 2 candidate.
**Status:** Analysis complete; awaiting human selection.

### D-014 — Retrieval must be load-bearing, not decorative
**Decision:** Design the workflow so that removing the vector store would break it, rather than adding retrieval because the guide endorses it.
**Origin:** AI identified the vulnerability; adopted as a design constraint.
**Reasoning:** In the naive reading of this problem statement, RAG is ornamental — scraped article text could simply be passed in the prompt, and a judge is very likely to ask why a vector database is needed at all. Retrieval becomes structurally necessary only when the system must query a corpus it cannot fit in context: its own publishing history, for novelty and continuity, and multiple independent sources, for corroboration of a claim. Both are designed in for that reason.
**Status:** Adopted as a design constraint.

---

## Phase 2 — Trial 2

### D-015 — Unified Workspace Repository Push
**Decision:** Push the complete local workspace including backend code, frontend sources, and metadata directly to the user's remote repository.
**Origin:** Human requested; AI executed the initialization, gitignore setups, conflict resolution, and initial push.
**Reasoning:** Consolidating the full history (both the Express orchestration server and the Vite React app) in a single GitHub repository ensures complete visibility for evaluation.
**Status:** Adopted.

### D-016 — nested .git Folder Cleanup
**Decision:** Remove nested sub-repository structures (`RAG-based-automation-tool/.git`) within the workspace to avoid detached HEAD status and track the entire project structure from the workspace root.
**Origin:** AI identified conflict; human accepted execution.
**Reasoning:** Git will reject tracking folders containing their own `.git` directory under a standard commit, resulting in empty directory references. Removing these nested references keeps the repository structure clean and deployable.
**Status:** Adopted.

### D-017 — Vercel Subdirectory Redirection
**Decision:** Add a workspace-root `vercel.json` file configuring the build command and output directory instead of moving workspace folders or changing options in the dashboard.
**Origin:** AI recommended; human approved.
**Reasoning:** Keeps the repository structure clean and developer-friendly without having to restructure folders, ensuring Vercel builds the React client seamlessly on the Edge host.
**Status:** Adopted.

### D-018 — Dynamic API Environment Detection
**Decision:** Program the React UI to dynamically detect its hostname context (`window.location.hostname`) and redirect API traffic and SSE streams to `http://localhost:8787` when hosted on Vercel.
**Origin:** AI designed and implemented.
**Reasoning:** Express servers cannot run continuously inside serverless platforms without extra setup. By dynamically routing API endpoints, the Vercel-deployed frontend is still fully functional, communicating directly with the locally-hosted orchestrator for real-time validation.
**Status:** Adopted.
