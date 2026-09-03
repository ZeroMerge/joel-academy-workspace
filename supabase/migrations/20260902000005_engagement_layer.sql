-- JOEL OS Engagement & Retention Layer

-- 5.1 Recognitions
CREATE TABLE recognitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Null if system generated
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    message TEXT,
    type TEXT NOT NULL CHECK (type IN ('system_approved', 'manual_shoutout')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5.2 Streaks View
-- We compute an active week if the user changed a task status or updated a milestone.
-- This is a very simplified placeholder view for a streak. 
-- In Postgres, computing consecutive streaks dynamically across all history is heavy, 
-- but a materialized view or a nightly cron updating a table is best.
-- For now, we will create a `user_stats` table that we'd update.

CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak_weeks INT DEFAULT 0,
    longest_streak_weeks INT DEFAULT 0,
    last_active_date DATE,
    personal_goal TEXT -- For 5.7 Personal notes
);

-- 5.3 Impact visibility
-- We already have `publishing_channels` JSONB on tasks, so we will just render this in the UI.

-- Update the user_stats for everyone currently
INSERT INTO user_stats (user_id)
SELECT id FROM users ON CONFLICT DO NOTHING;
