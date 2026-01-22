## Agent Skill – Keep Product & Tech Docs in Sync

This “skill” describes how agents should update documentation as they work on the Bingopedia revamp. Treat it as a standing rule.

---

### 1. When to Update Docs

- **Always update docs** when you:
  - Change or clarify **product behavior**, requirements, or scope.
  - Change or add **architecture** (modules, flows, data models).
  - Add or modify **environment variables**, deployment details, or external services.
  - Create or significantly change **flows, scripts, or data processes**.
  - Add new “skills” or working agreements for agents.

If you’re unsure whether a change is “big enough,” **err on the side of updating the docs.**

---

### 2. Which Doc to Update

Agents should map their changes to these docs:

- **Product behavior / requirements**
  - Update: `PRODUCT_PRD.md`
  - Also: Add clarifications or decisions to `PRODUCT_QA.md` if they come from new Q&A.

- **Architecture, modules, and data flow**
  - Update: `ARCHITECTURE_OVERVIEW.md`

- **Environment, config, and external services**
  - Update: `ENVIRONMENT_AND_CONFIG.md`

- **Execution/implementation plan and milestones**
  - Update: `REBUILD_EXECUTION_PLAN.md`

- **Product-level readiness / status**
  - Update: `PRODUCT_CHECKLIST.md` (tick off items as they are completed).

- **New working practices or helper behaviors**
  - Update: `SKILL_UPDATE_DOCS.md` (this file) or add a new skill file if more appropriate.

---

### 3. How to Update Docs

1. **Make the code or config change first** (or at the same time), ensuring it aligns with the PRD.
2. **Locate the relevant doc section**:
   - Feature → `PRODUCT_PRD.md`.
   - Architecture change → `ARCHITECTURE_OVERVIEW.md`.
   - Env var / deployment detail → `ENVIRONMENT_AND_CONFIG.md`.
3. **Edit the doc in-place**:
   - Keep headings and structure consistent.
   - Prefer concise bullet points over long prose.
   - Reflect the **current truth**, not history.
4. **Keep checklists up to date**:
   - When a product-level item is done, tick its checkbox in `PRODUCT_CHECKLIST.md`.

---

### 4. Examples

- If you:
  - Add or change a **leaderboard field or rule** → Update `PRODUCT_PRD.md` (Leaderboard section) and, if needed, `ARCHITECTURE_OVERVIEW.md` (data model).
  - Add a **new env var** for Wikipedia or MongoDB → Update `ENVIRONMENT_AND_CONFIG.md`.
  - Finish implementing **win detection** → Tick relevant items in `PRODUCT_CHECKLIST.md`.
  - Agree on a new **product decision** via Q&A → Record it in `PRODUCT_QA.md` and reflect it in `PRODUCT_PRD.md`.

---

### 5. Agent Reminder (TL;DR)

- Before you finish a task, quickly ask:
  - **“Did I change behavior, data, or architecture?”**  
  - **“If so, did I update the right markdown doc?”**
- Keep docs as **live artifacts**, not historical notes.  
  Agents should assume that future work will rely on these docs being accurate.


