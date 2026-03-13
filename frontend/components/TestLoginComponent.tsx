/**
 * Test Login Component
 * 
 * Development-only UI component for quickly generating test tokens.
 * Only rendered when VITE_TEST_MODE=true
 */

'use client';

import { useState } from 'react';
import {
  getTestToken,
  storeTestToken,
  getTestLoginLinks,
  TEST_USERS,
  isTestModeEnabled,
  TestUserType,
} from '@/lib/testLoginHelper';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function TestLoginComponent() {
  const [selectedUser, setSelectedUser] = useState<TestUserType>(TEST_USERS.BASIC);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Don't render in production
  if (!isTestModeEnabled()) {
    return null;
  }

  const handleGetToken = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await getTestToken(selectedUser);

      if (response.status === 'success' && response.data) {
        const newToken = response.data.token;
        setToken(newToken);
        storeTestToken(newToken);

        console.log(
          `✅ Test token generated for ${selectedUser}:`,
          newToken
        );
      } else {
        setError(response.message || 'Failed to generate token');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyHeader = () => {
    if (token) {
      const header = `Authorization: Bearer ${token}`;
      navigator.clipboard.writeText(header);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className=\"fixed bottom-4 right-4 w-80 shadow-xl z-50 bg-amber-50 border-2 border-amber-200\">
      <div className=\"space-y-4 p-4\">
        <div>
          <h3 className=\"flex items-center gap-2 font-bold text-amber-900\">
            <span>🧪</span>
            <span>Test Login</span>
          </h3>
          <p className=\"mt-1 text-xs text-amber-700\">
            Development mode - Generate test tokens
          </p>
        </div>

        {/* User Selection */}
        <div className=\"space-y-2\">
          <label className=\"block text-sm font-medium text-amber-900\">
            Select Test User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value as TestUserType)}
            className=\"w-full rounded border border-amber-200 bg-white px-2 py-1 text-sm text-amber-900\"
          >
            {getTestLoginLinks().map((link) => (
              <option key={link.user} value={link.user}>
                {link.label}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGetToken}
          disabled={loading}
          className=\"w-full bg-amber-600 hover:bg-amber-700 text-white\"
        >
          {loading ? 'Generating...' : 'Get Test Token'}
        </Button>

        {/* Error Message */}
        {error && (
          <div className=\"rounded bg-red-50 p-2 text-xs text-red-700\">
            {error}
          </div>
        )}

        {/* Token Display */}
        {token && (
          <div className=\"space-y-2 rounded bg-white p-3\">
            <div className=\"text-xs font-semibold text-amber-900\">Token:</div>
            <div className=\"relative\">
              <code className=\"block break-all rounded bg-amber-100 p-2 text-xs text-amber-900 font-mono\">
                {token.substring(0, 20)}...
              </code>
              <button
                onClick={handleCopyToken}
                className=\"absolute right-1 top-1 rounded bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-300\"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>

            {/* Header Helper */}
            <div className=\"mt-3 space-y-1\">
              <div className=\"text-xs font-semibold text-amber-900\">
                Use in requests:
              </div>
              <code className=\"block break-all rounded bg-amber-100 p-2 text-xs text-amber-900 font-mono\">
                Authorization: Bearer {token.substring(0, 15)}...
              </code>
              <button
                onClick={handleCopyHeader}
                className=\"mt-1 w-full rounded bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-300\"
              >
                Copy Header
              </button>
            </div>

            {/* Quick Links */}
            <div className=\"mt-3 space-y-1 border-t border-amber-200 pt-2\">
              <div className=\"text-xs font-semibold text-amber-900\">
                Quick Actions
              </div>
              <a
                href={`/dashboard?token=${token}`}
                className=\"block rounded bg-blue-100 px-2 py-1 text-center text-xs text-blue-900 hover:bg-blue-200\"
              >
                → Go to Dashboard
              </a>
            </div>
          </div>
        )}

        {/* Info */}
        <div className=\"border-t border-amber-200 pt-2 text-xs text-amber-700\">
          <p>
            💡 <strong>Tip:</strong> Tokens are valid for 24 hours and stored
            in localStorage.
          </p>
        </div>
      </div>
    </Card>
  );
}
