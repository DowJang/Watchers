-- ============================================================
-- 감시자들 — 시민 참여 백엔드 스키마 (Supabase / PostgreSQL)
--
-- 적용: Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여넣고 실행.
--
-- 설계 원칙
--   · 공개 사이트는 GitHub Pages 의 정적 파일이므로 서버가 없다.
--     브라우저가 anon key 로 직접 호출하며, 권한은 RLS 와 SECURITY DEFINER 함수가 통제한다.
--   · 개인정보 최소화(§26): 이름·전화번호·주민번호를 저장하지 않는다.
--     본인확인 결과의 중복확인용 식별값은 서버 비밀키로 HMAC 하여 해시만 남긴다.
--   · 1인 1법안 1표(§9). 투표 변경은 가능하되 활성표는 하나. 모든 변경은 감사로그에 남는다.
--   · 집계는 클라이언트가 직접 세지 않는다. 원표는 읽을 수 없고, 집계 뷰만 공개된다.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 관리자
-- ------------------------------------------------------------
create table if not exists admin_users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       text not null default 'admin' check (role in ('admin', 'reviewer')),
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

-- 자기 자신이 관리자인지 확인하는 조회만 허용한다.
drop policy if exists admin_self_read on admin_users;
create policy admin_self_read on admin_users
  for select using (id = auth.uid());

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

-- ------------------------------------------------------------
-- 본인확인 식별값 (§9, §26)
--   본인확인 서비스가 주는 중복확인용 값(CI 등)을 그대로 두지 않고
--   서버 비밀키로 HMAC 한 결과만 저장한다. 원본은 어디에도 남기지 않는다.
-- ------------------------------------------------------------
create table if not exists voter_identities (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  identity_hash text not null unique,
  verified_at timestamptz not null default now()
);

alter table voter_identities enable row level security;
-- 정책 없음 = 클라이언트는 이 표를 전혀 읽고 쓸 수 없다. 함수로만 접근한다.

-- ------------------------------------------------------------
-- 시민 헌법의견투표 (§8)
-- ------------------------------------------------------------
create table if not exists citizen_votes (
  id         uuid primary key default gen_random_uuid(),
  bill_id    text not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  choice     text not null check (choice in ('UNFIT', 'FIT')),
  verified   boolean not null default false,   -- 본인확인을 마친 표인가
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bill_id, user_id)                    -- 1인 1법안 1표
);

create index if not exists citizen_votes_bill_idx on citizen_votes (bill_id);

alter table citizen_votes enable row level security;

-- 본인 표만 읽을 수 있다. 남의 표는 물론 전체 목록도 읽을 수 없다.
drop policy if exists vote_self_read on citizen_votes;
create policy vote_self_read on citizen_votes
  for select using (user_id = auth.uid());

-- 쓰기는 정책으로 열지 않는다. cast_vote() 함수만 사용한다.

-- 투표 변경 이력 (§23) — append only
create table if not exists citizen_vote_history (
  id         bigserial primary key,
  vote_id    uuid not null,
  bill_id    text not null,
  before_choice text,
  after_choice  text,
  changed_at timestamptz not null default now()
);

alter table citizen_vote_history enable row level security;

-- ------------------------------------------------------------
-- 집계 (§8 하단 표시용)
--   개별 표는 공개하지 않고 합계만 공개한다 (§26 — 개인 식별정보 비노출).
-- ------------------------------------------------------------
create or replace view bill_vote_tally
with (security_invoker = off) as
  select
    bill_id,
    count(*) filter (where choice = 'UNFIT')                as unfit,
    count(*) filter (where choice = 'FIT')                  as fit,
    count(*) filter (where choice = 'UNFIT')
      - count(*) filter (where choice = 'FIT')              as difference,
    count(*) filter (where verified)                        as verified_voters,
    max(updated_at)                                         as updated_at
  from citizen_votes
  group by bill_id;

grant select on bill_vote_tally to anon, authenticated;

