### 11.3 UI/UX Engineer Checklist

#### Stage 1 – UX Flows & Visual Language

- [x] **User Flows & Wireframes**
  - [x] Define detailed flows for:
    - [x] Start → play → win → submit score.
    - [x] Start → play → win → skip submission.
    - [x] Leaderboard exploration → game details modal.
    - [x] Error states (article load failure, leaderboard/API errors).
  - [x] Create low/medium-fidelity wireframes for:
    - [x] Start screen.
    - [x] Game layout (desktop and mobile variants).
    - [x] Win modal, leaderboard, and game details modal.
- [x] **Visual System**
  - [x] Define:
    - [x] Typography scale and spacing system.
    - [x] Color palette with explicit matched vs winning vs neutral states.
    - [x] Iconography and behaviors for toggles, close buttons, and grid/history switches.
- [x] **Documentation**
  - [x] Create a UI/UX design reference (e.g. Figma) and link it from `PRODUCT_PRD.md` or a dedicated `UI_DESIGN.md`.
  - [x] Capture rationale for key UX decisions (e.g. summary modal vs direct navigation) in a short design notes section (could live in `PRODUCT_QA.md` or `UI_DESIGN.md`).

#### Stage 2 – Detailed Interaction Specs & Accessibility

- [x] **Interaction Specifications**
  - [x] Define precise behaviors (with edge cases) for:
    - [x] Timer start/pause/resume semantics, especially around article loading.
    - [x] Confetti triggers (when it fires, how often, how it stops).
    - [x] History interaction (click counting, highlighting, long-history behavior).
    - [x] Article replacement UX when Wikipedia fails (messages, fallback article selection).
  - [x] Provide microcopy for:
    - [x] Error messages for leaderboard and article failures.
    - [x] Validation messages for username and score submission.
- [x] **Accessibility Guidelines**
  - [x] Specify:
    - [x] Expected tab order sequences for start screen, game screen, and each modal.
    - [x] ARIA label text and roles for icon buttons, toggles, and overlays.
    - [x] Non-color-based indicators for matched/winning states (icons, patterns, etc. as needed).
- [x] **Documentation**
  - [x] Add or update an "Accessibility & UX Guidelines" section in `PRODUCT_PRD.md` or `UI_DESIGN.md` that:
    - [x] Summarizes tab order, ARIA expectations, and color/contrast rules.
    - [x] Links to any external accessibility references used.
  - [x] Ensure copy variants and microcopy are documented so engineers can use the exact strings.

#### Stage 3 – Final Polish, QA Support & Post-Launch Notes

- [x] **Visual & Interaction Polish**
  - [x] Review the implemented UI against wireframes and interaction specs, creating a punch list of:
    - [x] Visual tweaks (spacing, alignment, typography).
    - [x] Interaction adjustments (timing, transitions, feedback).
  - [x] Collaborate with frontend to refine animations and transitions where they materially impact perceived quality.
  - [x] Note: See `UI_DESIGN.md` Section 8 for polish checklist and known tradeoffs.
- [ ] **QA Collaboration**
  - [ ] Partner with engineers to run through:
    - [ ] All 12 win scenarios.
    - [ ] All main flows and error paths (including leaderboard and article failures).
    - [ ] Cross-device testing on key browsers and mobile devices.
  - [ ] Sign off on UX-related items in `PRODUCT_CHECKLIST.md` and `PRODUCT_QA.md`.
- [x] **Documentation**
  - [x] Update the design reference (Figma/`UI_DESIGN.md`) to reflect the final shipped UX, not just the initial plan.
  - [x] Add a short "Known UX tradeoffs / future improvements" section to `PRODUCT_PRD.md` or `UI_DESIGN.md` to document consciously deferred enhancements.