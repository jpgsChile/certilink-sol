import { Link } from "react-router-dom";
import { ShieldCheck, Award, Users, BookOpen, ArrowRight, CheckCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

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
      <header className="sticky top-0 z-50 border-b border-border bg-white shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-white/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo to="/" size="md" />
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Principal">
            <Link to="/verificar">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900">
                Verificar Certificado
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="rounded-lg bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95">
                Acceder
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden pt-0">
        <div className="relative bg-gradient-hero">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-primary-foreground/[0.06] blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-primary-foreground/[0.07] blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
            <div className="max-w-2xl rounded-[1.75rem] border border-white/25 bg-white/[0.12] p-8 shadow-[0_28px_64px_-16px_rgba(0,0,0,0.55)] backdrop-blur-2xl ring-1 ring-white/15 sm:p-10 lg:p-12">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/[0.08] px-4 py-2 backdrop-blur-md">
                <Building2 className="h-4 w-4 shrink-0 text-white/95" aria-hidden />
                <span className="text-xs font-medium tracking-wide text-white/95">
                  Plataforma para instituciones OTEC en Chile
                </span>
              </div>

              <h1 className="text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.35rem]">
                Certificados digitales{" "}
                <span className="font-semibold text-slate-600">verificables y seguros</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
                Emita, gestione y verifique certificados de capacitación de forma segura. La plataforma integral para instituciones OTEC que buscan modernizar su proceso de certificación.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/login">
                  <Button
                    size="lg"
                    className="h-12 gap-2 rounded-xl bg-gradient-primary px-7 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-95"
                  >
                    Comenzar ahora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/verificar">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl border-slate-300/90 bg-white/70 px-7 font-semibold text-slate-800 shadow-sm backdrop-blur-sm hover:bg-white"
                  >
                    Verificar certificado
                  </Button>
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-4">
                {TRUST_POINTS.map((point) => (
                  <div key={point} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <span className="text-sm leading-snug text-slate-600">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Funcionalidades</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Todo lo que necesita su institución</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Una plataforma completa para gestionar el ciclo completo de certificación de sus programas OTEC
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feat, idx) => (
              <div
                key={feat.title}
                className="card-enterprise group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-muted transition-colors duration-300 group-hover:bg-gradient-primary">
                  <feat.icon className="h-5 w-5 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center shadow-xl sm:p-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
            <div className="relative">
              <h2 className="mb-4 text-2xl font-bold text-primary-foreground sm:text-3xl">
                Modernice la certificación de su institución OTEC
              </h2>
              <p className="mx-auto mb-8 max-w-md text-primary-foreground/70">
                Únase a las instituciones que ya confían en CertiLink para emitir certificados digitales verificables.
              </p>
              <Link to="/registro">
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-xl bg-white px-8 font-semibold text-slate-900 shadow-lg hover:bg-white/95"
                >
                  Solicitar acceso
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
          <BrandLogo to="/" size="sm" />
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            © {new Date().getFullYear()} CertiLink. Plataforma de certificación digital para instituciones OTEC en Chile.
          </p>
        </div>
      </footer>
    </div>
  );
}
