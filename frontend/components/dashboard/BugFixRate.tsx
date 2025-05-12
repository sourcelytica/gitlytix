import { motion } from "framer-motion"
import { Bug } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

interface BugFixRateProps {
    bugFixRate: number;
}

const BugFixRate: React.FC<BugFixRateProps> = ({ bugFixRate }) => {
    return (
        <Card className="bg-white shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bug Fix Rate</CardTitle>
                <Bug className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{bugFixRate}</div>
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
    )
}
export default BugFixRate;