-- ------------------------------------------------------------
-- 투표 (SECURITY DEFINER)
--   · 같은 선택을 다시 누르면 취소(활성표 제거)
--   · 다른 선택을 누르면 변경 — 활성표는 항상 하나
--   · 모든 변경을 이력에 남긴다
--   · rate limit: 10초 내 반복 호출 거부
-- ------------------------------------------------------------
create or replace function cast_vote(p_bill_id text, p_choice text)
returns table (unfit bigint, fit bigint, difference bigint, my_choice text)
language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_before text;
  v_after  text;
  v_id     uuid;
  v_verified boolean;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_choice not in ('UNFIT', 'FIT') then
    raise exception 'INVALID_CHOICE';
  end if;

  select exists (select 1 from voter_identities where user_id = v_user) into v_verified;

  select id, choice into v_id, v_before
    from citizen_votes where bill_id = p_bill_id and user_id = v_user;

  if v_id is not null then
    -- 과도한 반복 변경 차단
    if exists (
      select 1 from citizen_votes
      where id = v_id and updated_at > now() - interval '10 seconds'
    ) then
      raise exception 'TOO_FAST';
    end if;

    if v_before = p_choice then
      delete from citizen_votes where id = v_id;      -- 취소
      v_after := null;
    else
      update citizen_votes
         set choice = p_choice, updated_at = now(), verified = v_verified
       where id = v_id;
      v_after := p_choice;
    end if;
  else
    insert into citizen_votes (bill_id, user_id, choice, verified)
      values (p_bill_id, v_user, p_choice, v_verified)
      returning id into v_id;
    v_after := p_choice;
  end if;

  insert into citizen_vote_history (vote_id, bill_id, before_choice, after_choice)
    values (v_id, p_bill_id, v_before, v_after);

  perform check_trigger(p_bill_id);

  return query
    select coalesce(t.unfit, 0), coalesce(t.fit, 0), coalesce(t.difference, 0), v_after
      from (select 1) x
      left join bill_vote_tally t on t.bill_id = p_bill_id;
end;
$$;

revoke all on function cast_vote(text, text) from public;
grant execute on function cast_vote(text, text) to authenticated;

-- ------------------------------------------------------------
-- 1,000표 격차 Trigger (§10, §14)
--   조건을 처음 충족한 순간의 스냅샷을 영구 보존한다.
--   이후 격차가 줄어도 기록을 지우지 않는다.
-- ------------------------------------------------------------
create table if not exists alert_triggers (
  id                   uuid primary key default gen_random_uuid(),
  bill_id              text not null unique,   -- 같은 법안에 1회만
  triggered_at         timestamptz not null default now(),
  unfit_votes          bigint not null,
  fit_votes            bigint not null,
  difference           bigint not null,
  verified_voter_count bigint not null,
  data_snapshot_hash   text not null,
  correction_note      text                    -- 집계정정 시 기록 (§14)
);

alter table alert_triggers enable row level security;

drop policy if exists trigger_public_read on alert_triggers;
create policy trigger_public_read on alert_triggers for select using (true);

create or replace function check_trigger(p_bill_id text)
returns void
language plpgsql security definer set search_path = public as $$
declare t record;
begin
  select * into t from bill_vote_tally where bill_id = p_bill_id;
  if t is null or t.difference < 1000 then
    return;
  end if;

  insert into alert_triggers (
    bill_id, unfit_votes, fit_votes, difference, verified_voter_count, data_snapshot_hash
  ) values (
    p_bill_id, t.unfit, t.fit, t.difference, t.verified_voters,
    encode(digest(p_bill_id || ':' || t.unfit || ':' || t.fit || ':' || now()::text, 'sha256'), 'hex')
  )
  on conflict (bill_id) do nothing;   -- 1회성 Trigger ID

  insert into audit_logs (actor, action, target_type, target_id, after_value, reason)
    values ('system', 'CONSTITUTION_ALERT_TRIGGERED', 'bill', p_bill_id, t.difference::text,
            '부적합 − 적합 격차 1,000 도달');
end;
$$;

