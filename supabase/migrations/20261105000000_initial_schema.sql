-- Classroom Survey Web App — Complete Database Schema & RPC Functions
-- Compatible with PostgreSQL 15+ & Supabase

create extension if not exists "pgcrypto";

drop trigger if exists surveys_updated_at on surveys;
drop function if exists update_updated_at_column();
drop function if exists activate_survey(uuid);
drop function if exists close_survey(uuid);
drop function if exists submit_survey_response(uuid, text, jsonb);

create table if not exists surveys (
    id uuid primary key default gen_random_uuid(),
    created_by uuid references auth.users(id) on delete set null,
    title text not null,
    description text,
    status text not null default 'draft'
        check (status in ('draft', 'active', 'closed', 'archived')),
    public_slug text unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists surveys_status_idx on surveys(status);
create index if not exists surveys_public_slug_idx on surveys(public_slug);

create unique index if not exists only_one_active_survey
on surveys ((status))
where status = 'active';

create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger surveys_updated_at
before update on surveys
for each row
execute function update_updated_at_column();

create table if not exists questions (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid not null references surveys(id) on delete cascade,
    question_text text not null,
    question_type text not null
        check (question_type in ('multiple_choice', 'true_false')),
    position integer not null default 1,
    created_at timestamptz not null default now()
);

create index if not exists questions_survey_id_idx on questions(survey_id);
create index if not exists questions_position_idx on questions(survey_id, position);

create table if not exists choices (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null references questions(id) on delete cascade,
    choice_text text not null,
    position integer not null default 1,
    created_at timestamptz not null default now()
);

create index if not exists choices_question_id_idx on choices(question_id);
create index if not exists choices_position_idx on choices(question_id, position);

create table if not exists responses (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid not null references surveys(id) on delete cascade,
    anonymous_token text,
    submitted_at timestamptz not null default now()
);

create index if not exists responses_survey_id_idx on responses(survey_id);
create index if not exists responses_submitted_at_idx on responses(submitted_at);

create unique index if not exists responses_unique_student_per_survey
on responses(survey_id, anonymous_token)
where anonymous_token is not null;

create table if not exists answers (
    id uuid primary key default gen_random_uuid(),
    response_id uuid not null references responses(id) on delete cascade,
    question_id uuid not null references questions(id) on delete cascade,
    choice_id uuid references choices(id) on delete set null,
    text_answer text,
    created_at timestamptz not null default now(),
    unique(response_id, question_id)
);

create index if not exists answers_response_id_idx on answers(response_id);
create index if not exists answers_question_id_idx on answers(question_id);
create index if not exists answers_choice_id_idx on answers(choice_id);

alter table surveys enable row level security;
alter table questions enable row level security;
alter table choices enable row level security;
alter table responses enable row level security;
alter table answers enable row level security;

drop policy if exists "students read active surveys" on surveys;
create policy "students read active surveys"
on surveys for select to anon
using (status = 'active');

drop policy if exists "students read active survey questions" on questions;
create policy "students read active survey questions"
on questions for select to anon
using (
    exists (
        select 1 from surveys
        where surveys.id = questions.survey_id
        and surveys.status = 'active'
    )
);

drop policy if exists "students read active survey choices" on choices;
create policy "students read active survey choices"
on choices for select to anon
using (
    exists (
        select 1 from questions
        join surveys on surveys.id = questions.survey_id
        where questions.id = choices.question_id
        and surveys.status = 'active'
    )
);

drop policy if exists "authenticated users manage surveys" on surveys;
create policy "authenticated users manage surveys"
on surveys for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated users manage questions" on questions;
create policy "authenticated users manage questions"
on questions for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated users manage choices" on choices;
create policy "authenticated users manage choices"
on choices for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated users manage responses" on responses;
create policy "authenticated users manage responses"
on responses for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated users manage answers" on answers;
create policy "authenticated users manage answers"
on answers for all to authenticated
using (true) with check (true);

create or replace function generate_survey_slug()
returns text as $$
declare
    chars text := 'abcdefghjkmnpqrstuvwxyz23456789';
    result text := '';
    i integer;
begin
    for i in 1..6 loop
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    end loop;
    return result;
end;
$$ language plpgsql;

create or replace function activate_survey(p_survey_id uuid)
returns jsonb as $$
declare
    v_slug text;
    v_survey surveys%rowtype;
begin
    update surveys
    set status = 'closed'
    where status = 'active' and id != p_survey_id;

    select * into v_survey from surveys where id = p_survey_id;
    if not found then
        raise exception 'Survey not found';
    end if;

    v_slug := v_survey.public_slug;
    if v_slug is null or length(v_slug) = 0 then
        v_slug := generate_survey_slug();
        while exists (select 1 from surveys where public_slug = v_slug and id != p_survey_id) loop
            v_slug := generate_survey_slug();
        end loop;
    end if;

    update surveys
    set status = 'active',
        public_slug = v_slug
    where id = p_survey_id
    returning * into v_survey;

    return jsonb_build_object(
        'id', v_survey.id,
        'title', v_survey.title,
        'status', v_survey.status,
        'public_slug', v_survey.public_slug
    );
end;
$$ language plpgsql security definer;

create or replace function close_survey(p_survey_id uuid)
returns jsonb as $$
declare
    v_survey surveys%rowtype;
begin
    update surveys
    set status = 'closed'
    where id = p_survey_id
    returning * into v_survey;

    if not found then
        raise exception 'Survey not found';
    end if;

    return jsonb_build_object(
        'id', v_survey.id,
        'status', v_survey.status
    );
end;
$$ language plpgsql security definer;

create or replace function submit_survey_response(
    p_survey_id uuid,
    p_anonymous_token text,
    p_answers jsonb
)
returns jsonb as $$
declare
    v_survey_status text;
    v_response_id uuid;
    v_item jsonb;
    v_question_id uuid;
    v_choice_id uuid;
begin
    select status into v_survey_status from surveys where id = p_survey_id;
    if not found then
        raise exception 'SURVEY_NOT_FOUND';
    end if;
    if v_survey_status != 'active' then
        raise exception 'SURVEY_NOT_ACTIVE';
    end if;

    if p_anonymous_token is not null and exists (
        select 1 from responses
        where survey_id = p_survey_id
        and anonymous_token = p_anonymous_token
    ) then
        raise exception 'DUPLICATE_RESPONSE';
    end if;

    insert into responses (survey_id, anonymous_token, submitted_at)
    values (p_survey_id, p_anonymous_token, now())
    returning id into v_response_id;

    for v_item in select * from jsonb_array_elements(p_answers)
    loop
        v_question_id := (v_item->>'question_id')::uuid;
        v_choice_id := null;
        if v_item->>'choice_id' is not null then
            v_choice_id := (v_item->>'choice_id')::uuid;
        end if;

        if not exists (
            select 1 from questions
            where id = v_question_id and survey_id = p_survey_id
        ) then
            raise exception 'INVALID_QUESTION';
        end if;

        if v_choice_id is not null and not exists (
            select 1 from choices
            where id = v_choice_id and question_id = v_question_id
        ) then
            raise exception 'INVALID_CHOICE';
        end if;

        insert into answers (response_id, question_id, choice_id, text_answer)
        values (v_response_id, v_question_id, v_choice_id, v_item->>'text_answer');
    end loop;

    return jsonb_build_object(
        'success', true,
        'response_id', v_response_id
    );
end;
$$ language plpgsql security definer;
