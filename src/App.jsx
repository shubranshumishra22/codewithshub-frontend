import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingNavbar from './components/FloatingNavbar';
import RevisionTerminal from './components/RevisionTerminal';
import LoginPage from './pages/LoginPage';
import ProgressPage from './pages/ProgressPage';
import SheetPage from './pages/SheetPage';
import SignupPage from './pages/SignupPage';
import LeaderboardPage from './pages/LeaderboardPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <FloatingNavbar />
                <SheetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <FloatingNavbar />
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <FloatingNavbar />
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <RevisionTerminal />
      </BrowserRouter>
    </AuthProvider>
  );
}
