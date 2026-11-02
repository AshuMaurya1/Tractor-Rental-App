import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import NavbarOwner from '../../Components/owner/NavbarOwner'
import SideBar from '../../Components/owner/SideBar'
import { useAppContext } from '../../context/AppContext'

const Layout = () => {
  const { isOwner, user, navigate } = useAppContext()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const effectiveIsOwner = Boolean(isOwner || user?.role === 'owner')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token && !effectiveIsOwner) {
      navigate('/')
    } else if (user && user.role !== 'owner' && !effectiveIsOwner) {
      navigate('/')
    }
  }, [effectiveIsOwner, user, navigate])

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#faf9f6] text-slate-800 antialiased">
      <NavbarOwner
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />
      <div className="flex min-h-0 flex-1">
        <SideBar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#faf9f6] px-4 py-4 sm:px-6 sm:py-6 lg:px-12 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
