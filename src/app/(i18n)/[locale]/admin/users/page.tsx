"use client";

import { useEffect, useState } from 'react';

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  verified: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN as string | undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/users', { headers: { ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}) }, cache: 'no-store', credentials: 'include' });
        const data = await res.json();
        if (!cancelled && res.ok) setUsers((data.users || []).filter((u: UserRow) => u.role !== 'admin'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ADMIN_TOKEN]);

  async function deleteUser(id: string) {
    if (!confirm('Delete this user permanently?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setUsers((list) => list.filter((u) => u._id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  }

  async function patchUser(id: string, body: Partial<Pick<UserRow, 'role' | 'active'>>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setUsers((list) => {
        const updated = data.user as UserRow;
        // If user became admin, remove from list; otherwise update inline
        if (updated.role === 'admin') return list.filter((u) => u._id !== id);
        return list.map((u) => (u._id === id ? { ...u, ...updated } : u));
      });
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin • Users</h1>
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Verified</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.verified ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
                  </td>
                  <td className="px-3 py-2">{u.active ? 'Active' : 'Disabled'}</td>
                  <td className="px-3 py-2 space-x-2">
                    {u.role === 'admin' ? (
                      <button disabled={busyId === u._id} onClick={() => patchUser(u._id, { role: 'user' })} className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Demote</button>
                    ) : (
                      <button disabled={busyId === u._id} onClick={() => patchUser(u._id, { role: 'admin' })} className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Promote</button>
                    )}
                    {u.active ? (
                      <button disabled={busyId === u._id} onClick={() => patchUser(u._id, { active: false })} className="text-sm px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700">Disable</button>
                    ) : (
                      <button disabled={busyId === u._id} onClick={() => patchUser(u._id, { active: true })} className="text-sm px-3 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700">Activate</button>
                    )}
                    <button disabled={busyId === u._id} onClick={() => deleteUser(u._id)} className="text-sm px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>No users</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
 
