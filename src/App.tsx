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
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Certificates from './pages/Certificates';
import Verify from './pages/Verify';
import NotFound from './pages/NotFound';
import TodosDemo from './pages/TodosDemo';
import Diagnostics from './pages/Diagnostics';
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
                path="/cursos"
                element={
                  <ProtectedRoute>
                    <Courses />
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

          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;