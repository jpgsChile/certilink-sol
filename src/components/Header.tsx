import { useNavigate } from "react-router-dom";
import { Menu, Bell, Search, LogOut, ShieldCheck } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@solana/wallet-adapter-react";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  const initials = otec?.nombre
    ? otec.nombre.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
    : "CL";

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
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar estudiantes, cursos..."
            className="w-72 pl-9 bg-secondary border-none text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Wallet status indicator */}
        <WalletIndicator />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-foreground leading-none">
                  {otec?.nombre || "Admin"}
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
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
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