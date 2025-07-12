import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function SecurityVerificationScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }

    const fetchSecurityQuestions = async () => {
      try {
        const response = await api.getSecurityQuestions(email);
        setQuestions(response.questions);
        // Initialize answers state
        const initialAnswers = {};
        response.questions.forEach((question, index) => {
          initialAnswers[question] = '';
        });
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Error fetching security questions:', error);
        setErrors({ general: 'Failed to load security questions. Please try again.' });
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchSecurityQuestions();
  }, [email, navigate]);

  const handleAnswerChange = (question, value) => {
    setAnswers(prev => ({
      ...prev,
      [question]: value
    }));
    // Clear error when user starts typing
    if (errors[question]) {
      setErrors(prev => ({
        ...prev,
        [question]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    questions.forEach(question => {
      if (!answers[question] || !answers[question].trim()) {
        newErrors[question] = 'Please provide an answer';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.verifySecurityAnswers(email, answers);
      // Navigate directly to reset password with email and verification flag
      navigate(`/reset-password?email=${encodeURIComponent(email)}&verified=true`);
    } catch (error) {
      console.error('Security verification error:', error);
      setErrors({ general: error.message || 'Incorrect answers. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-indigo-600 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-4 text-gray-600">Loading security questions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-10 w-10 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Security Verification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please answer your security questions to reset your password for <span className="font-medium">{email}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {errors.general}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700">
                  {question}
                </label>
                <input
                  type="text"
                  value={answers[question] || ''}
                  onChange={(e) => handleAnswerChange(question, e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors[question] ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Enter your answer"
                />
                {errors[question] && (
                  <p className="mt-1 text-sm text-red-600">{errors[question]}</p>
                )}
              </div>
            ))}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              {isLoading ? 'Verifying...' : 'Verify Answers'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to forgot password
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
