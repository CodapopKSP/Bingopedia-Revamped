## core-assets – Preserved Data, Scripts, and Assets

This directory collects all **critical, non-code artifacts** from the legacy `Bingopedia/` app so the new implementation does not depend on the old app tree staying intact.

---

## 1. Contents

- `data/`
  - `masterArticleList.txt`
  - `masterArticleList.txt.backup`
- `scripts/`
  - All legacy data-generation and utility scripts from `Bingopedia/scripts/`.
- `public/`
  - `Confetti.lottie`
  - `globe.png`
- `categoryGroups.json`

These files are also described in detail in `HANDOFF_CRITICAL_FILES.md`.

---

## 2. Usage in the New Architecture

- **At build/setup time**
  - If `curatedArticles.json` ever needs to be regenerated:
    - Use `core-assets/data/masterArticleList.txt` as input.
    - Run scripts from `core-assets/scripts/` (see inline comments in those files).
    - Output `curatedArticles.json` into the new app’s `public/` directory.
  - When scaffolding the new frontend app, copy:
    - `core-assets/public/Confetti.lottie` → `public/Confetti.lottie`.
    - `core-assets/public/globe.png` → `public/globe.png`.

- **At runtime**
  - The running app should **not** read from `core-assets/` directly.
  - It should instead:
    - Load `curatedArticles.json` from its own `public/` folder.
    - Treat `core-assets/` as an internal backup and maintenance source.

---

## 3. Maintenance Notes

- Do not modify the files in `core-assets/` casually; they are the canonical copies preserved from the legacy app.
- If you re-run scripts and change article data:
  - Document what changed and why in a separate markdown note (e.g. `DATA_UPDATES.md`).
  - Keep `masterArticleList.txt.backup` intact as an original baseline where possible.


