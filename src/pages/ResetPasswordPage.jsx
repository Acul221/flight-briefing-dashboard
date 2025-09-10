// src/pages/ResetPasswordPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Debug: log when component mounts
    console.log("[ResetPasswordPage] Mounted. Waiting for Supabase recovery event...");

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Supabase Auth Event]", event, session);

      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        toast.success("Please enter your new password.");
      }
    });

    return () => {
      console.log("[ResetPasswordPage] Unmounted. Cleaning up listener.");
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    console.log("[ResetPasswordPage] Submitting new password...");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error("[ResetPasswordPage] Failed to update password:", error);
      toast.error(`Failed to update password: ${error.message}`);
    } else {
      toast.success("✅ Password updated successfully!");
      console.log("[ResetPasswordPage] Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    }
  }

  if (!ready) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <p className="text-gray-600 dark:text-gray-300">Verifying reset link...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        Reset Password
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
