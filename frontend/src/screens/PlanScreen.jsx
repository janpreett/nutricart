
import React, { useEffect, useState } from 'react';
import { useLocation }               from 'react-router-dom';
import { useAuth }                   from '../contexts/AuthContext';
import apiClient                     from '../services/api';

export default function PlanScreen() {
  const { user }     = useAuth();
  const location     = useLocation();
  const [plan, setPlan]           = useState(null);   // raw backend response
  const [days, setDays]           = useState([]);     // filtered list
  const [loading, setLoading]     = useState(true);

  /* ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      let data = location.state?.plan;
      if (!data) data = await apiClient.generateMealPlan(user.id);

      /* apply dietary restrictions */
      const restrictions = data.dietary_restrictions || [];
      const filtered = data.weekly_plan.map(d => ({
        ...d,
        meals: d.meals.filter(
          m => !restrictions.some(dr =>
            m.name.toLowerCase().includes(dr.toLowerCase())
          )
        )
      }));

      setPlan(data);
      setDays(filtered);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading your personalized meal plan…</p>
      </div>
    );

  if (!days.length)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No meal plan available – create a profile first.</p>
      </div>
    );

  /* -------- derived numbers ---------------------------------------- */
  const weekCost     = days.flatMap(d => d.meals)
                            .reduce((s, m) => s + (m.price || 0), 0);
  const weekCalories = days.flatMap(d => d.meals)
                            .reduce((s, m) => s + (m.calories || 0), 0);

  const budget   = plan.budget ?? plan.weekly_budget ?? null;
  const inBudget = budget ? weekCost <= budget : true;

  /* helper to compute per-day sums */
  const sums = d => ({
    kcal : d.meals.reduce((s, m) => s + (m.calories || 0), 0),
    cost : d.meals.reduce((s, m) => s + (m.price    || 0), 0),
  });

  /* ------------------------------------------------------------------ */
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Weekly Meal Plan</h1>

      {budget && (
        <div
          className={
            'mb-6 p-4 font-medium text-center rounded-lg ' +
            (inBudget
              ? 'bg-green-50 text-green-700 border border-green-400'
              : 'bg-red-50   text-red-700   border border-red-400')
          }
        >
          Weekly cost&nbsp;
          <span className="tabular-nums">${weekCost.toFixed(2)}</span>
          {' / '}
          <span className="tabular-nums">${budget.toFixed(2)}</span>
          &nbsp;– {inBudget ? '✓ within budget' : '✗ over budget'}
        </div>
      )}

      {/* ------------------------ day cards --------------------------- */}
      {days.map(day => {
        const { kcal, cost } = sums(day);
        return (
          <section key={day.day}
                   className="mb-6 p-4 bg-gray-100 rounded-lg shadow">
            <header className="flex justify-between items-baseline mb-2">
              <h2 className="text-xl font-semibold">{day.day}</h2>
              <span className="text-sm text-gray-700 tabular-nums">
                {kcal} kcal · ${cost.toFixed(2)}
              </span>
            </header>

            <ul className="divide-y">
              {day.meals.map(meal => (
                <li key={meal.name} className="py-2">
                  <p>
                    <strong>{meal.name}</strong>
                    &nbsp;– {meal.calories} kcal · ${meal.price.toFixed(2)}
                  </p>
                  <div className="text-xs text-gray-600 space-x-3">
                    {meal.protein && <span>P {meal.protein} g</span>}
                    {meal.carbs   && <span>C {meal.carbs} g</span>}
                    {meal.fat     && <span>F {meal.fat} g</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
