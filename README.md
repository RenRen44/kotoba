# コトバ · Kotoba

> An adaptive Japanese vocabulary learning platform powered by ML-based knowledge tracing, spaced repetition, and a personalized AI tutor.

![Kotoba Landing](https://img.shields.io/badge/status-active%20development-peach?style=for-the-badge)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20FastAPI%20%7C%20Python-201E33?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-5FAE8E?style=for-the-badge)

---

## What is Kotoba?

Most language learning apps are static — everyone follows the same path, gets the same lessons, reviews the same content. Kotoba is different.

Kotoba learns about the learner. It tracks what you know, what you're likely to forget, and what you should study next — then adapts in real time. The system answers questions like:

- What level is this learner right now?
- Which words are they about to forget?
- What should they study next to reach N3 fastest?
- What exercises target their specific weak points?

---

## Live Demo

> 🚧 Deploy link coming soon — run locally with instructions below

---

## Features

### ✅ Built
- **Adaptive vocabulary game** — 8-card sessions, combo system, confetti, answer animations
- **Learn Hub** — 4 categories (Vocabulary, Kanji, Grammar, Reading) × 5 JLPT levels (N5→N1)
- **Landing page** — animated hero, magnetic 3D feature cards, floating mascot
- **Progress dashboard** — JLPT readiness bars, activity heatmap, session stats
- **Custom cursor** — peach dot + lagging ring, morphs on hover
- **Morphing blob animations** — organic background shapes that breathe and shift
- **Responsive** — full desktop sidebar + mobile bottom nav

### 🔨 In Progress
- Live JLPT API integration (replacing hardcoded words)
- SM-2 Spaced Repetition algorithm
- FastAPI backend + SQLite database
- User progress persistence

### 📋 Planned
- Bayesian Knowledge Tracing (BKT) — P(user knows word X right now)
- XGBoost JLPT readiness classifier
- NLP reading difficulty analyzer
- Smart distractor generation using JMdict similarity
- AI tutor with personalized knowledge state injection
- Deep Knowledge Tracing (DKT) with LSTM

---

## ML & AI Roadmap

This is not just a flashcard app. The ML architecture is designed around real educational AI research:

| Component | Type | Status |
|-----------|------|--------|
| SM-2 Spaced Repetition | Algorithm | 🔨 In progress |
| Bayesian Knowledge Tracing | Probabilistic model | 📋 Planned |
| Forgetting Curve Prediction | Regression (XGBoost) | 📋 Planned |
| JLPT Readiness Classifier | Classification (XGBoost) | 📋 Planned |
| Content-Based Recommendation | Rule-based → ML | 📋 Planned |
| Reading Difficulty Estimator | NLP pipeline | 📋 Planned |
| Smart Distractor Generation | NLP similarity (JMdict) | 📋 Planned |
| AI Tutor | LLM + knowledge state | 📋 Planned |
| Deep Knowledge Tracing | LSTM (PyTorch) | 📋 Planned |

---

## Data Sources

| Dataset | What it provides |
|---------|-----------------|
| **JMdict** (248MB) | 217,425 entries — kanji, kana readings, meanings, POS, formality, domain tags |
| **JLPT Vocab API** | 8,000+ words tagged N5→N1 with furigana and romaji |

The combination: JLPT API tells us *what to teach and in what order*. JMdict tells us *everything about it*.

---

## Tech Stack

**Frontend**
- React (no build step — Babel standalone for rapid iteration)
- Custom CSS design system with CSS variables
- SVG animation, morphing blobs, magnetic 3D tilt cards

**Backend** *(in progress)*
- FastAPI (Python)
- SQLite → PostgreSQL
- pyBKT, scikit-learn, XGBoost, PyTorch

**Data**
- JMdict (open Japanese dictionary)
- JLPT Vocab API (`jlpt-vocab-api.vercel.app`)

---

## Running Locally

No install required for the frontend:

```bash
# Clone
git clone https://github.com/RenRen44/kotoba.git
cd kotoba

# Option 1 — Node.js
npx serve .

# Option 2 — Python
python -m http.server 3000

# Option 3 — VS Code
# Install "Live Server" → right-click index.html → Open with Live Server
```

Open `http://localhost:3000`

---

## File Structure

```
kotoba/
├── index.html           ← entry point
├── kotoba.css           ← full design system + animations
├── kotoba-data.jsx      ← vocabulary bank
├── kotoba-icons.jsx     ← SVG icon library
├── kotoba-mascot.jsx    ← Daruma "Maru" mascot + blob decorations
├── kotoba-ui.jsx        ← Ring, Count, Bar, StatCard primitives
├── kotoba-game.jsx      ← playable quiz with combo/confetti/physics
├── kotoba-views.jsx     ← Landing, LearnHub, Results, Progress, Profile
└── kotoba-app.jsx       ← app shell: routing, sidebar, custom cursor
```

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--paper` | `#F7F0E3` | Warm cream background |
| `--ink` | `#201E33` | Dark surfaces + text |
| `--peach` | `#F1855A` | Primary CTA + accent |
| `--honey` | `#F3B24E` | Streaks + XP + highlights |
| `--sage` | `#5FAE8E` | Correct answers + success |
| `--terra` | `#E0685C` | Wrong answers + errors |
| `--lav` | `#8C82C9` | Secondary accent |

---

## Why This Project

Built to demonstrate practical skills across the full ML/AI engineering stack:

- **Knowledge Tracing** — applying BKT and DKT to model learner knowledge state
- **Recommendation Systems** — content-based and collaborative filtering for study paths
- **NLP** — reading difficulty estimation, smart distractor generation, text analysis
- **Full-Stack** — React frontend, FastAPI backend, database design
- **Data Engineering** — processing JMdict (248MB), JLPT word lists, user interaction logs
- **Educational AI** — building systems that genuinely adapt to individual learners

---

## Author

**Rayyan** — [@RenRen44](https://github.com/RenRen44)

---

*Kotoba (言葉) means "words" or "language" in Japanese.*
