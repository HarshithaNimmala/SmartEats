import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import FoodTracker from './pages/FoodTracker';
import MealPlanner from './pages/MealPlanner';
import NutritionLookup from './pages/NutritionLookup';
import ProgressTracker from './pages/ProgressTracker';
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';

const Layout = ({ children }) => {
  return (
    <>
      <div className="flex bg-[#f8fafc] min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 transition-all duration-300">
          {children}
        </div>
      </div>
      {/* Floating AI chat widget — available on every page */}
      <ChatWidget />
    </>
  );
};

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const email = localStorage.getItem('userEmail');
  if (!email) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/food-tracker" 
          element={
            <ProtectedRoute>
              <FoodTracker />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meal-planner" 
          element={
            <ProtectedRoute>
              <MealPlanner />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nutrition" 
          element={
            <ProtectedRoute>
              <NutritionLookup />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/progress" 
          element={
            <ProtectedRoute>
              <ProgressTracker />
            </ProtectedRoute>
          } 
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
