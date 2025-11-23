create table revlog (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  card_id uuid references cards(id) on delete cascade not null,
  grade integer not null, -- 1: Again, 2: Hard, 3: Good, 4: Easy
  state integer not null, -- 0: New, 1: Learning, 2: Review, 3: Relearning
  elapsed_days double precision not null, -- Time since last review
  scheduled_days integer not null, -- What the interval WAS scheduled to be
  stability double precision not null, -- Stability BEFORE this review
  difficulty double precision not null, -- Difficulty BEFORE this review
  created_at timestamptz default now()
);

-- Index for fast retrieval during optimization
create index revlog_user_lang_idx on revlog (user_id);
create index revlog_card_idx on revlog (card_id);
