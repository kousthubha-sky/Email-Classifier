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

import { motion } from "framer-motion";
import { Mail, Calendar } from "lucide-react";

import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export function EmailList({ emails }: EmailListProps) {
  return (
    <Card className="p-0">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium">Recent Emails</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-sm">
          View all
        </Button>
      </div>

      <motion.div className="divide-y">
        {emails.map((email) => (
          <motion.div
            key={email.id}
            className="p-4 hover:bg-gray-50 flex flex-col"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 line-clamp-1">{email.subject || "No Subject"}</h4>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(email.date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">From: {email.from}</p>
            <p className="text-sm text-gray-500 line-clamp-2">{email.snippet}</p>
          </motion.div>
        ))}
      </motion.div>
    </Card>
  );
}