# Bingopedia Project Handoff Documentation

## Welcome

This directory contains comprehensive documentation for the Bingopedia Wikipedia Bingo game project, prepared for handoff to a new development team. The project is being retired and rebuilt due to accumulated tech debt.

### ⚠️ Important: Code Reference vs. Fresh Implementation

**The existing codebase in this repository is available for reference only.**

**You should rebuild the application from scratch** using these specifications. 

**Use the existing code to:**
- Understand behavior and edge cases
- See implementation patterns and approaches  
- Reference data structures and API formats
- Understand complex logic (article matching, redirect resolution, win detection)

**But write fresh, clean code** for the new implementation. Don't copy-paste old code - use it as a reference guide only. The goal is to rebuild with modern best practices and clean architecture, not to port the existing codebase.

---

## 📚 Documentation Index

### 1. [Product Specification](./HANDOFF_PRODUCT_SPEC.md)
**Complete product specification document** - Read this first for a comprehensive understanding of the product.

**Contents:**
- Product overview and core features
- Game mechanics and user flows
- Technical requirements
- Data structures and API specifications
- Business rules and success metrics

**When to read:** Start here for full product understanding.

---

### 2. [Critical Files Inventory](./HANDOFF_CRITICAL_FILES.md)
**List of files that MUST be preserved** - Critical for data preservation.

**Contents:**
- Data files (article lists, JSON files)
- Asset files (confetti animation, images)
- Script files (data generation tools)
- Configuration files
- Migration checklist

**When to read:** Before starting migration, to identify what to preserve.

---

### 3. [Quick Start Guide](./HANDOFF_QUICK_START.md)
**Rapid onboarding guide** - Get up and running quickly.

**Contents:**
- Immediate actions (first day)
- Core system understanding
- Testing procedures
- Common issues and solutions
- First week priorities

**When to read:** After reading Product Spec, for practical implementation guidance.

---

## 🚀 Quick Navigation

### I want to...

