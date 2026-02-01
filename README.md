# Wikibingo

A Wikipedia Bingo game where players navigate from a random starting article to find 5 articles in a row on their bingo grid. Explore Wikipedia while competing on the global leaderboard!

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)

### Setup

1. **Environment Setup**: Create `.env.local` in the repo root with MongoDB credentials:
   ```bash
   MONGODB_USERNAME=your_username
   MONGODB_PASSWORD=your_password
   MONGODB_CLUSTER=your_cluster.mongodb.net
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   cd app && npm install
   ```

3. **Run Development Servers**:
   ```bash
   # Terminal 1: Backend (Express dev server)
   npm run dev:server
   
   # Terminal 2: Frontend (React + Vite)
   cd app && npm run dev
   ```

4. **Open**: Navigate to `http://localhost:5173` (or the port shown in terminal)

For detailed setup, see **[docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)**.

---

## 📚 Documentation

### Essential Documents
- **[Product Requirements](./docs/PRODUCT_PRD.md)** - Complete product specifications and requirements
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Tech stack, commands, API endpoints, and project structure
- **[Documentation Index](./docs/README.md)** - Complete documentation navigation

### Key Documentation Areas
- **Architecture**: [docs/architecture/](./docs/architecture/) - Technical decisions and patterns
- **Design**: [docs/design/](./docs/design/) - UI/UX design system and component structure
- **Skills**: [docs/skills/](./docs/skills/) - Implementation patterns and best practices by role

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express (dev) / Vercel serverless functions (production)
- **Database**: MongoDB Atlas
- **Deployment**: Vercel

---

## 📁 Project Structure

```
app/                    # Frontend React application
  src/
    features/           # Feature modules (game, article-viewer, leaderboard)
    shared/             # Shared utilities and components
api/                    # Vercel serverless API functions
server/                 # Local Express development server
core-assets/            # Preserved data and scripts
docs/                   # Active documentation
```

---

## 🎮 How It Works

1. Start with a random Wikipedia article
2. Navigate through Wikipedia links to find articles on your bingo grid
3. Complete a row, column, or diagonal to win
4. Submit your score to compete on the global leaderboard

---

## 📝 Development

- **Tests**: `npm test`
- **Build**: `cd app && npm run build`
- **Linting**: See individual package.json files for lint commands

For more development details, see the [Quick Reference](./docs/QUICK_REFERENCE.md) and [Documentation Index](./docs/README.md).

