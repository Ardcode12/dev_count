import React, { useState, useEffect } from 'react';
import { CountdownProvider } from './context/CountdownContext';
import CountdownPage from './components/CountdownPage';
import AdminPanel from './components/AdminPanel';

export const VALID_PANELS = ['cc1', 'cc2', 'cc6', 'cc8'];

export function parseRoute() {
  if (typeof window === 'undefined') {
    return { isAdmin: false, isMasterAdmin: false, panelId: 'main' };
  }

  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/+$/, '');
  const searchParams = new URLSearchParams(window.location.search);
  const queryPanel = searchParams.get('panel')?.toLowerCase();

  // Check Admin Routes (e.g. /admin, /admin/cc1, #/admin/cc2, /admin?panel=cc6)
  if (path === '/admin' || path.startsWith('/admin/') || hash === 'admin' || hash.startsWith('admin/')) {
    let panel = queryPanel;
    if (!panel) {
      if (path.startsWith('/admin/')) {
        panel = path.replace('/admin/', '').split('/')[0];
      } else if (hash.startsWith('admin/')) {
        panel = hash.replace('admin/', '').split('/')[0];
      }
    }

    if (panel && VALID_PANELS.includes(panel)) {
      return { isAdmin: true, isMasterAdmin: false, panelId: panel };
    }
    return { isAdmin: true, isMasterAdmin: true, panelId: 'all' };
  }

  // Check Panel Display Routes (e.g. /cc1, /cc2, #/cc6, /?panel=cc8)
  let displayPanel = queryPanel;
  if (!displayPanel) {
    const directPathPanel = path.replace(/^\//, '').split('/')[0];
    const directHashPanel = hash.split('/')[0];
    if (VALID_PANELS.includes(directPathPanel)) {
      displayPanel = directPathPanel;
    } else if (VALID_PANELS.includes(directHashPanel)) {
      displayPanel = directHashPanel;
    }
  }

  if (displayPanel && VALID_PANELS.includes(displayPanel)) {
    return { isAdmin: false, isMasterAdmin: false, panelId: displayPanel };
  }

  return { isAdmin: false, isMasterAdmin: false, panelId: 'main' };
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(parseRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return (
    <CountdownProvider>
      {route.isAdmin ? (
        <AdminPanel
          key={`admin-${route.panelId}-${route.isMasterAdmin}`}
          panelId={route.panelId}
          isMasterAdmin={route.isMasterAdmin}
        />
      ) : (
        <CountdownPage
          key={`display-${route.panelId}`}
          panelId={route.panelId}
        />
      )}
    </CountdownProvider>
  );
}
