import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthLayout } from './pages/auth/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { VerificationPage } from './pages/auth/VerificationPage';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { FAQPage } from './pages/FAQPage';
import PricingPage from './pages/PricingPage';
import { ThemeProvider } from './components/theme-provider';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { BlankPage } from './pages/dashboard/BlankPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';
import { DataIngestionPage } from './pages/dashboard/DataIngestionPage';
import { ConnectorRequestPage } from './pages/dashboard/ConnectorRequestPage';
import { DataProcessingPage } from './pages/dashboard/DataProcessingPage';
import { DatasetsPage } from './pages/dashboard/DatasetsPage';
import { DatabaseConnectorPage } from './pages/dashboard/DatabaseConnectorPage';
import { ConnectionDetailPage } from './pages/dashboard/ConnectionDetailPage';
import { GoogleSheetsPage } from './pages/dashboard/GoogleSheetsPage';
import { GoogleSheetsConnectorPage } from './pages/dashboard/GoogleSheetsConnectorPage';
import { MetaAdsConnectorPage } from './pages/dashboard/MetaAdsConnectorPage';
import { GoogleAuthCallback } from './pages/auth/GoogleAuthCallback';
import { Toaster } from 'sonner';
import {
  LayoutGrid,
  Import,
  Database,
  BookOpen,
  Zap,
  MessagesSquare,
  Files,
  FileText,
  FileSearch,
  FolderOpen,
  Cpu,
  ShieldCheck,
  PanelRight,
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
  UserCircle
} from 'lucide-react';

export default function App() {
  console.log("DataIQ: App Rendering...");
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <Toaster position="top-center" richColors />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-email" element={<VerificationPage />} />
          </Route>

          {/* OAuth Callbacks */}
          <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout children={<Outlet />} />}>
            <Route index element={<OverviewPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="ingestion" element={<DataIngestionPage />} />
            <Route path="ingestion/processing" element={<DataProcessingPage />} />
            <Route path="ingestion/connect/:id" element={<DatabaseConnectorPage />} />
            <Route path="ingestion/connect/google-sheets" element={<GoogleSheetsConnectorPage />} />
            <Route path="ingestion/connect/metaads" element={<MetaAdsConnectorPage />} />
            <Route path="connection/:connectorId" element={<ConnectionDetailPage />} />
            <Route path="ingestion/request" element={<ConnectorRequestPage />} />
            <Route path="google-sheets" element={<GoogleSheetsPage />} />
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="notebook" element={<BlankPage title="AI Notebook" icon={BookOpen} />} />
            <Route path="auto-analysis" element={<BlankPage title="Auto Analysis" icon={Zap} />} />
            <Route path="chat" element={<BlankPage title="AI Chat" icon={MessagesSquare} />} />
            <Route path="pinned" element={<BlankPage title="Pinned Dashboards" icon={Files} />} />
            <Route path="reports" element={<BlankPage title="Reports" icon={FileText} />} />
            <Route path="file-parser" element={<BlankPage title="File Parser" icon={FileSearch} />} />
            <Route path="my-files" element={<BlankPage title="My Files" icon={FolderOpen} />} />
            <Route path="models" element={<BlankPage title="AI Model Hub" icon={Cpu} />} />
            <Route path="security" element={<BlankPage title="Security & Audit" icon={ShieldCheck} />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}