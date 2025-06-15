import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PlanScreen = () => {
  const location = useLocation();
  const [weeklyPlan, setWeeklyPlan] = useState(location.state?.weekly_plan || []);
  const [loading, setLoading] = useState(!location.state?.weekly_plan);

  useEffect(() => {
    if (!weeklyPlan.length && location.state?.weekly_plan) {
      setWeeklyPlan(location.state.weekly_plan);
      setLoading(false);
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading your personalized meal plan...</p>
      </div>
    );
  }

  if (!weeklyPlan.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">No meal plan available. Please create a profile first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Weekly Meal Plan</h1>
      {weeklyPlan.map((dayPlan, index) => (
        <div key={index} className="mb-6 p-4 bg-gray-100 rounded-lg shadow">
          <h2 className="text-xl font-semibold">{dayPlan.day}</h2>
          <ul className="mt-2">
            {dayPlan.meals.map((meal, mealIndex) => (
              <li key={mealIndex} className="py-2 border-b last:border-b-0">
                <p><strong>{meal.name}</strong> - {meal.calories} kcal</p>
                {meal.protein && <p>Protein: {meal.protein}g</p>}
                {meal.carbs && <p>Carbs: {meal.carbs}g</p>}
                {meal.fat && <p>Fat: {meal.fat}g</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PlanScreen;