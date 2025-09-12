import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RedeemVoucherPage() {
  const [voucherCode, setVoucherCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Pastikan user login
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("❌ You must be logged in to redeem a voucher.");
        setLoading(false);
        return;
      }

      // Call Netlify Function
      const res = await fetch("/.netlify/functions/redeem-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          voucher_code: voucherCode.trim()
        })
      });

      let result;
      try {
        result = await res.json();
      } catch (parseError) {
        throw new Error("Invalid response from server");
      }

      if (result.success) {
        setMessage("✅ " + result.message);
      } else {
        setMessage("❌ " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("[RedeemVoucherPage] Error:", err);
      setMessage("❌ Unexpected error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Redeem Voucher</h1>

      <input
        type="text"
        placeholder="Enter voucher code"
        value={voucherCode}
        onChange={(e) => setVoucherCode(e.target.value)}
        className="border border-gray-300 dark:border-gray-700 p-2 w-full mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={handleRedeem}
        disabled={loading || !voucherCode.trim()}
        className={`w-full px-4 py-2 rounded-md text-white font-medium ${
          loading || !voucherCode.trim()
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Processing..." : "Redeem"}
      </button>

      {message && (
        <p
          className={`mt-4 text-center font-medium ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
