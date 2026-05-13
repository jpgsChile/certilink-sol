import { useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export default function Register() {
  const [form, setForm] = useState({
    institucion: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await signUp(form.email, form.password, form.institucion);
      toast({
        title: "Institución registrada",
        description: "Su cuenta OTEC está lista. Ya puede usar el panel.",
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      toast({
        title: "Error de registro",
        description: getAuthErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <BrandLogo to="/" size="md" className="mb-8" />

        <div>
          <h2 className="text-2xl font-bold text-foreground">Solicitar acceso</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete el formulario para registrar su institución OTEC
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="institucion" className="text-sm font-medium text-foreground">
              Nombre de la institución
            </Label>
            <Input
              id="institucion"
              name="institucion"
              placeholder="Centro de Capacitación ABC"
              value={form.institucion}
              onChange={handleChange}
              className="h-11"
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Correo electrónico institucional
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@institución.cl"
              value={form.email}
              onChange={handleChange}
              className="h-11"
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Contraseña
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={handleChange}
              className="h-11"
              required
              disabled={submitting}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold shadow-sm"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta...
              </span>
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tiene cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}