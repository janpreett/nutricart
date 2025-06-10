import React from 'react';
import { useLocation } from 'react-router-dom';

export default function PlanScreen() {
  const { state } = useLocation();
  const { weekly_plan } = state.plan || {};

  return (
    <div style={{ padding: 20 }}>
      <h1>Your Weekly Plan</h1>
      {weekly_plan?.map(({ day, meals }) => (
        <div key={day}>
          <h2>{day}</h2>
          <ul>
            {meals.map((m,i) => (
              <li key={i}>{m.name} — {m.calories} kcal</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
