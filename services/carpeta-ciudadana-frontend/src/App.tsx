/**
 * App Component
 * Root component with routing configuration
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/authentication/context/AuthContext';
import { ProtectedRoute } from './contexts/authentication/components';
import { Layout } from './shared/components/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { FolderPage } from './pages/FolderPage';
import { PortabilityPage } from './pages/PortabilityPage';
import { RequestsPage } from './pages/RequestsPage';
import { UploadDocumentForm } from './contexts/documents/components';

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

const autheticatedOptions = [
  { path: "dashboard", Component: DashboardPage},
  { path: "documents", Component: DocumentsPage},
  { path: "documents/upload", Component: UploadDocumentForm},
  { path: "folder", Component: FolderPage},
  { path: "requests", Component: RequestsPage},
  { path: "portability", Component: PortabilityPage},
];


function printProtectedOptions() {
  return autheticatedOptions.map(({path, Component}) => 
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />

              {/* Protected routes */}
              {printProtectedOptions()}

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
