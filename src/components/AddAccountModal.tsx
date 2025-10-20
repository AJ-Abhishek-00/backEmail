import { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { api } from '../lib/api';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onAccountAdded: () => void;
}

export function AddAccountModal({ isOpen, onClose, userId, onAccountAdded }: AddAccountModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    imapHost: '',
    imapPort: 993,
    imapUsername: '',
    imapPassword: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.addAccount({
        userId,
        ...formData,
      });

      alert('Email account added successfully! Syncing will start automatically.');
      onAccountAdded();
      onClose();
      setFormData({
        email: '',
        imapHost: '',
        imapPort: 993,
        imapUsername: '',
        imapPassword: '',
      });
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Failed to add email account. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add Email Account</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IMAP Host
            </label>
            <input
              type="text"
              value={formData.imapHost}
              onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
              placeholder="imap.gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IMAP Port
            </label>
            <input
              type="number"
              value={formData.imapPort}
              onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IMAP Username
            </label>
            <input
              type="text"
              value={formData.imapUsername}
              onChange={(e) => setFormData({ ...formData, imapUsername: e.target.value })}
              placeholder="Usually same as email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IMAP Password
            </label>
            <input
              type="password"
              value={formData.imapPassword}
              onChange={(e) => setFormData({ ...formData, imapPassword: e.target.value })}
              placeholder="Your password or app password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              For Gmail, use an App Password instead of your regular password
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
