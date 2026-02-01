"""add_tone_behavior_columns

Revision ID: a0c619e00a9e
Revises: b7c4d2e8f9a1
Create Date: 2026-02-01 21:16:14.478898

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0c619e00a9e'
down_revision: Union[str, None] = 'b7c4d2e8f9a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tone and behavior columns for AI Core v2.0
    op.add_column('messages', sa.Column('tone', sa.Text(), nullable=True))
    op.add_column('messages', sa.Column('behavior', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove tone and behavior columns
    op.drop_column('messages', 'behavior')
    op.drop_column('messages', 'tone')
