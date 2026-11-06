-- Sample Seed Data for Classroom Survey Web App

-- 1. Insert Sample Survey (Active)
insert into surveys (id, title, description, status, public_slug)
values (
    'a1111111-1111-1111-1111-111111111111',
    'Recursion Concept Check',
    'Quick in-class understanding check on recursive functions.',
    'active',
    'rec101'
) on conflict (id) do nothing;

-- 2. Questions for Recursion Survey
insert into questions (id, survey_id, question_text, question_type, position)
values
(
    'b1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'What is required for every recursive function to terminate?',
    'multiple_choice',
    1
),
(
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Recursion always requires more memory than an equivalent iterative loop.',
    'true_false',
    2
) on conflict (id) do nothing;

-- 3. Choices for Question 1
insert into choices (id, question_id, choice_text, position)
values
('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'A base case', 1),
('c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'A global variable', 2),
('c3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'A while loop', 3),
('c4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'A compiler flag', 4)
on conflict (id) do nothing;

-- 4. Choices for Question 2
insert into choices (id, question_id, choice_text, position)
values
('c5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 'True', 1),
('c6666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222', 'False', 2)
on conflict (id) do nothing;

-- 5. Sample Closed Survey
insert into surveys (id, title, description, status, public_slug)
values (
    'a2222222-2222-2222-2222-222222222222',
    'Pointers & Memory Review',
    'Review of dynamic memory allocation and pointer arithmetic.',
    'closed',
    'ptr202'
) on conflict (id) do nothing;

insert into questions (id, survey_id, question_text, question_type, position)
values (
    'b3333333-3333-3333-3333-333333333333',
    'a2222222-2222-2222-2222-222222222222',
    'Which operator is used to obtain the memory address of a variable in C/C++?',
    'multiple_choice',
    1
) on conflict (id) do nothing;

insert into choices (id, question_id, choice_text, position)
values
('c7777777-7777-7777-7777-777777777777', 'b3333333-3333-3333-3333-333333333333', '& (ampersand)', 1),
('c8888888-8888-8888-8888-888888888888', 'b3333333-3333-3333-3333-333333333333', '* (asterisk)', 2),
('c9999999-9999-9999-9999-999999999999', 'b3333333-3333-3333-3333-333333333333', '-> (arrow)', 3)
on conflict (id) do nothing;
