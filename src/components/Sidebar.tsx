import type { ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  ChevronLeft,
  X,
  Activity,
} from "lucide-react";
import { NAV_ITEMS, LOGO_URL } from "@/lib/constants";
import { isSupabaseDiagnosticsEnabled } from "@/lib/supabase";
import { BrandLogo } from "@/components/BrandLogo";

const ICON_MAP: Record<string, ElementType> = {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Award,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-sidebar
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-[72px]" : "w-64"}
    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
    lg:relative lg:translate-x-0
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="min-w-0 overflow-hidden">
          {collapsed ? (
            <Link
              to="/dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent/40 ring-1 ring-white/10"
              aria-label="Inicio"
            >
              <img
                src={LOGO_URL}
                alt=""
                className="max-h-full max-w-full object-contain p-0.5"
                decoding="async"
              />
            </Link>
          ) : (
            <BrandLogo
              to="/dashboard"
              size="md"
              className="min-w-0"
              wordmarkClassName="text-sidebar-primary-foreground"
              imgClassName="ring-white/10"
              showWordmark={false}
            />
          )}
        </div>

        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-md p-1.5 text-sidebar-muted hover:text-sidebar-accent-foreground lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="hidden rounded-md p-1.5 text-sidebar-muted hover:text-sidebar-accent-foreground lg:block"
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {!collapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted">
            Navegación
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={`sidebar-nav-item ${isActive ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        {isSupabaseDiagnosticsEnabled() && (
          <Link
            to="/diagnostico"
            onClick={onMobileClose}
            className={`sidebar-nav-item ${location.pathname === "/diagnostico" ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
            title={collapsed ? "Diagnóstico Supabase" : undefined}
          >
            <Activity className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Diagnóstico Supabase</span>}
          </Link>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="text-xs font-medium text-sidebar-accent-foreground">Plataforma OTEC</p>
            <p className="mt-0.5 text-[11px] text-sidebar-muted">Certificación digital segura</p>
          </div>
        )}
      </div>
    </aside>
  );
}
