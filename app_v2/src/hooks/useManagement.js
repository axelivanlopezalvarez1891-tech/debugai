import { useState, useEffect, useCallback } from 'react';

export const useManagement = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true); // Assume true, let 403 flip it
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/stats');
      if (resp.status === 403 || resp.status === 401) {
        setIsAuthorized(false);
        return;
      }
      
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const contentType = resp.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }

      const data = await resp.json();
      if (data.ok) {
        setUsers(data.users || []);
        setStats({
          totalUsers: data.totalUsers,
          proUsers: data.proUsers,
          revenueUsd: data.revenueUsd
        });
        setIsAuthorized(true);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const performAction = async (endpoint, body) => {
    try {
      const resp = await fetch(`/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      if (data.ok) {
        fetchUsers(); // Refresh data after action
        return { success: true, msg: data.msg };
      }
      return { success: false, msg: data.msg };
    } catch (err) {
      return { success: false, msg: 'Error al contactar con el núcleo maestro.' };
    }
  };

  const giftPlus = (targetUser, duration) => performAction('upgrade-user', { targetUser, duration });
  const giftTokens = (targetUser, amount) => performAction('gift-tokens', { targetUser, amount });
  const deleteUser = (targetUser) => performAction('delete-user', { targetUser });

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    users: filteredUsers,
    stats,
    loading,
    isAuthorized,
    searchQuery,
    setSearchQuery,
    setIsAuthorized,
    giftPlus,
    giftTokens,
    deleteUser,
    refreshUsers: fetchUsers
  };
};
