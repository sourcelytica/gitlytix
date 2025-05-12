"use client"

import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CalendarHeatmap } from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AlertCircle, Bug, CheckCircle, Clock, GitBranch, GitCommit, GitPullRequest, Users, MessageSquare, FileCode, Zap, Brain } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ActivityTab } from '@/components/dashboard/ActivityTab'

// Define interfaces for state data types
interface CommitData {
  date: string;
  commits: number;
}

interface IssueData {
  month: string;
  open: number;
  closed: number;
}

interface PrData {
  status: string;
  value: number;
}

interface PrReviewTimeData {
  date: string;
  time: number;
}

interface ContributorHeatmapData {
  date: string;
  count: number;
}

interface IssueTypeData {
  name: string;
  value: number;
}

// Keep existing hardcoded data for now, except those moved to ActivityTab
const prData: PrData[] = [
  { status: 'Open', value: 45 },
  { status: 'Merged', value: 155 },
]

const prReviewTimeData: PrReviewTimeData[] = [
  { date: '2023-01', time: 3.2 },
  { date: '2023-02', time: 2.8 },
  { date: '2023-03', time: 3.5 },
  { date: '2023-04', time: 2.9 },
  { date: '2023-05', time: 2.6 },
  { date: '2023-06', time: 3.1 },
]

const contributorHeatmapData: ContributorHeatmapData[] = [
  { date: '2023-01-01', count: 8 },
  { date: '2023-01-15', count: 12 },
  { date: '2023-02-01', count: 10 },
  { date: '2023-02-15', count: 18 },
  { date: '2023-03-01', count: 15 },
  { date: '2023-03-15', count: 25 },
]

