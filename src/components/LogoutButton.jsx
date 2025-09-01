// src/components/LogoutButton.jsx
import { supabase } from "@/lib/supabaseClient";

export default function LogoutButton() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-sm transition-colors"
    >
      Logout
    </button>
  );
}
