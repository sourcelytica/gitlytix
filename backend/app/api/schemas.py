from pydantic import BaseModel, Field
from typing import Dict, Optional, List
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

class BugResolutionTimeResponse(BaseModel):
    repository: str
    period: PeriodInfo
    average_resolution_time_seconds: float
    average_resolution_time_readable: str
    total_bugs_resolved: int

class PrReviewTimeResponse(BaseModel):
    repository: str
    reviewed_pr_count: int = Field(description="Number of PRs that received a review (excluding author)")
    average_review_time_seconds: Optional[float] = Field(None, description="Average time in seconds until the first review by someone other than the author")
    average_review_time_readable: Optional[str] = Field(None, description="Average time in human-readable format")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "repository": "owner/repo",
                    "reviewed_pr_count": 50,
                    "average_review_time_seconds": 7200.5,
                    "average_review_time_readable": "2 hours, 0 minutes"
                },
                {
                    "repository": "owner/repo",
                    "reviewed_pr_count": 0,
                    "average_review_time_seconds": None,
                    "average_review_time_readable": None
                }
            ]
        }
    }

class IssueAvgResolutionTimeResponse(BaseModel):
    repository: str
    period: PeriodInfo
    average_resolution_time_seconds: Optional[float] = Field(
        None,
        description="Average time in seconds from issue opening to closing"
    )
    average_resolution_time_readable: Optional[str] = Field(
        None,
        description="Average time in human-readable format",
        example="2 days, 3 hours, 45 minutes"
    )
    total_issues_resolved: int = Field(
        description="Total number of issues that were resolved (opened and closed)"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "repository": "owner/repo",
                    "period": {
                        "start": "2020-01-01",
                        "end": "2023-01-01"
                    },
                    "average_resolution_time_seconds": 172800.5,
                    "average_resolution_time_readable": "2 days, 0 hours",
                    "total_issues_resolved": 50
                },
                {
                    "repository": "owner/repo",
                    "period": {
                        "start": "2020-01-01",
                        "end": "2023-01-01"
                    },
                    "average_resolution_time_seconds": None,
                    "average_resolution_time_readable": None,
                    "total_issues_resolved": 0
                }
            ]
        }
    }

class ErrorResponse(BaseModel):
    detail: str 


class MonthlyIssueStat(BaseModel):
    month: str = Field(description="Month in YYYY-MM format")
    opened: int = Field(description="Number of issues opened in this month")
    closed: int = Field(description="Number of issues closed in this month")


class IssuesOpenClosedMonthlyResponse(BaseModel):
    repository: str
    data: List[MonthlyIssueStat] = Field(description="List of monthly issue statistics for the last 6 months") 