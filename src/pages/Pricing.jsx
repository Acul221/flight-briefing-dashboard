import { Helmet } from "react-helmet-async";

export default function Pricing() {
  const buy = async (plan) => {
    const r = await fetch("/.netlify/functions/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
    const { token } = await r.json();
    window.snap.pay(token, {
      onSuccess: (res) => alert("Success!\n" + JSON.stringify(res)),
      onPending: (res) => alert("Pending!\n" + JSON.stringify(res)),
      onError:   (res) => alert("Error!\n" + JSON.stringify(res)),
      onClose:   () => alert("Popup closed"),
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* ✅ SEO Meta */}
      <Helmet>
        <title>Pricing – SkyDeckPro</title>
        <meta
          name="description"
          content="Choose your SkyDeckPro plan. Free, Pro (Rp 60k/month), or Bundle (Rp 90k/month). All prices in IDR."
        />

        {/* Open Graph */}
        <meta property="og:title" content="Pricing – SkyDeckPro" />
        <meta
          property="og:description"
          content="Choose your SkyDeckPro plan. Free, Pro (Rp 60k/month), or Bundle (Rp 90k/month)."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://skydeckpro.netlify.app/pricing" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pricing – SkyDeckPro" />
        <meta
          name="twitter:description"
          content="Choose your SkyDeckPro plan. Free, Pro (Rp 60k/month), or Bundle (Rp 90k/month)."
        />
        <meta name="twitter:image" content="/og-image.png" />
      </Helmet>

      {/* ✅ Content */}
      <h1 className="text-2xl font-bold mb-4">Plans</h1>
      <p className="mb-6 text-gray-600">
        All prices are shown in Indonesian Rupiah (IDR).
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Free */}
        <div className="border rounded-xl p-4 shadow">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="text-2xl font-bold mt-2">Rp 0</p>
          <p className="text-gray-600 mt-1">Limited quiz access</p>
          <button className="w-full mt-4 bg-gray-300 text-gray-800 py-2 rounded-lg cursor-not-allowed">
            Active
          </button>
        </div>

        {/* Pro */}
        <div className="border rounded-xl p-4 shadow">
          <h2 className="text-xl font-semibold">Pro</h2>
          <p className="text-2xl font-bold mt-2">Rp 60.000 / month</p>
          <p className="text-gray-600 mt-1">Full access to all question banks</p>
          <button
            onClick={() => buy("pro")}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
          >
            Subscribe
          </button>
        </div>

        {/* Bundle */}
        <div className="border rounded-xl p-4 shadow">
          <h2 className="text-xl font-semibold">Bundle</h2>
          <p className="text-2xl font-bold mt-2">Rp 90.000 / month</p>
          <p className="text-gray-600 mt-1">Quiz + upcoming features</p>
          <button
            onClick={() => buy("bundle")}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
          >
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
