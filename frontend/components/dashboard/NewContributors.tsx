import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users } from "lucide-react";

interface NewContributorsProps {
    newContributors: number;
}

const NewContributors: React.FC<NewContributorsProps> = ({ newContributors }) => {
    return (
        <Card className="bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Contributors</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{newContributors}</div>
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
    )
}

export default NewContributors;