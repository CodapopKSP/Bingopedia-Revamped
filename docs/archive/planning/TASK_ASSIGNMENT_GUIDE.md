# Task Assignment Guide

**Document Purpose**: Quick reference for engineering manager to assign tasks from `BACKEND_TASKS.md` and `FRONTEND_TASKS.md` to engineers.

**Status**: Reference Material (Historical)  
**Last Updated**: Pre-Implementation  
**Related Documents**: 
- `ENGINEERING_PLAN.md` (moved to `archive/historical/completed-work/planning/`)
- `BACKEND_TASKS.md` (in `archive/tasks/`)
- `FRONTEND_TASKS.md` (in `archive/tasks/`)

**Note**: This guide contains task assignment patterns that may be useful for reference, but the specific tasks referenced may be completed.

---

## Overview

This guide helps you assign tasks to engineers based on the engineering plan. All tasks are independently verifiable and include clear acceptance criteria.

---

## Task Files

- **`BACKEND_TASKS.md`**: Tasks for backend engineers (API, database, serverless functions)
- **`FRONTEND_TASKS.md`**: Tasks for frontend engineers (React components, UI, client-side logic)

---

## Task Summary by Engineer Type

### Backend Engineer (6 tasks)

**Phase 1: Critical Bug Fixes**
- **BE-BUG-2**: Fix Leaderboard Default Sort (30 min) - Independent
- **BE-BUG-3**: Fix Leaderboard Time Period Filter (2-3 hours) - Independent
- **BE-BUG-4**: Add gameType Field and Update Terminology (3-4 hours) - Independent

**Phase 2: High Priority Features**
- **BE-FEAT-2**: Implement Hashed ID System (4-5 hours) - Independent

**Phase 3: Medium Priority Features**
- **BE-FEAT-3**: Create Event Logging System (3-4 hours) - Independent

**Phase 4: Optional**
- **BE-OPT-1**: Support Game Persistence (2-3 hours) - Optional, can defer

**Total Estimated Time**: 15-20 hours (excluding optional)

### Frontend Engineer (10 tasks)

**Phase 1: Critical Bug Fixes**
- **FE-BUG-1**: Fix Leaderboard Time Format (1-2 hours) - Independent
- **FE-BUG-2**: Fix Leaderboard Default Sort (30 min) - Depends on BE-BUG-2
- **FE-BUG-3**: Fix Leaderboard Time Period Filter (1-2 hours) - Depends on BE-BUG-3
- **FE-BUG-4**: Update Game Type Terminology (1-2 hours) - Depends on BE-BUG-4

**Phase 2: High Priority Features**
- **FE-FEAT-2**: Update Frontend for Hashed ID System (3-4 hours) - Depends on BE-FEAT-2
- **FE-FEAT-4**: Add "View on Wikipedia" Button (2-3 hours) - Independent

**Phase 3: Medium Priority Features**
- **FE-FEAT-1**: Add Leaderboard Pagination (2-3 hours) - Independent
- **FE-FEAT-3**: Integrate Event Logging (2-3 hours) - Depends on BE-FEAT-3
- **FE-UX-1**: Update Light Mode Styling (2-3 hours) - Independent
- **FE-UX-2**: Fix Mobile Timer/Clicks Visibility (1-2 hours) - Independent

**Phase 4: Optional**
- **FE-OPT-1**: Implement Game Persistence (4-6 hours) - Optional, can defer

**Total Estimated Time**: 18-26 hours (excluding optional)

---

## Critical Path

**Must be done first:**
1. **BE-BUG-2** (Default Sort) → **FE-BUG-2** (Frontend Default Sort)
2. **BE-BUG-3** (Time Filter) → **FE-BUG-3** (Frontend Time Filter)
3. **BE-BUG-4** (Game Type) → **FE-BUG-4** (Frontend Game Type)
4. **BE-FEAT-2** (Hashed ID) → **FE-FEAT-2** (Frontend Hashed ID)
5. **BE-FEAT-3** (Logging API) → **FE-FEAT-3** (Frontend Logging)

**Can be done in parallel:**
- All Phase 1 backend tasks (BE-BUG-2, BE-BUG-3, BE-BUG-4)
- All Phase 1 frontend tasks that don't depend on backend (FE-BUG-1)
- Phase 2 and 3 tasks after dependencies are met

---

## Recommended Assignment Strategy

### Week 1: Critical Bug Fixes

