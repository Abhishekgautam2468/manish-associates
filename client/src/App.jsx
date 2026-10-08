import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import RequireAuth from './components/RequireAuth.jsx'

// The dashboard loads only after sign-in, one page at a time, so the public pages stay small.
const AppShell = lazy(() => import('./dashboard/AppShell.jsx'))
const Overview = lazy(() => import('./pages/dashboard/Overview.jsx'))
const Entries = lazy(() => import('./pages/dashboard/Entries.jsx'))
const Balances = lazy(() => import('./pages/dashboard/Balances.jsx'))
const People = lazy(() => import('./pages/dashboard/People.jsx'))
const Person = lazy(() => import('./pages/dashboard/Person.jsx'))
const Reminders = lazy(() => import('./pages/dashboard/Reminders.jsx'))
const Reports = lazy(() => import('./pages/dashboard/Reports.jsx'))
const Labels = lazy(() => import('./pages/dashboard/Labels.jsx'))
const Settings = lazy(() => import('./pages/dashboard/Settings.jsx'))
const StatementDoc = lazy(() => import('./pages/dashboard/StatementDoc.jsx'))
const DayBook = lazy(() => import('./pages/dashboard/DayBook.jsx'))
const RegisterDoc = lazy(() => import('./pages/dashboard/RegisterDoc.jsx'))

function App() {
  return (
    <Suspense fallback={<p className="page-status">Loading…</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<RequireAuth>{(user) => <AppShell user={user} />}</RequireAuth>}>
          <Route index element={<Overview />} />
          <Route path="entries" element={<Entries />} />
          <Route path="daybook" element={<DayBook />} />
          <Route path="balances" element={<Balances />} />
          <Route path="pending" element={<Navigate to="/dashboard/balances" replace />} />
          <Route path="people" element={<People />} />
          <Route path="people/:id" element={<Person />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="reports" element={<Reports />} />
          <Route path="labels" element={<Labels />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="/register" element={<RequireAuth>{() => <RegisterDoc />}</RequireAuth>} />
        <Route path="/statement/:id" element={<RequireAuth>{() => <StatementDoc />}</RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
