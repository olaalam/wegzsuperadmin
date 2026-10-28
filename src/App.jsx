import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "sonner";
import LoginPage from "./components/layout/LoginPage";
import AppLayout from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/dashboard-page";
import { NotFoundPage } from "./pages/not-found-page";
import AdminsPage from "./pages/Admins/Admins";
import AdminAddPage from "./pages/Admins/AdminsAdd";
import SalesPage from "./pages/Sales/Sales";
import SalesAddPage from "./pages/Sales/SalesAdd";
import PaymentPage from "./pages/Payment/Payment";
import PaymentsAddPage from "./pages/Payment/Paymentadd";
import ReportPage from "./pages/Repots/Reportspage";
import ReportForm from "./pages/Repots/Reportformpage";
import ReportDetails from "./pages/Repots/Reportdetails";
import FinancialReportsPage from "./pages/FinancialReports/FinancialReportsDashboard";
import SectionsPage from "./pages/Sections/Sections";
import SectionsAddPage from "./pages/Sections/SectionsAdd";
import ClientsPage from "./pages/Clients/Clients";
import ClientsAddPage from "./pages/Clients/ClientsAdd";

// ─── Route guards ─────────────────────────────────────────────────────────────

function PrivateRoute({ children }) {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  return isAuthenticated
    ? <AppLayout>{children}</AppLayout>
    : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function NotFoundRoute() {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  return isAuthenticated
    ? <AppLayout><NotFoundPage /></AppLayout>
    : <NotFoundPage />;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{ style: { fontFamily: "var(--font-sans, sans-serif)" } }}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />

        <Route
          path="/dashboard"
          element={<PrivateRoute><DashboardPage /></PrivateRoute>}
        />
        <Route path="/admins" element={<PrivateRoute><AdminsPage /></PrivateRoute>} />
        <Route path="/admins/add" element={<PrivateRoute><AdminAddPage /></PrivateRoute>} />
        <Route path="/admins/edit/:id" element={<PrivateRoute><AdminAddPage /></PrivateRoute>} />
        <Route path="/admin/website/dashboard" element={<Navigate to="/dashboard" replace />} />

        <Route path="/sales" element={<PrivateRoute><SalesPage /></PrivateRoute>} />
        <Route path="/sales/add" element={<PrivateRoute><SalesAddPage /></PrivateRoute>} />
        <Route path="/sales/edit/:id" element={<PrivateRoute><SalesAddPage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/payments" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
        <Route path="/payments/add" element={<PrivateRoute><PaymentsAddPage /></PrivateRoute>} />
        <Route path="/payments/edit/:id" element={<PrivateRoute><PaymentsAddPage /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><ReportPage /></PrivateRoute>} />
        <Route path="/operations/edit/:id" element={<PrivateRoute><ReportForm /></PrivateRoute>} />
        <Route path="/reports/details/:id" element={<PrivateRoute><ReportDetails /></PrivateRoute>} />
        <Route path="/financial-reports" element={<PrivateRoute><FinancialReportsPage /></PrivateRoute>} />
        <Route path="/sections" element={<PrivateRoute><SectionsPage /></PrivateRoute>} />
        <Route path="/sections/add" element={<PrivateRoute><SectionsAddPage /></PrivateRoute>} />
        <Route path="/sections/edit/:id" element={<PrivateRoute><SectionsAddPage /></PrivateRoute>} />
        <Route path="/clients" element={<PrivateRoute><ClientsPage /></PrivateRoute>} />
        <Route path="/clients/add" element={<PrivateRoute><ClientsAddPage /></PrivateRoute>} />
        <Route path="/clients/edit/:id" element={<PrivateRoute><ClientsAddPage /></PrivateRoute>} />



        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
