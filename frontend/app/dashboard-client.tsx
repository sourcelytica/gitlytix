'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip} from 'recharts'
import { AlertCircle, Users, Bug, BookOpen, Gauge, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import ScoreCard from '@/components/dashboard/ScoreCard';
import ProjectOverview from '@/components/dashboard/ProjectOverview';
import ReleaseFreq from '@/components/dashboard/ReleaseFreq';
import OpenClosedIssues from '@/components/dashboard/OpenClosedIssues';
import NewContributors from '@/components/dashboard/NewContributors';
import BugFixRate from '@/components/dashboard/BugFixRate';

interface ReleaseDataEntry {
  month: string;
  releases: number;
}

interface IssueDataEntry {
  month: string;
  opened: number;
  closed: number;
}

interface IssueTypeEntry {
  name: string;
  value: number;
}

interface DashboardClientProps {
  initialReleaseData: ReleaseDataEntry[];
  initialIssueData: IssueDataEntry[];
  initialIssueTypeData: IssueTypeEntry[];
  score: number;
  firstResponseTime: number;
  avgIssueResolution: number;
  prReviewTime: number;
  // prSuccessRate: string;
  newContributors: number;
  bugFixRate: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B']

export default function DashboardClient(props: DashboardClientProps) {
  const {
    initialReleaseData,
    initialIssueData,
    initialIssueTypeData,
    score,
    firstResponseTime,
    avgIssueResolution,
    prReviewTime,
    // prSuccessRate,
    newContributors,
    bugFixRate
  } = props;

  const [activeMetric, setActiveMetric] = React.useState('score')

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto p-4">
        <motion.h1 
          className="text-5xl font-bold mb-8 text-center text-gray-900"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Open Source Project Dashboard
        </motion.h1>
        
        {/* Project Health Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
            className="col-span-2 row-span-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
          <ScoreCard 
            score={score} 
          />
        </motion.div>
          
          <motion.div
            className="col-span-2 row-span-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
          <ProjectOverview 
            firstResponseTime={firstResponseTime} 
            avgIssueResolution={avgIssueResolution} 
            prReviewTime={prReviewTime} 
            // prSuccessRate={prSuccessRate} 
          />
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >

          <ReleaseFreq releaseData={initialReleaseData} />

          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >

          <OpenClosedIssues issueData={initialIssueData} />

          </motion.div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >

          <NewContributors newContributors={newContributors} />

          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <BugFixRate bugFixRate={bugFixRate} />
          </motion.div>
        </div>
        
        {/* Areas Needing Attention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="mb-8 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Areas Needing Attention</CardTitle>
              <CardDescription>Critical areas where contributions can have the most immediate impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold">Documentation Updates</h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    <li>API reference for new features</li>
                    <li>Getting started guide improvements</li>
                    <li>More code examples needed</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Bug className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold">High-Priority Bugs</h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    <li>Memory leak in data processing module</li>
                    <li>Inconsistent results in search function</li>
                    <li>UI freezes on large dataset imports</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Gauge className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold">Performance Optimization</h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    <li>Optimize database queries for faster retrieval</li>
                    <li>Implement caching for frequently accessed data</li>
                    <li>Reduce bundle size for faster load times</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Contributor Hall of Fame */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="mb-8 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Trophy className="mr-2 text-yellow-400" /> Contributor Hall of Fame
              </CardTitle>
              <CardDescription>Celebrating our top contributors and their achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Alice Chen', username: 'alice', avatar: 'https://i.pravatar.cc/100?img=1', title: 'Code Maestro', score: 1250, streak: 7, badges: ['🏆', '🚀', '📚'] },
                  { name: 'Bob Smith', username: 'bob', avatar: 'https://i.pravatar.cc/100?img=2', title: 'Bug Buster', score: 1100, streak: 5, badges: ['🐛', '🛠️', '🔍'] },
                  { name: 'Charlie Davis', username: 'charlie', avatar: 'https://i.pravatar.cc/100?img=3', title: 'Doc Wizard', score: 950, streak: 3, badges: ['📖', '✨', '🧙‍♂️'] },
                  { name: 'Diana Evans', username: 'diana', avatar: 'https://i.pravatar.cc/100?img=4', title: 'Feature Guru', score: 875, streak: 4, badges: ['💡', '🎨', '🚢'] },
                  { name: 'Ethan James', username: 'ethan', avatar: 'https://i.pravatar.cc/100?img=5', title: 'Test Master', score: 800, streak: 2, badges: ['🧪', '✅', '🛡️'] },
                  { name: 'Fiona Garcia', username: 'fiona', avatar: 'https://i.pravatar.cc/100?img=6', title: 'Community Champion', score: 750, streak: 6, badges: ['🤝', '🌟', '🎉'] },
                ].map((contributor, index) => (
                  <motion.div 
                    key={index} 
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md"
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="flex items-center mb-2">
                      <Avatar className="h-12 w-12 border-2 border-blue-500">
                        <AvatarImage src={contributor.avatar} />
                        <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{contributor.name}</h3>
                        <p className="text-sm text-gray-600">@{contributor.username}</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold mr-2">
                        {contributor.title}
                      </span>
                      <span className="text-sm text-gray-600">
                        🔥 {contributor.streak} day streak
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold text-blue-600">{contributor.score} pts</div>
                      <div className="flex space-x-1">
                        {contributor.badges.map((badge, badgeIndex) => (
                          <span key={badgeIndex} className="text-2xl" title={`Achievement Badge ${badgeIndex + 1}`}>{badge}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        
        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
          >
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <AlertCircle className="mr-2 text-blue-600" /> Type of Issues
                </CardTitle>
                <CardDescription>Breakdown of issue categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={initialIssueTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {initialIssueTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center mt-4">
                  {initialIssueTypeData.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center mx-2">
                      <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-sm text-gray-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Users className="mr-2 text-blue-600" /> Contributor Activity
                </CardTitle>
                <CardDescription>Heatmap of contributor engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className={`h-4 rounded-sm ${
                        Math.random() > 0.5 ? 'bg-blue-600' : 'bg-blue-200'
                      }`}
                      style={{ opacity: Math.random() * 0.5 + 0.5 }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.01 }}
                    ></motion.div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Less</span>
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  </div>
                  <span>More</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 