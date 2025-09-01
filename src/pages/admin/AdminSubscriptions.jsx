// src/pages/admin/AdminSubscriptions.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);

  const load = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id,plan,status,current_period_end");
    setSubs(data || []);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Subscriptions</h2>
      <div className="space-y-2">
        {subs.map(s => (
          <div key={s.user_id} className="border p-2 rounded">
            <div className="font-mono text-sm">User: {s.user_id}</div>
            <div className="text-xs text-gray-600">
              Plan: {s.plan} | Status: {s.status} | End: {s.current_period_end}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
