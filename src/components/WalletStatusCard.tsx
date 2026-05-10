// CertiLink - Institutional Wallet Status Card
// Displays wallet connection status with enterprise terminology
// No crypto jargon - presented as "Autorización Institucional"

import { ShieldCheck, Wallet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { useOtecWallet } from "@/hooks/useOtecWallet";
import { useToast } from "@/hooks/use-toast";

export function WalletStatusCard() {
  const { isRegistered, savedAddress, isConnected, connectedAddress, isVerified, loading, registerWallet } = useOtecWallet();
  const { connected } = useWallet();
  const { toast } = useToast();

  const handleRegister = async () => {
    try {
      await registerWallet();
      toast({
        title: "Autorización registrada",
        description: "Su billetera institucional ha sido vinculada exitosamente",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const truncateAddress = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  if (loading) {
    return (
      <div className="card-enterprise p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Verificando estado...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card-enterprise p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Autorización Institucional</h3>
          <p className="text-xs text-muted-foreground">
            Requerida para emitir certificados digitales
          </p>
        </div>
      </div>

      {/* Status indicator */}
      {isVerified ? (
        <div className="flex items-center gap-2 rounded-lg bg-accent-muted p-3 mb-3">
          <CheckCircle className="h-4 w-4 text-accent shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-accent">Autorización activa</p>
            <p className="text-[11px] text-accent/70 font-mono truncate">
              {truncateAddress(connectedAddress!)}
            </p>
          </div>
        </div>
      ) : isConnected && !isRegistered ? (
        <div className="space-y-3 mb-3">
          <div className="flex items-center gap-2 rounded-lg bg-warning-muted p-3">
            <AlertCircle className="h-4 w-4 text-warning shrink-0" />
            <div>
              <p className="text-xs font-medium text-warning">Billetera conectada</p>
              <p className="text-[11px] text-warning/70">
                Registre su billetera para habilitar la emisión
              </p>
            </div>
          </div>
          <Button
            onClick={handleRegister}
            size="sm"
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 text-xs"
          >
            Registrar como billetera institucional
          </Button>
        </div>
      ) : isConnected && isRegistered && !isVerified ? (
        <div className="flex items-center gap-2 rounded-lg bg-warning-muted p-3 mb-3">
          <AlertCircle className="h-4 w-4 text-warning shrink-0" />
          <div>
            <p className="text-xs font-medium text-warning">Billetera diferente</p>
            <p className="text-[11px] text-warning/70">
              Conecte la billetera registrada: {truncateAddress(savedAddress!)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-3 mb-3">
          <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Conecte su billetera para habilitar la emisión de certificados
          </p>
        </div>
      )}

      {/* Connect button - styled to match enterprise theme */}
      {!connected && (
        <div className="certilink-wallet-btn">
          <WalletMultiButton />
        </div>
      )}
    </div>
  );
}