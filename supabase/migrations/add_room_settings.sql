-- Add timer_duration and max_players to game_rooms
alter table public.game_rooms 
add column timer_duration int default 10,
add column max_players int default 4;
