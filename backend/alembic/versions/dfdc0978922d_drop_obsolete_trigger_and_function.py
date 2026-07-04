"""drop_obsolete_trigger_and_function

Revision ID: dfdc0978922d
Revises: f52949bac1f6
Create Date: 2026-05-10 19:18:09.656838

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfdc0978922d'
down_revision: Union[str, None] = 'f52949bac1f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the trigger first
    op.execute("""
        DROP TRIGGER IF EXISTS trg_assign_questions_on_user_create ON users;
    """)
    
    # Drop the function
    op.execute("""
        DROP FUNCTION IF EXISTS auto_assign_questions_by_position();
    """)


def downgrade() -> None:
    # Recreate the function (if needed for rollback)
    op.execute("""
        CREATE OR REPLACE FUNCTION auto_assign_questions_by_position()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO user_question_assignments (user_id, question_id)
            SELECT
                NEW.id,
                q.id
            FROM ai_questions q
            JOIN position_control_mappings pcm
                ON q.control_id = pcm.control_id
            WHERE pcm.position_id = NEW.position_id
            ON CONFLICT (user_id, question_id) DO NOTHING;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Recreate the trigger
    op.execute("""
        CREATE TRIGGER trg_assign_questions_on_user_create
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION auto_assign_questions_by_position();
    """)
