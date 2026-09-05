-- Resources & Vault Final Model (Specification Section 7)

-- 1. Ensure 'Executive' scope exists so Executives have their own resource group
DO 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM scopes WHERE name = 'Executive') THEN
        INSERT INTO scopes (name) VALUES ('Executive');
    END IF;
END ;

-- 2. Update scope_resources to support tags
ALTER TABLE scope_resources ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 3. Enhance vault_resources to act as general secure notepad / drive folder
ALTER TABLE vault_resources ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE vault_resources ADD COLUMN IF NOT EXISTS drive_url TEXT;
ALTER TABLE vault_resources ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE vault_resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE vault_resources ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Drop old type check constraint if exists, and support 'secret' and 'drive_folder'
ALTER TABLE vault_resources DROP CONSTRAINT IF EXISTS vault_resources_type_check;
ALTER TABLE vault_resources ADD CONSTRAINT vault_resources_type_check CHECK (type IN ('secret', 'drive_folder', 'login', 'other'));

-- 4. Enhance vault_secrets
ALTER TABLE vault_secrets ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE vault_secrets ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- 5. Enhance vault_grants for task-linked automatic grants
ALTER TABLE vault_grants ADD COLUMN IF NOT EXISTS grant_type TEXT DEFAULT 'manual' CHECK (grant_type IN ('manual', 'task_linked'));
ALTER TABLE vault_grants ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE vault_grants ADD COLUMN IF NOT EXISTS secret_version_granted INTEGER DEFAULT 1;
-- Allow expires_at to be NULL for task-linked grants (tied to task lifetime)
ALTER TABLE vault_grants ALTER COLUMN expires_at DROP NOT NULL;

-- 6. Enhance vault_requests
ALTER TABLE vault_requests ADD COLUMN IF NOT EXISTS reason TEXT;

-- 7. Add tagged resources and vault entries to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tagged_resource_ids UUID[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tagged_vault_ids UUID[] DEFAULT '{}';

-- 8. Assign Executive user to Executive scope if not already assigned
DO 
DECLARE
    exec_scope_id UUID;
    exec_user_id UUID;
BEGIN
    SELECT id INTO exec_scope_id FROM scopes WHERE name = 'Executive' LIMIT 1;
    SELECT id INTO exec_user_id FROM users WHERE email = 'exec@joel.os' LIMIT 1;
    
    IF exec_scope_id IS NOT NULL AND exec_user_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM user_role_scopes WHERE user_id = exec_user_id AND scope_id = exec_scope_id) THEN
            INSERT INTO user_role_scopes (user_id, base_role, scope_id)
            VALUES (exec_user_id, 'executive', exec_scope_id);
        END IF;
    END IF;
END ;
