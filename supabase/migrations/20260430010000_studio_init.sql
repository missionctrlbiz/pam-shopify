create extension if not exists pgcrypto;

create table if not exists studio_packages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  status text not null default 'DRAFT' check (status in ('DRAFT','READY','APPROVED','PUBLISHED','ARCHIVED')),
  source_type text not null default 'PROMPT' check (source_type in ('PROMPT','PDF','CSV','PASTE')),
  source_prompt text,
  source_blob_path text,
  source_text text,
  carousel_json jsonb not null default '{"ratio":"1:1","slides":[],"meta":{"palette":["#041f50","#af5ce9","#ec5185","#ed415b"],"font":"Montserrat"}}'::jsonb,
  captions_json jsonb not null default '{"instagram":{"body":"","hashtags":[],"chars":0},"facebook":{"body":"","hashtags":[],"chars":0},"linkedin":{"body":"","hashtags":[],"chars":0},"tiktok":{"body":"","hashtags":[],"chars":0}}'::jsonb,
  quality_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_packages_owner_updated_idx on studio_packages (owner_id, updated_at desc);
create index if not exists studio_packages_status_idx on studio_packages (status);

create table if not exists studio_messages (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references studio_packages(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  target text,
  created_at timestamptz not null default now()
);

create index if not exists studio_messages_package_created_idx on studio_messages (package_id, created_at);

create table if not exists studio_assets (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references studio_packages(id) on delete cascade,
  kind text not null check (kind in ('SLIDE_PNG','CAPTION_TXT','BUNDLE_ZIP')),
  ratio text,
  slide_id text,
  storage_path text not null,
  bytes int,
  created_at timestamptz not null default now()
);

create index if not exists studio_assets_package_idx on studio_assets (package_id);

update studio_packages
set carousel_json = '{"ratio":"1:1","slides":[],"meta":{"palette":["#041f50","#af5ce9","#ec5185","#ed415b"],"font":"Montserrat"}}'::jsonb
where carousel_json = '{}'::jsonb or not (carousel_json ? 'slides');

update studio_packages
set captions_json = '{"instagram":{"body":"","hashtags":[],"chars":0},"facebook":{"body":"","hashtags":[],"chars":0},"linkedin":{"body":"","hashtags":[],"chars":0},"tiktok":{"body":"","hashtags":[],"chars":0}}'::jsonb
where captions_json = '{}'::jsonb
  or not (captions_json ? 'instagram')
  or not (captions_json ? 'facebook')
  or not (captions_json ? 'linkedin')
  or not (captions_json ? 'tiktok');

create table if not exists studio_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  brand_json jsonb not null default '{}'::jsonb,
  cta_presets jsonb not null default '[]'::jsonb,
  tone text not null default 'AUTHORITATIVE',
  hook_style text not null default 'STAT_LED',
  hashtag_cluster text not null default '',
  model_strategist text not null default 'gemini-2.5-pro',
  model_gate text not null default 'gemini-2.5-flash',
  gate_threshold numeric(2,1) not null default 3.0,
  default_slides int not null default 4,
  always_say text,
  never_say text,
  updated_at timestamptz not null default now()
);

alter table studio_packages enable row level security;
alter table studio_messages enable row level security;
alter table studio_assets enable row level security;
alter table studio_settings enable row level security;

drop policy if exists studio_packages_owner_all on studio_packages;
create policy studio_packages_owner_all on studio_packages for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists studio_messages_owner_all on studio_messages;
create policy studio_messages_owner_all on studio_messages for all using (
  exists (select 1 from studio_packages p where p.id = package_id and p.owner_id = auth.uid())
) with check (
  exists (select 1 from studio_packages p where p.id = package_id and p.owner_id = auth.uid())
);

drop policy if exists studio_assets_owner_all on studio_assets;
create policy studio_assets_owner_all on studio_assets for all using (
  exists (select 1 from studio_packages p where p.id = package_id and p.owner_id = auth.uid())
) with check (
  exists (select 1 from studio_packages p where p.id = package_id and p.owner_id = auth.uid())
);

drop policy if exists studio_settings_owner_all on studio_settings;
create policy studio_settings_owner_all on studio_settings for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function set_updated_at_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists studio_packages_set_updated_at on studio_packages;
create trigger studio_packages_set_updated_at before update on studio_packages for each row execute function set_updated_at_timestamp();

drop trigger if exists studio_settings_set_updated_at on studio_settings;
create trigger studio_settings_set_updated_at before update on studio_settings for each row execute function set_updated_at_timestamp();
