interface ClassifiedEmail {
  email: {
    id: string;
    subject: string;
    from: string;
  };
  classification: {
    category: string;
    confidence: number;
    reasoning: string;
  };
}

interface ClassificationResultsProps {
  emails: ClassifiedEmail[];
}

import { motion } from "framer-motion";
import { Tag, BarChart } from "lucide-react";

import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

const categoryColors: Record<string, string> = {
  important: "bg-blue-100 text-blue-800",
  promotional: "bg-purple-100 text-purple-800",
  social: "bg-green-100 text-green-800",
  marketing: "bg-orange-100 text-orange-800",
  spam: "bg-red-100 text-red-800",
  general: "bg-gray-100 text-gray-800",
};

export function ClassificationResults({ emails }: ClassificationResultsProps) {
  const categoryCounts = emails.reduce((acc, { classification }) => {
    acc[classification.category] = (acc[classification.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <BarChart className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium">Classification Summary</h3>
        </div>

        <motion.div
          className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {Object.entries(categoryCounts).map(([category, count]) => (
            <motion.div
              key={category}
              className="text-center p-3 rounded-lg bg-gray-50"
              whileHover={{ scale: 1.03 }}
            >
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category] || categoryColors.general}`}>
                <Tag className="h-3 w-3 mr-1" />
                {category}
              </div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </motion.div>
          ))}
        </motion.div>
      </Card>

      {/* Detailed Results */}
      <Card className="p-0">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Email Classifications</h3>
        </div>

        <motion.div className="divide-y" initial="hidden" animate="visible" variants={{
          hidden: {},
          visible: {},
        }}>
          {emails.map(({ email, classification }) => (
            <motion.div
              key={email.id}
              className="p-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 line-clamp-1">
                  {email.subject || "No Subject"}
                </h4>
                <Badge className={`${categoryColors[classification.category] || categoryColors.general}`}>
                  {classification.category}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">From: {email.from}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Confidence: {(classification.confidence * 100).toFixed(1)}%</span>
                <span className="text-xs">{classification.reasoning}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Card>
    </div>
  );
}