# LinguaFlow

**LinguaFlow** is an advanced, open-source language acquisition platform designed for serious learners. It leverages the **Free Spaced Repetition Scheduler (FSRS v5)** algorithm to optimize memory retention and integrates **Generative AI (Google Gemini)** to automate content creation.

Unlike traditional flashcard applications, LinguaFlow offers a gamified ecosystem featuring real-time multiplayer battles ("Deck Wars"), a competitive leaderboard, and a "Sabotage" mechanics system, all built on a robust, offline-first architecture synchronized via Supabase.

---

## Key Features

### Core Study Mechanics

- **FSRS v5 Algorithm:** Implements the latest iteration of the Free Spaced Repetition Scheduler, offering significantly higher retention efficiency compared to SM-2 (Anki).
- **Hybrid Optimization:** Includes an on-device optimizer that analyzes review logs to calculate custom parameters (`w` weights) tailored to the user's specific memory patterns.
- **Granular Study Controls:** Configurable daily limits, retention targets (0.70–0.99), and interval fuzzing to prevent review clustering.
- **Cram Mode:** Allows reviewing cards outside the SRS schedule without affecting long-term statistics.

### AI Integration

- **Generative Card Creation:** Uses Google Gemini 2.5 to generate context-aware sentences, translations, and grammatical notes based on a topic or target word.
- **Contextual Analysis:** Select any text within a flashcard to instantly receive an AI-generated breakdown of grammar, part of speech, and definition.
- **Furigana Parsing:** Automated parsing and rendering of Furigana for Japanese language learners.

### Multiplayer & Gamification

- **Deck Wars:** Real-time, socket-based multiplayer quizzes. Users host lobbies where AI generates questions based on the room's language and difficulty level (A1-C2).
- **Sabotage System:** A PvP mechanic where users spend earned "Points" to inflict UI curses on rivals (e.g., blurring text, rotating the screen, forcing fonts) via Supabase Realtime presence.
- **Leaderboards:** Global rankings tracking XP, daily streaks, and user levels.

### Architecture

- **Offline-First:** Utilizes `idb` (IndexedDB) for local storage, ensuring zero-latency reviews. Data synchronizes to the cloud when online.
- **Text-to-Speech:** Supports the Web Speech API (Browser), Google Cloud TTS, and Microsoft Azure Neural TTS.

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS, shadcn/ui (Radix Primitives), Lucide React
- **Visualization:** Recharts (for heatmaps and retention graphs)
- **Backend / Database:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **AI Provider:** Google Gemini (via Supabase Edge Functions)

---

## Installation & Setup

### Prerequisites

- Node.js v19+
- A Supabase project
- A Google Gemini API Key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/linguaflow.git
cd linguaflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup (Supabase)

Run the following SQL migration in your Supabase SQL Editor to set up the required schema:

```sql
-- Enable Extensions
create extension if not exists vector;

-- Tables
create table profiles (
  id uuid references auth.users on delete cascade,
  username text unique,
  xp bigint default 0,
  points bigint default 0,
  level int default 1,
  primary key (id)
);

create table cards (
  id uuid primary key,
  user_id uuid references auth.users on delete cascade,
  target_sentence text not null,
  native_translation text not null,
  status text,
  interval real,
  ease_factor real,
  due_date timestamptz,
  language text,
  tags text[],
  -- FSRS specific columns
  stability real default 0,
  difficulty real default 0,
  state int default 0,
  reps int default 0,
  lapses int default 0,
  last_review timestamptz,
  created_at timestamptz default now()
);

create table revlog (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  card_id uuid references cards,
  grade int,
  state int,
  elapsed_days real,
  scheduled_days real,
  created_at timestamptz default now()
);

create table game_rooms (
  id uuid default gen_random_uuid() primary key,
  code text unique,
  host_id uuid references auth.users,
  status text default 'waiting',
  questions jsonb,
  current_question_index int default 0
);
```

_Note: Additional tables for `study_history` and `active_curses` are also required._

### 5. Run the Application

```bash
npm run dev
```

---

## Architecture Overview

### FSRS Implementation

LinguaFlow implements the FSRS algorithm client-side to allow for immediate scheduling updates. The logic resides in `src/features/study/logic/srs.ts`. When a user reviews a card:

1. The current card state (stability, difficulty, retrievability) is analyzed.
2. The scheduler calculates the next optimal interval based on the user's grade (Again, Hard, Good, Easy).
3. The review is logged to the `revlog` table for future optimization iterations.

### Cloud Sync Strategy

To maintain a responsive UI, the app operates primarily on IndexedDB. Synchronization happens in two vectors:

1. **Pull:** On load, React Query fetches the latest state from Supabase.
2. **Push:** Critical actions (reviews, edits) optimistically update the UI and push to Supabase in the background. A manual "Sync to Cloud" feature is available in settings for data migration.

### Sabotage Mechanics

The Sabotage system uses Supabase Realtime subscriptions. When a user purchases a "Curse" in `SabotageStore.tsx`:

1. A record is inserted into `active_curses`.
2. The victim's client, listening via `SabotageContext.tsx`, receives the payload.
3. CSS transforms or React components (e.g., `comic_sans`, `blur`, `rotate`) are dynamically applied to the victim's Study Session.

---

## Contributing

Contributions are welcome. Please adhere to the following guidelines:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Open a Pull Request.

---

## License

Distributed under the GPLv3 License. See `LICENSE` for more information.
