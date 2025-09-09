import { Helmet } from "react-helmet-async";

export default function TermsEN() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Helmet>
        <title>Terms & Conditions – SkyDeckPro</title>
        <meta
          name="description"
          content="Read SkyDeckPro's Terms & Conditions regarding subscription, data protection, and service usage."
        />
      </Helmet>

      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <p className="mb-4">
        Welcome to SkyDeckPro. By accessing or using our services, you agree to
        the following Terms. Please read them carefully.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">1) Service Description</h2>
      <p className="text-gray-700">
        SkyDeckPro provides digital learning services for pilots, including
        interactive quizzes, study tools, and (in future) OCR logbook features.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">2) User Rights & Responsibilities</h2>
      <ul className="list-disc ml-6 space-y-2 text-gray-700">
        <li>Keep your account credentials confidential and secure.</li>
        <li>Use the service only for lawful, personal, and educational purposes.</li>
        <li>You are responsible for the accuracy of any data or documents you upload.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">3) Prohibited Uses</h2>
      <ul className="list-disc ml-6 space-y-2 text-gray-700">
        <li>Attempting to bypass access controls, scrape, or reverse engineer the platform.</li>
        <li>Reselling, redistributing, or publicly posting paid or protected content without permission.</li>
        <li>Uploading infringing, unlawful, or harmful materials.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">4) Payments & Subscriptions</h2>
      <ul className="list-disc ml-6 space-y-2 text-gray-700">
        <li>Subscriptions are billed in Indonesian Rupiah (IDR) on a recurring basis (monthly or yearly).</li>
        <li>Prices and benefits may change with prior notice on the website.</li>
        <li>Access is activated after payment is confirmed by our payment processor.</li>
        <li>No refunds are provided except where legally required.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">5) Data Protection & Privacy</h2>
      <p className="text-gray-700">
        We process personal data in accordance with Indonesia’s Personal Data Protection Law (UU PDP 2022) and applicable global standards (GDPR/CCPA where relevant). 
        Users have the right to access, correct, or request deletion of their data by contacting us. 
        By using the service, you consent to international data transfers required for service provision.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">6) Intellectual Property</h2>
      <p className="text-gray-700">
        All quizzes, study materials, and platform content are owned by or licensed to SkyDeckPro. 
        Unauthorized copying, distribution, or derivative use is prohibited.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">7) Termination</h2>
      <p className="text-gray-700">
        We reserve the right to suspend or terminate accounts that violate these Terms or engage in misuse of the service.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">8) Disclaimer & Limitation of Liability</h2>
      <p className="text-gray-700">
        SkyDeckPro provides study tools as supplementary resources. We are not responsible for regulatory or operational decisions made based on this content. 
        To the maximum extent permitted by law, liability for damages is limited.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">9) Governing Law</h2>
      <p className="text-gray-700">
        These Terms are governed by and construed in accordance with the laws of the Republic of Indonesia.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">10) Changes to Terms</h2>
      <p className="text-gray-700">
        We may revise these Terms periodically. Continued use after updates constitutes acceptance of the new Terms.
      </p>
    </div>
  );
}
