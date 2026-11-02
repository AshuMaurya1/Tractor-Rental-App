import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import SuperAdminSidebar from './Sidebar';
import SuperAdminNavbar from './Navbar';

const SuperAdminLayout = () => {
  const { user, token, logout } = useAppContext();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const role = String(user?.role || '').toLowerCase();
    if (!token || !user || !['superadmin', 'admin'].includes(role)) {
      navigate('/');
    }
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      <div className="flex min-h-screen">
        <SuperAdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className="flex flex-1 flex-col min-w-0">
          <SuperAdminNavbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} logout={logout} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
