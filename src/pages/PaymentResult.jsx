import { useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function PaymentResult() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const status = params.get("status") || "unknown";
  const orderId = params.get("order_id") || "-";

  let message = "";
  let color = "text-gray-700";

  switch (status) {
    case "success":
      message = "Your payment was successful ✅";
      color = "text-green-600";
      break;
    case "pending":
      message = "Your payment is pending ⏳";
      color = "text-yellow-600";
      break;
    case "error":
      message = "There was an error with your payment ❌";
      color = "text-red-600";
      break;
    default:
      message = "Payment status unknown";
  }

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <Helmet>
        <title>Payment Result – SkyDeckPro</title>
      </Helmet>

      <h1 className="text-2xl font-bold mb-4">Payment Result</h1>
      <p className={`text-lg font-medium mb-2 ${color}`}>{message}</p>
      <p className="text-gray-500">Order ID: {orderId}</p>

      <div className="mt-6 flex justify-center gap-4">
        <Link
          to="/pricing"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow"
        >
          Back to Pricing
        </Link>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
