import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/hooks/useSession";

export default function PricingPage() {
  const session = useSession();
  const [promo, setPromo] = useState("");
  const [msg, setMsg] = useState("");

  if (!session) {
    return <p className="p-6">Please login to see pricing.</p>;
  }

  const handleSubscribe = async (plan) => {
    try {
      setMsg("Processing...");

      // cek promo kode
      let expiresAt = new Date();
      if (promo === "TRIAL-14") {
        expiresAt.setDate(expiresAt.getDate() + 14); // free trial 14 hari
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1); // default 1 bulan
      }

      // insert/update subscription
      const { error: subError } = await supabase.from("subscriptions").upsert({
        user_id: session.user.id,
        plan,
        status: "active",
        current_period_end: expiresAt.toISOString(),
        gateway: promo === "TRIAL-14" ? "trial" : "manual",
      });
      if (subError) throw subError;

      // insert/update entitlement
      const features =
        plan === "pro"
          ? ["quiz_pro", "logbook_ocr"]
          : plan === "bundle"
          ? ["quiz_pro", "logbook_ocr", "school_dashboard"]
          : [];

      for (const f of features) {
        const { error: entError } = await supabase.from("entitlements").upsert({
          user_id: session.user.id,
          feature: f,
          expires_at: expiresAt.toISOString(),
        });
        if (entError) throw entError;
      }

      setMsg(`✅ Subscribed to ${plan} plan!`);
    } catch (err) {
      console.error(err);
      setMsg(`❌ ${err.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>

      {/* Promo input */}
      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Enter promo code (optional)"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
        />
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        <PlanCard
          title="Free"
          price="Rp 0"
          features={["Basic Quiz Access"]}
          onSubscribe={() => handleSubscribe("free")}
        />
        <PlanCard
          title="Pro"
          price="Rp 150.000 / month"
          features={["All Quizzes", "OCR Logbook"]}
          onSubscribe={() => handleSubscribe("pro")}
        />
        <PlanCard
          title="Bundle"
          price="Rp 300.000 / month"
          features={["All Pro Features", "School Dashboard"]}
          onSubscribe={() => handleSubscribe("bundle")}
        />
      </div>

      {msg && <p className="text-center mt-6">{msg}</p>}
    </div>
  );
}

function PlanCard({ title, price, features, onSubscribe }) {
  return (
    <div className="border rounded-xl p-6 shadow bg-white dark:bg-gray-800 flex flex-col">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{price}</p>
      <ul className="flex-1 mb-4 space-y-1 text-sm">
        {features.map((f) => (
          <li key={f}>✅ {f}</li>
        ))}
      </ul>
      <button
        onClick={onSubscribe}
        className="mt-auto bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Subscribe
      </button>
    </div>
  );
}
