import React from 'react';
import { useApp } from './context/AppContext.jsx';
import Navbar from './components/Navbar.jsx';
import LandingView   from './views/LandingView.jsx';
import FanView       from './views/FanView.jsx';
import StaffView     from './views/StaffView.jsx';
import SecurityView  from './views/SecurityView.jsx';

const VIEWS = {
  fan:      <FanView />,
  staff:    <StaffView />,
  security: <SecurityView />,
};

export default function App() {
  const { role } = useApp();

  return (
    <>
      <Navbar />
      <div
        key={role || 'landing'}
        style={{ animation: 'fadeUp 0.4s ease-out both' }}
      >
        {VIEWS[role] ?? <LandingView />}
      </div>
    </>
  );
}
