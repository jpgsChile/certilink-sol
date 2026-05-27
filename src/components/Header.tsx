import { useNavigate } from "react-router-dom";
import { Menu, Bell, Search, LogOut, ShieldCheck, Building2, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { useAuth } from "@/hooks/useAuth";
import { useInstitutionProfile } from "@/hooks/useInstitutionProfile";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { resolveInstitutionBranding } from "@/lib/institution-branding";

interface HeaderProps {
  onMenuClick: () => void;
}

function WalletIndicator() {
  const { connected } = useWallet();
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      connected
        ? "bg-accent-muted text-accent"
        : "bg-secondary text-muted-foreground"
    }`}>
      <ShieldCheck className="h-3 w-3" />
      <span className="hidden sm:inline">
        {connected ? "Autorizada" : "Sin autorización"}
      </span>
    </div>
  );
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, otec, signOut } = useAuth();
  const { profile } = useInstitutionProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const branding = resolveInstitutionBranding(otec, profile);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Sesión cerrada", description: "Ha cerrado sesión exitosamente" });
      navigate("/login");
    } catch {
      toast({ title: "Error", description: "Error al cerrar sesión", variant: "destructive" });
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar estudiantes, cursos..."
            className="w-72 pl-9 bg-secondary border-none text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <WalletIndicator />

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors">
              <InstitutionLogo
                name={branding.institutionName}
                logoUrl={branding.logoUrl}
                size="sm"
                rounded="lg"
              />
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-foreground leading-none">
                  {branding.institutionName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user?.email || ""}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onClick={() => navigate("/mi-institucion")}>
              <Building2 className="h-3.5 w-3.5" />
              Mi Institución
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => navigate("/mi-cuenta")}>
              <User className="h-3.5 w-3.5" />
              Mi Cuenta
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => navigate("/configuracion")}>
              <Settings className="h-3.5 w-3.5" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive gap-2" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
