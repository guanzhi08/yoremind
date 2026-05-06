"""add note to parcels

Revision ID: 001
Revises: None
Create Date: 2026-05-06
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('parcels', sa.Column('note', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('parcels', 'note')
