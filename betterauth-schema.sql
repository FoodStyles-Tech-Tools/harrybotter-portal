create table public.account (
  id text not null,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null,
  "accessToken" text null,
  "refreshToken" text null,
  "idToken" text null,
  "accessTokenExpiresAt" timestamp with time zone null,
  "refreshTokenExpiresAt" timestamp with time zone null,
  scope text null,
  "expiresAt" timestamp with time zone null,
  password text null,
  "createdAt" timestamp with time zone null default now(),
  "updatedAt" timestamp with time zone null default now(),
  constraint account_pkey primary key (id),
  constraint account_providerId_accountId_key unique ("providerId", "accountId"),
  constraint account_userId_fkey foreign KEY ("userId") references auth_user (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_account_user_id on public.account using btree ("userId") TABLESPACE pg_default;


create table public.account (
create table public.account (
  id text not null,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null,
  "accessToken" text null,
  "refreshToken" text null,
  "idToken" text null,
  "accessTokenExpiresAt" timestamp with time zone null,
  "refreshTokenExpiresAt" timestamp with time zone null,
  scope text null,
  "expiresAt" timestamp with time zone null,
  password text null,
  "createdAt" timestamp with time zone null default now(),
  "updatedAt" timestamp with time zone null default now(),
  constraint account_pkey primary key (id),
  constraint account_providerId_accountId_key unique ("providerId", "accountId"),
  constraint account_userId_fkey foreign KEY ("userId") references auth_user (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_account_user_id on public.account using btree ("userId") TABLESPACE pg_default;


create table public.auth_user (
  id text not null,
  email text not null,
  "emailVerified" boolean null default false,
  name text null,
  image text null,
  "createdAt" timestamp with time zone null default now(),
  "updatedAt" timestamp with time zone null default now(),
  constraint auth_user_pkey primary key (id),
  constraint auth_user_email_key unique (email)
) TABLESPACE pg_default;

create trigger check_user_before_insert BEFORE INSERT on auth_user for EACH row
execute FUNCTION check_user_exists ();

create trigger sync_user_on_insert
after INSERT on auth_user for EACH row
execute FUNCTION sync_better_auth_user ();

create trigger sync_user_on_update
after
update on auth_user for EACH row when (
  old.email is distinct from new.email
  or old.name is distinct from new.name
  or old.image is distinct from new.image
)
execute FUNCTION sync_better_auth_user ();

create table public.auth_user (
  id text not null,
  email text not null,
  "emailVerified" boolean null default false,
  name text null,
  image text null,
  "createdAt" timestamp with time zone null default now(),
  "updatedAt" timestamp with time zone null default now(),
  constraint auth_user_pkey primary key (id),
  constraint auth_user_email_key unique (email)
) TABLESPACE pg_default;

create trigger check_user_before_insert BEFORE INSERT on auth_user for EACH row
execute FUNCTION check_user_exists ();

create trigger sync_user_on_insert
after INSERT on auth_user for EACH row
execute FUNCTION sync_better_auth_user ();

create trigger sync_user_on_update
after
update on auth_user for EACH row when (
  old.email is distinct from new.email
  or old.name is distinct from new.name
  or old.image is distinct from new.image
)
execute FUNCTION sync_better_auth_user ();

create table public.verification (
  id text not null,
  identifier text not null,
  value text not null,
  "expiresAt" timestamp with time zone not null,
  "createdAt" timestamp with time zone null default now(),
  "updatedAt" timestamp with time zone null default now(),
  constraint verification_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_verification_identifier on public.verification using btree (identifier) TABLESPACE pg_default;

