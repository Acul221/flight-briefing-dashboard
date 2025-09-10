// src/pages/LoginPage.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(`Login failed: ${error.message}`);
      return;
    }

    if (data?.session) {
      toast.success("✅ Login successful!");
      navigate(from, { replace: true });
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first.");
      return;
    }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://www.skydeckpro.id/reset-password",
      });
      if (error) throw error;
      toast.success("📧 Password reset email sent. Check your inbox.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        Login
      </h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>

      {/* Forgot password link */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={resetting}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {resetting ? "Sending reset email…" : "Forgot Password?"}
        </button>
      </div>
    </div>
  );
}
