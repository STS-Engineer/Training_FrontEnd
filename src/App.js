import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './Component/SignIn';
import Dashboard from './Component/Dashboard';
import TrainingForm from './Component/TrainingForm';
import UpdateTrainingForm from './Component/UpdateTrainingForm';

const SESSION_MS = 48 * 60 * 60 * 1000; 

export function setSession(token, member) {
  const expiry = Date.now() + SESSION_MS;
  localStorage.setItem('avo_token',  token);
  localStorage.setItem('avo_member', JSON.stringify(member ?? {}));
  localStorage.setItem('avo_expiry', String(expiry));
}

export function getSession() {
  const expiry = Number(localStorage.getItem('avo_expiry') ?? 0);
  if (!expiry || Date.now() > expiry) {
    clearSession();
    return { token: null, member: null };
  }
  const token  = localStorage.getItem('avo_token');
  const member = JSON.parse(localStorage.getItem('avo_member') ?? '{}');
  return { token, member };
}

export function clearSession() {
  localStorage.removeItem('avo_token');
  localStorage.removeItem('avo_member');
  localStorage.removeItem('avo_expiry');
}

export function isAuthenticated() {
  const { token } = getSession();
  return !!token;
}

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
