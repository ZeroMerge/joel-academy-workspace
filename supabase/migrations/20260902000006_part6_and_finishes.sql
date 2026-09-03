-- JOEL OS Phase 3 & Remaining Phase 2 Upgrades

-- 5.1 Recognitions (already created in previous migration)
-- Adding a function and trigger to auto-create recognition when task is approved
CREATE OR REPLACE FUNCTION auto_recognition_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Approved' AND OLD.status != 'Approved' THEN
        INSERT INTO recognitions (recipient_id, task_id, message, type)
        VALUES (NEW.assignee_id, NEW.id, 'Task approved! Great work.', 'system_approved');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_approval_recognition
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_recognition_on_approval();

-- 6.1 Availability / exam-break status
ALTER TABLE users ADD COLUMN availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'limited', 'unavailable'));
ALTER TABLE users ADD COLUMN availability_return_date DATE;

-- 6.4 Multiple assignees
CREATE TABLE task_collaborators (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

-- 6.5 Recurring task templates
CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type_id UUID REFERENCES task_types(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6.8 Suggestion box
CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scope_id UUID REFERENCES scopes(id), -- If directed at a specific team
    content TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'implemented')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
