import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { operationalLog } from "@/lib/operational";

type Props = {
  children: ReactNode;
  scope?: string;
};

type State = {
  error: Error | null;
};

export class OperationalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    operationalLog.log({
      type: "operational_alert",
      severity: "error",
      message: "Se produjo un error inesperado en la interfaz. Puede recargar la página para continuar.",
      technicalDetail: `${error.message}\n${info.componentStack ?? ""}`.slice(0, 1200),
      meta: { scope: this.props.scope ?? "app" },
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Error operacional</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Ocurrió un problema al renderizar esta sección. El resto de la plataforma puede seguir disponible tras
            recargar.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={this.handleRetry}>
              Reintentar vista
            </Button>
            <Button type="button" className="gap-2" onClick={this.handleReload}>
              <RefreshCw className="h-4 w-4" />
              Recargar aplicación
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
