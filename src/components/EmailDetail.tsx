import { useState } from 'react';
import { Mail, User, Clock, Tag, Sparkles } from 'lucide-react';
import { Email, api } from '../lib/api';

interface EmailDetailProps {
  email: Email;
  userId: string;
}

const categoryColors: Record<string, string> = {
  Interested: 'bg-green-100 text-green-800',
  'Meeting Booked': 'bg-blue-100 text-blue-800',
  'Not Interested': 'bg-red-100 text-red-800',
  Spam: 'bg-gray-100 text-gray-800',
  'Out of Office': 'bg-yellow-100 text-yellow-800',
};

export function EmailDetail({ email, userId }: EmailDetailProps) {
  const [suggestedReply, setSuggestedReply] = useState<string | null>(null);
  const [loadingReply, setLoadingReply] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleGetSuggestedReply = async () => {
    setLoadingReply(true);
    try {
      const response = await api.getSuggestedReply(email.id, userId);
      setSuggestedReply(response.suggestedReply);
    } catch (error) {
      console.error('Error getting suggested reply:', error);
      alert('Failed to generate suggested reply. Please ensure product context is set up.');
    } finally {
      setLoadingReply(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{email.subject}</h2>
            {email.category && (
              <span
                className={`inline-block text-sm px-3 py-1 rounded-full ${
                  categoryColors[email.category] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {email.category}
                {email.category_confidence && (
                  <span className="ml-1 opacity-70">
                    ({Math.round(email.category_confidence * 100)}%)
                  </span>
                )}
              </span>
            )}
          </div>
          <button
            onClick={handleGetSuggestedReply}
            disabled={loadingReply}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {loadingReply ? 'Generating...' : 'Suggested Reply'}
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {(email.from_name || email.from_address)[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">
                {email.from_name || email.from_address}
              </div>
              <div className="text-sm text-gray-600">{email.from_address}</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatDate(email.received_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{email.folder}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{email.email_accounts.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {suggestedReply && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">AI-Suggested Reply</span>
            </div>
            <div className="text-gray-800 whitespace-pre-wrap">{suggestedReply}</div>
            <button
              onClick={() => navigator.clipboard.writeText(suggestedReply)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Copy to Clipboard
            </button>
          </div>
        )}

        <div className="prose max-w-none">
          {email.body_html ? (
            <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
          ) : (
            <div className="whitespace-pre-wrap text-gray-800">{email.body_text}</div>
          )}
        </div>
      </div>
    </div>
  );
}
