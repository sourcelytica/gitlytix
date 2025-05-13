import DashboardClient from './dashboard-client';

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

interface DashboardMetrics {
  score: number;
  activityLevel: string;
  engagementLevel: string;
  qualityLevel: string;
  firstResponseTime: number;
  avgIssueResolution: number;
  prReviewTime: number;
  prSuccessRate: number;
  newContributors: number;
  documentationQuality: string;
  bugFixRate: number;
}

async function fetchData<T>(url: string, mockData: T, delay: number = 500): Promise<T> {
  console.log(`Fetching ${url} on server...`);
  const response = await fetch("http://localhost:8000" + url);
  if (!response.ok) {
    await new Promise(resolve => setTimeout(resolve, delay));
    return mockData;
  }
  const data = await response.json();
  return data;

}

async function fetchReleaseData(): Promise<ReleaseDataEntry[]> {
  return fetchData<ReleaseDataEntry[]>(
    '/api/v1/stats/releases/frequency?repo_name=mindsdb%2Fmindsdb',
    [
      { name: 'Jan', releases: 2 },
      { name: 'Feb', releases: 1 },
      { name: 'Mar', releases: 3 },
      { name: 'Apr', releases: 2 },
      { name: 'May', releases: 4 },
      { name: 'Jun', releases: 2 },
    ]
  );
}

async function fetchIssueData(): Promise<IssueDataEntry[]> {
  return fetchData<IssueDataEntry[]>(
    '/api/issue-data',
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
    '/api/issue-type-data',
    [
      { name: 'Bugs', value: 30 },
      { name: 'Features', value: 45 },
      { name: 'Docs', value: 25 },
    ]
  );
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return fetchData<DashboardMetrics>(
    '/api/dashboard-metrics',
    {
        score: 88,
        activityLevel: "Very High",
        engagementLevel: "High",
        qualityLevel: "Excellent",
        firstResponseTime: 2.1,
        avgIssueResolution: 3.0,
        prReviewTime: 1.5,
        prSuccessRate: 82,
        newContributors: 18,
        documentationQuality: "Excellent",
        bugFixRate: 1.2,
    },
    100 
  );
}

export default async function Page() {
  // Fetch all data in parallel to optimize loading time
  const [ 
    releaseData,
    issueData,
    issueTypeData,
    metrics
  ] = await Promise.all([
    fetchReleaseData(),
    fetchIssueData(),
    fetchIssueTypeData(),
    fetchDashboardMetrics()
  ]);

  return (
    <DashboardClient
      initialReleaseData={releaseData}
      initialIssueData={issueData}
      initialIssueTypeData={issueTypeData}
      score={metrics.score}
      activityLevel={metrics.activityLevel}
      engagementLevel={metrics.engagementLevel}
      qualityLevel={metrics.qualityLevel}
      firstResponseTime={metrics.firstResponseTime}
      avgIssueResolution={metrics.avgIssueResolution}
      prReviewTime={metrics.prReviewTime}
      prSuccessRate={metrics.prSuccessRate}
      newContributors={metrics.newContributors}
      documentationQuality={metrics.documentationQuality}
      bugFixRate={metrics.bugFixRate}
    />
  );
}