from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import text
from sqlmodel import Session
from datetime import datetime, timedelta

from app.core.db import get_db
from app.api.schemas import IssuesOpenClosedResponse, ErrorResponse, DataQualityResponse, IssueFirstResponseTimeResponse, PrSuccessRateResponse, PrAvgClosingTimeResponse, BugResolutionTimeResponse, PrReviewTimeResponse, IssueAvgResolutionTimeResponse
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
        
        
@router.get(
    "/prs/avg-closing-time",
    response_model=PrAvgClosingTimeResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
def get_pr_avg_closing_time(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    start_date: str = Query("2010-01-01", description="Start date in format 'YYYY-MM-DD'"),
    db: Session = Depends(get_db)
):
    """
    Calculate average time between PR opening and closing (either merged or closed without merging).
    
    Returns:
    - repository: Repository name
    - average_closing_time_seconds: Average in seconds
    - average_closing_time_readable: Human-readable average (e.g., "2 days 3 hours")
    """
    try:
        query = text("""
        WITH pr_openings AS (
            SELECT 
                repo_name,
                number,
                created_at as opened_at
            FROM github_events
            WHERE event_type = 'PullRequestEvent'
              AND action = 'opened'
              AND repo_name = :repo_name
              AND created_at >= :start_date
        ),
        pr_closings AS (
            SELECT
                repo_name,
                number,
                maxIf(created_at, action = 'closed') as closed_at
            FROM github_events
            WHERE event_type = 'PullRequestEvent'
              AND action = 'closed'
              AND repo_name = :repo_name
              AND created_at >= :start_date
            GROUP BY repo_name, number
        ),
        valid_prs AS (
            SELECT
                o.repo_name,
                o.number,
                o.opened_at,
                c.closed_at
            FROM pr_openings o
            JOIN pr_closings c ON o.repo_name = c.repo_name AND o.number = c.number
            WHERE c.closed_at > o.opened_at
        ),
        closing_times AS (
            SELECT
                repo_name,
                dateDiff('second', opened_at, closed_at) as closing_time_seconds
            FROM valid_prs
        )
        SELECT
            repo_name,
            avg(closing_time_seconds) as avg_seconds
        FROM closing_times
        GROUP BY repo_name
        """)

        result = db.execute(query, {
            "repo_name": repo_name,
            "start_date": start_date
        })
        row = result.fetchone()

        if not row or row[1] is None:
            raise HTTPException(
                status_code=404,
                detail=f"No PR closing data found for repository: {repo_name}"
            )

        avg_seconds = float(row[1])
        avg_timedelta = timedelta(seconds=avg_seconds)
        
        return {
            "repository": repo_name,
            "average_closing_time_seconds": avg_seconds,
            "average_closing_time_readable": format_time_delta(avg_timedelta)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating PR average closing time: {str(e)}"
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
    "/prs/review-time",
    response_model=PrReviewTimeResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
def get_pr_review_time(
    repo_name: str = Query(..., description="Repository name in format 'owner/repo'"),
    db: Session = Depends(get_db)
):
    """
    Calculate the average time until the first review for Pull Requests.
    
    This excludes reviews made by the PR author themselves.
    """
    try:
        query = text(
            """
            WITH pr_opened_times AS (
                SELECT
                    number,
                    argMin(created_at, created_at) as opened_at,
                    argMin(actor_login, created_at) as pr_author
                FROM github_events
                WHERE event_type = 'PullRequestEvent' 
                  AND action = 'opened' 
                  AND repo_name = :repo_name
                GROUP BY number
            ),
            review_event_times AS (
                SELECT 
                    number, 
                    created_at AS review_at, 
                    actor_login
                FROM github_events
                WHERE repo_name = :repo_name 
                  AND event_type IN ('PullRequestReviewCommentEvent', 'PullRequestReviewEvent')
            ),
            first_review_times AS (
                SELECT
                    rev.number,
                    min(rev.review_at) as first_review_at
                FROM review_event_times rev
                JOIN pr_opened_times po ON rev.number = po.number
                WHERE rev.actor_login != po.pr_author AND rev.review_at >= po.opened_at
                GROUP BY rev.number
            )
            SELECT
                avg(dateDiff('second', po.opened_at, fr.first_review_at)) as avg_time_to_first_review_seconds,
                count() as reviewed_pr_count
            FROM pr_opened_times po
            JOIN first_review_times fr ON po.number = fr.number
            """
        )
        
        result = db.execute(query, {"repo_name": repo_name})
        row = result.fetchone()
        
        avg_seconds = None
        readable_time = None
        reviewed_count = 0
        
        if row and row[1] is not None and row[1] > 0:
            reviewed_count = row[1]
            avg_seconds = row[0]
            if avg_seconds is not None:
                avg_seconds = float(avg_seconds) 
                readable_time = format_time_difference(avg_seconds)
            else:
                 avg_seconds = None
                 readable_time = None
            
        return PrReviewTimeResponse(
            repository=repo_name,
            reviewed_pr_count=reviewed_count,
            average_review_time_seconds=avg_seconds,
            average_review_time_readable=readable_time
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating PR review time: {str(e)}"
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