**Understand what this product does:**
→ Read [Product Specification - Section 1](./HANDOFF_PRODUCT_SPEC.md#1-product-overview)

**Know what files I must preserve:**
→ Read [Critical Files Inventory - Section 7](./HANDOFF_CRITICAL_FILES.md#7-file-priority-summary)

**Get started quickly:**
→ Read [Quick Start Guide - Section 1](./HANDOFF_QUICK_START.md#1-immediate-actions-first-day)

**Understand the game mechanics:**
→ Read [Product Specification - Section 2](./HANDOFF_PRODUCT_SPEC.md#2-core-features)

**Understand the data system:**
→ Read [Product Specification - Section 2.3](./HANDOFF_PRODUCT_SPEC.md#23-data-management) and review `scripts/` directory

**Fix a specific issue:**
→ Read [Quick Start Guide - Section 5](./HANDOFF_QUICK_START.md#5-common-issues--solutions)

**Deploy the application:**
→ Read [Product Specification - Section 6](./HANDOFF_PRODUCT_SPEC.md#6-deployment-configuration) and [Quick Start Guide - Section 9](./HANDOFF_QUICK_START.md#9-deployment-checklist)

---

## 📋 Recommended Reading Order

### For Project Managers / Product Owners
1. [Product Specification - Sections 1-2](./HANDOFF_PRODUCT_SPEC.md) (Overview & Features)
2. [Product Specification - Section 11](./HANDOFF_PRODUCT_SPEC.md#11-success-metrics) (Success Metrics)
3. [Critical Files Inventory - Section 7](./HANDOFF_CRITICAL_FILES.md#7-file-priority-summary) (Priority Summary)

### For Developers
1. [Product Specification](./HANDOFF_PRODUCT_SPEC.md) (Full read)
2. [Critical Files Inventory](./HANDOFF_CRITICAL_FILES.md) (Full read)
3. [Quick Start Guide](./HANDOFF_QUICK_START.md) (Full read)
4. Review `scripts/` directory (for data generation)
5. [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) (Performance notes)
6. **Reference existing codebase** - Study implementation patterns, then write fresh code

### For DevOps / Infrastructure
1. [Product Specification - Section 6](./HANDOFF_PRODUCT_SPEC.md#6-deployment-configuration)
2. [Critical Files Inventory - Section 6](./HANDOFF_CRITICAL_FILES.md#6-database--api-configuration-critical---for-backend)
3. [Quick Start Guide - Section 9](./HANDOFF_QUICK_START.md#9-deployment-checklist)

---

## ⚠️ Critical Warnings

### Data Loss Risk
**⚠️ CRITICAL**: The following files contain irreplaceable data:
- `data/masterArticleList.txt` (~37,000 articles) - **MUST PRESERVE**
- `categoryGroups.json` (group constraints) - **MUST PRESERVE**
- `public/Confetti.lottie` (animation asset) - **MUST PRESERVE**
- `public/globe.png` (icon asset) - **MUST PRESERVE**
- **ALL scripts in `scripts/` directory** - **MUST PRESERVE**
- **MongoDB credentials** (for `bingopedia.leaderboard` collection) - **MUST PRESERVE**

**Note**: 
- `curatedArticles.json` can be regenerated from `masterArticleList.txt` using `scripts/generateCuratedData.js`
- The same MongoDB collection will be reused - extract credentials from `server/index.js` or `api/leaderboard.js` and configure as environment variables

**Action Required:** Preserve these files and credentials before migration.

### Security Issues
**⚠️ SECURITY**: MongoDB credentials are currently hardcoded in:
- `server/index.js`
- `api/leaderboard.js`

**Action Required:** Move to environment variables in new implementation.

### Regeneration Time
**⚠️ PERFORMANCE**: Regenerating article data takes 5-10 minutes and requires Wikipedia API access. Preserve existing data files.

---

## 📊 Project Statistics

- **Total Articles**: ~37,000
- **Categories**: 58+
- **Game Articles per Round**: 26 (25 grid + 1 starting)
- **Grid Size**: 5x5 (25 cells)
- **Winning Lines**: 12 possible (5 rows + 5 columns + 2 diagonals)
- **Technology**: React 18, Vite, MongoDB, Express/Vercel

---

## 🔗 Related Documentation

### Existing Documentation (In Project)
- `PERFORMANCE_OPTIMIZATIONS.md` - Performance notes (still relevant)
- `scripts/` directory - Script files (READMEs are outdated, refer to scripts directly)

**Note**: Most README files in the project are outdated. Refer to the handoff documentation instead.

### External Resources
- [Wikipedia REST API](https://www.mediawiki.org/wiki/API:REST_API)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 📞 Support During Migration

### If You Need Help With:

**Data Format Questions:**
→ See [Product Specification - Section 4](./HANDOFF_PRODUCT_SPEC.md#4-data-structures)

**Script Usage:**
→ Review script files directly in `scripts/` directory (READMEs are outdated)

**API Questions:**
→ See [Product Specification - Section 5](./HANDOFF_PRODUCT_SPEC.md#5-api-specifications)

**Performance Issues:**
→ See [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)

**Common Problems:**
→ See [Quick Start Guide - Section 5](./HANDOFF_QUICK_START.md#5-common-issues--solutions)

---

## ✅ Migration Checklist

Use this checklist to ensure nothing is missed:

### Phase 1: Data Preservation
- [ ] Export `data/masterArticleList.txt` (+ backup)
- [ ] Export `categoryGroups.json`
- [ ] Export `public/Confetti.lottie`
- [ ] Export `public/globe.png`
- [ ] Export **ALL files from `scripts/` directory**
- [ ] Export MongoDB `leaderboard` collection
- [ ] Regenerate `curatedArticles.json` using `scripts/generateCuratedData.js`

### Phase 2: Documentation Review
- [ ] Read Product Specification
- [ ] Read Critical Files Inventory
- [ ] Read Quick Start Guide
- [ ] Review `PERFORMANCE_OPTIMIZATIONS.md`
- [ ] Review script files in `scripts/` directory

### Phase 3: Environment Setup
- [ ] Set up development environment
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Test MongoDB connection
- [ ] Test data generation scripts

### Phase 4: Implementation
- [ ] Implement core game mechanics
- [ ] Implement article matching
- [ ] Implement win detection
- [ ] Implement leaderboard
- [ ] Test end-to-end flow

### Phase 5: Deployment
- [ ] Build application
- [ ] Deploy to staging
- [ ] Run test suite
- [ ] Deploy to production
- [ ] Monitor for issues

---

## 🎯 Success Criteria

The rebuild will be considered successful when:

✅ All critical files preserved  
✅ Core game mechanics working  
✅ Article matching accurate (handles redirects)  
✅ Win detection working (all 12 lines)  
✅ Leaderboard functional  
✅ Performance acceptable (< 2s load times)  
✅ Mobile experience smooth  
✅ No critical bugs  

---

## 📝 Document Version

- **Version**: 1.0
- **Date**: January 2025
- **Status**: Initial handoff documentation
- **Last Updated**: Project retirement

---

## 🙏 Final Notes

**Code Reference Policy**: The existing codebase in this repository is available for reference. However, **rebuild the application from scratch** based on these specifications. Use the existing code to:
- Understand behavior and edge cases
- See implementation patterns and approaches
- Reference data structures and API formats
- Understand complex logic (like article matching, redirect resolution)

But write **fresh, clean code** for the new implementation. Don't copy-paste old code - use it as a reference guide only.

**Good luck with the rebuild!**

---

**End of Handoff README**

