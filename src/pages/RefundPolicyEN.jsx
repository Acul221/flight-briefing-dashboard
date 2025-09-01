export default function RefundPolicyEN() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Refund Policy</h1>
      <p className="mb-4">
        SkyDeckPro provides digital content. Refunds are limited and subject to the rules below:
      </p>

      <ul className="list-disc ml-6 space-y-2 text-gray-700">
        <li>
          <b>No refunds</b> once access to paid digital content has been granted to your account.
        </li>
        <li>Refunds are only eligible if:
          <ul className="list-disc ml-6 mt-2">
            <li>There is a confirmed <b>duplicate (double) payment</b>, or</li>
            <li>A <b>technical error</b> from our system prevents activation despite successful payment.</li>
          </ul>
        </li>
        <li>
          Approved refunds are processed <b>manually within 7 business days</b>.
        </li>
        <li>
          To request a refund, contact our support with proof of payment and a brief description of the issue.
        </li>
      </ul>
    </div>
  );
}
