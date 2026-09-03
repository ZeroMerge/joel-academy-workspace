-- 1. Add active_scope_id to users for context switching
ALTER TABLE users ADD COLUMN active_scope_id UUID REFERENCES scopes(id);

-- 2. Create scope_resources for Team Workspace (Tab 3)
CREATE TABLE scope_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_id UUID NOT NULL REFERENCES scopes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category TEXT,
    "order" INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scope_resources ENABLE ROW LEVEL SECURITY;

-- Policies for scope_resources
-- 1. Contributors can read resources in their scope
CREATE POLICY "Users can view resources in their scopes"
ON scope_resources FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_role_scopes urs
        WHERE urs.user_id = auth.uid()
        AND urs.scope_id = scope_resources.scope_id
    )
);

-- 2. Leads and above can insert/update/delete in their scope
CREATE POLICY "Leads can insert resources in their scopes"
ON scope_resources FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_role_scopes urs
        WHERE urs.user_id = auth.uid()
        AND urs.scope_id = scope_resources.scope_id
        AND urs.base_role IN ('lead', 'executive', 'admin')
    )
);

CREATE POLICY "Leads can update resources in their scopes"
ON scope_resources FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_role_scopes urs
        WHERE urs.user_id = auth.uid()
        AND urs.scope_id = scope_resources.scope_id
        AND urs.base_role IN ('lead', 'executive', 'admin')
    )
);

CREATE POLICY "Leads can delete resources in their scopes"
ON scope_resources FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_role_scopes urs
        WHERE urs.user_id = auth.uid()
        AND urs.scope_id = scope_resources.scope_id
        AND urs.base_role IN ('lead', 'executive', 'admin')
    )
);
