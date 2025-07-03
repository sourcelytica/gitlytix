import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface ReleaseFreqProps {
    releaseData: { month: string; releases: number }[];
}

const ReleaseFreq: React.FC<ReleaseFreqProps> = ({ releaseData }) => {
    return (
        <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <TrendingUp className="mr-2 text-blue-600" /> Release Frequency
          </CardTitle>
          <CardDescription>Timeline of project releases</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={releaseData}>
              <defs>
                <linearGradient id="colorReleases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }} />
              <Area type="monotone" dataKey="releases" stroke="#3B82F6" fillOpacity={1} fill="url(#colorReleases)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
}

export default ReleaseFreq;