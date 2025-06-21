import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';

export default function ContactScreen() {
  const [smsConsent, setSmsConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');

  const validate = (values) => {
    const errs = {};
    if (!values.first_name) errs.first_name = 'First name is required';
    if (!values.last_name) errs.last_name = 'Last name is required';
    if (!values.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(values.email)) errs.email = 'Email is invalid';
    if (!values.message) errs.message = 'Message is required';
    if (!values.sms_consent) errs.sms_consent = 'You must consent to SMS';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const formData = {
      first_name: e.target.firstName.value.trim(),
      last_name:  e.target.lastName.value.trim(),
      email:      e.target.email.value.trim(),
      phone:      e.target.phone.value.trim() || null,
      message:    e.target.message.value.trim(),
      sms_consent: smsConsent,
    };

    const errs = validate(formData);
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await apiClient.request('/contact', {
        method: 'POST',
        body: formData,            // <— use `body`, not `data`
      });
      e.target.reset();
      setSmsConsent(false);
      setFormErrors({});
      alert('Message sent successfully!');
    } catch (err) {
      // Show the raw error string instead of [object Object]
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 my-10 flex flex-col md:flex-row gap-10">
      <form onSubmit={handleSubmit} noValidate className="flex-1 space-y-6">
        <h2 className="text-2xl font-bold text-green-400">Send Us a Message</h2>

        {error && (
          <p className="text-red-600" role="alert">
            {error}
          </p>
        )}

        {/** FIRST NAME **/}
        <label className="block">
          <span className="font-semibold">First Name*</span>
          <input
            name="firstName"
            type="text"
            className={`w-full border rounded p-2 mt-1 focus:ring-2 ${
              formErrors.first_name ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!formErrors.first_name}
          />
          {formErrors.first_name && (
            <p className="text-red-600 text-sm">{formErrors.first_name}</p>
          )}
        </label>

        {/** LAST NAME **/}
        <label className="block">
          <span className="font-semibold">Last Name*</span>
          <input
            name="lastName"
            type="text"
            className={`w-full border rounded p-2 mt-1 focus:ring-2 ${
              formErrors.last_name ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!formErrors.last_name}
          />
          {formErrors.last_name && (
            <p className="text-red-600 text-sm">{formErrors.last_name}</p>
          )}
        </label>

        {/** EMAIL **/}
        <label className="block">
          <span className="font-semibold">Email*</span>
          <input
            name="email"
            type="email"
            className={`w-full border rounded p-2 mt-1 focus:ring-2 ${
              formErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!formErrors.email}
          />
          {formErrors.email && (
            <p className="text-red-600 text-sm">{formErrors.email}</p>
          )}
        </label>

        {/** PHONE **/}
        <label className="block">
          <span className="font-semibold">Phone (Optional)</span>
          <input
            name="phone"
            type="tel"
            className="w-full border rounded p-2 mt-1 focus:ring-2 border-gray-300"
          />
        </label>

        {/** MESSAGE **/}
        <label className="block">
          <span className="font-semibold">Message*</span>
          <textarea
            name="message"
            rows="4"
            className={`w-full border rounded p-2 mt-1 focus:ring-2 ${
              formErrors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!formErrors.message}
          />
          {formErrors.message && (
            <p className="text-red-600 text-sm">{formErrors.message}</p>
          )}
        </label>

        {/** SMS CONSENT **/}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="smsConsent"
            checked={smsConsent}
            onChange={() => setSmsConsent(!smsConsent)}
          />
          <label htmlFor="smsConsent" className="font-semibold">
            I consent to receive SMS messages*
          </label>
        </div>
        {formErrors.sms_consent && (
          <p className="text-red-600 text-sm">{formErrors.sms_consent}</p>
        )}
        <p className="text-xs text-gray-600">
          By checking above, you agree to our{' '}
          <Link to="/terms" className="text-green-500 underline">
            Terms
          </Link>{' '}
          &{' '}
          <Link to="/privacy" className="text-green-500 underline">
            Privacy Policy
          </Link>.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full text-white rounded-md py-2 font-medium ${
            submitting
              ? 'bg-green-300 cursor-not-allowed'
              : 'bg-green-400 hover:bg-green-500'
          }`}
        >
          {submitting ? 'Sending…' : 'Send Message'}
        </button>
      </form>

      <aside className="w-full md:w-1/3 bg-green-100 rounded-lg p-6 text-green-700">
        <h3 className="text-xl font-semibold mb-4">Send an Email</h3>
        <a href="mailto:nutricart@gmail.com" className="underline">
          nutricart@gmail.com
        </a>
      </aside>
    </div>
  );
}
