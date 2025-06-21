import React from 'react';

const TermsScreen = () => (
  <section className="max-w-4xl mx-auto px-6 py-12 bg-white rounded-2xl shadow-xl text-gray-800">
    <header className="mb-10 border-b pb-6">
      <h1 className="text-4xl font-extrabold text-gray-900">Terms and Conditions</h1>
      <p className="mt-2 text-sm text-gray-500">Effective Date: June 20, 2025</p>
    </header>

    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-semibold mb-2">1. Service Description</h2>
        <p>NutriCart provides AI-generated weekly meal plans and grocery lists based on user-provided information. The service is for educational and informational purposes only and is not medical advice.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">2. Account Use</h2>
        <p>When creating an account, you agree to:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>Provide accurate and complete information</li>
          <li>Keep your login credentials secure</li>
          <li>Be responsible for all activity under your account</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">3. Intellectual Property</h2>
        <p>All application content, including code, UI, and data models, belongs to NutriCart. Unauthorized copying, modification, or redistribution is prohibited.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>Misuse or interfere with the service</li>
          <li>Attempt to reverse-engineer the app</li>
          <li>Upload malicious or harmful content</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">5. Limitation of Liability</h2>
        <p>NutriCart is provided “as is.” We do not guarantee results and are not liable for:</p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>Misuse of meal plans</li>
          <li>Service interruptions</li>
          <li>Loss of user data</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">6. Termination</h2>
        <p>Your access may be suspended or terminated if you violate these terms.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">7. Governing Law</h2>
        <p>These terms are governed by the laws of the Province of Ontario, Canada.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">8. Modifications</h2>
        <p>We may modify these Terms at any time. Continued use of the app implies acceptance of updated terms.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Contact</h2>
        <p>For legal inquiries, contact <a className="text-blue-600 underline" href="mailto:nutricart@gmail.com">nutricart@gmail.com</a>.</p>
      </section>
    </div>
  </section>
);

export default TermsScreen;
