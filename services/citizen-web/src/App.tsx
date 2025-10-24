/**
 * App Component
 * Root component with routing configuration
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from '@/contexts/authentication/context/AuthContext';
import { ProtectedRoute } from '@/contexts/authentication/components';
import { Layout } from '@/shared/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { FolderPage } from '@/pages/FolderPage';
import { PortabilityPage } from '@/pages/PortabilityPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { UploadDocumentForm } from '@/contexts/documents/components';
import { isFeatureEnabled, type FeatureFlag } from '@/shared/config/featureFlags';
import { NotificationProvider } from '@/contexts/notifications/context';
import { NotificationsPage } from '@/pages/NotificationsPage';

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

interface AuthenticatedRoute {
  path: string;
  Component: React.ComponentType;
  feature?: FeatureFlag;
}

const autheticatedOptions: AuthenticatedRoute[] = [
  { path: "dashboard", Component: DashboardPage },
  { path: "documents", Component: DocumentsPage, feature: 'DOCUMENTS' },
  { path: "documents/upload", Component: UploadDocumentForm, feature: 'UPLOAD_DOCUMENTS' },
  { path: "folder", Component: FolderPage },
  { path: "requests", Component: RequestsPage, feature: 'DOCUMENT_REQUESTS' },
  { path: "portability", Component: PortabilityPage, feature: 'PORTABILITY' },
  { path: "notifications", Component: NotificationsPage, feature: 'NOTIFICATIONS' },
];


function printProtectedOptions() {
  return autheticatedOptions
    .filter(({ feature }) => !feature || isFeatureEnabled(feature))
    .map(({ path, Component }) =>
      <Route
        key={`option_${path}`}
        path={path}
        element={
          <ProtectedRoute>
            <Component />
          </ProtectedRoute>
        }
      />
    );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              {isFeatureEnabled('REGISTRATION') && (
                <Route path="register" element={<RegisterPage />} />
              )}

              {/* Protected routes */}
              {printProtectedOptions()}

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
