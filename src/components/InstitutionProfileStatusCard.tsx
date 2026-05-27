import { Link } from "react-router-dom";
import { Building2, CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useInstitutionProfile } from "@/hooks/useInstitutionProfile";

export function InstitutionProfileStatusCard() {
  const { otec } = useAuth();
  const { profile, loading, error, isLocalFallback, refetch, completion } = useInstitutionProfile();

  if (loading) {
    return (
      <div className="card-enterprise p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cargando perfil institucional…</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card-enterprise p-5 space-y-3">
        <p className="text-sm text-muted-foreground">{error || "Perfil no disponible"}</p>
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => void refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const items = [
    { label: "Logo configurado", done: completion.logoConfigured },
    { label: "Firma configurada", done: completion.signatureConfigured },
    { label: "Wallet conectada", done: completion.walletConnected || Boolean(otec?.wallet_address) },
    { label: "Branding completo", done: completion.brandingComplete },
  ];

  const completionPercent = Math.round(
    (items.filter((i) => i.done).length / items.length) * 100
  );
  const isComplete = completionPercent === 100;

  return (
    <div className="card-enterprise p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Estado de Perfil Institucional</h3>
          <p className="text-xs text-muted-foreground">
            {isLocalFallback
              ? "Modo local — aplique migraciones en Supabase"
              : isComplete
                ? "Perfil completo"
                : `${completionPercent}% completado`}
          </p>
        </div>
      </div>

      <Progress value={completionPercent} className="h-2 mb-4" />

      <ul className="space-y-2 mb-4">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs">
            {item.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
          </li>
        ))}
      </ul>

      {!isComplete ? (
        <div className="rounded-lg bg-secondary/80 p-3 mb-3">
          <div className="flex gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Complete el perfil de su institución para generar mayor confianza en sus certificados.
            </p>
          </div>
        </div>
      ) : null}

      <Button asChild size="sm" variant={isComplete ? "outline" : "default"} className="w-full text-xs">
        <Link to="/mi-institucion">
          {isComplete ? "Editar perfil institucional" : "Completar perfil institucional"}
        </Link>
      </Button>

      {!profile.logo_url ? (
        <p className="mt-2 text-[10px] text-center text-muted-foreground">
          Sin logo: se mostrarán iniciales como respaldo
        </p>
      ) : null}
    </div>
  );
}
