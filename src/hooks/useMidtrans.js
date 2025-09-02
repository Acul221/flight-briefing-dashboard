import { useEffect } from "react";

export default function useMidtrans(clientKey) {
  useEffect(() => {
    if (!clientKey) {
      console.error("❌ Missing Midtrans Client Key");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [clientKey]);
}
