-- JOEL OS RLS Policies Migration

-- Enable Row Level Security on all tables
ALTER TABLE scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_requests ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_role_scopes 
    WHERE user_id = auth.uid() AND base_role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_executive() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_role_scopes 
    WHERE user_id = auth.uid() AND base_role = 'executive'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_scope_access(target_scope_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Admins and Executives have cross-scope visibility implicitly via other rules,
  -- but we can explicitly check if the user has any role in this scope or its parents
  -- For v1, simpler approach: check if user has a role in the target scope directly.
  SELECT EXISTS (
    SELECT 1 FROM public.user_role_scopes
    WHERE user_id = auth.uid() AND scope_id = target_scope_id
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Scopes: readable by all authenticated users, writable by admin
CREATE POLICY "Scopes are viewable by all authenticated users" ON scopes
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Scopes are insertable by admin" ON scopes
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Scopes are updatable by admin" ON scopes
    FOR UPDATE TO authenticated USING (public.is_admin());

-- 2. Users: readable by all authenticated users, writable by admin
CREATE POLICY "Users are viewable by all authenticated users" ON users
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users are insertable by admin" ON users
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Users are updatable by admin" ON users
    FOR UPDATE TO authenticated USING (public.is_admin());

-- 3. User Role Scopes: readable by all authenticated users, writable by admin
CREATE POLICY "Role scopes are viewable by all authenticated users" ON user_role_scopes
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Role scopes are editable by admin" ON user_role_scopes
    FOR ALL TO authenticated USING (public.is_admin());

-- 4. Tasks:
-- Visible if: admin OR executive OR assignee OR requester has role in scope
CREATE POLICY "Tasks visibility" ON tasks
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR 
        public.is_executive() OR 
        assignee_id = auth.uid() OR
        public.has_scope_access(scope_id)
    );

CREATE POLICY "Tasks insertable by admin or lead in scope" ON tasks
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin() OR 
        (
            public.has_scope_access(scope_id) AND 
            EXISTS (SELECT 1 FROM user_role_scopes WHERE user_id = auth.uid() AND base_role = 'lead' AND scope_id = tasks.scope_id)
        )
    );

CREATE POLICY "Tasks updatable" ON tasks
    FOR UPDATE TO authenticated
    USING (
        public.is_admin() OR 
        assignee_id = auth.uid() OR
        (
            public.has_scope_access(scope_id) AND 
            EXISTS (SELECT 1 FROM user_role_scopes WHERE user_id = auth.uid() AND base_role = 'lead' AND scope_id = tasks.scope_id)
        )
    );

-- 5. Task Types: viewable by all
CREATE POLICY "Task types viewable by all" ON task_types
    FOR SELECT TO authenticated USING (true);

-- 6. Content Pages (Notion Bible Cache): viewable by all authenticated users
CREATE POLICY "Content pages viewable by all" ON content_pages
    FOR SELECT TO authenticated USING (true);

-- 7. Audit Log: viewable by admin only
CREATE POLICY "Audit log viewable by admin only" ON audit_log
    FOR SELECT TO authenticated USING (public.is_admin());

-- 8. Vault Secrets: NO DIRECT SELECT ALLOWED
-- We don't create a SELECT policy for vault_secrets, which means it defaults to deny all.
-- Access will be granted via a specific SECURITY DEFINER function.

-- 9. Notifications: users can see their own
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 10. Vault Resources: viewable by all (to request access)
CREATE POLICY "Vault resources viewable by all" ON vault_resources
    FOR SELECT TO authenticated USING (true);

-- 11. Vault Grants: users see their own, admins see all
CREATE POLICY "Vault grants viewable by owner or admin" ON vault_grants
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid() OR public.is_admin());

-- 12. Vault Requests: users see their own, admins and approvers see requests directed to them
CREATE POLICY "Vault requests viewable" ON vault_requests
    FOR SELECT TO authenticated 
    USING (
        requested_by = auth.uid() OR 
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM vault_resources 
            WHERE id = vault_requests.resource_id AND approver_user_id = auth.uid()
        )
    );
