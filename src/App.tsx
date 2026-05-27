import { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';

import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';

import {
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import { OperationalErrorBoundary } from '@/components/OperationalErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import AcademicIdentity from './pages/AcademicIdentity';
import Courses from './pages/Courses';
import AcademicLines from './pages/AcademicLines';
import Certificates from './pages/Certificates';
import Verify from './pages/Verify';
import NotFound from './pages/NotFound';
import TodosDemo from './pages/TodosDemo';
import Diagnostics from './pages/Diagnostics';
import Settings from './pages/Settings';
import MyAccount from './pages/MyAccount';
import InstitutionProfilePage from './pages/InstitutionProfile';
import { isSupabaseDiagnosticsEnabled } from '@/lib/supabase';

// Wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

const App = () => {
  // Solana network
  const network = WalletAdapterNetwork.Devnet;

  // RPC endpoint
  const endpoint = useMemo(
    () => clusterApiUrl(network),
    [network]
  );

  // Wallet adapters
  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AuthProvider>
            <OperationalErrorBoundary scope="certilink-app">

            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/verificar" element={<Verify />} />
              <Route path="/verificar/:codigo" element={<Verify />} />
              <Route path="/todos" element={<TodosDemo />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/estudiantes"
                element={
                  <ProtectedRoute>
                    <Students />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/identidad-academica/:alumnoId"
                element={
                  <ProtectedRoute>
                    <AcademicIdentity />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cursos"
                element={
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/lineas-academicas"
                element={
                  <ProtectedRoute>
                    <AcademicLines />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/certificados"
                element={
                  <ProtectedRoute>
                    <Certificates />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mi-institucion"
                element={
                  <ProtectedRoute>
                    <InstitutionProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mi-cuenta"
                element={
                  <ProtectedRoute>
                    <MyAccount />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {isSupabaseDiagnosticsEnabled() && (
                <Route
                  path="/diagnostico"
                  element={
                    <ProtectedRoute>
                      <Diagnostics />
                    </ProtectedRoute>
                  }
                />
              )}

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Global notifications */}
            <Toaster />

            </OperationalErrorBoundary>

          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;