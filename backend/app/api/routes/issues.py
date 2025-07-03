from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import text
from sqlmodel import Session
from datetime import datetime, timedelta

from app.core.db import get_db
from app.api.schemas import IssuesOpenClosedMonthlyResponse, ErrorResponse, IssueFirstResponseTimeResponse, IssueAvgResolutionTimeResponse
from app.core.utils import format_time_delta

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get(
    "/issues/open-closed",
    response_model=IssuesOpenClosedMonthlyResponse,
    responses={500: {"model": ErrorResponse}}
)
def get_open_closed_issues(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    db: Session = Depends(get_db)
):
    """
    Get monthly issue statistics for the past 6 months from ClickHouse.
    Returns counts of opened and closed issues formatted with month names.
    """
    try:
        # Calculate date range - last 6 months from now
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)  # ~6 months
        
        # ClickHouse SQL query
        query = text(
            """
            SELECT
                toStartOfMonth(created_at) AS month,
                countIf(action = 'opened') AS opened,
                countIf(action = 'closed') AS closed
            FROM github_events
            WHERE event_type = 'IssuesEvent'
              AND action IN ('opened', 'closed')
              AND created_at >= :start_date
              AND created_at <= :end_date
              AND repo_name = :repo_name
            GROUP BY month
            ORDER BY month
            """
        )
        
        # Execute query with ClickHouse-compatible date formatting
        result = db.execute(query, {
            "repo_name": repo_name,
            "start_date": start_date,
            "end_date": end_date
        })
        db_results = result.fetchall()
        
        # Process results
        monthly_stats = []
        
        # Generate all months in the period
        current_month = start_date.replace(day=1)
        while current_month <= end_date.replace(day=1):
            # ClickHouse returns dates as datetime.date objects
            current_month_date = current_month.date()
            
            # Find matching data from DB
            db_data = next((row for row in db_results if row[0] == current_month_date), None)
            
            # Format month as YYYY-MM to match MonthlyIssueStat
            month_str = current_month.strftime("%Y-%m")
            
            monthly_stats.append({
                "month": month_str,
                "opened": db_data[1] if db_data else 0,
                "closed": db_data[2] if db_data else 0
            })
            
            # Move to next month
            if current_month.month == 12:
                current_month = current_month.replace(year=current_month.year + 1, month=1)
            else:
                current_month = current_month.replace(month=current_month.month + 1)
        
        # Get only the last 6 months
        last_6_months = monthly_stats[-6:]
        
        return {
           last_6_months
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving monthly issues data: {str(e)}"
        )
    


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

    
@router.get(
    "/issues/avg-resolution-time",
    response_model=IssueAvgResolutionTimeResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
def get_issue_avg_resolution_time(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    start_date: str = Query("2010-01-01", description="Start date in format 'YYYY-MM-DD'"),
    end_date: str = Query(None, description="End date in format 'YYYY-MM-DD' (defaults to now)"),
    db: Session = Depends(get_db)
):
    """
    Calculate average time between issue opening and closing.
    
    Returns:
    - repository: Repository name
    - period: Time window analyzed
    - average_resolution_time_seconds: Average in seconds
    - average_resolution_time_readable: Human-readable average (e.g., "2 days 3 hours")
    - total_issues_resolved: Total number of issues resolved in the time window
    """
    try:
        end_date = end_date or datetime.utcnow().strftime("%Y-%m-%d")
        
        query = text("""
        WITH issue_events AS (
            -- Get all open and close events for issues
            SELECT 
                repo_name,
                number,
                action,
                created_at,
                labels
            FROM github_events
            WHERE event_type = 'IssuesEvent'
              AND repo_name = :repo_name
              AND action IN ('opened', 'closed')
              AND created_at BETWEEN :start_date AND :end_date
        ),
        issue_timings AS (
            -- Find first open and last close for each issue
            SELECT
                repo_name,
                number,
                minIf(created_at, action = 'opened') as opened_at,
                maxIf(created_at, action = 'closed') as closed_at
            FROM issue_events
            GROUP BY repo_name, number
            HAVING opened_at IS NOT NULL AND closed_at IS NOT NULL
        ),
        resolution_times AS (
            -- Calculate resolution time for each issue
            SELECT
                repo_name,
                dateDiff('second', opened_at, closed_at) as resolution_time_seconds
            FROM issue_timings
            WHERE resolution_time_seconds > 0  -- Ensure closed after opened
        )
        SELECT
            repo_name,
            avg(resolution_time_seconds) as avg_seconds,
            count() as total_issues
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
                detail=f"No issue resolution data found for repository: {repo_name}"
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
            "total_issues_resolved": row[2]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating issue resolution time: {str(e)}"
        )