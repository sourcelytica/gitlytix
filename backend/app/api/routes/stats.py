from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import text
from sqlmodel import Session
from datetime import datetime, timedelta

from app.core.db import get_db
from app.api.schemas import ErrorResponse, DataQualityResponse, BugResolutionTimeResponse
from app.core.utils import format_time_delta, format_time_difference

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
    "/bugs/avg-resolution-time",
    response_model=BugResolutionTimeResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
def get_bug_avg_resolution_time(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    start_date: str = Query("2010-01-01", description="Start date in format 'YYYY-MM-DD'"),
    end_date: str = Query(None, description="End date in format 'YYYY-MM-DD' (defaults to now)"),
    db: Session = Depends(get_db)
):
    """
    Calculate average time between bug issue opening and closing.
    
    A bug is identified as an issue with a 'bug' label that was closed.
    
    Returns:
    - repository: Repository name
    - period: Time window analyzed
    - average_resolution_time_seconds: Average in seconds
    - average_resolution_time_readable: Human-readable average (e.g., "2 days 3 hours")
    - total_bugs_resolved: Total number of bugs resolved in the time window
    """
    try:
        end_date = end_date or datetime.utcnow().strftime("%Y-%m-%d")
        
        query = text("""
        WITH bug_issues AS (
            -- Get the first opened and last closed event for each issue
            SELECT 
                repo_name,
                number,
                minIf(created_at, action = 'opened') as opened_at,
                maxIf(created_at, action = 'closed') as closed_at,
                -- Check if any event for this issue had a 'bug' label
                max(hasAny(labels, ['bug'])) as is_bug
            FROM github_events
            WHERE event_type = 'IssuesEvent'
              AND repo_name = :repo_name
              AND action IN ('opened', 'closed')
              AND created_at BETWEEN :start_date AND :end_date
            GROUP BY repo_name, number
            HAVING is_bug = 1 AND closed_at IS NOT NULL AND opened_at IS NOT NULL
        ),
        resolution_times AS (
            SELECT
                repo_name,
                dateDiff('second', opened_at, closed_at) as resolution_time_seconds
            FROM bug_issues
            WHERE resolution_time_seconds > 0  -- Ensure closed after opened
              AND resolution_time_seconds < 31536000  -- Filter out resolutions > 1 year
        )
        SELECT
            repo_name,
            avg(resolution_time_seconds) as avg_seconds,
            count() as total_bugs
        FROM resolution_times
        GROUP BY repo_name
        """)

        result = db.execute(query, {
            "repo_name": repo_name,
            "start_date": start_date,
            "end_date": end_date
        })
        row = result.fetchone()

        if not row or row[1] is None:
            raise HTTPException(
                status_code=404,
                detail=f"No bug resolution data found for repository: {repo_name}"
            )

        avg_seconds = float(row[1])
        avg_timedelta = timedelta(seconds=avg_seconds)
        
        return {
            "repository": repo_name,
            "period": {
                "start": start_date,
                "end": end_date
            },
            "average_resolution_time_seconds": avg_seconds,
            "average_resolution_time_readable": format_time_delta(avg_timedelta),
            "total_bugs_resolved": row[2]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating bug resolution time: {str(e)}"
        )

@router.get(
    "/releases/frequency",
    responses={500: {"model": ErrorResponse}}
)
def get_release_frequency(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    start_month: str = Query(None, description="Start month in format 'YYYY-MM' (defaults to 12 months ago)"),
    end_month: str = Query(None, description="End month in format 'YYYY-MM' (defaults to current month)"),
    db: Session = Depends(get_db)
):
    """
    Get release frequency statistics by month.
    
    Returns a list of months with release counts in the format:
    [
        {"month": "2025-01", "releases": 4},
        {"month": "2025-02", "releases": 3},
        ...
    ]
    
    If no months are provided, defaults to last 12 months.
    Returns empty array when there are no releases in range.
    """
    try:
        # Set default date range (last 12 months if no dates provided)
        now = datetime.utcnow()
        current_month = now.strftime("%Y-%m")
        
        if not end_month:
            end_month = current_month
        if not start_month:
            # Calculate 12 months before end_month
            end_date = datetime.strptime(end_month + "-01", "%Y-%m-%d")
            start_date = (end_date - timedelta(days=365)).strftime("%Y-%m")
            start_month = start_date
        
        # Convert YYYY-MM to first day of month for database query
        start_date = f"{start_month}-01"
        end_date = f"{end_month}-01"
        
        query = text("""
        WITH release_events AS (
            SELECT 
                toStartOfMonth(created_at) as month,
                count() as releases
            FROM github_events
            WHERE event_type = 'ReleaseEvent'
              AND repo_name = :repo_name
              AND created_at BETWEEN :start_date AND :end_date
            GROUP BY month
            ORDER BY month
        )
        SELECT 
            formatDateTime(month, '%Y-%m') as month_str,
            releases
        FROM release_events
        """)

        result = db.execute(query, {
            "repo_name": repo_name,
            "start_date": start_date,
            "end_date": end_date
        })
        
        data = [
            {"month": row[0], "releases": row[1]}
            for row in result.fetchall()
        ]
        
        return {"data": data}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving release frequency data: {str(e)}"
        )
    

@router.get(
    "/contributors/new",
    responses={500: {"model": ErrorResponse}}
)
def get_new_contributors(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    months: int = Query(6, description="Time window in months to look for new contributors (default: 6)", ge=1, le=24),
    db: Session = Depends(get_db)
):
    """
    Get list of users who made their first contribution to the repository within the specified time window.
    
    Returns a list of new contributors with their first contribution date and GitHub profile URL.
    Only considers PushEvent and PullRequestEvent as qualifying contributions.
    
    Default time window is 6 months (maximum 24 months allowed).
    """
    try:
        query = text("""
        WITH first_contributions AS (
            SELECT
                actor_login as username,
                min(created_at) as first_contribution_date
            FROM github_events
            WHERE repo_name = :repo_name
              AND event_type IN ('PushEvent', 'PullRequestEvent')
            GROUP BY actor_login
            HAVING first_contribution_date >= subtractMonths(now(), :months)
        )
        SELECT
            username,
            first_contribution_date,
            concat('https://github.com/', username) as profile_url
        FROM first_contributions
        ORDER BY first_contribution_date DESC
        """)

        result = db.execute(query, {
            "repo_name": repo_name,
            "months": months
        })
        
        contributors = [
            {
                "username": row[0],
                "first_contribution_date": row[1].strftime("%Y-%m-%d"),
                "profile_url": row[2]
            }
            for row in result.fetchall()
        ]
        
        return {
            "repository": repo_name,
            "time_window_months": months,
            "new_contributors_count": len(contributors),
            "contributors": contributors
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving new contributors data: {str(e)}"
        )