import { Mail, Inbox, Star, Tag, Settings, Plus } from 'lucide-react';

interface SidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  onOpenAddAccount: () => void;
  onOpenSettings: () => void;
}

const categories = [
  { id: null, name: 'All Emails', icon: Inbox, color: 'text-gray-600' },
  { id: 'Interested', name: 'Interested', icon: Star, color: 'text-green-600' },
  { id: 'Meeting Booked', name: 'Meeting Booked', icon: Mail, color: 'text-blue-600' },
  { id: 'Not Interested', name: 'Not Interested', icon: Mail, color: 'text-red-600' },
  { id: 'Spam', name: 'Spam', icon: Mail, color: 'text-gray-600' },
  { id: 'Out of Office', name: 'Out of Office', icon: Mail, color: 'text-yellow-600' },
];

export function Sidebar({
  selectedCategory,
  onSelectCategory,
  onOpenAddAccount,
  onOpenSettings,
}: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email Onebox</h1>
            <p className="text-xs text-gray-600">AI-Powered</p>
          </div>
        </div>

        <button
          onClick={onOpenAddAccount}
          className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Add Account</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id || 'all'}
                onClick={() => onSelectCategory(category.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : category.color}`} />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
        >
          <Settings className="w-5 h-5 text-gray-600" />
          <span>Product Context</span>
        </button>
      </div>
    </div>
  );
}
