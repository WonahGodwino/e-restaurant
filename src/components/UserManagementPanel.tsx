"use client";

import { useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'COOK';
  isActive: boolean;
  createdAt: string;
}

export default function UserManagementPanel({ adminKey }: { adminKey: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'MANAGER' | 'COOK'>('COOK');

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importingCSV, setImportingCSV] = useState(false);

  // Load users function (memoized)
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'x-admin-key': adminKey },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load users');
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to load users: ' + String(err));
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  // Load users on mount and when adminKey changes
  useEffect(() => {
    if (!adminKey) return;
    void loadUsers();
  }, [adminKey, loadUsers]);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();

    if (!newUserEmail || !newUserName) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add user');
        return;
      }

      setSuccess(`Added ${newUserName} as ${newUserRole}`);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('COOK');
      setShowAddForm(false);
      setTimeout(() => setSuccess(null), 3000);
      await loadUsers();
    } catch (err) {
      setError('Failed to add user: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  async function importCSV(e: React.FormEvent) {
    e.preventDefault();

    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setImportingCSV(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch('/api/admin/users/import-csv', {
        method: 'POST',
        headers: {
          'x-admin-key': adminKey,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to import CSV');
        return;
      }

      setSuccess(
        `Imported: ${data.created} created, ${data.skipped} skipped. ${
          data.errors.length > 0 ? data.errors.join('; ') : ''
        }`
      );
      setCsvFile(null);
      setTimeout(() => setSuccess(null), 5000);
      await loadUsers();
    } catch (err) {
      setError('Failed to import CSV: ' + String(err));
    } finally {
      setImportingCSV(false);
    }
  }

  async function toggleUserActive(userId: string, currentActive: boolean) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          isActive: !currentActive,
        }),
      });

      if (!response.ok) {
        setError('Failed to update user');
        return;
      }

      setSuccess(`User ${currentActive ? 'deactivated' : 'activated'}`);
      setTimeout(() => setSuccess(null), 3000);
      await loadUsers();
    } catch (err) {
      setError('Failed to update user: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!adminKey) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Please enter your admin key above to manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add User Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {showAddForm ? 'Cancel' : '+ Add User'}
          </button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}

        {showAddForm && (
          <form onSubmit={addUser} className="mb-6 space-y-3 border-t border-slate-200 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="email"
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Full Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'MANAGER' | 'COOK')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="COOK">Cook</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </form>
        )}

        {/* CSV Import */}
        <form onSubmit={importCSV} className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Import from CSV</h3>
          <p className="text-xs text-slate-600">
            CSV format: email,name,role (role must be ADMIN, MANAGER, or COOK)
          </p>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={importingCSV || !csvFile}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {importingCSV ? 'Importing...' : 'Import'}
            </button>
          </div>
        </form>

        {/* Users List */}
        {loading && !showAddForm ? (
          <p className="text-sm text-slate-600">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-600">No users added yet</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  user.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div>
                  <p className={`font-semibold ${user.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-600">{user.email}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'MANAGER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => toggleUserActive(user.id, user.isActive)}
                  disabled={loading}
                  className={`rounded-lg px-3 py-1 text-sm font-semibold text-white disabled:opacity-50 ${
                    user.isActive ? 'bg-red-600' : 'bg-green-600'
                  }`}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
