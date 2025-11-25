-- Migration: Add user_settings table for storing API keys and preferences
-- This enables cross-device sync of API keys (Gemini, Google TTS, Azure TTS)

-- Create user_settings table
create table if not exists public.user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  
  -- API Keys (encrypted at rest by Supabase)
  gemini_api_key text,
  google_tts_api_key text,
  azure_tts_api_key text,
  azure_region text default 'eastus',
  
  -- Metadata
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add index on user_id for faster lookups
create index if not exists user_settings_user_id_idx on public.user_settings(user_id);

-- Enable Row Level Security
alter table public.user_settings enable row level security;

-- RLS Policies: Users can only access their own settings
create policy "Users can view their own settings"
  on public.user_settings
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.user_settings
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own settings"
  on public.user_settings
  for delete
  using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger set_updated_at
  before update on public.user_settings
  for each row
  execute function public.handle_updated_at();

-- Function to auto-create user_settings row when profile is created
create or replace function public.handle_new_user_settings()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user_settings when profile is created
create trigger on_profile_created_create_settings
  after insert on public.profiles
  for each row
  execute function public.handle_new_user_settings();

-- Add language_level column to profiles table for proficiency tracking
alter table public.profiles
add column if not exists language_level text,
add column if not exists initial_deck_generated boolean default false;

-- Add comment for documentation
comment on table public.user_settings is 'Stores user API keys and preferences for cross-device sync';
comment on column public.profiles.language_level is 'User proficiency level (A1, A2, B1, B2, C1, C2)';
comment on column public.profiles.initial_deck_generated is 'Flag indicating if user completed initial deck setup';