-- ------------------------------------------------------------
-- 시민 코멘트 (§15, §16)
-- ------------------------------------------------------------
create table if not exists comments (
  id             uuid primary key default gen_random_uuid(),
  bill_id        text not null,
  user_id        uuid not null references auth.users (id) on delete cascade,
  body           text not null check (char_length(body) between 2 and 240),
  vote           text check (vote in ('UNFIT', 'FIT')),
  status         text not null default 'VISIBLE' check (status in ('VISIBLE', 'HIDDEN')),
  reported_count int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists comments_bill_idx on comments (bill_id, created_at desc);

alter table comments enable row level security;

-- 공개된 코멘트는 누구나 읽는다. 작성자 식별정보는 컬럼 자체를 노출하지 않도록 뷰로 감싼다.
drop policy if exists comment_public_read on comments;
create policy comment_public_read on comments
  for select using (status = 'VISIBLE' or is_admin());

drop policy if exists comment_admin_update on comments;
create policy comment_admin_update on comments
  for update using (is_admin());

create or replace view public_comments
with (security_invoker = on) as
  select
    id,
    bill_id,
    body,
    vote,
    created_at,
    -- 표시명은 사용자 id 를 되돌릴 수 없게 잘라 만든 값이다 (§26)
    '시민 ' || substr(encode(digest(user_id::text, 'sha256'), 'hex'), 1, 4) as handle
  from comments
  where status = 'VISIBLE';

grant select on public_comments to anon, authenticated;

-- 코멘트 작성 — 투표 완료자만 (권장 기본값, §15.2) · 도배 차단 · 3줄 제한
create or replace function post_comment(p_bill_id text, p_body text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_vote text;
  v_id   uuid;
  v_require_vote boolean;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  p_body := btrim(p_body);
  if char_length(p_body) < 2 then raise exception 'TOO_SHORT'; end if;
  if char_length(p_body) > 240 then raise exception 'TOO_LONG'; end if;
  if array_length(string_to_array(p_body, E'\n'), 1) > 3 then raise exception 'TOO_MANY_LINES'; end if;

  select coalesce((select value = 'true' from system_settings where key = 'require_vote_to_comment'), true)
    into v_require_vote;

  select choice into v_vote from citizen_votes where bill_id = p_bill_id and user_id = v_user;
  if v_require_vote and v_vote is null then raise exception 'VOTE_REQUIRED'; end if;

  -- 같은 사람이 같은 법안에 같은 내용을 반복 등록하는 것을 막는다
  if exists (
    select 1 from comments
    where bill_id = p_bill_id and user_id = v_user and btrim(body) = p_body
  ) then
    raise exception 'DUPLICATE';
  end if;

  -- 1분에 1건
  if exists (
    select 1 from comments
    where user_id = v_user and created_at > now() - interval '1 minute'
  ) then
    raise exception 'TOO_FAST';
  end if;

  insert into comments (bill_id, user_id, body, vote)
    values (p_bill_id, v_user, p_body, v_vote)
    returning id into v_id;

  return v_id;
end;
$$;

revoke all on function post_comment(text, text) from public;
grant execute on function post_comment(text, text) to authenticated;

-- 관리자 조치는 반드시 감사로그를 남긴다 (§16, §23)
create or replace function moderate_comment(p_comment_id uuid, p_status text, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_before text;
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_status not in ('VISIBLE', 'HIDDEN') then raise exception 'INVALID_STATUS'; end if;

  select status into v_before from comments where id = p_comment_id;
  update comments set status = p_status where id = p_comment_id;

  insert into audit_logs (actor, action, target_type, target_id, before_value, after_value, reason)
    values (coalesce(auth.uid()::text, 'unknown'), 'MODERATE_COMMENT', 'comment',
            p_comment_id::text, v_before, p_status, p_reason);
end;
$$;

grant execute on function moderate_comment(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- 언론 수신처 / 발송 기록 (§13, §20)
-- ------------------------------------------------------------
create table if not exists media_recipients (
  id          uuid primary key default gen_random_uuid(),
  outlet      text not null,
  desk        text not null default '정치부',
  email       text not null,
  active      boolean not null default true,
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table media_recipients enable row level security;

drop policy if exists media_admin_all on media_recipients;
create policy media_admin_all on media_recipients for all using (is_admin()) with check (is_admin());

create table if not exists media_deliveries (
  id           uuid primary key default gen_random_uuid(),
  trigger_id   uuid not null references alert_triggers (id) on delete cascade,
  recipient_id uuid not null references media_recipients (id) on delete cascade,
  sent_at      timestamptz,
  status       text not null default 'QUEUED'
                 check (status in ('QUEUED', 'SENT', 'FAILED', 'BOUNCED', 'PAUSED')),
  content_version text not null default 'v1',
  error        text,
  unique (trigger_id, recipient_id)   -- 동일 Trigger 에 대해 1회만 (§13.4)
);

alter table media_deliveries enable row level security;

drop policy if exists delivery_admin_all on media_deliveries;
create policy delivery_admin_all on media_deliveries for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- 헌재 제출 검토 (§21)
-- ------------------------------------------------------------
create table if not exists constitutional_review_cases (
  id          uuid primary key default gen_random_uuid(),
  bill_id     text not null,
  trigger_id  uuid references alert_triggers (id) on delete set null,
  stage       text not null default 'Trigger 발생',
  court_case_no text,
  note        text,
  updated_at  timestamptz not null default now()
);

alter table constitutional_review_cases enable row level security;

drop policy if exists review_admin_all on constitutional_review_cases;
create policy review_admin_all on constitutional_review_cases for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- 설정 / 감사로그
-- ------------------------------------------------------------
create table if not exists system_settings (
  key   text primary key,
  value text not null
);

alter table system_settings enable row level security;

drop policy if exists settings_read on system_settings;
create policy settings_read on system_settings for select using (true);

drop policy if exists settings_admin_write on system_settings;
create policy settings_admin_write on system_settings for all using (is_admin()) with check (is_admin());

insert into system_settings (key, value) values
  ('media_emergency_pause', 'false'),
  ('require_vote_to_comment', 'true')
on conflict (key) do nothing;

-- append-only. 관리자도 지울 수 없다.
create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  actor        text not null,
  action       text not null,
  target_type  text not null,
  target_id    text not null,
  before_value text,
  after_value  text,
  reason       text
);

alter table audit_logs enable row level security;

drop policy if exists audit_admin_read on audit_logs;
create policy audit_admin_read on audit_logs for select using (is_admin());
-- insert/update/delete 정책 없음 → SECURITY DEFINER 함수를 통해서만 기록된다.

-- ------------------------------------------------------------
-- 방문 집계 (§18.3) — 개인정보를 과도하게 수집하지 않는다.
--   개별 방문자를 식별하지 않고 일자·경로별 카운트만 남긴다.
-- ------------------------------------------------------------
create table if not exists page_view_daily (
  day   date not null,
  path  text not null,
  views bigint not null default 0,
  primary key (day, path)
);

alter table page_view_daily enable row level security;

drop policy if exists pv_admin_read on page_view_daily;
create policy pv_admin_read on page_view_daily for select using (is_admin());

create or replace function record_page_view(p_path text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into page_view_daily (day, path, views)
    values ((now() at time zone 'Asia/Seoul')::date, left(p_path, 200), 1)
  on conflict (day, path) do update set views = page_view_daily.views + 1;
end;
$$;

grant execute on function record_page_view(text) to anon, authenticated;

-- ============================================================
-- 적용 후 할 일
--   1) Authentication → Providers → Email 활성화 (매직링크)
--   2) Authentication → URL Configuration 의 Site URL / Redirect URLs 에
--      https://dowjang.github.io/Watchers/ 를 등록
--   3) 관리자 계정으로 한 번 로그인한 뒤:
--        insert into admin_users (id, email)
--        select id, email from auth.users where email = '관리자이메일';
--   4) 저장소 Settings → Secrets and variables → Actions → Variables 에
--        NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 등록 후 재배포
-- ============================================================
