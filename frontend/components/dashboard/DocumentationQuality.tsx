import { FileText } from "lucide-react"

import { Badge } from "../ui/badge"

import { Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

interface DocumentationQualityProps {
    documentationQuality: string;
}

const DocumentationQuality: React.FC<DocumentationQualityProps> = ({ documentationQuality }) => {
    return (
        <Card className="bg-white shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentation Quality</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{documentationQuality}</div>
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
    )
}
export default DocumentationQuality;