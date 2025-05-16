from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import text
from sqlmodel import Session
from datetime import timedelta

from app.core.db import get_db
from app.api.schemas import ErrorResponse, PrSuccessRateResponse, PrAvgClosingTimeResponse, PrReviewTimeResponse
from app.core.utils import format_time_delta, format_time_difference

router = APIRouter(prefix="/stats", tags=["stats"])


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
    