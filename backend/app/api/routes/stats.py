from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import text
from sqlmodel import Session
from datetime import datetime, timedelta

from app.core.db import get_db
from app.api.schemas import IssuesOpenClosedResponse, ErrorResponse, DataQualityResponse, IssueFirstResponseTimeResponse, PrSuccessRateResponse

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/")
def read_stats():
    return {"message": "Hello, World!"}

@router.get(
    "/data-quality",
    response_model=DataQualityResponse,
    responses={500: {"model": ErrorResponse}}
)
def get_data_quality(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    db: Session = Depends(get_db)
):
    """
    Get data quality metrics for a repository.
    
    This endpoint provides information about the freshness of data for a specific repository,
    including when the most recent event was recorded and how long ago that was.
    
    This helps users understand how up-to-date the metrics for a repository are.
    """
    try:
        query = text(
            """
            SELECT 
                MAX(created_at) as latest_event_time,
                NOW() - MAX(created_at) as time_since_latest_event
            FROM github_events
            WHERE repo_name = :repo_name
            """
        )
        
        result = db.execute(query, {"repo_name": repo_name})
        row = result.fetchone()
        
        if not row or row[0] is None:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for repository: {repo_name}"
            )
            
        latest_event_time = row[0]
        seconds_since_latest = row[1]
        
        # Convert seconds to a readable format
        time_since_latest = format_time_difference(seconds_since_latest)
        
        # Determine data freshness status
        data_freshness_status = "Fresh"
        if seconds_since_latest > 86400 * 7:  # More than 7 days
            data_freshness_status = "Outdated"
        elif seconds_since_latest > 86400:  # More than 1 day
            data_freshness_status = "Stale"
            
        return {
            "repository": repo_name,
            "latest_event_time": latest_event_time,
            "time_since_latest_event": time_since_latest,
            "data_freshness_status": data_freshness_status
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving data quality information: {str(e)}"
        )

