import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="mb-6 flex justify-center">
          <BrandLogo to="/" size="lg" />
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-3">404</h1>
        <p className="text-lg font-medium text-foreground mb-2">Página no encontrada</p>
        <p className="text-sm text-muted-foreground mb-8">
          La página que busca no existe o ha sido movida.
        </p>
        <Link to="/">
          <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}