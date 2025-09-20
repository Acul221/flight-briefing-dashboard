// src/components/quiz/QuizSidebar.jsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Plane, BookOpen, CloudSun, Settings2, Shield,
  PackageCheck, Layers, FolderOpenDot, Lock
} from "lucide-react";

/** Sidebar khusus Quiz (ala gambar #4) */
export default function QuizSidebar({ parents = [], activeSlug }) {
  const iconFor = (slug) => {
    const m = {
      atpl: BookOpen,
      "atpl-test": BookOpen,
      weather: CloudSun,
      procedure: PackageCheck,
      systems: Settings2,
      "aircraft-systems": Settings2,
      airlaw: Shield,
      icao: Layers,
      general: FolderOpenDot,
      a320: Plane,
    };
    return m[slug] || BookOpen;
  };

  return (
    <aside className="hidden md:flex w-60 shrink-0 bg-base-200/60 border-r border-base-300">
      <div className="p-3 w-full">
        <div className="mb-3 px-2 text-xs uppercase tracking-wider text-base-content/60">
          Quiz Menu
        </div>
        <nav className="flex flex-col gap-1">
          <NavItem to="/dashboard" label="Overview" icon={LayoutDashboard} />
          {parents.map((p) => {
            const Icon = iconFor(p.slug);
            return (
              <NavItem
                key={p.id}
                to={`/quiz/${encodeURIComponent(p.slug)}`}
                label={p.label}
                icon={Icon}
                active={activeSlug === p.slug}
                pro={p.pro_only}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function NavItem({ to, label, icon: Icon, active, pro }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm 
         ${active || isActive ? "bg-primary/10 text-primary" : "hover:bg-base-300"}`
      }
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-base-100 border border-base-300">
        <Icon size={18} />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {pro ? (
        <span className="tooltip tooltip-left" data-tip="PRO only">
          <Lock size={16} className="text-warning" />
        </span>
      ) : null}
    </NavLink>
  );
}
