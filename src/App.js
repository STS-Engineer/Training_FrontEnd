import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './session';
import SignIn from './Component/SignIn';
import Dashboard from './Component/Dashboard';
import CalendarPage from './Component/CalendarPage';
import TrainingForm from './Component/TrainingForm';
import UpdateTrainingForm from './Component/UpdateTrainingForm';

export { setSession, getSession, clearSession, isAuthenticated } from './session';

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/training"
          element={
            <ProtectedRoute>
              <TrainingForm />
            </ProtectedRoute>
          }
        />
        {/* Public — accessed via email link, no login required */}
        <Route path="/training/edit/:id" element={<UpdateTrainingForm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
