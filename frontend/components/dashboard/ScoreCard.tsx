import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from 'lucide-react';

interface ScoreCardProps {
  score: number;
  // activityLevel: string; // Removed
  // engagementLevel: string; // Removed
  // qualityLevel: string; // Removed
}

const ScoreCard: React.FC<ScoreCardProps> = ({ score /*, activityLevel, engagementLevel, qualityLevel */ }) => {
  const scorePercentage = score / 100;

  return (
    <Card className="overflow-hidden bg-white shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"> {/* Adjusted gradient */}
        <CardTitle className="text-3xl flex items-center justify-between">
          Project Score
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "loop", repeatDelay: 5 }} // Added looping animation
          >
            <Trophy className="w-8 h-8" />
          </motion.div>
        </CardTitle>
        <CardDescription className="text-blue-100">Overall health and activity</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative w-48 h-48 mx-auto mb-4"> {/* Added margin-bottom */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="text-gray-200 stroke-current"
              strokeWidth="10"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            {/* Progress circle */}
            <motion.circle
              className="text-blue-600 stroke-current"
              strokeWidth="10"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: scorePercentage }}
              transition={{ duration: 1.5, ease: "easeInOut" }} // Adjusted duration
              style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
            ></motion.circle>
          </svg>
          {/* Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <motion.div
              className="text-5xl font-bold text-blue-600"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 100 }} // Added spring animation
            >
              {score}
            </motion.div>
            <div className="text-gray-500 text-sm mt-1">out of 100</div> {/* Added margin-top */}
          </div>
        </div>
        {/* Badges - Removing these as their data is no longer available */}
        {/* <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800">Activity: {activityLevel}</Badge>
          <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-800">Engagement: {engagementLevel}</Badge>
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-800">Quality: {qualityLevel}</Badge>
        </div> */}
      </CardContent>
    </Card>
  );
};

export default ScoreCard; 