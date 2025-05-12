'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'
import { Activity, AlertCircle, CheckCircle2, Clock, GitPullRequest, Star, Users, FileText, Bug, Zap, TrendingUp, BookOpen, Gauge, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Mock data for charts
const issueData = [
  { name: 'Jan', open: 40, closed: 24 },
  { name: 'Feb', open: 30, closed: 35 },
  { name: 'Mar', open: 20, closed: 45 },
  { name: 'Apr', open: 27, closed: 38 },
  { name: 'May', open: 18, closed: 48 },
  { name: 'Jun', open: 23, closed: 38 },
]

const releaseData = [
  { name: 'Jan', releases: 2 },
  { name: 'Feb', releases: 1 },
  { name: 'Mar', releases: 3 },
  { name: 'Apr', releases: 2 },
  { name: 'May', releases: 4 },
  { name: 'Jun', releases: 2 },
]

const issueTypeData = [
  { name: 'Bugs', value: 30 },
  { name: 'Features', value: 45 },
  { name: 'Docs', value: 25 },
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B']

export default function Dashboard() {
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
            <Card className="overflow-hidden bg-white shadow-md">
              <CardHeader className="bg-gradient-to-r bg-blue-600  text-white">
                <CardTitle className="text-3xl flex items-center justify-between">
                  Project Score
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  >
                    <Trophy className="w-8 h-8" />
                  </motion.div>
                </CardTitle>
                <CardDescription className="text-blue-100">Overall health and activity</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-200 stroke-current"
                      strokeWidth="10"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    ></circle>
                    <motion.circle
                      className="text-blue-600 stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 85 / 100 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
                    ></motion.circle>
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <motion.div 
                      className="text-5xl font-bold text-blue-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {85}
                    </motion.div>
                    <div className="text-gray-500 text-sm">out of 100</div>
                  </div>
                </div>
                <div className="flex justify-center space-x-2 mt-4">
                  <Badge className="bg-blue-100 text-blue-800">Activity: High</Badge>
                  <Badge className="bg-purple-100 text-purple-800">Engagement: Medium</Badge>
                  <Badge className="bg-green-100 text-green-800">Quality: Good</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            className="col-span-2 row-span-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white shadow-md h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Project Overview</CardTitle>
                <CardDescription>Key project statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">First Response Time</p>
                      <p className="text-2xl font-bold text-gray-900">2.5 hours</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <CheckCircle2 className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Issue Resolution</p>
                      <p className="text-2xl font-bold text-gray-900">3.2 days</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <GitPullRequest className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">PR Review Time</p>
                      <p className="text-2xl font-bold text-gray-900">1.8 days</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Activity className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">PR Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900">78%</p>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <Card className="bg-white shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Contributors</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">+12</div>
                <p className="text-xs text-gray-500">in the last 3 months</p>
                <div className="mt-4 h-2 bg-blue-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-2 bg-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 1, delay: 1.2 }}
                  ></motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            <Card className="bg-white shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentation Quality</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">Good</div>
                <p className="text-xs text-gray-500">
                  <Badge className="bg-blue-100 text-blue-800">
                    Comprehensive
                  </Badge>
                </p>
                <div className="mt-4 flex items-center">
                  <Star className="h-4 w-4 text-blue-600 mr-1" />
                  <Star className="h-4 w-4 text-blue-600 mr-1" />
                  <Star className="h-4 w-4 text-blue-600 mr-1" />
                  <Star className="h-4 w-4 text-blue-600 mr-1" />
                  <Star className="h-4 w-4 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <Card className="bg-white shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bug Fix Rate</CardTitle>
                <Bug className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">1.5 days</div>
                <p className="text-xs text-gray-500">average time to resolve</p>
                <div className="mt-4">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 w-20">Critical:</span>
                    <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-2 bg-blue-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '80%' }}
                        transition={{ duration: 1, delay: 1.4 }}
                      ></motion.div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">0.5d</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500 w-20">High:</span>
                    <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-2 bg-blue-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        transition={{ duration: 1, delay: 1.5 }}
                      ></motion.div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">1.2d</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500 w-20">Normal:</span>
                    <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-2 bg-blue-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '40%' }}
                        transition={{ duration: 1, delay: 1.6 }}
                      ></motion.div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">2.5d</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        
         {/* Activity Metrics */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
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
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }} />
                    <Area type="monotone" dataKey="releases" stroke="#3B82F6" fillOpacity={1} fill="url(#colorReleases)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
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
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }} />
                    <Bar dataKey="open" fill="#3B82F6" stackId="a" />
                    <Bar dataKey="closed" fill="#10B981" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
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
                      data={issueTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {issueTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center mt-4">
                  {issueTypeData.map((entry, index) => (
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