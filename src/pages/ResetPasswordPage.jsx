// src/pages/ResetPasswordPage.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  // 1) Exchange token from email → create session
  useEffect(() => {
    const token = searchParams.get("access_token");
    if (!token) {
      toast.error("Reset token not found. Please try again.");
      return;
    }

    supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
      if (error) {
        console.error(error);
        toast.error("Reset link is invalid or has expired.");
      } else {
        setReady(true);
        toast.success("Token verified, please set a new password.");
      }
    });
  }, [searchParams]);

  // 2) Submit new password
  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(`Failed to update password: ${error.message}`);
    } else {
      toast.success("✅ Password successfully updated!");
      setTimeout(() => navigate("/login"), 2000);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        Reset Password
      </h1>

      {!ready ? (
        <p className="text-center text-gray-600 dark:text-gray-300">
          Verifying reset link…
        </p>
      ) : (
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
      )}
    </div>
  );
}
