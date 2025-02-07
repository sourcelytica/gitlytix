from sqlmodel import Field, SQLModel
from sqlalchemy import Column
from clickhouse_sqlalchemy import engines

class Stats(SQLModel, table=True):
    __table_args__ = (
        engines.MergeTree(
            partition_by=None,  # You can specify partition key if needed
            order_by='id',      # Required: specify the sorting key
            primary_key='id'    # Specify primary key
        ),
    )
    
    id: int = Field(primary_key=True)
    name: str
