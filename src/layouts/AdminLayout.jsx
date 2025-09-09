// src/layouts/AdminLayout.jsx
import { NavLink, Outlet } from "react-router-dom";

const menus = [
  { name: "Dashboard", path: "/admin" },
  { name: "Users", path: "/admin/users" },
  { name: "Orders", path: "/admin/orders" },
  { name: "Promos", path: "/admin/promos" },
  { name: "Newsletter", path: "/admin/newsletter" },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col">
        <div className="p-4 text-2xl font-bold">Admin</div>
        <nav className="flex flex-col gap-1 px-2">
          {menus.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-700"
                }`
              }
            >
              {m.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white shadow px-4 flex items-center justify-between">
          <h2 className="font-semibold">Admin Panel</h2>
          <button className="text-sm text-gray-600">Logout</button>
        </header>
        <main className="flex-1 p-6 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
