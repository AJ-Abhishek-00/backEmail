import { useState, useEffect } from 'react';
import { Mail, Tag, Clock, User } from 'lucide-react';
import { Email } from '../lib/api';

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  onSelectEmail: (email: Email) => void;
}

const categoryColors: Record<string, string> = {
  Interested: 'bg-green-100 text-green-800',
  'Meeting Booked': 'bg-blue-100 text-blue-800',
  'Not Interested': 'bg-red-100 text-red-800',
  Spam: 'bg-gray-100 text-gray-800',
  'Out of Office': 'bg-yellow-100 text-yellow-800',
};

export function EmailList({ emails, selectedEmailId, onSelectEmail }: EmailListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="divide-y divide-gray-200 overflow-y-auto">
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => onSelectEmail(email)}
          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedEmailId === email.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {(email.from_name || email.from_address)[0].toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 truncate">
                    {email.from_name || email.from_address}
                  </span>
                  {email.category && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        categoryColors[email.category] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {email.category}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 truncate">{email.from_address}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
              <Clock className="w-4 h-4" />
              <span>{formatDate(email.received_at)}</span>
            </div>
          </div>

          <div className="mb-1">
            <h3 className="font-medium text-gray-900 truncate">{email.subject}</h3>
          </div>

          <div className="text-sm text-gray-600 line-clamp-2">{email.body_text}</div>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>{email.folder}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{email.email_accounts.email}</span>
            </div>
          </div>
        </div>
      ))}

      {emails.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">No emails found</p>
          <p className="text-sm">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
}
