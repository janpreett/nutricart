import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import apiClient from '../services/api'

const PlanScreen = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [weeklyPlan, setWeeklyPlan] = useState([])
  const [loading, setLoading] = useState(true)

  // we'll carry dietary restrictions through state:
  const [dietaryRestrictions, setDietaryRestrictions] = useState([])

  useEffect(() => {
    async function load() {
      let planData = location.state?.plan
      if (!planData) {
        planData = await apiClient.generateMealPlan(user.id)
      }
      setDietaryRestrictions(planData.dietary_restrictions || [])
      setWeeklyPlan(
        (planData.weekly_plan || []).map(day => ({
          ...day,
          meals: day.meals.filter(
            m =>
              !dietaryRestrictions.some(dr =>
                m.name.toLowerCase().includes(dr.toLowerCase())
              )
          ),
        }))
      )
      setLoading(false)
    }
    load()
  }, [location.state, user, dietaryRestrictions])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading your personalized meal plan...</p>
      </div>
    )
  }
  if (!weeklyPlan.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">
          No meal plan available. Please create a profile first.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Weekly Meal Plan</h1>
      {weeklyPlan.map((dayPlan, idx) => (
        <div key={idx} className="mb-6 p-4 bg-gray-100 rounded-lg shadow">
          <h2 className="text-xl font-semibold">{dayPlan.day}</h2>
          <ul className="mt-2">
            {dayPlan.meals.map((meal, i) => (
              <li key={i} className="py-2 border-b last:border-b-0">
                <p>
                  <strong>{meal.name}</strong> – {meal.calories} kcal
                </p>
                {meal.protein && <p>Protein: {meal.protein}g</p>}
                {meal.carbs && <p>Carbs: {meal.carbs}g</p>}
                {meal.fat && <p>Fat: {meal.fat}g</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default PlanScreen
