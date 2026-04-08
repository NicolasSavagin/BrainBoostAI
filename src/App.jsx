import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from './store';
import authService from './services/authService';
import { useStreakCheck } from './hooks/useStreakCheck';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Tutor from './pages/Tutor';
import Practice from './pages/Practice';
import Lesson from './pages/Lesson';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';

// Components
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { user, setUser, setUserProfile, loading, setLoading } = useAuthStore();
  const { theme } = useThemeStore();
useStreakCheck();
  // 🌙 Tema
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 🔐 Auth + Profile
  useEffect(() => {
    const unsubscribe = authService.onAuthChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          const profile = await authService.getUserProfile(firebaseUser.uid);

          const defaultProfile = {
            displayName: firebaseUser.displayName || 'Usuário',
            level: 1,
            xp: 0,
            totalXP: 0,
            completedExercises: 0,
            accuracy: 0,
            streak: 0,
            createdAt: new Date().toISOString(),
          };

          setUserProfile(profile || defaultProfile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Erro no auth:', error);
      } finally {
        setLoading(false); // 🔥 garante que nunca trava
      }
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading]);

  // ⏳ Loading global
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>

        {/* 🔓 Auth */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" /> : <Register />}
          />
        </Route>

        {/* 🔒 Protegidas */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/tutor" element={<Tutor />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/lesson/:subtopicId/:lessonNumber" element={<Lesson />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>

        {/* 🔁 Redirect inteligente */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;