import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Forms from './pages/Forms'
import CreateForm from './pages/CreateForm'
import FormDetail from './pages/FormDetail'
import Responses from './pages/Responses'
import Analytics from './pages/Analytics'
import Insights from './pages/Insights'
import Users from './pages/Users'
import Templates from './pages/Templates'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import PublicForm from './pages/PublicForm'
import MySubmissions from './pages/MySubmissions'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="form/:uniqueLink" element={<PublicForm />} />
          <Route path="submissions" element={<MySubmissions />} />

          <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="forms" element={<ProtectedRoute><Forms /></ProtectedRoute>} />
          <Route path="forms/new" element={<ProtectedRoute><CreateForm /></ProtectedRoute>} />
          <Route path="forms/:id" element={<ProtectedRoute><FormDetail /></ProtectedRoute>} />
          <Route path="responses" element={<ProtectedRoute><Responses /></ProtectedRoute>} />
          <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
