import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from "react-router-dom";
import { translations } from "../translations/translations";

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
axios.defaults.baseURL = API_BASE_URL;

const normalizeRole = (role) => {
    const value = String(role || '').toLowerCase();
    if (['user', 'customer'].includes(value)) return 'farmer';
    if (value === 'superadmin' || value === 'super-admin') return 'admin';
    return value || 'farmer';
};

const setAuthToken = (jwtToken) => {
    if (jwtToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
        return;
    }

    delete axios.defaults.headers.common['Authorization'];
};

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const navigate = useNavigate()
    const currency = import.meta.env.VITE_CURRENCY || '₹';

    const [token, setToken] = useState(() => localStorage.getItem('token'))
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(() => Boolean(localStorage.getItem('token')))
    const [isOwner, setIsOwner] = useState(() => localStorage.getItem('isOwner') === 'true')
    const [showLogin, setShowLogin] = useState(false)
    const [authMode, setAuthMode] = useState('login')
    const [pickupDate, setPickupDate] = useState('')
    const [returnDate, setReturnDate] = useState('')
    const [tractors, setTractors] = useState([])

    // Bilingual Language State
    const [language, setLanguage] = useState(() => localStorage.getItem('agri_language') || 'en')

    const toggleLanguage = () => {
        const nextLang = language === 'en' ? 'hi' : 'en'
        setLanguage(nextLang)
        localStorage.setItem('agri_language', nextLang)
        toast.success(nextLang === 'hi' ? 'भाषा हिंदी में बदली गई (Hindi Selected)' : 'Language switched to English')
    }

    const t = (key) => {
        return translations[language]?.[key] || translations['en']?.[key] || key
    }

    // Function to Check if user is logged in 
    const fetchUser = useCallback(async () => {
        setAuthLoading(true)
        try {
            const { data } = await axios.get('/api/user/data')
            if (data.success) {
                if (data.user?.isSuspended || data.user?.accountStatus === 'Suspended') {
                    localStorage.removeItem('token')
                    localStorage.removeItem('isOwner')
                    setToken(null)
                    setUser(null)
                    setIsOwner(false)
                    setAuthToken(null)
                    const reason = data.user?.suspensionReason ? ` Reason: ${data.user.suspensionReason}` : ''
                    toast.error(`Account Suspended: Your account has been suspended by the administrator.${reason}`, { duration: 6000 })
                    navigate('/')
                    return
                }
                const userRole = normalizeRole(data.user.role)
                setUser({ ...data.user, role: userRole })
                const isOwnerRole = userRole === 'owner'
                const isAdminRole = userRole === 'admin'
                setIsOwner(isOwnerRole)
                localStorage.setItem('isOwner', String(isOwnerRole))

                if (isAdminRole && !window.location.pathname.startsWith('/admin')) {
                    navigate('/admin/dashboard')
                }
            } else {
                navigate('/')
            }
        } catch (error) {
            const isSuspended = error.response?.status === 403 && (error.response?.data?.isSuspended || error.response?.data?.message?.toLowerCase().includes('suspend'))
            if (isSuspended) {
                localStorage.removeItem('token')
                localStorage.removeItem('isOwner')
                setToken(null)
                setUser(null)
                setIsOwner(false)
                setAuthToken(null)
                const reason = error.response?.data?.suspensionReason ? ` Reason: ${error.response.data.suspensionReason}` : ''
                toast.error(`Account Suspended: ${error.response?.data?.message || 'Access denied.'}${reason}`, { duration: 6000 })
                navigate('/')
                return
            }
            if (error.response?.status === 401) {
                localStorage.removeItem('token')
                localStorage.removeItem('isOwner')
                setToken(null)
                setUser(null)
                setIsOwner(false)
                setAuthToken(null)
                toast.error('Your session has expired. Please log in again.')
                return
            }
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setAuthLoading(false)
        }
    }, [navigate])

    // Global Axios Response Interceptor for live session invalidation on suspension
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                const status = error.response?.status
                const data = error.response?.data
                const isSuspended = status === 403 && (data?.isSuspended || data?.message?.toLowerCase().includes('suspend'))
                if (isSuspended) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('isOwner')
                    setToken(null)
                    setUser(null)
                    setIsOwner(false)
                    setAuthToken(null)
                    const reason = data?.suspensionReason ? ` Reason: ${data.suspensionReason}` : ''
                    toast.error(`Account Suspended: ${data?.message || 'Access revoked by administrator.'}${reason}`, { duration: 6000, id: 'account-suspended' })
                    navigate('/')
                } else if (status === 401 && !error.config?.url?.includes('/login')) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('isOwner')
                    setToken(null)
                    setUser(null)
                    setIsOwner(false)
                    setAuthToken(null)
                }
                return Promise.reject(error)
            }
        )
        return () => axios.interceptors.response.eject(interceptor)
    }, [navigate])

    // Function to fetch all tractors from the server
    const fetchTractors = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/user/tractors')
            data.success ? setTractors(data.tractors) : toast.error(data.message)
        } catch {
            // Silently fallback to bundled fleet data
        }
    }, [])

    // Function to Log out the User
    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('isOwner')
        setToken(null)
        setUser(null)
        setIsOwner(false)
        setAuthMode('login')
        setAuthToken(null)
        toast.success(language === 'hi' ? 'आप सफलतापूर्वक लॉग आउट हो गए हैं' : 'You have been logged out')
    }

    const openAuthModal = (mode = 'login') => {
        setAuthMode(mode)
        setShowLogin(true)
    }

    // useEffect to retrieve the token from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('token')
        setAuthToken(storedToken)
        setToken(storedToken)
        if (!storedToken) setAuthLoading(false)
        fetchTractors()
    }, [fetchTractors])

    // useEffect to fetch user data when token is Available
    useEffect(() => {
        if (token) {
            setAuthToken(token)
            fetchUser()
        } else {
            setAuthToken(null)
        }
    }, [token, fetchUser])

    const value = {
        navigate,
        currency,
        axios,
        user,
        setUser,
        token,
        setToken,
        authLoading,
        isOwner,
        setIsOwner,
        fetchUser,
        showLogin,
        setShowLogin,
        authMode,
        setAuthMode,
        openAuthModal,
        logout,
        fetchTractors,
        tractors,
        setTractors,
        pickupDate,
        setPickupDate,
        returnDate,
        setReturnDate,
        language,
        setLanguage,
        toggleLanguage,
        t
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => {
    return useContext(AppContext)
}
