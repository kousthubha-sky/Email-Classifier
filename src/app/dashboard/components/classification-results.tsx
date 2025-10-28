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

const categoryColors = {
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
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-4">Classification Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <div key={category} className="text-center p-3 rounded-lg bg-gray-50">
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category as keyof typeof categoryColors] || categoryColors.general}`}>
                {category}
              </div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Email Classifications</h3>
        </div>
        <div className="divide-y">
          {emails.map(({ email, classification }) => (
            <div key={email.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 line-clamp-1">
                  {email.subject || "No Subject"}
                </h4>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${categoryColors[classification.category as keyof typeof categoryColors] || categoryColors.general}`}>
                  {classification.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">From: {email.from}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Confidence: {(classification.confidence * 100).toFixed(1)}%</span>
                <span className="text-xs">{classification.reasoning}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}