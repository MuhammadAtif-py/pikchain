import Home from "./Home";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { Suspense } from 'react';
import log from './utils/logger';
import HistoryPage from './pages/History';
import AnalyticsPage from './pages/Analytics';
import ExplorerPage from './pages/Explorer';
import VerifyPage from './pages/Verify';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ProfilePage from './pages/ProfilePage';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './component/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Lazy loaded Settings to reduce initial bundle
const Settings = React.lazy(() => {
  log.debug('Loading Settings route');
  return import('./component/Settings');
});

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col items-center h-screen min-h-screen overflow-y-auto font-mono bg-gradient-to-bl from-slate-900 to-zinc-900 text-slate-100">
        <BrowserRouter>
          <Navbar />
          <ToastContainer />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/explorer" element={<ExplorerPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            
            {/* Protected Routes */}
            <Route path="/history" element={
              <ProtectedRoute><HistoryPage /></ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Suspense fallback={<div className='p-4 text-sm'>Loading settings...</div>}>
                  <Settings />
                </Suspense>
              </ProtectedRoute>
            } />
          </Routes>

          <Footer />
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
