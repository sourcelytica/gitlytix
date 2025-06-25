import DashboardClient from "./dashboard-client";
import { calculateOsScore } from "../lib/scoring";

// Define interfaces for the data structures
interface ReleaseDataEntry {
  month: string;
  releases: number;
}

interface IssueDataEntry {
  month: string;
  opened: number;
  closed: number;
}

interface IssuesOpenClosedResponse {
  repository: string;
  data: { month: string; opened: number; closed: number }[];
}

interface IssueTypeEntry {
  name: string;
  value: number;
}

export interface DashboardMetrics {
  firstResponseTimeReadable: number;
  avgIssueResolutionReadable: number;
  prReviewTimeReadable: number;
  firstResponseTimeSeconds: number;
  avgIssueResolutionSeconds: number;
  prReviewTimeSeconds: number;
}

// Interface for the actual data structure from /api/v1/stats/releases/frequency
interface ApiReleaseMonthEntry {
  month: string; // e.g., "2024-05"
  releases: number; // API uses 'count' for the number of releases
}

// Wrapper for the API response, as it returns { data: [...] }
interface ReleasesApiResponse {
  data: ApiReleaseMonthEntry[];
}

// Interface for the PR Review Time API response
interface PrReviewTimeResponse {
  average_review_time_seconds: number;
  average_review_time_readable: number;
}

// Interface for the First Response Time API response
interface IssueFirstResponseTimeResponse {
  average_response_time_seconds: number;
  average_response_time_readable: number;
}

// Interface for the Avg Issue Resolution Time API response
interface IssueAvgResolutionTimeResponse {
  average_resolution_time_seconds: number;
  average_resolution_time_readable: number;
}

interface PrSuccessRateResponse {
  success_rate_percent: string;
}

interface NewContributors {
  new_contributors_count: number;
}

async function fetchData<T>(
  url: string,
  mockData: T,
  delay: number = 500
): Promise<T> {
  console.log(`Fetching ${url} on server...`);
  const response = await fetch("http://localhost:8000" + url);
  if (!response.ok) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return mockData;
  }
  const data = await response.json();
  return data;
}

async function fetchReleaseData(): Promise<ReleaseDataEntry[]> {
  try {
    const apiResponse = await fetchData<ReleasesApiResponse>(
      "/api/v1/stats/releases/frequency?repo_name=mindsdb%2Fmindsdb",
      { data: [] }
    );
    if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
      const transformedData = apiResponse.data.map((item) => {
        const [year, monthNum] = item.month.split("-");
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const monthName = date.toLocaleString("en-US", { month: "short" });
        return {
          month: monthName,
          releases: item.releases,
        };
      });
      console.log(
        "Transformed Release Data (in fetchReleaseData):",
        transformedData
      );
      return transformedData;
    }
    console.error(
      "Failed to fetch or transform release data, returning empty array."
    );
    return [];
  } catch (error) {
    console.error("Error in fetchReleaseData, returning empty array:", error);
    return [];
  }
}

async function fetchIssueData(): Promise<IssueDataEntry[]> {
  try {
    const apiResponse = await fetchData<IssuesOpenClosedResponse>(
      "/api/v1/stats/issues/open-closed?repo_name=mindsdb%2Fmindsdb",
      {
        repository: "mindsdb/mindsdb",
        data: [
          { month: "2024-12", opened: 12, closed: 12 },
          { month: "2025-01", opened: 40, closed: 24 },
          { month: "2025-02", opened: 30, closed: 35 },
          { month: "2025-03", opened: 20, closed: 45 },
          { month: "2025-04", opened: 27, closed: 38 },
          { month: "2025-05", opened: 18, closed: 48 },
        ],
      }
    );

    if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
      const transformedData = apiResponse.data.map((item) => {
        const [year, monthNum] = item.month.split("-");
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const monthName = date.toLocaleString("en-US", { month: "short" });
        return {
          month: monthName,
          opened: item.opened,
          closed: item.closed,
        };
      });

      console.log(
        "Transformed Issue Data (in fetchIssueData):",
        transformedData
      );
      return transformedData;
    }

    console.error(
      "Failed to fetch or transform issue data, returning empty array."
    );
    return [];
  } catch (error) {
    console.error("Error in fetchIssueData, returning empty array:", error);
    return [];
  }
}