**Backend Engineer:**
- Day 1: BE-BUG-2 (Default Sort) + BE-BUG-3 (Time Filter)
- Day 2-3: BE-BUG-4 (Game Type + Terminology)

**Frontend Engineer:**
- Day 1: FE-BUG-1 (Time Format) - Independent
- Day 2: FE-BUG-2 (Default Sort) - After BE-BUG-2 complete
- Day 2-3: FE-BUG-3 (Time Filter) - After BE-BUG-3 complete
- Day 3-4: FE-BUG-4 (Game Type) - After BE-BUG-4 complete

### Week 2: High Priority Features

**Backend Engineer:**
- Day 1-3: BE-FEAT-2 (Hashed ID System)
- Day 3-4: BE-FEAT-3 (Event Logging)

**Frontend Engineer:**
- Day 1-2: FE-FEAT-4 (View on Wikipedia) - Independent
- Day 3-5: FE-FEAT-2 (Hashed ID Frontend) - After BE-FEAT-2 complete

### Week 3: Medium Priority Features

**Backend Engineer:**
- Support and bug fixes

**Frontend Engineer:**
- Day 1-2: FE-FEAT-1 (Pagination) - Independent
- Day 2-3: FE-FEAT-3 (Event Logging) - After BE-FEAT-3 complete
- Day 3-4: FE-UX-1 (Light Mode) + FE-UX-2 (Mobile Visibility) - Independent

---

## Task Dependencies

```
Backend:
  BE-BUG-2 → Independent
  BE-BUG-3 → Independent
  BE-BUG-4 → Independent
  BE-FEAT-2 → Independent
  BE-FEAT-3 → Independent

Frontend:
  FE-BUG-1 → Independent
  FE-BUG-2 → Depends on BE-BUG-2
  FE-BUG-3 → Depends on BE-BUG-3
  FE-BUG-4 → Depends on BE-BUG-4
  FE-FEAT-2 → Depends on BE-FEAT-2
  FE-FEAT-4 → Independent
  FE-FEAT-1 → Independent
  FE-FEAT-3 → Depends on BE-FEAT-3
  FE-UX-1 → Independent
  FE-UX-2 → Independent
```

---

## Verification Process

Before marking any task complete, verify:
- [ ] All acceptance criteria met (check task file)
- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New tests written and passing
- [ ] No linter errors
- [ ] Code follows project style guidelines
- [ ] Documentation updated (if applicable)
- [ ] Skills documented in `docs/IMPLEMENTATION_SKILLS.md` (if applicable)

---

## Communication Points

**Daily Standup Topics:**
- Blockers or dependencies
- Progress on critical path items
- Integration points between backend/frontend
- Test coverage status

**Handoff Points:**
- BE-BUG-2 complete → FE-BUG-2 can start
- BE-BUG-3 complete → FE-BUG-3 can start
- BE-BUG-4 complete → FE-BUG-4 can start
- BE-FEAT-2 complete → FE-FEAT-2 can start
- BE-FEAT-3 complete → FE-FEAT-3 can start

---

## Risk Areas

**High Risk:**
- BE-BUG-4 (Database Migration) - Test on staging first, create backup
- BE-FEAT-2 (Hashed ID) - Collision handling, backward compatibility
- FE-FEAT-2 (Hashed ID Frontend) - URL routing changes

**Medium Risk:**
- BE-BUG-3 (Time Filter) - Complex date/timezone handling
- FE-BUG-3 (Time Filter Frontend) - Date range calculation

**Low Risk:**
- BE-BUG-2, FE-BUG-1, FE-BUG-2 - Simple changes
- FE-FEAT-4, FE-UX-1, FE-UX-2 - Well-scoped UI features

---

## Success Metrics

**Feature Completion:**
- All tasks have passing tests
- All acceptance criteria verified
- No regressions in existing functionality
- Documentation complete

**Code Quality:**
- No linter errors
- Test coverage maintained or improved
- Code follows project patterns
- Performance not degraded

---

## Quick Reference: Task IDs

**Backend:** BE-BUG-2, BE-BUG-3, BE-BUG-4, BE-FEAT-2, BE-FEAT-3, BE-OPT-1  
**Frontend:** FE-BUG-1, FE-BUG-2, FE-BUG-3, FE-BUG-4, FE-FEAT-1, FE-FEAT-2, FE-FEAT-3, FE-FEAT-4, FE-UX-1, FE-UX-2, FE-OPT-1

See `BACKEND_TASKS.md` and `FRONTEND_TASKS.md` for full task details.

---

**End of Task Assignment Guide**

