import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import apiClient from '../services/api'
import bannerImage from '../assets/banner.png'

export default function ProfileScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [age, setAge]         = useState('')
  const [weight, setWeight]   = useState('')
  const [height, setHeight]   = useState('')
  const [goal, setGoal]       = useState('maintain')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 1) On mount, fetch existing profile to prefill form, but DO NOT redirect
  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await apiClient.request('/profile')
        setAge(profile.age)
        setWeight(profile.weight)
        setHeight(profile.height)
        setGoal(profile.goal)
      } catch (err) {
        // ignore 404: no existing profile
        if (err.detail && err.detail !== 'Profile not found') {
          console.error('Error fetching profile:', err)
          setError(err.detail || err.message)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const submitProfile = async () => {
    setError('')
    setSubmitting(true)

    try {
      // Create or update profile
      await apiClient.createProfile({ age, weight, height, goal })

      // Fetch meal plan and navigate
      const plan = await apiClient.generateMealPlan(user.id)
      navigate('/plan', { state: { plan } })
    } catch (err) {
      console.error('Profile submission failed:', err)
      setError(err.detail || err.message || 'Failed to save profile')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading your profile…</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 my-10">
      <img
        src={bannerImage}
        alt="Healthy Food"
        className="w-full h-16 object-cover rounded-sm mb-6"
      />

      <h1 className="text-2xl font-bold text-center mb-6">
        Tell us about yourself
      </h1>

      {error && (
        <p className="text-red-600 text-center mb-4">{error}</p>
      )}

      <div className="space-y-4">
        <label className="block">
          <span>Age:</span>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            className="w-full border rounded p-2 mt-1"
            placeholder="Enter your age"
          />
        </label>

        <label className="block">
          <span>Weight (kg):</span>
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="w-full border rounded p-2 mt-1"
            placeholder="Enter your weight"
          />
        </label>

        <label className="block">
          <span>Height (cm):</span>
          <input
            type="number"
            value={height}
            onChange={e => setHeight(e.target.value)}
            className="w-full border rounded p-2 mt-1"
            placeholder="Enter your height"
          />
        </label>

        <label className="block">
          <span>Goal:</span>
          <select
            value={goal}
            onChange={e => setGoal(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          >
            <option value="lose">Lose Weight</option>
            <option value="maintain">Maintain Weight</option>
            <option value="gain">Gain Weight</option>
          </select>
        </label>

        <button
          onClick={submitProfile}
          disabled={submitting}
          className={`w-full text-white rounded-md py-2 mt-4 font-medium ${
            submitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {submitting ? 'Saving…' : 'Generate My Meal Plan'}
        </button>
      </div>
    </div>
  )
}
