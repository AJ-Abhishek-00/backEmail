import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { SearchBar } from './components/SearchBar';
import { AddAccountModal } from './components/AddAccountModal';
import { ProductContextModal } from './components/ProductContextModal';
import { api, Email } from './lib/api';
import { supabase } from './lib/supabase';
import { LogIn, Loader } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isProductContextModalOpen, setIsProductContextModalOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadEmails();
    }
  }, [user, selectedCategory, searchQuery]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        alert('Account created successfully!');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const loadEmails = async () => {
    try {
      if (searchQuery) {
        const results = await api.searchEmails(searchQuery, {
          category: selectedCategory || undefined,
        });
        setEmails(results.hits);
      } else {
        const result = await api.getEmails({
          userId: user.id,
          category: selectedCategory || undefined,
          limit: 100,
        });
        setEmails(result.emails);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSignIn={handleSignIn} onSignUp={handleSignUp} />;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenAddAccount={() => setIsAddAccountModalOpen(true)}
        onOpenSettings={() => setIsProductContextModalOpen(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 p-4">
          <SearchBar onSearch={setSearchQuery} />
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <EmailList
              emails={emails}
              selectedEmailId={selectedEmail?.id}
              onSelectEmail={setSelectedEmail}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedEmail ? (
              <EmailDetail email={selectedEmail} userId={user.id} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">No email selected</p>
                  <p className="text-sm">Select an email from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        userId={user.id}
        onAccountAdded={loadEmails}
      />

      <ProductContextModal
        isOpen={isProductContextModalOpen}
        onClose={() => setIsProductContextModalOpen(false)}
        userId={user.id}
      />
    </div>
  );
}

function AuthScreen({ onSignIn, onSignUp }: {
  onSignIn: (email: string, password: string) => void;
  onSignUp: (email: string, password: string) => void;
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      onSignUp(email, password);
    } else {
      onSignIn(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Onebox</h1>
          <p className="text-gray-600">AI-Powered Email Aggregator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-700 font-medium mb-2">Features:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Real-time IMAP sync with IDLE mode</li>
            <li>✓ AI-powered email categorization</li>
            <li>✓ Elasticsearch-powered search</li>
            <li>✓ Slack & webhook integrations</li>
            <li>✓ AI-suggested replies with RAG</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
