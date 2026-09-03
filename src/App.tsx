import { type ReactNode } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';

import { Button } from './components/ui';
import { useAuth } from './contexts/AuthContext';
import { HotelDetailPage } from './pages/HotelDetailPage';
import { HotelListPage } from './pages/HotelListPage';
import { LoginPage } from './pages/LoginPage';
import { NewHotelPage } from './pages/NewHotelPage';
import { DeployGuidePage } from './pages/DeployGuidePage';

function Guard({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-white">
              HQ
            </span>
            OtelApps
          </Link>
          <Button type="button" variant="ghost" className="h-9 px-3 text-muted" onClick={logout}>
            Odhlásit
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Guard>
            <HotelListPage />
          </Guard>
        }
      />
      <Route
        path="/hotels/new"
        element={
          <Guard>
            <NewHotelPage />
          </Guard>
        }
      />
      <Route
        path="/hotels/:slug/nasazeni"
        element={
          <Guard>
            <DeployGuidePage />
          </Guard>
        }
      />
      <Route
        path="/hotels/:slug"
        element={
          <Guard>
            <HotelDetailPage />
          </Guard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
