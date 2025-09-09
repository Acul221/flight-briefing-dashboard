import { Helmet } from "react-helmet-async";

export default function PrivacyEN() {
  return (
    <div className="max-w-3xl mx-auto p-6 prose dark:prose-invert">
      <Helmet>
        <title>Privacy Policy – SkyDeckPro</title>
        <meta
          name="description"
          content="SkyDeckPro Privacy Policy: how we collect, use, and protect your personal data."
        />
      </Helmet>

      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> Sep 9, 2025</p>
      <p>
        SkyDeckPro respects your privacy. This Policy explains what personal data we collect,
        why we collect it, how we use and protect it, and the choices you have. By using
        SkyDeckPro, you agree to this Policy.
      </p>

      <h2>Who We Are</h2>
      <p>
        SkyDeckPro is an aviation e-learning platform providing quizzes, study tools, and (future)
        OCR logbook features. For privacy inquiries, see <a href="#contact">Contact</a>.
      </p>

      <h2>Data We Collect</h2>
      <ul>
        <li>
          <strong>Account data</strong>: email, name (optional), WhatsApp number (optional),
          authentication identifiers.
        </li>
        <li>
          <strong>Transaction data</strong>: order_id, payment status, payment method token
          (processed by our payment partner; we do not store full card details).
        </li>
        <li>
          <strong>Usage & technical data</strong>: access logs, device/browser info, IP address,
          timestamps, error/diagnostic logs for security and reliability.
        </li>
        <li>
          <strong>Learning data</strong>: quiz attempts, scores, progress, preferences.
        </li>
        <li>
          <strong>Logbook (future)</strong>: images/files you upload for OCR and extracted text.
        </li>
        <li>
          <strong>Support data</strong>: messages, attachments you send to support channels.
        </li>
      </ul>

      <h2>How We Use Data (Purposes)</h2>
      <ul>
        <li><strong>Provide the service</strong>: authentication, deliver quizzes/content, maintain sessions.</li>
        <li><strong>Process payments</strong>: verify and activate subscriptions via payment partner.</li>
        <li><strong>Security & integrity</strong>: prevent abuse, detect fraud, ensure fair use, keep audit logs.</li>
        <li><strong>Customer support</strong>: respond to requests, fix issues, improve reliability.</li>
        <li><strong>Product improvement</strong>: aggregated analytics to enhance features and content quality.</li>
        <li><strong>Legal compliance</strong>: fulfill legal obligations, respond to lawful requests.</li>
      </ul>

      <h2>Legal Bases for Processing</h2>
      <ul>
        <li><strong>Contract</strong>: to create your account and deliver subscription features you request.</li>
        <li><strong>Consent</strong>: optional fields (e.g., WhatsApp), marketing communications, international transfers where required.</li>
        <li><strong>Legitimate interests</strong>: security, fraud prevention, service analytics (in a privacy-preserving manner).</li>
        <li><strong>Legal obligation</strong>: tax, accounting, responding to lawful authority requests.</li>
      </ul>

      <h2>Third-Party Processors & Integrations</h2>
      <p>
        We rely on reputable vendors who process data on our behalf under data processing terms:
      </p>
      <ul>
        <li><strong>Supabase</strong> (authentication, database, storage, logs).</li>
        <li><strong>Netlify</strong> (hosting, CDN, TLS termination, access logs).</li>
        <li><strong>Midtrans</strong> (payments; handles payment credentials).</li>
        <li><strong>AVWX</strong> (weather data; queries do not include your personal identifiers).</li>
        <li><strong>Windy</strong> (embedded maps/weather layers).</li>
        <li><strong>INA-SIAM</strong> (embedded aviation information, where applicable).</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data. We do not share personal data with advertisers.
      </p>

      <h2>International Data Transfers</h2>
      <p>
        Our vendors may process data in countries outside Indonesia. Where applicable, we use
        contractual safeguards and security controls to ensure a level of protection equivalent
        to Indonesian standards. By using the service and, where required, by providing consent,
        you acknowledge such transfers for service provision.
      </p>

      <h2>Storage, Security & Retention</h2>
      <ul>
        <li><strong>Security</strong>: encrypted connections (HTTPS/TLS), access controls (role-based), and industry-standard safeguards.</li>
        <li><strong>Encryption</strong>: data in transit is encrypted; storage encryption is enabled at our providers; sensitive fields may be additionally protected.</li>
        <li><strong>Backups</strong>: regular backups for continuity and disaster recovery.</li>
        <li><strong>Retention</strong>: account & learning data retained while your account is active. Inactive accounts may be deleted or anonymized after a reasonable period (e.g., 12–24 months) unless law requires longer. Transaction records are kept as required by tax/accounting laws.</li>
        <li><strong>OCR Files (future)</strong>: where feasible, source images are deleted after successful extraction unless you choose to retain them.</li>
      </ul>

      <h2>Cookies & Analytics</h2>
      <p>
        We use essential cookies/local storage for authentication and session continuity. We currently
        do not run third-party advertising cookies. If we introduce analytics or marketing cookies,
        we will provide clear notice and controls.
      </p>

      <h2 id="your-rights">Your Rights</h2>
      <p>
        Subject to applicable law, you may request <strong>access</strong>, <strong>correction</strong>,
        <strong> deletion</strong>, <strong>restriction</strong>, or <strong>portability</strong> of your
        personal data, and you may <strong>withdraw consent</strong> at any time (does not affect prior lawful processing).
        Deleting essential data may end your access to paid features.
      </p>
      <p>
        We aim to respond within legally required timeframes. For Indonesia’s PDP Law,
        certain requests must be handled promptly. We may need to verify your identity before acting.
      </p>

      <h2>Children</h2>
      <p>
        SkyDeckPro is intended for adult learners (pilots/trainees). We do not knowingly collect data
        from children. If you believe a child has provided data, please contact us to remove it.
      </p>

      <h2>Data Breaches & Notifications</h2>
      <p>
        We maintain incident response procedures. Where required by law, we will notify affected users
        and/or competent authorities within the prescribed timelines after becoming aware of a qualifying breach.
      </p>

      <h2>Data Minimization & Choice</h2>
      <p>
        You may choose not to provide optional data (e.g., name, WhatsApp). Core features require an email
        for authentication. You may opt out of non-essential communications anytime via provided controls.
      </p>

      <h2>Links & Embedded Content</h2>
      <p>
        Embedded third-party widgets (e.g., maps, weather) may collect usage data per their policies.
        We recommend reviewing those providers’ privacy notices.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Policy periodically. Material changes will be posted here with a new “Last updated” date.
        Continued use after changes constitutes acceptance.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        <strong>Privacy inquiries / data rights requests:</strong>{" "}
        <a href="mailto:privacy@skydeckpro.id">privacy@skydeckpro.id</a>
      </p>
      <p>
        General support:{" "}
        <a href="mailto:support@skydeckpro.id">support@skydeckpro.id</a>
      </p>
      <p>
        WhatsApp:{" "}
        <a href="https://wa.me/6281219828080" target="_blank" rel="noreferrer">
          +62 812-1982-8080
        </a>
      </p>

      <h2>Jurisdiction</h2>
      <p>
        This Policy is governed by the laws of the Republic of Indonesia. Depending on your location,
        additional rights under local laws (e.g., GDPR/CCPA) may apply.
      </p>
    </div>
  );
}
