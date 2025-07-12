import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const PREDEFINED_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your elementary school?",
  "What is your favorite movie?",
  "What was your childhood nickname?",
  "What is the name of the street you grew up on?",
  "What was your first car?",
  "What is your favorite food?",
  "What was the name of your first boss?"
];

export default function SecurityQuestionsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    question1: '',
    answer1: '',
    question2: '',
    answer2: '',
    question3: '',
    answer3: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [hasExistingQuestions, setHasExistingQuestions] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    loadExistingQuestions();
  }, []);

  const loadExistingQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      const response = await api.getCurrentUserSecurityQuestions();
      
      if (response.security_questions && Object.keys(response.security_questions).length > 0) {
        setHasExistingQuestions(true);
        const questionsArray = Object.entries(response.security_questions);
        setExistingQuestions(questionsArray);
        
        // Pre-populate form with existing questions for editing
        if (questionsArray.length >= 3) {
          setFormData({
            question1: questionsArray[0][0],
            answer1: questionsArray[0][1],
            question2: questionsArray[1][0],
            answer2: questionsArray[1][1],
            question3: questionsArray[2][0],
            answer3: questionsArray[2][1]
          });
        }
      } else {
        setHasExistingQuestions(false);
        setShowUpdateForm(true); // Show form immediately if no existing questions
      }
    } catch (error) {
      console.error('Error loading security questions:', error);
      setHasExistingQuestions(false);
      setShowUpdateForm(true); // Show form on error too
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Check if all questions are selected
    if (!formData.question1) {
      newErrors.question1 = 'Please select a security question';
    }
    if (!formData.question2) {
      newErrors.question2 = 'Please select a security question';
    }
    if (!formData.question3) {
      newErrors.question3 = 'Please select a security question';
    }

    // Check if all answers are provided
    if (!formData.answer1.trim()) {
      newErrors.answer1 = 'Please provide an answer';
    }
    if (!formData.answer2.trim()) {
      newErrors.answer2 = 'Please provide an answer';
    }
    if (!formData.answer3.trim()) {
      newErrors.answer3 = 'Please provide an answer';
    }

    // Check if questions are unique
    const questions = [formData.question1, formData.question2, formData.question3].filter(q => q);
    const uniqueQuestions = [...new Set(questions)];
    if (questions.length !== uniqueQuestions.length) {
      newErrors.general = 'Please select three different security questions';
    }

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
      const securityQuestions = {
        [formData.question1]: formData.answer1,
        [formData.question2]: formData.answer2,
        [formData.question3]: formData.answer3
      };

      await api.saveSecurityQuestions(securityQuestions);
      // Show success message and refresh data
      setHasExistingQuestions(true);
      setShowUpdateForm(false);
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Security questions error:', error);
      setErrors({ general: error.message || 'Failed to save security questions. Please try again.' });
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
              className="animate-spin mx-auto h-12 w-12 text-indigo-600"
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
            <p className="mt-4 text-lg text-gray-600">Loading security questions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Display existing questions
  if (hasExistingQuestions && !showUpdateForm) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
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
              Your Security Questions
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your account is protected by security questions
            </p>
          </div>

          {showSuccessMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Security Questions Updated Successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your security questions have been saved and can now be used for password recovery.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {existingQuestions.map(([question, answer], index) => (
              <div key={index} className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Security Question {index + 1}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question:</label>
                    <p className="mt-1 text-sm text-gray-900 bg-white p-2 rounded border">
                      {question}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Your Answer:</label>
                    <p className="mt-1 text-sm text-gray-900 bg-white p-2 rounded border">
                      {answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Security Information
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Keep your answers secure and memorable. These questions will be used to verify your identity
                    if you need to reset your password. Updating these questions will replace your previous answers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Profile
            </button>
            
            <button
              type="button"
              onClick={() => setShowUpdateForm(true)}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form for setting/updating questions

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
            {hasExistingQuestions ? 'Update Security Questions' : 'Set Up Security Questions'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {hasExistingQuestions 
              ? 'Update your security questions and answers below'
              : 'Please answer three security questions to help protect your account'
            }
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

          {hasExistingQuestions && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-orange-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    Updating Security Questions
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>
                      You are updating your existing security questions. This will completely replace your 
                      previous questions and answers. Make sure you remember your new answers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Security Question 1 */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Security Question 1</h3>
              
              <div>
                <label htmlFor="question1" className="block text-sm font-medium text-gray-700">
                  Select a question
                </label>
                <select
                  id="question1"
                  name="question1"
                  value={formData.question1}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.question1 ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                >
                  <option value="">Choose a question...</option>
                  {PREDEFINED_QUESTIONS.map((question, index) => (
                    <option key={index} value={question}>
                      {question}
                    </option>
                  ))}
                </select>
                {errors.question1 && (
                  <p className="mt-1 text-sm text-red-600">{errors.question1}</p>
                )}
              </div>

              <div>
                <label htmlFor="answer1" className="block text-sm font-medium text-gray-700">
                  Your answer
                </label>
                <input
                  id="answer1"
                  name="answer1"
                  type="text"
                  value={formData.answer1}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.answer1 ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Enter your answer"
                />
                {errors.answer1 && (
                  <p className="mt-1 text-sm text-red-600">{errors.answer1}</p>
                )}
              </div>
            </div>

            {/* Security Question 2 */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Security Question 2</h3>
              
              <div>
                <label htmlFor="question2" className="block text-sm font-medium text-gray-700">
                  Select a question
                </label>
                <select
                  id="question2"
                  name="question2"
                  value={formData.question2}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.question2 ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                >
                  <option value="">Choose a question...</option>
                  {PREDEFINED_QUESTIONS.map((question, index) => (
                    <option key={index} value={question}>
                      {question}
                    </option>
                  ))}
                </select>
                {errors.question2 && (
                  <p className="mt-1 text-sm text-red-600">{errors.question2}</p>
                )}
              </div>

              <div>
                <label htmlFor="answer2" className="block text-sm font-medium text-gray-700">
                  Your answer
                </label>
                <input
                  id="answer2"
                  name="answer2"
                  type="text"
                  value={formData.answer2}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.answer2 ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Enter your answer"
                />
                {errors.answer2 && (
                  <p className="mt-1 text-sm text-red-600">{errors.answer2}</p>
                )}
              </div>
            </div>

            {/* Security Question 3 */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Security Question 3</h3>
              
              <div>
                <label htmlFor="question3" className="block text-sm font-medium text-gray-700">
                  Select a question
                </label>
                <select
                  id="question3"
                  name="question3"
                  value={formData.question3}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.question3 ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                >
                  <option value="">Choose a question...</option>
                  {PREDEFINED_QUESTIONS.map((question, index) => (
                    <option key={index} value={question}>
                      {question}
                    </option>
                  ))}
                </select>
                {errors.question3 && (
                  <p className="mt-1 text-sm text-red-600">{errors.question3}</p>
                )}
              </div>

              <div>
                <label htmlFor="answer3" className="block text-sm font-medium text-gray-700">
                  Your answer
                </label>
                <input
                  id="answer3"
                  name="answer3"
                  type="text"
                  value={formData.answer3}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.answer3 ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Enter your answer"
                />
                {errors.answer3 && (
                  <p className="mt-1 text-sm text-red-600">{errors.answer3}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => hasExistingQuestions ? setShowUpdateForm(false) : navigate('/profile')}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {hasExistingQuestions ? 'Cancel' : 'Skip for now'}
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
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
              {isLoading ? 'Saving...' : hasExistingQuestions ? 'Update Security Questions' : 'Save Security Questions'}
            </button>
          </div>

          {showSuccessMessage && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Security questions saved successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Your security questions and answers have been saved. Remember to keep your answers secure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
