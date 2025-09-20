import { useEffect, useState } from "react";

export default function CategoriesDebug() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/.netlify/functions/categories?tree=1");
        if (!res.ok) throw new Error(await res.text());

        const { items } = await res.json();
        setTree(items || []);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-2">Categories (Live)</h2>
      <pre className="text-xs bg-gray-100 p-3 rounded">
        {JSON.stringify(tree, null, 2)}
      </pre>
    </div>
  );
}

/*
  Catatan:
  - Pastikan fungsi Netlify sudah terdeploy dan dapat diakses di path:
      /.netlify/functions/categories
  - Pastikan environment variable VITE_SUPABASE_ANON_KEY sudah di-set di Netlify.
  - Jika ingin coba fitur createCategory, perlu juga environment variable ACCESS_TOKEN
    yang berisi Supabase Access Token dari user dengan is_admin = true.
    (Token bisa di-generate manual via Supabase Dashboard > Authentication > Users > [pilih user] > Generate new token).
*/
// Bisa juga pakai token dari .env (hanya untuk development lokal):