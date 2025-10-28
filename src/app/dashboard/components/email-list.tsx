interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

interface EmailListProps {
  emails: Email[];
}

export function EmailList({ emails }: EmailListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Recent Emails</h3>
      </div>
      <div className="divide-y">
        {emails.map((email) => (
          <div key={email.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 line-clamp-1">
                {email.subject || "No Subject"}
              </h4>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {new Date(email.date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">From: {email.from}</p>
            <p className="text-sm text-gray-500 line-clamp-2">{email.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}