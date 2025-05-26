import DashboardClient from './dashboard-client';
import { calculateOsScore } from '../lib/scoring';

// Define interfaces for the data structures
interface ReleaseDataEntry {
  name: string;
  releases: number;
}

interface IssueDataEntry {
  name: string;
  open: number;
  closed: number;
}

interface IssueTypeEntry {
  name: string;
  value: number;
}

export interface DashboardMetrics {
  firstResponseTime: number;
  avgIssueResolution: number;
  prReviewTime: number;
}

// Interface for the actual data structure from /api/v1/stats/releases/frequency
interface ApiReleaseMonthEntry {
  month: string; // e.g., "2024-05"
  count: number; // API uses 'count' for the number of releases
}

// Wrapper for the API response, as it returns { data: [...] }
interface ReleasesApiResponse {
  data: ApiReleaseMonthEntry[]; 
}

async function fetchData<T>(url: string, mockData: T, delay: number = 500): Promise<T> {
  console.log(`Fetching ${url} on server...`);
  const response = await fetch("http://localhost:8000" + url);
  if (!response.ok) {
    await new Promise(resolve => setTimeout(resolve, delay));
    return mockData;
  }
  const data = await response.json();
  console.log('RELESE DAA',data )
  return data;
}

async function fetchReleaseData(): Promise<ReleaseDataEntry[]> {
  try {
    const apiResponse = await fetchData<ReleasesApiResponse>(
      '/api/v1/stats/releases/frequency?repo_name=mindsdb%2Fmindsdb',
      { data: [] }
    );
    if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
      const transformedData = apiResponse.data.map(item => {
        const [year, monthNum] = item.month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'short' });
        return {
          name: monthName,
          releases: item.count,
        };
      });
      console.log('Transformed Release Data (in fetchReleaseData):', transformedData);
      return transformedData;
    }
    console.error("Failed to fetch or transform release data, returning empty array.");
    return [];
  } catch (error) {
    console.error("Error in fetchReleaseData, returning empty array:", error);
    return [];
  }
}

async function fetchIssueData(): Promise<IssueDataEntry[]> {
  return fetchData<IssueDataEntry[]>(
    '/api/issue-data', // Example API endpoint
    [
      { name: 'Jan', open: 40, closed: 24 },
      { name: 'Feb', open: 30, closed: 35 },
      { name: 'Mar', open: 20, closed: 45 },
      { name: 'Apr', open: 27, closed: 38 },
      { name: 'May', open: 18, closed: 48 },
      { name: 'Jun', open: 23, closed: 38 },
    ]
  );
}

async function fetchIssueTypeData(): Promise<IssueTypeEntry[]> {
  return fetchData<IssueTypeEntry[]>(
    '/api/issue-type-data', // Example API endpoint
    [
      { name: 'Bugs', value: 30 },
      { name: 'Features', value: 45 },
      { name: 'Docs', value: 25 },
    ]
  );
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return fetchData<DashboardMetrics>(
    '/api/dashboard-metrics', // Example API endpoint
    {
        firstResponseTime: 2.1,
        avgIssueResolution: 3.0,
        prReviewTime: 1.5
    },
    100 // Shorter delay for this one
  );
}

export default async function Page() {
  // Fetch all data in parallel to optimize loading time
  const [ 
    releaseData,
    issueData,
    issueTypeData,
    rawMetrics
  ] = await Promise.all([
    fetchReleaseData(),
    fetchIssueData(),
    fetchIssueTypeData(),
    fetchDashboardMetrics()
  ]);

  // Calculate the OS Score
  const osScore = calculateOsScore(rawMetrics);

  return (
    <DashboardClient
      initialReleaseData={releaseData}
      initialIssueData={issueData}
      initialIssueTypeData={issueTypeData}
      score={osScore}
      firstResponseTime={rawMetrics.firstResponseTime}
      avgIssueResolution={rawMetrics.avgIssueResolution}
      prReviewTime={rawMetrics.prReviewTime}
      prSuccessRate={11}
      newContributors={17}
      bugFixRate={2}
    />
  );
}