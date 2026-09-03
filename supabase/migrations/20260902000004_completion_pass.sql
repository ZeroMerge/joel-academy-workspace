-- JOEL OS Completion Pass Migration

-- 1. Alter Role Enum to include 'advisor'
ALTER TABLE user_role_scopes DROP CONSTRAINT IF EXISTS user_role_scopes_base_role_check;
ALTER TABLE user_role_scopes ADD CONSTRAINT user_role_scopes_base_role_check CHECK (base_role IN ('admin', 'executive', 'lead', 'advisor', 'contributor'));

-- 2. Projects & Campaigns
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('project', 'campaign')),
    scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'planning',
    requires_executive_approval BOOLEAN DEFAULT false,
    is_approved_by_exec BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- 3. Cross-Team Requests
CREATE TABLE cross_team_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
    target_scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    resulting_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);

-- 4. Product Validation & Student Pain Points
CREATE TABLE student_pain_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem TEXT NOT NULL,
    experiencer TEXT,
    level TEXT,
    evidence TEXT,
    frequency TEXT,
    current_solutions TEXT,
    joel_opportunity TEXT,
    intervention TEXT,
    reported_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE product_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_statement TEXT NOT NULL,
    target_user TEXT,
    proposed_solution TEXT,
    evidence TEXT,
    priority TEXT,
    status TEXT NOT NULL CHECK (status IN ('idea', 'validating', 'approved', 'in_progress')) DEFAULT 'idea',
    student_pain_point_id UUID REFERENCES student_pain_points(id) ON DELETE SET NULL,
    reported_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Publishing Queue & Academic Detail (Adding to Tasks)
ALTER TABLE tasks ADD COLUMN publishing_channels JSONB DEFAULT '{}'::jsonb;
ALTER TABLE tasks ADD COLUMN academic_metadata JSONB DEFAULT '{}'::jsonb;

-- 6. Decisions & Onboarding
CREATE TABLE decisions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    context TEXT,
    decider_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    decision_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Onboarding checklist can just be tracked as a JSONB column on users
ALTER TABLE users ADD COLUMN onboarding_progress JSONB DEFAULT '{"read_guide": false, "meet_team": false, "join_channel": false, "access_tools": false, "understand_role": false, "first_task": false}'::jsonb;