const issueTypeData: IssueTypeData[] = [
  { name: 'Bugs', value: 40 },
  { name: 'Features', value: 35 },
  { name: 'Help Wanted', value: 25 },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('summary')
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Type the placeholder state for fetched data
  const [commitDataState, setCommitDataState] = useState<CommitData[]>([])
  const [issueDataState, setIssueDataState] = useState<IssueData[]>([])
  const [issueTypeDataState, setIssueTypeDataState] = useState<IssueTypeData[]>([]) // Added state for issue types

  useEffect(() => {
    const fetchActivityData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setCommitDataState([
        { date: '2023-01', commits: 320 },
        { date: '2023-02', commits: 280 },
        { date: '2023-03', commits: 350 },
        { date: '2023-04', commits: 410 },
        { date: '2023-05', commits: 380 },
        { date: '2023-06', commits: 450 },
      ]);
      setIssueDataState([
        { month: 'Jan', open: 80, closed: 60 },
        { month: 'Feb', open: 90, closed: 75 },
        { month: 'Mar', open: 100, closed: 85 },
      ]);
      // Set placeholder issue type data (originally hardcoded)
      setIssueTypeDataState([
        { name: 'Bugs', value: 40 },
        { name: 'Features', value: 35 },
        { name: 'Help Wanted', value: 25 },
      ]);
    };

    if (activeTab === 'activity') {
       fetchActivityData();
    }
  }, [activeTab]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="container mx-auto p-4 bg-background text-foreground">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="mr-2" /> mindsdb/mindsdb
          </h1>
          <div className="flex items-center space-x-2">
            <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            <Label htmlFor="dark-mode">Dark Mode</Label>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Repository Health Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <p className="text-6xl font-bold text-primary">88</p>
                <p className="text-xl mt-2">Overall Score</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Badge className={`text-lg ${getScoreColor(92)}`}>Activity: 92</Badge>
                <Badge className={`text-lg ${getScoreColor(88)}`}>Community: 88</Badge>
                <Badge className={`text-lg ${getScoreColor(85)}`}>Code Quality: 85</Badge>
                <Badge className={`text-lg ${getScoreColor(87)}`}>Documentation: 87</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 gap-4">
            <TabsTrigger value="activity" className="flex items-center"><Zap className="mr-2" /> Activity</TabsTrigger>
            <TabsTrigger value="community" className="flex items-center"><Users className="mr-2" /> Community</TabsTrigger>
            <TabsTrigger value="code" className="flex items-center"><FileCode className="mr-2" /> Code Quality</TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center"><CheckCircle className="mr-2" /> Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <ActivityTab
              commitData={commitDataState}
              issueData={issueDataState}
              issueTypeData={issueTypeDataState}
             />
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2" /> Contributor Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarHeatmap
                  startDate={new Date('2023-01-01')}
                  endDate={new Date('2023-12-31')}
                  values={contributorHeatmapData}
                  classForValue={(value: { date: string; count: number } | null | undefined) => {
                    if (!value) {
                      return 'color-empty';
                    }
                    return `color-scale-${Math.min(4, Math.ceil(value.count / 5))}`;
                  }}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2" /> New Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">18 new contributors</p>
                  <p className="text-sm text-muted-foreground">in the last 3 months</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2" /> Community Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">High</p>
                  <Progress value={88} className="w-full mt-2" />
                  <p className="text-sm text-muted-foreground mt-2">Based on discussions and issue interactions</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GitPullRequest className="mr-2" /> Pull Request Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartContainer config={{
                  value: {
                    label: "PRs",
                    color: "hsl(var(--chart-1))",
                  },
                }} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prData}
                        dataKey="value"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="var(--color-value)"
                        label
                      >
                        {prData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-open)' : 'var(--color-merged)'} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <ChartContainer config={{
                  time: {
                    label: "Review Time (Days)",
                    color: "hsl(var(--chart-1))",
                  },
                }} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prReviewTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="time" stroke="var(--color-time)" />
                    
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileCode className="mr-2" /> Documentation Quality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-lg">Comprehensive</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">Last updated: 3 days ago</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2" /> Test Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={87} className="w-full" />
                  <p className="mt-2 text-sm text-muted-foreground">87% coverage</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2" /> CI/CD Pipeline Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pipeline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Run</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Build</TableCell>
                      <TableCell><Badge variant="secondary">Passing</Badge></TableCell>
                      <TableCell>1 hour ago</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Test</TableCell>
                      <TableCell><Badge variant="secondary">Passing</Badge></TableCell>
                      <TableCell>1 hour ago</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Deploy</TableCell>
                      <TableCell><Badge variant="secondary">Passing</Badge></TableCell>
                      <TableCell>1 day ago</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bug className="mr-2" /> Bug Fix Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Average: 2.2 days</p>
                <p className="text-sm text-muted-foreground">from report to resolution</p>
                <Progress value={80} className="w-full mt-2" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>MindsDB Repository Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold">Open Issues</p>
                    <p className="text-2xl">68</p>
                  </div>
                  <div>
                    <p className="font-semibold">Open PRs</p>
                    <p className="text-2xl">23</p>
                  </div>
                  <div>
                    <p className="font-semibold">Contributors</p>
                    <p className="text-2xl">142</p>
                  </div>
                  <div>
                    <p className="font-semibold">Last Release</p>
                    <p className="text-2xl">5 days ago</p>
                  </div>
                  <div>
                    <p className="font-semibold">Test Coverage</p>
                    <p className="text-2xl">87%</p>
                  </div>
                  <div>
                    <p className="font-semibold">Avg. Issue Resolution</p>
                    <p className="text-2xl">3.1 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GitBranch className="mr-2" /> Project Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>v23.6 Release</TableCell>
                      <TableCell><Progress value={85} className="w-full" /></TableCell>
                      <TableCell>In 1 week</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>New ML Model Integration</TableCell>
                      <TableCell><Progress value={60} className="w-full" /></TableCell>
                      <TableCell>In 3 weeks</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cloud Deployment Enhancements</TableCell>
                      <TableCell><Progress value={30} className="w-full" /></TableCell>
                      <TableCell>In 2 months</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2" /> Areas Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <AlertCircle className="mr-2 text-yellow-500" />
                    Documentation updates needed for new ML integrations
                  </li>
                  <li className="flex items-center">
                    <AlertCircle className="mr-2 text-red-500" />
                    Performance optimization required for large dataset processing
                  </li>
                  <li className="flex items-center">
                    <AlertCircle className="mr-2 text-yellow-500" />
                    Additional unit tests needed for recently added features
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}