"use client"

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bug, Clock, GitBranch } from 'lucide-react'

// TODO: Replace with actual data fetching and type definitions
interface CommitData {
  date: string;
  commits: number;
}

interface IssueData {
  month: string;
  open: number;
  closed: number;
}

interface IssueTypeData {
  name: string;
  value: number;
}

interface ActivityTabProps {
  commitData: CommitData[];
  issueData: IssueData[];
  issueTypeData: IssueTypeData[];
  // Add other necessary props, e.g., release frequency, active branches
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'] // Consider moving to constants

export function ActivityTab({ commitData, issueData, issueTypeData }: ActivityTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Commit Activity (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{
            commits: {
              label: "Commits",
              color: "hsl(var(--chart-1))",
            },
          }} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="commits" stroke="var(--color-commits)" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2" /> Release Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Replace hardcoded values */}
            <p className="text-2xl font-bold">Last release: 5 days ago</p>
            <p className="text-sm text-muted-foreground">Average: Every 10 days</p>
            <div className="mt-4">
              <Progress value={50} className="w-full h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GitBranch className="mr-2" /> Active Branches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Replace hardcoded values */}
            <ul className="space-y-2">
              <li className="flex items-center"><GitBranch className="mr-2" /> main</li>
              <li className="flex items-center"><GitBranch className="mr-2" /> develop</li>
              <li className="flex items-center"><GitBranch className="mr-2" /> feature/new-integrations</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="mr-2" /> Issue Tracker Health
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartContainer config={{
            open: {
              label: "Open Issues",
              color: "hsl(var(--chart-1))",
            },
            closed: {
              label: "Closed Issues",
              color: "hsl(var(--chart-2))",
            },
          }} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="open" fill="var(--color-open)" />
                <Bar dataKey="closed" fill="var(--color-closed)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          {/* Pie chart for issue types removed - assumed fetched separately or passed differently */}
          {/* If needed, add PieChart similar to the original dashboard.tsx */}
          {/* Consider creating a separate IssueTypePieChart component */}
        </CardContent>
      </Card>
    </div>
  );
} 