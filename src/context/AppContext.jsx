import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

/**
 * AppProvider — global state for role selection and active notifications.
 */
export function AppProvider({ children }) {
  const [role, setRole]           = useState(null); // 'fan' | 'staff' | 'security' | null
  const [notifications, setNotifications] = useState([]);

  function addNotification(msg, level = 'info') {
    const id = Date.now();
    setNotifications((prev) => [{ id, msg, level }, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }

  function clearRole() { setRole(null); }

  return (
    <AppContext.Provider value={{ role, setRole, clearRole, notifications, addNotification }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
