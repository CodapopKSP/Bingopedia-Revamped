# Task Assignment Guide

**Quick Reference for Engineering Manager**

This guide helps you assign tasks from `IMPLEMENTATION_TASKS.md` to engineers.

---

## Task Summary by Engineer Type

### Backend Engineer (5 tasks)
- **BE-1**: Date Filtering API (2-3 hours) - Independent
- **BE-2**: Game Type Filtering API (1-2 hours) - Depends on BE-4
- **BE-3**: Games API Endpoints (4-5 hours) - Independent
- **BE-4**: Schema Updates (2-3 hours) - Independent (blocks BE-2)
- **BE-5**: Database Indexes (1 hour) - Independent

**Total Estimated Time**: 10-14 hours

### Frontend Engineer (14 tasks)
- **FE-1**: Timer Bug Fix (4-6 hours) - **CRITICAL** - Independent
- **FE-2**: Theme Context (2-3 hours) - Independent
- **FE-3**: Theme Toggle (2 hours) - Depends on FE-2
- **FE-4**: Date Display (2-3 hours) - Independent
- **FE-5**: Enhanced Sorting (3-4 hours) - Independent
- **FE-6**: Time Filtering UI (3-4 hours) - Depends on BE-1
- **FE-7**: Article Summaries (3-4 hours) - Independent
- **FE-8**: Confetti on Match (2-3 hours) - Independent
- **FE-9**: URL Game Loading (3-4 hours) - Depends on BE-3, FE-10
- **FE-10**: Game State Management (3-4 hours) - Depends on BE-3
- **FE-11**: Shareable Game UI (2-3 hours) - Depends on FE-10
- **FE-12**: Replay Feature (3-4 hours) - Depends on FE-10, BE-4
- **FE-13**: Score Submission Update (1-2 hours) - Depends on BE-4, FE-10
- **FE-14**: Game Type Filter UI (2-3 hours) - Depends on BE-2, BE-4

**Total Estimated Time**: 35-48 hours

### UI/UX Engineer (2 tasks)
- **UI-1**: CSS Variables System (4-6 hours) - Depends on FE-2
- **UI-2**: Color Palette Design (2-3 hours) - Independent

**Total Estimated Time**: 6-9 hours

### Documentation Engineer (4 tasks)
- **DOC-1**: Architecture Docs (2-3 hours) - After features complete
- **DOC-2**: Skills Documentation (2-3 hours) - After features complete
- **DOC-3**: API Documentation (2-3 hours) - After backend complete
- **DOC-4**: README Updates (1-2 hours) - After features complete

**Total Estimated Time**: 7-11 hours

---

## Critical Path

**Must be done first:**
1. **FE-1** (Timer Bug Fix) - Critical bug blocking usability
2. **BE-4** (Schema Updates) - Blocks BE-2 and FE-13, FE-14

**Sequential dependencies:**
- **FE-2** → **FE-3** → **UI-1** (Theme system)
- **BE-3** → **FE-10** → **FE-9, FE-11, FE-12** (Game sharing)
- **BE-1** → **FE-6** (Date filtering)

---

## Recommended Assignment Strategy

### Week 1: Critical & Foundation
**Backend Engineer:**
- BE-4 (Schema Updates) - Day 1-2
- BE-1 (Date Filtering) - Day 2-3
- BE-3 (Games API) - Day 3-5

**Frontend Engineer:**
- FE-1 (Timer Bug Fix) - Day 1-3 **CRITICAL**
- FE-2 (Theme Context) - Day 3-4
- FE-4 (Date Display) - Day 4-5

**UI/UX Engineer:**
- UI-2 (Color Palette) - Day 1-2
- Start UI-1 (CSS Variables) - Day 3 (after FE-2)

### Week 2: Feature Implementation
**Backend Engineer:**
- BE-2 (Game Type Filtering) - Day 1
- BE-5 (Indexes) - Day 1
- Support frontend integration

**Frontend Engineer:**
- FE-3 (Theme Toggle) - Day 1
- FE-5 (Sorting) - Day 1-2
- FE-6 (Time Filtering) - Day 2-3
- FE-7 (Article Summaries) - Day 3
- FE-8 (Confetti) - Day 4
- FE-10 (Game State Management) - Day 4-5

**UI/UX Engineer:**
- Complete UI-1 (CSS Variables) - Day 1-3

### Week 3: Game Sharing & Polish
**Backend Engineer:**
- Support and bug fixes

**Frontend Engineer:**
- FE-9 (URL Loading) - Day 1-2
- FE-11 (Shareable UI) - Day 2
- FE-12 (Replay) - Day 3
- FE-13 (Score Submission) - Day 3
- FE-14 (Game Type Filter) - Day 4

**Documentation Engineer:**
- DOC-3 (API Docs) - Day 1-2
- DOC-1, DOC-2, DOC-4 - Day 3-5

---

## Parallel Work Opportunities

**Can work simultaneously:**
- BE-1, BE-3, BE-4, BE-5 (all backend tasks except BE-2)
- FE-1, FE-2, FE-4, FE-5, FE-7, FE-8 (independent frontend tasks)
- UI-2 (can start immediately)

**Must be sequential:**
- BE-4 → BE-2
- FE-2 → FE-3 → UI-1
- BE-3 → FE-10 → FE-9, FE-11, FE-12
- BE-1 → FE-6

---

## Verification Checklist

Before marking any task complete, verify:
- [ ] All acceptance criteria met
- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New tests written and passing
- [ ] No linter errors
- [ ] Code follows project style
- [ ] Documentation updated (if applicable)

---

## Risk Areas

**High Risk:**
- FE-1 (Timer Bug) - Complex state management, may require multiple iterations
- UI-1 (CSS Variables) - Extensive changes, risk of visual regressions

**Medium Risk:**
- BE-3 (Games API) - New database collection, needs careful testing
- FE-9, FE-10, FE-11, FE-12 (Game Sharing) - Complex feature with multiple dependencies

**Low Risk:**
- BE-1, BE-2, BE-4, BE-5 - Straightforward API/database changes
- FE-4, FE-5, FE-6, FE-7, FE-8 - Well-scoped UI features

---

## Communication Points

**Daily Standup Topics:**
- Blockers or dependencies
- Progress on critical path items
- Integration points between backend/frontend
- Test coverage status

**Handoff Points:**
- BE-1 complete → FE-6 can start
- BE-3 complete → FE-10 can start
- BE-4 complete → BE-2, FE-13, FE-14 can start
- FE-2 complete → FE-3, UI-1 can start
- FE-10 complete → FE-9, FE-11, FE-12 can start

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

**Backend:** BE-1, BE-2, BE-3, BE-4, BE-5  
**Frontend:** FE-1 through FE-14  
**UI/UX:** UI-1, UI-2  
**Documentation:** DOC-1, DOC-2, DOC-3, DOC-4

See `IMPLEMENTATION_TASKS.md` for full task details.

