import { Link } from "react-router-dom";
import { Users, BookOpen, Award, TrendingUp, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { WalletStatusCard } from "@/components/WalletStatusCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { certificadosService } from "@/lib/services/certificados.service";

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando panel...</span>
        </div>
      </DashboardLayout>
    );
  }

  const verificationRate =
    stats.totalCertificates > 0
      ? ((stats.emitidosCount / stats.totalCertificates) * 100).toFixed(1)
      : "0";

  return (
    <DashboardLayout>
      <PageHeader
        title="Panel de Control"
        description="Resumen general de su institución OTEC"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="animate-fade-in">
          <StatCard
            label="Total Estudiantes"
            value={stats.totalStudents.toLocaleString("es-CL")}
            icon={Users}
          />
        </div>
        <div className="animate-fade-in-delay">
          <StatCard
            label="Cursos Registrados"
            value={stats.totalCourses}
            icon={BookOpen}
            iconColor="bg-accent-muted"
          />
        </div>
        <div className="animate-fade-in-delay-2">
          <StatCard
            label="Con registro en cadena"
            value={stats.emitidosCount.toLocaleString("es-CL")}
            icon={Award}
            iconColor="bg-warning-muted"
          />
        </div>
        <div className="animate-fade-in-delay-3">
          <StatCard
            label="% certificados on-chain"
            value={`${verificationRate}%`}
            icon={TrendingUp}
            iconColor="bg-primary-muted"
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent Certificates */}
        <div className="lg:col-span-3 card-enterprise p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Certificados Recientes</h3>
            <Link to="/certificados" className="text-xs font-medium text-primary cursor-pointer hover:underline">
              Ver todos
            </Link>
          </div>

          {stats.recentCertificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Award className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Aún no hay certificados emitidos
              </p>
              <Link
                to="/certificados"
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                Emitir primer certificado
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3.5 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-muted">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {cert.alumnos
                          ? `${cert.alumnos.nombre} ${cert.alumnos.apellido}`
                          : "Estudiante"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cert.cursos?.nombre || "Curso"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={cert.tx_hash ? "badge-success" : "badge-warning"}
                    >
                      {cert.tx_hash ? "En cadena" : "Solo registro"}
                    </span>
                    <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                      {certificadosService.hashToCode(cert.hash_sha256)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Wallet Status + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Status */}
          <WalletStatusCard />

          {/* Quick Actions */}
          <div className="card-enterprise p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Acciones Rápidas</h3>
            <div className="space-y-2.5">
              <Link
                to="/estudiantes"
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/20 transition-colors"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Agregar estudiante</p>
                  <p className="text-[11px] text-muted-foreground">Inscribir nuevo alumno</p>
                </div>
              </Link>
              <Link
                to="/cursos"
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/20 transition-colors"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Registrar curso</p>
                  <p className="text-[11px] text-muted-foreground">Nuevo programa</p>
                </div>
              </Link>
              <Link
                to="/certificados"
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/20 transition-colors"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Emitir certificado</p>
                  <p className="text-[11px] text-muted-foreground">Credencial verificable</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}