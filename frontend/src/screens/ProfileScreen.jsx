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
  const [budget, setBudget]   = useState('')               // new
  const [dietary, setDietary] = useState('')               // new: comma-separated list
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await apiClient.fetchProfile()
        setAge(profile.age)
        setWeight(profile.weight)
        setHeight(profile.height)
        setGoal(profile.goal)
        setBudget(profile.budget || '')
        setDietary((profile.dietary_restrictions || []).join(', '))
      } catch (err) {
        if (err.message !== 'HTTP 404') {
          console.error('Error fetching profile:', err)
          setError(err.message)
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
      // Create or update profile with budget & dietary restrictions
      await apiClient.createProfile({
        age,
        weight,
        height,
        goal,
        budget,
        dietary_restrictions: dietary.split(',').map(s => s.trim()).filter(Boolean),
      })

      // Fetch meal plan and navigate
      const plan = await apiClient.generateMealPlan(user.id)
      navigate('/plan', { state: { plan } })
    } catch (err) {
      console.error('Profile submission failed:', err)
      setError(err.message || 'Failed to save profile')
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

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      <div className="space-y-4">
        {/* Age, Weight, Height, Goal (unchanged) */}
        <label className="block">
          <span>Budget per week ($):</span>
          <input
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            className="w-full border rounded p-2 mt-1"
            placeholder="e.g. 100"
          />
        </label>

        <label className="block">
          <span>Dietary Restrictions (comma-separated):</span>
          <input
            type="text"
            value={dietary}
            onChange={e => setDietary(e.target.value)}
            className="w-full border rounded p-2 mt-1"
            placeholder="e.g. gluten, nuts, dairy"
          />
        </label>

        <button
          onClick={submitProfile}
          disabled={submitting}
          className={`w-full text-white rounded-md py-2 mt-4 font-medium ${
            submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {submitting ? 'Saving…' : 'Generate My Meal Plan'}
        </button>
      </div>
    </div>
  )
}