async function fetchIssueTypeData(): Promise<IssueTypeEntry[]> {
  return fetchData<IssueTypeEntry[]>("/api/issue-type-data", [
    { name: "Bugs", value: 30 },
    { name: "Features", value: 45 },
    { name: "Docs", value: 25 },
  ]);
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const mockMetrics: DashboardMetrics = {
    firstResponseTimeReadable: 2.1,
    avgIssueResolutionReadable: 3.0,
    prReviewTimeReadable: 1.5,
    firstResponseTimeSeconds: 2.1,
    avgIssueResolutionSeconds: 3.0,
    prReviewTimeSeconds: 1.5,
  };

  try {
    // Fetch first response time
    const firstResponseData = await fetchData<IssueFirstResponseTimeResponse>(
      "/api/v1/stats/issues/first-response-time?repo_name=mindsdb%2Fmindsdb",
      {
        average_response_time_seconds: mockMetrics.firstResponseTimeSeconds,
        average_response_time_readable: mockMetrics.firstResponseTimeReadable,
      },
      100
    );

    // Fetch average issue resolution time
    const issueResolutionData = await fetchData<IssueAvgResolutionTimeResponse>(
      "/api/v1/stats/issues/avg-resolution-time?repo_name=mindsdb%2Fmindsdb",
      {
        average_resolution_time_seconds: mockMetrics.avgIssueResolutionSeconds,
        average_resolution_time_readable: mockMetrics.avgIssueResolutionReadable,
      },
      100
    );

    // Fetch PR review time
    const prReviewData = await fetchData<PrReviewTimeResponse>(
      "/api/v1/stats/prs/review-time?repo_name=mindsdb%2Fmindsdb",
      {
        average_review_time_seconds: mockMetrics.prReviewTimeSeconds,
        average_review_time_readable: mockMetrics.prReviewTimeReadable,
      },
      100
    );

    // Combine metrics
    return {
      firstResponseTimeReadable: firstResponseData.average_response_time_readable,
      avgIssueResolutionReadable: issueResolutionData.average_resolution_time_readable,
      prReviewTimeReadable: prReviewData.average_review_time_readable,
      firstResponseTimeSeconds: firstResponseData.average_response_time_seconds,
      avgIssueResolutionSeconds: firstResponseData.average_response_time_seconds,
      prReviewTimeSeconds: firstResponseData.average_response_time_seconds,
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics, using mock data:", error);
    return mockMetrics;
  }
}

async function fetchNewContributors(): Promise<number> {
  try {
    const response = await fetchData<NewContributors>(
      "/api/v1/stats/contributors/new?repo_name=mindsdb%2Fmindsdb",
      {
        new_contributors_count: 17,
      }
    );
    return response.new_contributors_count;
  } catch (error) {
    console.error("Error fetching new contributors, using default value:", error);
    return 17;
  }
}



export default async function Page() {
  const [releaseData, issueData, issueTypeData, rawMetrics, newContributorsCount] = await Promise.all(
    [
      fetchReleaseData(),
      fetchIssueData(),
      fetchIssueTypeData(),
      fetchDashboardMetrics(),
      fetchNewContributors()
    ]
  );

  const osScore = calculateOsScore(rawMetrics);

  return (
    <DashboardClient
      initialReleaseData={releaseData}
      initialIssueData={issueData}
      initialIssueTypeData={issueTypeData}
      score={osScore}
      firstResponseTime={rawMetrics.firstResponseTimeReadable}
      avgIssueResolution={rawMetrics.avgIssueResolutionReadable}
      prReviewTime={rawMetrics.prReviewTimeReadable}
      // prSuccessRate={"11"}
      newContributors={newContributorsCount}
      bugFixRate={2}
    />
  );
}
