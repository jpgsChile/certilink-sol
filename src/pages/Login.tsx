import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast({ title: "Sesión iniciada", description: "Bienvenido a CertiLink" });
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      toast({ title: "Error de autenticación", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-primary-foreground blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground tracking-tight">{APP_NAME}</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
              Certificación digital para instituciones OTEC
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/70 leading-relaxed">
              Emita certificados verificables de forma segura y eficiente. Gestione sus estudiantes, cursos y credenciales desde una sola plataforma.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold text-primary-foreground">3.8K+</p>
                <p className="mt-1 text-sm text-primary-foreground/60">Certificados emitidos</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">98.7%</p>
                <p className="mt-1 text-sm text-primary-foreground/60">Tasa de verificación</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">1.2K+</p>
                <p className="mt-1 text-sm text-primary-foreground/60">Estudiantes activos</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-primary-foreground/40">
            © 2024 CertiLink. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">{APP_NAME}</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingrese sus credenciales para acceder a la plataforma
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@institución.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Ingresando...
                </span>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tiene cuenta?{" "}
            <Link to="/registro" className="font-medium text-primary hover:underline">
              Solicitar acceso
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}