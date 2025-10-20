import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface ProductContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ProductContextModal({ isOpen, onClose, userId }: ProductContextModalProps) {
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    outreachAgenda: '',
    meetingLink: '',
    additionalContext: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadExistingContext();
    }
  }, [isOpen, userId]);

  const loadExistingContext = async () => {
    try {
      const response = await api.getProductContext(userId);
      if (response.contexts && response.contexts.length > 0) {
        const context = response.contexts[0];
        setFormData({
          productName: context.product_name || '',
          description: context.description || '',
          outreachAgenda: context.outreach_agenda || '',
          meetingLink: context.meeting_link || '',
          additionalContext: context.additional_context || '',
        });
      }
    } catch (error) {
      console.error('Error loading product context:', error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.saveProductContext({
        userId,
        ...formData,
      });

      alert('Product context saved successfully! AI will now use this for suggested replies.');
      onClose();
    } catch (error) {
      console.error('Error saving product context:', error);
      alert('Failed to save product context. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Product Context Setup</h2>
              <p className="text-sm text-gray-600">For AI-powered suggested replies</p>
            </div>
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
              Product/Service Name *
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g., Acme CRM Software"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what your product/service does..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outreach Agenda *
            </label>
            <textarea
              value={formData.outreachAgenda}
              onChange={(e) => setFormData({ ...formData, outreachAgenda: e.target.value })}
              placeholder="e.g., I am applying for a job position. If the lead is interested, share the meeting booking link."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Booking Link
            </label>
            <input
              type="url"
              value={formData.meetingLink}
              onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              placeholder="https://cal.com/your-link"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              This link will be included in AI-generated replies when appropriate
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context
            </label>
            <textarea
              value={formData.additionalContext}
              onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              placeholder="Any other information the AI should know when crafting replies..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              {loading ? 'Saving...' : 'Save Context'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
