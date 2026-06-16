# コトバ · Kotoba v2

## Run (zero install required)

```bash
# Option 1 — Node.js
cd kotoba
npx serve .
# → open http://localhost:3000

# Option 2 — Python
cd kotoba
python -m http.server 3000
# → open http://localhost:3000

# Option 3 — VS Code
# Install "Live Server" extension
# Right-click index.html → Open with Live Server
```

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **Home** | `home` | Landing page — what Kotoba is, features, stats, CTA |
| **Learn** | `learn` | Hub — 4 categories × 5 levels, N5 Vocab unlocked |
| **Game** | `play` | Playable 8-card quiz with combo/confetti |
| **Results** | `results` | Session summary, XP, review words |
| **Progress** | `progress` | JLPT readiness bars, activity heatmap |
| **Profile** | `profile` | User card, achievements, settings |

## File structure

```
kotoba/
├── index.html          ← entry point
├── kotoba.css          ← full design system
├── kotoba-data.jsx     ← vocabulary bank (16 N5 words)
├── kotoba-icons.jsx    ← SVG icon library
├── kotoba-mascot.jsx   ← Daruma "Maru" + blob decorations
├── kotoba-ui.jsx       ← Ring, Count, Bar, StatCard
├── kotoba-game.jsx     ← playable quiz component
├── kotoba-views.jsx    ← Landing, LearnHub, Results, Progress, Profile
└── kotoba-app.jsx      ← shell: routing, sidebar, nav
```

## What's new in v2

- **Landing home** with hero, feature cards (staggered animation), stats, CTA
- **Learn Hub** with 4 categories (Vocab, Kanji, Grammar, Reading) × 5 JLPT levels
- Locked cards have shimmer effect, unlocked N5 Vocab launches the game
- Floating Daruma mascot animation on landing hero
- Staggered entrance animations on all pages
- Floating kana characters in hero background
- Cleaner navigation — Home = landing, Learn = hub

## Design tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--paper` | `#F7F0E3` | warm cream background |
| `--ink` | `#201E33` | dark surfaces |
| `--peach` | `#F1855A` | primary CTA |
| `--honey` | `#F3B24E` | streaks / XP |
| `--sage` | `#5FAE8E` | correct / success |
| `--terra` | `#E0685C` | wrong / error |
