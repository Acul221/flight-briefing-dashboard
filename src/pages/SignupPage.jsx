import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { sendWelcomeEmail } from "@/lib/email";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Insert ke profiles (fallback kalau Supabase belum otomatis sync)
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: "user",
        newsletter_opt_in: true,
        welcome_email_sent: false,
      });

      // Kirim welcome email
      try {
        await sendWelcomeEmail(email, fullName || "Pilot");
        await supabase
          .from("profiles")
          .update({
            welcome_email_sent: true,
            welcome_email_sent_at: new Date().toISOString(),
          })
          .eq("id", data.user.id);
      } catch (e) {
        console.warn("Welcome email failed:", e.message);
      }

      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sign Up</h1>

      {errorMsg && (
        <div className="p-2 text-sm text-red-600 bg-red-100 rounded">{errorMsg}</div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          className="w-full rounded border px-3 py-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-green-600 text-white py-2 hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Signing up…" : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
