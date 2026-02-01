"""Add is_mistake column to messages

Revision ID: b7c4d2e8f9a1
Revises: a6f3e1c568cf
Create Date: 2026-01-31 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c4d2e8f9a1'
down_revision: Union[str, None] = 'a6f3e1c568cf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_mistake column to messages table"""
    op.add_column('messages', sa.Column('is_mistake', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('messages', sa.Column('mistake_note', sa.Text(), nullable=True))


def downgrade() -> None:
    """Remove is_mistake column from messages table"""
    op.drop_column('messages', 'mistake_note')
    op.drop_column('messages', 'is_mistake')
