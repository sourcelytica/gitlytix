import { Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';


interface OpenClosedIssuesProps {
    issueData: { month: string; opened: number; closed: number }[];
}

const OpenClosedIssues: React.FC<OpenClosedIssuesProps> = ({ issueData }) => {
    return (
        <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Zap className="mr-2 text-blue-600" /> Open vs. Closed Issues
          </CardTitle>
          <CardDescription>Issue management over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={issueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }} />
              <Bar dataKey="opened" fill="#3B82F6" stackId="a" />
              <Bar dataKey="closed" fill="#10B981" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
}

export default OpenClosedIssues;