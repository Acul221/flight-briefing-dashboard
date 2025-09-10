// src/pages/ResetPasswordPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | success | error
  const [error, setError] = useState(null);

  // 1) Read token from hash (#access_token=...)
  useEffect(() => {
    const hash = window.location.hash.substring(1); // remove leading "#"
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    const type = params.get("type");

    if (token && type === "recovery") {
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
        if (error) {
          setError(error.message);
          setStatus("error");
        } else {
          setStatus("ready");
        }
      });
    } else {
      setStatus("error");
      setError("Reset token not found. Please request a new reset link.");
    }
  }, []);

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
      setStatus("error");
    } else {
      setStatus("success");
      toast.success("✅ Password has been updated!");
      setTimeout(() => navigate("/login"), 2000);
    }
  }

  if (status === "loading") {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <p className="text-gray-600 dark:text-gray-300">Verifying reset link...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-red-100 text-red-700 rounded-xl shadow">
        <h1 className="text-lg font-bold mb-2">Reset Failed</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-green-100 text-green-700 rounded-xl shadow">
        <p>Password successfully updated. Redirecting to login...</p>
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
