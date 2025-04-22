from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime


class PeriodInfo(BaseModel):
    start: str
    end: str


class IssuesCounts(BaseModel):
    opened: int = Field(description="Number of issue open events")
    closed: int = Field(description="Number of issue close events")
    total_created: int = Field(description="Total number of issues created")
    currently_open: int = Field(description="Number of issues currently open")
    currently_closed: int = Field(description="Number of issues currently closed")
    

class IssuesOpenClosedResponse(BaseModel):
    repository: str
    period: PeriodInfo
    issues: IssuesCounts = Field(
        ...,
        description="Issue counts with detailed metrics",
        example={
            "opened": 27,
            "closed": 45,
            "total_created": 128,
            "currently_open": 83,
            "currently_closed": 45
        }
    )


class DataQualityResponse(BaseModel):
    repository: str
    latest_event_time: datetime = Field(description="Timestamp of the most recent event in the database")
    time_since_latest_event: str = Field(
        description="Human-readable time since the most recent event",
        example="2 days, 3 hours, 45 minutes"
    )
    data_freshness_status: str = Field(
        description="Status indicator for data freshness",
        example="Fresh",
        enum=["Fresh", "Stale", "Outdated"]
    )


class IssueFirstResponseTimeResponse(BaseModel):
    repository: str
    average_response_time_seconds: float
    average_response_time_readable: str


class PrSuccessRateResponse(BaseModel):
    repository: str
    total_closed_prs: int = Field(description="Total number of PRs that were closed")
    merged_prs: int = Field(description="Number of closed PRs that were merged")
    success_rate_percent: float = Field(description="Percentage of closed PRs that were merged")

class PrAvgClosingTimeResponse(BaseModel):
    repository: str
    average_closing_time_seconds: float
    average_closing_time_readable: str

class ErrorResponse(BaseModel):
    detail: str 