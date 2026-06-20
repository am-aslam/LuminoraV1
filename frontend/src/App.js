import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppShell } from "./components/AppShell";
import { AIOrb } from "./components/AIOrb";

import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import LearningStudio from "./pages/LearningStudio";
import Tutor from "./pages/Tutor";
import Exam from "./pages/Exam";
import Notes from "./pages/Notes";
import Planner from "./pages/Planner";
import Career from "./pages/Career";
import Admin from "./pages/Admin";

const FullScreenLoader = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#030712] gap-6">
    <AIOrb size={110} active />
    <p className="font-display text-sm uppercase tracking-[0.3em] text-gray-500">
      Luminora
    </p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return children;
};

const OnboardingRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.onboarded) return <Navigate to="/app/dashboard" replace />;
  return <Onboarding />;
};

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/app/dashboard" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: "rgba(10,15,28,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                backdropFilter: "blur(20px)",
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route
              path="/auth"
              element={
                <PublicOnly>
                  <Auth />
                </PublicOnly>
              }
            />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="studio" element={<LearningStudio />} />
              <Route path="tutor" element={<Tutor />} />
              <Route path="exam" element={<Exam />} />
              <Route path="notes" element={<Notes />} />
              <Route path="planner" element={<Planner />} />
              <Route path="career" element={<Career />} />
              <Route path="profile" element={<Onboarding edit />} />
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
