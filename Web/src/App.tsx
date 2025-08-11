import { useState, useEffect } from 'react'
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import { Dashboard } from './components'
import { authenticateUser, registerUser, checkAuthStatus, clearAuthTokens, getDebugTokenInfo } from './services/authService'
import { centrifugoService, connectToCentrifugo, disconnectFromCentrifugo } from './services/centrifugoService'
import { type User, type ConnectionStatus, type DeliveryUpdate, type ChatMessage, type NotificationMessage } from './types'
if (typeof window !== 'undefined') {
  (window as any).getTokenDebugInfo = getDebugTokenInfo;
}
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [centrifugoStatus, setCentrifugoStatus] = useState<ConnectionStatus>('disconnected')
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([])
  useEffect(() => {
    const authStatus = checkAuthStatus()
    if (authStatus.isAuthenticated && authStatus.user) {
      setIsLoggedIn(true)
      setUser(authStatus.user)
      const delay = 500;
      setTimeout(() => {
        connectToCentrifugo().catch(() => {
        })
      }, delay);
    }
    setLoading(false);
  }, [])
  useEffect(() => {
    const unsubscribeStatus = centrifugoService.onConnectionStatus(setCentrifugoStatus)
    const unsubscribeDelivery = centrifugoService.onDeliveryUpdate((data: DeliveryUpdate) => {
      setRealtimeMessages(prev => [...prev, { type: 'delivery', data, timestamp: new Date() }])
    })
    const unsubscribeChat = centrifugoService.onChatMessage((data: ChatMessage) => {
      setRealtimeMessages(prev => [...prev, { type: 'chat', data, timestamp: new Date() }])
    })
    const unsubscribeNotification = centrifugoService.onNotification((data: NotificationMessage) => {
      setRealtimeMessages(prev => [...prev, { type: 'notification', data, timestamp: new Date() }])
    })
    return () => {
      unsubscribeStatus()
      unsubscribeDelivery()
      unsubscribeChat()
      unsubscribeNotification()
    }
  }, [])
  const handleLogin = async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authenticateUser(username, password)
      if (!result.centrifugoToken) {
        clearAuthTokens()
        throw new Error('Login failed: Real-time messaging service is not available. Please contact system administrator.')
      }
      setIsLoggedIn(true)
      setUser(result.user)
      try {
        await connectToCentrifugo()
        console.log('✅ Successfully connected to real-time messaging service')
      } catch (centrifugoError) {
        clearAuthTokens()
        setIsLoggedIn(false)
        setUser(null)
        throw new Error('Login failed: Unable to connect to real-time messaging service. Please try again or contact support.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }
  const handleRegister = async (userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => {
    setLoading(true)
    setError(null)
    try {
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        full_name: `${userData.firstName} ${userData.lastName}`,
        role: userData.role || 'customer'
      };
      const result = await registerUser(registrationData);
      setIsLoggedIn(true);
      setUser(result.user);
      try {
        await connectToCentrifugo();
      } catch (centrifugoError) {
        console.warn('Centrifugo connection failed:', centrifugoError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }
  const handleLogout = async () => {
    try {
      await disconnectFromCentrifugo()
    } catch (error) {
    }
    clearAuthTokens()
    setIsLoggedIn(false)
    setUser(null)
    setError(null)
    setCentrifugoStatus('disconnected')
    setRealtimeMessages([])
  }
  if (isLoggedIn && user) {
    return (
      <Dashboard 
        user={user}
        onLogout={handleLogout}
        centrifugoStatus={centrifugoStatus}
        realtimeMessages={realtimeMessages}
      />
    )
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex flex-col justify-center items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 text-lg font-medium">Checking authentication...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10">
        {isRegisterMode ? (
          <RegisterPage
            onRegister={handleRegister}
            loading={loading}
            error={error}
            onSwitchToLogin={() => {
              setIsRegisterMode(false)
              setError(null)
            }}
          />
        ) : (
          <LoginPage
            onLogin={handleLogin}
            loading={loading}
            error={error}
            onSwitchToRegister={() => {
              setIsRegisterMode(true)
              setError(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
export default App
