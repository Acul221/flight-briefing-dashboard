// src/pages/Privacy.jsx
export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-6 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>SkyDeckPro respects your privacy. This policy explains what data we collect, why we collect it, and how we protect it.</p>

      <h2>Data We Collect</h2>
      <ul>
        <li>Account data: email, name (if provided), WhatsApp number (optional).</li>
        <li>Transaction data: payment method, payment status, order_id (via Midtrans).</li>
        <li>Usage data: access logs for security and service improvement.</li>
      </ul>

      <h2>How We Use Data</h2>
      <ul>
        <li>Authentication and delivery of digital content (quizzes).</li>
        <li>Processing subscription payments.</li>
        <li>Customer support and security.</li>
      </ul>

      <h2>Third Parties</h2>
      <p>We use Midtrans as our payment processor. Transaction data is processed under their policies. We do not sell your personal data.</p>

      <h2>Storage & Security</h2>
      <p>We store data securely with restricted access and use encrypted connections (HTTPS).</p>

      <h2>Your Rights</h2>
      <p>You may request access, correction, or deletion of certain data. Deleting essential data may end paid service access.</p>

      <h2>Contact</h2>
      <p>Email: <a href="mailto:skydeckpro@gmail.com">skydeckpro@gmail.com</a></p>
      <p>WhatsApp: <a href="https://wa.me/6281219828080" target="_blank" rel="noreferrer">+62 812-1982-8080</a></p>

      <h2>Updates</h2>
      <p>We may update this policy from time to time. Changes will be posted here.</p>
    </div>
  );
}
