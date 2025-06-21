import React from 'react';

const PrivacyScreen = () => (
  <section className="max-w-4xl mx-auto px-6 py-12 bg-white rounded-2xl shadow-xl text-gray-800">
    <header className="mb-10 border-b pb-6">
      <h1 className="text-4xl font-extrabold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">
        Effective Date: June 20, 2025 <br />
        Last Updated: June 20, 2025
      </p>
    </header>

    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
        <p>We collect only the data necessary to provide personalized nutrition services:</p>
        <ul className="list-disc list-inside ml-4 mt-2 text-gray-700">
          <li>Age, weight, height, and fitness goal (e.g., lose, gain, or maintain)</li>
          <li>Basic technical data such as IP address, browser type, and usage logs</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">2. How Your Information Is Used</h2>
        <p>Your data is used to:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>Generate customized meal and grocery plans</li>
          <li>Manage your user account and preferences</li>
          <li>Improve app functionality and user experience</li>
          <li>Comply with applicable legal obligations</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">3. Legal Consent</h2>
        <p>Your personal information is collected with your knowledge and explicit consent, and used only for the purposes outlined in this policy.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">4. Storage and Retention</h2>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>Information is securely stored in encrypted databases</li>
          <li>Personal data is retained only as long as needed for its purpose</li>
          <li>User data is deleted after 12 months of inactivity or upon user request</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">5. Disclosure</h2>
        <p>We do not sell or share your data. Information may be disclosed only to:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>Authorized service providers under confidentiality agreements</li>
          <li>Law enforcement if legally compelled</li>
          <li>Prevent fraud or protect system security</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">6. Data Security</h2>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>All data is encrypted in transit (HTTPS) and stored securely</li>
          <li>Passwords are hashed using modern cryptographic methods</li>
          <li>JWT tokens are used for secure session management</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">7. Your Rights</h2>
        <p>You may:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>Request access to or correction of your data</li>
          <li>Withdraw consent at any time</li>
          <li>Request deletion of your profile and all stored data</li>
        </ul>
        <p className="mt-2">To submit a request, contact <a className="text-blue-600 underline" href="mailto:nutricart@gmail.com">nutricart@gmail.com</a>.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">8. Children's Privacy</h2>
        <p>This service is not intended for users under the age of 13. We do not knowingly collect data from children.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">9. Third-Party Tools</h2>
        <p>We may use publicly available datasets or third-party tools to enhance features. Their data usage policies may differ.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy to reflect changes in practices or legal requirements. Users will be notified of material changes through the app.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
        <p>If you have questions or concerns about this policy, email <a className="text-blue-600 underline" href="mailto:nutricart@gmail.com">nutricart@gmail.com</a>.</p>
      </section>
    </div>
  </section>
);

export default PrivacyScreen;
