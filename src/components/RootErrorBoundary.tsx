import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[CertiLink]", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background p-8 font-sans text-foreground">
          <h1 className="text-xl font-semibold">Error al cargar la aplicación</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Revise la consola del navegador (F12). Mensaje:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{this.state.error.message}</code>
          </p>
          <button
            type="button"
            className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
