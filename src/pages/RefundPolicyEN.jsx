import { Helmet } from "react-helmet-async";

export default function RefundPolicyEN() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Helmet>
        <title>Refund Policy – SkyDeckPro</title>
        <meta
          name="description"
          content="SkyDeckPro's refund policy for digital products and subscriptions."
        />
      </Helmet>

      <h1 className="text-2xl font-bold mb-4">Refund Policy</h1>
      <p className="mb-4">
        SkyDeckPro provides digital educational services. As such, all purchases
        are considered final. Refunds are limited and subject to the terms below:
      </p>

      <ul className="list-disc ml-6 space-y-2 text-gray-700">
        <li>
          <b>No refunds</b> are provided once access to paid digital content has
          been granted to your account, except as required by applicable law.
        </li>
        <li>
          Refunds are only eligible in the following cases:
          <ul className="list-disc ml-6 mt-2">
            <li>
              There is a confirmed <b>duplicate (double) payment</b> for the same subscription, or
            </li>
            <li>
              A <b>technical error</b> from our system prevents activation of your subscription despite successful payment.
            </li>
          </ul>
        </li>
        <li>
          Approved refunds will be processed <b>within 7 business days</b>, using
          the same payment method and in Indonesian Rupiah (IDR).
        </li>
        <li>
          Refunds cannot be transferred to another account or converted into credits.
        </li>
        <li>
          To request a refund, please contact our support team at{" "}
          <a href="mailto:support@skydeckpro.id" className="text-blue-600 underline">
            support@skydeckpro.id
          </a>{" "}
          with proof of payment and a brief description of the issue.
        </li>
        <li>
          SkyDeckPro reserves the right to amend this Refund Policy. Continued
          use after updates constitutes acceptance of the revised terms.
        </li>
      </ul>
    </div>
  );
}