@router.get(
    "/issues/open-closed",
    response_model=IssuesOpenClosedResponse,
    responses={500: {"model": ErrorResponse}}
)
def get_open_closed_issues(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    start_date: str = Query("2010-01-01 00:00:00", description="Start date in format 'YYYY-MM-DD HH:MM:SS'"),
    db: Session = Depends(get_db)
):
    """
    Get counts of opened and closed issues for a specific repository.
    
    This endpoint retrieves the number of issues that have been opened and closed
    in a specific GitHub repository since the given start date.
    
    The data is retrieved from the GitHub events database and provides insight
    into the repository's issue activity.
    """
    try:
        # Simple query to get issue states
        state_query = text(
            """
            WITH last_action AS (
                SELECT
                    number,
                    argMax(action, created_at) as most_recent_action
                FROM github_events
                WHERE event_type = 'IssuesEvent'
                  AND action IN ('opened', 'closed', 'reopened')
                  AND repo_name = :repo_name
                GROUP BY number
            )
            SELECT
                most_recent_action,
                COUNT(*) as count
            FROM last_action
            GROUP BY most_recent_action
            """
        )
        
        # Get event counts for the specified date range
        events_query = text(
            """
            SELECT
                action,
                COUNT(*) AS count
            FROM github_events
            WHERE event_type = 'IssuesEvent'
              AND action IN ('opened', 'closed')
              AND created_at >= :start_date
              AND repo_name = :repo_name
            GROUP BY action
            """
        )
        
        # Execute queries
        state_result = db.execute(state_query, {"repo_name": repo_name})
        states = state_result.fetchall()
        
        events_result = db.execute(events_query, {"repo_name": repo_name, "start_date": start_date})
        events = events_result.fetchall()
        
        # Process state results in Python
        current_state = {}
        for state in states:
            action = state[0]
            count = state[1]
            current_state[action] = count
        
        # Calculate metrics
        currently_open = sum(current_state.get(action, 0) for action in ['opened', 'reopened'])
        currently_closed = current_state.get('closed', 0)
        total_created = currently_open + currently_closed
        
        # Process event counts
        event_counts = {}
        for event in events:
            action = event[0]
            count = event[1]
            event_counts[action] = count
        
        opened_events = event_counts.get('opened', 0)
        closed_events = event_counts.get('closed', 0)
        
        return {
            "repository": repo_name,
            "period": {
                "start": start_date,
                "end": "now"
            },
            "issues": {
                "opened": opened_events,
                "closed": closed_events,
                # Calculated metrics (states)
                "total_created": total_created,
                "currently_open": currently_open,
                "currently_closed": currently_closed
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving issues data: {str(e)}"
        )
    

def format_time_difference(seconds):
    """Format a time difference in seconds to a human-readable string."""
    if not seconds:
        return "Unknown"
        
    seconds = int(seconds)
    days, remainder = divmod(seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    parts = []
    if days > 0:
        parts.append(f"{days} day{'s' if days != 1 else ''}")
    if hours > 0:
        parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
    if minutes > 0:
        parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
    if seconds > 0 and not parts:  # Only show seconds if less than a minute
        parts.append(f"{seconds} second{'s' if seconds != 1 else ''}")
        
    if not parts:
        return "Just now"
        
    return ", ".join(parts)

@router.get(
    "/issues/first-response-time",
    response_model=IssueFirstResponseTimeResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
def get_first_response_time(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    start_date: str = Query("2010-01-01", description="Start date in format 'YYYY-MM-DD'"),
    exclude_opener_comments: bool = Query(True, description="Exclude comments by the issue opener"),
    db: Session = Depends(get_db)
):
    """
    Calculate average time between issue opening and first response comment.
    
    Returns:
    - repository: Repository name
    - average_response_time_seconds: Average in seconds
    - average_response_time_readable: Human-readable average (e.g., "2 hours 30 minutes")
    """
    try:
        query = text("""
        WITH issue_openings AS (
            SELECT 
                repo_name,
                number,
                created_at as opened_at,
                actor_login as opener_login
            FROM github_events
            WHERE event_type = 'IssuesEvent'
              AND action = 'opened'
              AND repo_name = :repo_name
              AND created_at >= :start_date
        ),
        first_comments AS (
            SELECT
                io.repo_name,
                io.number,
                io.opened_at,
                MIN(ge.created_at) as first_comment_at
            FROM issue_openings io
            JOIN github_events ge ON io.repo_name = ge.repo_name AND io.number = ge.number
            WHERE ge.event_type = 'IssueCommentEvent'
              AND ge.action = 'created'
              AND ge.created_at > io.opened_at
              {exclude_opener_condition}
            GROUP BY io.repo_name, io.number, io.opened_at
        ),
        response_times AS (
            SELECT
                repo_name,
                dateDiff('second', opened_at, first_comment_at) as response_time_seconds
            FROM first_comments
        )
        SELECT
            repo_name,
            avg(response_time_seconds) as avg_seconds
        FROM response_times
        GROUP BY repo_name
        """.format(
            exclude_opener_condition="AND ge.actor_login != io.opener_login" if exclude_opener_comments else ""
        ))

        result = db.execute(query, {
            "repo_name": repo_name,
            "start_date": start_date
        })
        row = result.fetchone()

        if not row or row[1] is None:
            raise HTTPException(
                status_code=404,
                detail=f"No response data found for issues in repository: {repo_name}"
            )

        avg_seconds = float(row[1])
        avg_timedelta = timedelta(seconds=avg_seconds)
        
        return {
            "repository": repo_name,
            "average_response_time_seconds": avg_seconds,
            "average_response_time_readable": format_time_delta(avg_timedelta)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating first response time: {str(e)}"
        )


def format_time_delta(delta: timedelta) -> str:
    """Convert timedelta to human-readable string (e.g., '2 days 3 hours')"""
    seconds = delta.total_seconds()
    periods = [
        ('day', 86400),
        ('hour', 3600),
        ('minute', 60),
        ('second', 1)
    ]
    
    parts = []
    for period_name, period_seconds in periods:
        if seconds >= period_seconds:
            period_value, seconds = divmod(seconds, period_seconds)
            parts.append(f"{int(period_value)} {period_name}{'s' if period_value != 1 else ''}")
    
    return " ".join(parts[:2]) if parts else "0 seconds"


@router.get(
    "/prs/success-rate",
    response_model=PrSuccessRateResponse,
    responses={500: {"model": ErrorResponse}}
)
def get_pr_success_rate(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    db: Session = Depends(get_db)
):
    """
    Calculate the percentage of closed PRs that were successfully merged.
    
    This endpoint identifies all PRs that reached a 'closed' state and determines
    what percentage of them were actually merged (as opposed to just closed without merging).
    """
    try:
        query = text(
            """
            WITH pr_final_states AS (
                SELECT
                    number,
                    argMax(action, created_at) as final_action,
                    argMax(merged, created_at) as final_merged_status,
                    max(created_at) as last_updated
                FROM github_events
                WHERE event_type = 'PullRequestEvent'
                  AND repo_name = :repo_name
                GROUP BY number
            )
            SELECT
                COUNT() as total_closed_prs,
                COUNTIf(final_merged_status = 1) as merged_prs,
                ROUND(COUNTIf(final_merged_status = 1) * 100.0 / COUNT(), 2) as success_rate_percent
            FROM pr_final_states
            WHERE final_action = 'closed'
            """
        )

        result = db.execute(query, {"repo_name": repo_name})
        row = result.fetchone()

        if not row or row[0] is None:
            raise HTTPException(
                status_code=404,
                detail=f"No PR data found for repository: {repo_name}"
            )

        return {
            "repository": repo_name,
            "total_closed_prs": row[0],
            "merged_prs": row[1],
            "success_rate_percent": row[2]
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating PR success rate: {str(e)}"
        ) 
        