import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './pages/auth/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { LandingPage } from './pages/LandingPage';
import { FAQPage } from './pages/FAQPage';
import PricingPage from './pages/PricingPage';
import { ThemeProvider } from './components/theme-provider';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { BlankPage } from './pages/dashboard/BlankPage';
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
  ShieldCheck
} from 'lucide-react';

export default function App() {
  console.log("DataIQ: App Rendering...");
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
          </Route>

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout><OverviewPage /></DashboardLayout>} />
          <Route path="/dashboard/ingestion" element={<DashboardLayout><BlankPage title="Data Ingestion" icon={Import} /></DashboardLayout>} />
          <Route path="/dashboard/datasets" element={<DashboardLayout><BlankPage title="Datasets" icon={Database} /></DashboardLayout>} />
          <Route path="/dashboard/notebook" element={<DashboardLayout><BlankPage title="AI Notebook" icon={BookOpen} /></DashboardLayout>} />
          <Route path="/dashboard/auto-analysis" element={<DashboardLayout><BlankPage title="Auto Analysis" icon={Zap} /></DashboardLayout>} />
          <Route path="/dashboard/chat" element={<DashboardLayout><BlankPage title="AI Chat" icon={MessagesSquare} /></DashboardLayout>} />
          <Route path="/dashboard/pinned" element={<DashboardLayout><BlankPage title="Pinned Dashboards" icon={Files} /></DashboardLayout>} />
          <Route path="/dashboard/reports" element={<DashboardLayout><BlankPage title="Reports" icon={FileText} /></DashboardLayout>} />
          <Route path="/dashboard/file-processor" element={<DashboardLayout><BlankPage title="File Processor" icon={FileSearch} /></DashboardLayout>} />
          <Route path="/dashboard/my-files" element={<DashboardLayout><BlankPage title="My Files" icon={FolderOpen} /></DashboardLayout>} />
          <Route path="/dashboard/models" element={<DashboardLayout><BlankPage title="AI Model Hub" icon={Cpu} /></DashboardLayout>} />
          <Route path="/dashboard/security" element={<DashboardLayout><BlankPage title="Security & Audit" icon={ShieldCheck} /></DashboardLayout>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}