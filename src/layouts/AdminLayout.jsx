// src/layouts/AdminLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block px-3 py-2 rounded hover:bg-gray-100 ${
          isActive ? "bg-gray-200 font-medium" : "text-gray-700"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="border-r bg-white">
        <div className="p-4 border-b">
          <div className="text-lg font-bold">Admin</div>
          <div className="text-xs text-gray-500">SkyDeckPro</div>
        </div>

        <nav className="p-3 space-y-1">
          <NavItem to="/admin">Dashboard</NavItem>

          {/* ✅ Tambahkan menu Questions -> diarahkan ke /admin/questions (akan auto-redirect ke /list) */}
          <NavItem to="/admin/questions">Questions</NavItem>

          <div className="mt-3 text-xs uppercase tracking-wider text-gray-500 px-3">Data</div>
          <NavItem to="/admin/users">Users</NavItem>
          <NavItem to="/admin/orders">Orders</NavItem>

          <div className="mt-3 text-xs uppercase tracking-wider text-gray-500 px-3">Marketing</div>
          <NavItem to="/admin/promos">Promos</NavItem>
          <NavItem to="/admin/newsletter">Newsletter</NavItem>

          <div className="mt-3 text-xs uppercase tracking-wider text-gray-500 px-3">Content</div>
          <NavItem to="/admin/categories">Categories</NavItem>
        </nav>
      </aside>

      {/* Content */}
      <main className="bg-gray-50">
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
