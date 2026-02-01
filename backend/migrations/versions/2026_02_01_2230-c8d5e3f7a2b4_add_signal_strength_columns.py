"""Add signal_strength, context_clarity, needs_knowledge columns

Revision ID: c8d5e3f7a2b4
Revises: a0c619e00a9e
Create Date: 2026-02-01 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8d5e3f7a2b4'
down_revision: Union[str, None] = 'a0c619e00a9e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add AI Core v2.1 columns to messages table"""
    # signal_strength: replaces confidence (same value, clearer meaning)
    op.add_column('messages', sa.Column('signal_strength', sa.Float(), nullable=True))
    
    # context_clarity: was context clear? (0=false, 1=true)
    op.add_column('messages', sa.Column('context_clarity', sa.Integer(), nullable=True))
    
    # needs_knowledge: does AI need RAG/knowledge base? (0=false, 1=true)
    op.add_column('messages', sa.Column('needs_knowledge', sa.Integer(), nullable=True, server_default='0'))
    
    # Add check constraints
    op.create_check_constraint(
        'ck_messages_signal_strength_range',
        'messages',
        'signal_strength >= 0 AND signal_strength <= 1'
    )
    op.create_check_constraint(
        'ck_messages_context_clarity_bool',
        'messages',
        'context_clarity IN (0, 1)'
    )
    op.create_check_constraint(
        'ck_messages_needs_knowledge_bool',
        'messages',
        'needs_knowledge IN (0, 1)'
    )


def downgrade() -> None:
    """Remove AI Core v2.1 columns"""
    op.drop_constraint('ck_messages_needs_knowledge_bool', 'messages', type_='check')
    op.drop_constraint('ck_messages_context_clarity_bool', 'messages', type_='check')
    op.drop_constraint('ck_messages_signal_strength_range', 'messages', type_='check')
    
    op.drop_column('messages', 'needs_knowledge')
    op.drop_column('messages', 'context_clarity')
    op.drop_column('messages', 'signal_strength')
