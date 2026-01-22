# Bingopedia Documentation Index

**Quick Start**: New agents should read this index first, then focus on the **Active Docs** section.

---

## 🎯 Active Documentation (Required Reading)

### Core Product & Architecture
- **[PRODUCT_PRD.md](./PRODUCT_PRD.md)** - Complete product requirements and specifications
- **[ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)** - System architecture, tech stack, and data flow
- **[ENVIRONMENT_AND_CONFIG.md](./ENVIRONMENT_AND_CONFIG.md)** - Environment variables, deployment config, MongoDB setup

### Active Work
- **[CODE_QUALITY_REFACTORING_CHECKLIST.md](./CODE_QUALITY_REFACTORING_CHECKLIST.md)** - ⚠️ **INCOMPLETE WORK** - Critical issues and refactoring tasks that must be completed

### Reference
- **[API_LEADERBOARD.md](./API_LEADERBOARD.md)** - Leaderboard API documentation (endpoints, request/response formats)
- **[README-backend.md](./README-backend.md)** - Backend setup, local development, and troubleshooting guide
- **[REBUILD_EXECUTION_PLAN.md](./REBUILD_EXECUTION_PLAN.md)** - Implementation phases and milestones (historical reference)
- **[PRODUCT_CHECKLIST.md](./PRODUCT_CHECKLIST.md)** - Product readiness checklist (mostly complete, for reference)

---

## 📚 Archived Documentation

Completed task lists, bug fixes, and implementation checklists have been moved to `docs/archive/`:

- `ENGINEERING_CHECKLIST.md` - Engineering implementation checklist (completed)
- `FRONTEND_BUG_FIXES.md` - Frontend bug fixes (completed)
- `FRONTEND_TASKS.md` - Frontend task list (completed)
- `BACKEND_TASKS.md` - Backend task list (completed)
- `UI_UX_TASKS.md` - UI/UX task list (completed)
- `INCOMPLETE_TASKS_ANALYSIS.md` - Analysis of incomplete tasks (historical)
- `UI_POLISH_CHECKLIST.md` - UI polish checklist (completed)
- `UI_DESIGN.md` - UI design documentation (completed)
- `UI_STRUCTURE.md` - UI structure documentation (completed)
- `BUG_FIXES_SUMMARY.md` - Bug fixes summary (completed)
- `OLD_CODEBASE_REFERENCE_MAP.md` - Reference map to old codebase (archived)

---

## 🔧 Documentation Maintenance

**When to update docs:**
- Product behavior changes → Update `PRODUCT_PRD.md`
- Architecture changes → Update `ARCHITECTURE_OVERVIEW.md`
- Config/env changes → Update `ENVIRONMENT_AND_CONFIG.md`
- Complete a task → Check off in `CODE_QUALITY_REFACTORING_CHECKLIST.md`

**Key principle**: Keep docs as **living artifacts** that reflect current truth, not historical notes.

---

## 📖 Quick Reference

**For Product Questions**: See `PRODUCT_PRD.md`  
**For Architecture Questions**: See `ARCHITECTURE_OVERVIEW.md`  
**For Config/Deployment**: See `ENVIRONMENT_AND_CONFIG.md`  
**For Active Work**: See `CODE_QUALITY_REFACTORING_CHECKLIST.md`

---

## 🗂️ Old Codebase Reference

The original `Bingopedia/` directory contains the old implementation and handoff docs. It is **reference-only** - do not copy code from it, only use it to understand behavior and edge cases.

Key reference files in `Bingopedia/`:
- `HANDOFF_PRODUCT_SPEC.md` - Original product spec (superseded by `PRODUCT_PRD.md`)
- `HANDOFF_CRITICAL_FILES.md` - Critical files inventory
- `src/App.jsx` - Old game logic (reference for behavior)
- `src/services/` - Old service implementations (reference for edge cases)

