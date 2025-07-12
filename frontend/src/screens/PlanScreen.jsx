import React, { useEffect, useState } from 'react';
import { useLocation }                from 'react-router-dom';
import { useAuth }                    from '../contexts/AuthContext';
import apiClient                      from '../services/api';

/* small helper */
const sum = (arr, key) => arr.reduce((s, x) => s + (x[key] || 0), 0);

export default function PlanScreen () {
  const { user }        = useAuth();
  const location        = useLocation();

  const [plan, setPlan] = useState(null);   // raw backend object
  const [days, setDays] = useState([]);     // UI-ready array
  const [loading, setLoading] = useState(true);

  /* fetch (or reuse) plan -------------------------------------------------- */
  useEffect(() => { (async () => {
    const data = location.state?.plan
      ?? await apiClient.generateMealPlan(user.id);

    const dr = (data.dietary_restrictions || []).map(x => x.toLowerCase());
    const filtered = data.weekly_plan.map(d => ({
      ...d,
      meals: d.meals.filter(m =>
        !dr.some(r => m.name.toLowerCase().includes(r)))
    }));

    setPlan(data);
    setDays(filtered);
    setLoading(false);
  })(); /* eslint-disable-next-line react-hooks/exhaustive-deps */}, []);

  /* ---------------------------------------------------------------------- */
  if (loading)
    return <div className="flex items-center justify-center h-screen">
      <p>Loading your personalised meal plan…</p>
    </div>;

  if (!days.length)
    return <div className="flex items-center justify-center h-screen">
      <p>No meal plan available – please create a profile first.</p>
    </div>;

  /* weekly aggregates */
  const weekCost = sum(days.flatMap(d => d.meals), 'price');
  const weekKcal = sum(days.flatMap(d => d.meals), 'calories');
  const weekProt = sum(days.flatMap(d => d.meals), 'protein');
  const weekCarb = sum(days.flatMap(d => d.meals), 'carbs');
  const weekFat  = sum(days.flatMap(d => d.meals), 'fat');

  const budget   = plan.budget ?? plan.weekly_budget ?? null;
  const inBudget = budget ? weekCost <= budget : true;

  /* very rough macro targets (30-40-30 split by kcal) */
  const kcal2g = { protein:4, carbs:4, fat:9 };
  const tgt    = {
    protein: (0.30 * weekKcal) / kcal2g.protein,
    carbs:   (0.40 * weekKcal) / kcal2g.carbs,
    fat:     (0.30 * weekKcal) / kcal2g.fat,
  };
  const pct = (v, t) => Math.min(100, Math.round((v / t) * 100));

  /* actions -------------------------------------------------------------- */
  const regenerate = async () => {
    setLoading(true);
    const fresh = await apiClient.generateMealPlan(user.id);

    const dr = (fresh.dietary_restrictions || []).map(x => x.toLowerCase());
    const filtered = fresh.weekly_plan.map(d => ({
      ...d,
      meals: d.meals.filter(m => !dr.some(r => m.name.toLowerCase().includes(r)))
    }));

    setPlan(fresh);
    setDays(filtered);
    setLoading(false);
  };

  const swapMeal = async (dayIdx, mealIdx) => {
    try {
      const repl = await apiClient.swapMeal(user.id, dayIdx, mealIdx);
      setDays(prev => {
        const copy = structuredClone(prev);
        copy[dayIdx].meals[mealIdx] = repl;
        return copy;
      });
    } catch (e) { alert(e.message); }
  };

  /* ---------------------------------------------------------------------- */
  return (
    <div className="max-w-4xl mx-auto p-4 print:p-0">
      <h1 className="text-2xl font-bold mb-4">Your Weekly Meal Plan</h1>

      {/* action buttons (hidden when printing) */}
      <div className="flex gap-3 mb-4 print:hidden">
        <button onClick={regenerate}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          Regenerate plan
        </button>
        <button onClick={() => window.print()}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">
          Save / Print
        </button>
      </div>

      {/* budget banner */}
      {budget && (
        <div className={
          `mb-6 p-4 font-medium text-center rounded-lg border ` +
          (inBudget
            ? 'bg-green-50 text-green-700 border-green-400'
            : 'bg-red-50   text-red-700   border-red-400')}
        >
          Weekly cost <span className="tabular-nums">${weekCost.toFixed(2)}</span>
          {' / '}
          <span className="tabular-nums">${budget.toFixed(2)}</span>
          &nbsp;– {inBudget ? '✓ within budget' : '✗ over budget'}
        </div>
      )}

      {/* macro progress bars */}
      <div className="mb-8 space-y-2">
        {[
          { label:'Protein', val:weekProt, tar:tgt.protein, bg:'bg-emerald-500' },
          { label:'Carbs',   val:weekCarb, tar:tgt.carbs,   bg:'bg-sky-500' },
          { label:'Fat',     val:weekFat,  tar:tgt.fat,     bg:'bg-yellow-500' },
        ].map(r => (
          <div key={r.label}>
            <div className="flex justify-between text-sm">
              <span>{r.label}</span>
              <span className="tabular-nums">
                {Math.round(r.val)} g / {Math.round(r.tar)} g
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div
                style={{ width:`${pct(r.val, r.tar)}%` }}
                className={`h-full rounded ${r.bg}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* daily cards */}
      {days.map((day, dIdx) => {
        const kcal = sum(day.meals, 'calories');
        const cost = sum(day.meals, 'price');
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
              {day.meals.map((m, i) => (
                <li key={m.name}
                    className="py-2 flex justify-between items-start">
                  <div>
                    <p>
                      <strong>{m.name}</strong>
                      {' – '} {m.calories} kcal · ${m.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600 space-x-3">
                      {m.protein && <span>P {m.protein} g</span>}
                      {m.carbs   && <span>C {m.carbs} g</span>}
                      {m.fat     && <span>F {m.fat} g</span>}
                    </p>
                  </div>

                  <button
                    onClick={() => swapMeal(dIdx, i)}
                    className="ml-3 text-blue-600 text-xs hover:underline shrink-0 print:hidden">
                    swap
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
