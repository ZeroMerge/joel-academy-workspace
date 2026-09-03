-- JOEL OS Analytics Views Migration

-- View to compute delivery rate and current load for each user
CREATE OR REPLACE VIEW user_analytics AS
WITH current_load AS (
    SELECT 
        assignee_id as user_id, 
        COUNT(id) as active_tasks
    FROM tasks
    WHERE status NOT IN ('Approved', 'Published', 'Archived') -- terminal statuses
      AND assignee_id IS NOT NULL
    GROUP BY assignee_id
),
historical_performance AS (
    SELECT 
        assignee_id as user_id,
        COUNT(id) as total_completed,
        SUM(
            CASE 
                WHEN completed_at <= deadline THEN 1 
                ELSE 0 
            END
        ) as completed_on_time
    FROM tasks
    WHERE completed_at IS NOT NULL
      AND assignee_id IS NOT NULL
    GROUP BY assignee_id
)
SELECT 
    u.id as user_id,
    COALESCE(cl.active_tasks, 0) as current_load,
    hp.total_completed,
    hp.completed_on_time,
    CASE 
        WHEN hp.total_completed > 0 THEN 
            ROUND((hp.completed_on_time::NUMERIC / hp.total_completed::NUMERIC) * 100, 1)
        ELSE null 
    END as delivery_rate_pct
FROM users u
LEFT JOIN current_load cl ON u.id = cl.user_id
LEFT JOIN historical_performance hp ON u.id = hp.user_id;

-- Grant permissions for authenticated users to view this data
GRANT SELECT ON user_analytics TO authenticated;
