// src/pages/PrivacyToolsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";

export default function PrivacyToolsPage() {
  const navigate = useNavigate();
  const { session, loading: loadingSession } = useSession();
  const { profile, loading: loadingProfile } = useProfile();

  const [exporting, setExporting] = useState(false);
  const userId = session?.user?.id;

  useEffect(() => {
    if (!loadingSession && !session) {
      navigate("/login", { state: { from: "/privacy-tools" }, replace: true });
    }
  }, [loadingSession, session, navigate]);

  if (loadingSession || loadingProfile) {
    return <div className="p-6">Loading…</div>;
  }

  async function exportData() {
    if (!userId) return;
    setExporting(true);
    try {
      const [ordersRes, entitlementsRes] = await Promise.all([
        supabase.from("orders").select("order_id,status,amount,plan,created_at,payment_type").eq("user_id", userId),
        supabase.from("entitlements").select("product_code,status,expires_at,updated_at").eq("user_id", userId),
      ]);

      const exportObj = {
        exported_at: new Date().toISOString(),
        user: { id: userId, email: session?.user?.email || "" },
        profile: {
          full_name: profile?.full_name || "",
          newsletter_opt_in: !!profile?.newsletter_opt_in,
          role: profile?.role || "user",
          created_at: profile?.created_at || null,
        },
        orders: ordersRes?.data || [],
        entitlements: entitlementsRes?.data || [],
      };

      const file = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skydeckpro-data-${userId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export data.");
    } finally {
      setExporting(false);
    }
  }

  async function requestDeletion() {
    if (!userId) return;
    const ok = confirm(
      "This will permanently delete your account and data (irreversible). Continue?"
    );
    if (!ok) return;

    try {
      const res = await fetch("/.netlify/functions/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (res.ok) {
        alert("Delete request submitted. You'll be signed out.");
        await supabase.auth.signOut({ scope: "global" });
        navigate("/", { replace: true });
      } else {
        alert(
          "Delete function is not configured yet. Please contact support so we can process it securely."
        );
      }
    } catch (e) {
      console.error(e);
      alert("Delete function not reachable. Please contact support.");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/" }, { label: "Privacy Tools" }]} />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-4">
        <h1 className="text-xl font-bold">Privacy Tools</h1>
        <p className="text-sm text-gray-600">
          Export your data or request account deletion. These actions are advanced and separated from the main Settings page.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportData}
            className="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-black disabled:opacity-60"
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Download My Data (JSON)"}
          </button>

          <button
            onClick={requestDeletion}
            className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50"
          >
            Delete Account & Data
          </button>
        </div>

        <p className="text-xs text-gray-500">
          For legal and security reasons, deletion is processed server-side. If the button doesn’t work,
          please contact support.
        </p>
      </div>
    </div>
  );
}
