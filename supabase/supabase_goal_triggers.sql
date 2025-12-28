-- ============================================================================
-- GOAL PROGRESS AUTO-UPDATE TRIGGERS
-- ============================================================================
-- This migration adds triggers to automatically update goal progress
-- when tasks are created, completed, or deleted.
-- ============================================================================

-- ============================================================================
-- FUNCTION: Recalculate goal progress based on linked tasks
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_goal_progress(goal_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_count INTEGER;
    completed_count INTEGER;
    new_progress INTEGER;
BEGIN
    -- Count total tasks linked to this goal
    SELECT COUNT(*)
    INTO total_count
    FROM tasks
    WHERE goal_id = goal_uuid;

    -- Count completed tasks linked to this goal
    SELECT COUNT(*)
    INTO completed_count
    FROM tasks
    WHERE goal_id = goal_uuid AND is_completed = true;

    -- Calculate progress percentage
    IF total_count > 0 THEN
        new_progress := ROUND((completed_count::DECIMAL / total_count::DECIMAL) * 100);
    ELSE
        new_progress := 0;
    END IF;

    -- Update the goal with new counts and progress
    UPDATE goals
    SET
        total_tasks = total_count,
        completed_tasks = completed_count,
        progress = new_progress,
        updated_at = NOW()
    WHERE id = goal_uuid;

    RAISE NOTICE 'Goal % updated: total=%, completed=%, progress=%', goal_uuid, total_count, completed_count, new_progress;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: After task INSERT with goal_id
-- ============================================================================

CREATE OR REPLACE FUNCTION task_inserted_update_goal()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the new task has a goal_id
    IF NEW.goal_id IS NOT NULL THEN
        PERFORM recalculate_goal_progress(NEW.goal_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_task_inserted ON tasks;
CREATE TRIGGER trigger_task_inserted
    AFTER INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION task_inserted_update_goal();

-- ============================================================================
-- TRIGGER: After task UPDATE (completion status or goal_id change)
-- ============================================================================

CREATE OR REPLACE FUNCTION task_updated_update_goal()
RETURNS TRIGGER AS $$
BEGIN
    -- Case 1: Task completion status changed
    IF OLD.is_completed != NEW.is_completed AND NEW.goal_id IS NOT NULL THEN
        PERFORM recalculate_goal_progress(NEW.goal_id);
    END IF;

    -- Case 2: Task moved to a different goal
    IF OLD.goal_id != NEW.goal_id THEN
        -- Update old goal (if it existed)
        IF OLD.goal_id IS NOT NULL THEN
            PERFORM recalculate_goal_progress(OLD.goal_id);
        END IF;

        -- Update new goal (if it exists)
        IF NEW.goal_id IS NOT NULL THEN
            PERFORM recalculate_goal_progress(NEW.goal_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_task_updated ON tasks;
CREATE TRIGGER trigger_task_updated
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION task_updated_update_goal();

-- ============================================================================
-- TRIGGER: After task DELETE
-- ============================================================================

CREATE OR REPLACE FUNCTION task_deleted_update_goal()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the deleted task had a goal_id
    IF OLD.goal_id IS NOT NULL THEN
        PERFORM recalculate_goal_progress(OLD.goal_id);
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_task_deleted ON tasks;
CREATE TRIGGER trigger_task_deleted
    AFTER DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION task_deleted_update_goal();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- These triggers will now automatically update goal progress whenever:
-- 1. A task is created with a goal_id
-- 2. A task is completed/uncompleted
-- 3. A task is moved to a different goal
-- 4. A task is deleted
-- ============================================================================
