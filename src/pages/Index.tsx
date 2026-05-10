import { Link } from "react-router-dom";
import { ShieldCheck, Award, Users, BookOpen, ArrowRight, CheckCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

const FEATURES = [
  {
    icon: Users,
    title: "Gestión de Estudiantes",
    desc: "Administre perfiles, inscripciones y seguimiento académico de todos sus alumnos en un solo lugar.",
  },
  {
    icon: BookOpen,
    title: "Control de Cursos",
    desc: "Organice sus programas de capacitación con detalles de horas, modalidad y estado en tiempo real.",
  },
  {
    icon: Award,
    title: "Certificación Digital",
    desc: "Emita certificados verificables con código único. Seguros, inmutables y consultables públicamente.",
  },
  {
    icon: ShieldCheck,
    title: "Verificación Pública",
    desc: "Cualquier persona puede verificar la autenticidad de un certificado con solo ingresar el código.",
  },
];

const TRUST_POINTS = [
  "Registros inmutables y seguros",
  "Cumplimiento normativo SENCE",
  "Verificación pública 24/7",
  "Sin conocimientos técnicos requeridos",
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/verificar">
              <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
                Verificar Certificado
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 text-sm font-semibold">
                Acceder
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="bg-gradient-hero">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-10 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl" />
            <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-primary-foreground/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 backdrop-blur-sm border border-primary-foreground/10">
                <Building2 className="h-3.5 w-3.5 text-primary-foreground/70" />
                <span className="text-xs font-medium text-primary-foreground/70">
                  Plataforma para instituciones OTEC en Chile
                </span>
              </div>

              <h1 className="text-4xl font-bold text-primary-foreground leading-tight sm:text-5xl lg:text-6xl">
                Certificados digitales{" "}
                <span className="text-primary-foreground/60">
                  verificables y seguros
                </span>
              </h1>

              <p className="mt-6 text-lg text-primary-foreground/60 leading-relaxed max-w-lg">
                Emita, gestione y verifique certificados de capacitación de forma segura. La plataforma integral para instituciones OTEC que buscan modernizar su proceso de certificación.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/login">
                  <Button
                    size="lg"
                    className="h-12 px-6 bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold gap-2 text-sm"
                  >
                    Comenzar ahora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/verificar">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-6 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-sm"
                  >
                    Verificar certificado
                  </Button>
                </Link>
              </div>

              {/* Trust points */}
              <div className="mt-12 grid grid-cols-2 gap-3">
                {TRUST_POINTS.map((point) => (
                  <div key={point} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm text-primary-foreground/60">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              Funcionalidades
            </p>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              Todo lo que necesita su institución
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Una plataforma completa para gestionar el ciclo completo de certificación de sus programas OTEC
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feat, idx) => (
              <div
                key={feat.title}
                className="card-enterprise p-6 group"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-muted group-hover:bg-gradient-primary transition-colors duration-300 mb-4">
                  <feat.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-hero p-10 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-primary-foreground/5 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
                Modernice la certificación de su institución OTEC
              </h2>
              <p className="text-primary-foreground/60 max-w-md mx-auto mb-8">
                Únase a las instituciones que ya confían en CertiLink para emitir certificados digitales verificables.
              </p>
              <Link to="/registro">
                <Button
                  size="lg"
                  className="h-12 px-8 bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold gap-2"
                >
                  Solicitar acceso
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary">
                <ShieldCheck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">{APP_NAME}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 CertiLink. Plataforma de certificación digital para instituciones OTEC en Chile.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}