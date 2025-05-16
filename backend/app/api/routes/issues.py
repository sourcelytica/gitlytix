from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import text
from sqlmodel import Session
from datetime import datetime, timedelta

from app.core.db import get_db
from app.api.schemas import IssuesOpenClosedResponse, ErrorResponse, IssueFirstResponseTimeResponse, IssueAvgResolutionTimeResponse
from app.core.utils import format_time_delta

router = APIRouter(prefix="/stats", tags=["stats"])


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