import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileScreen() {
  const [age, setAge]       = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal]     = useState('maintain');
  const navigate = useNavigate();

  const submitProfile = async () => {
    const profile = { user_id: 1, age, weight, height, goal };
    await fetch('http://127.0.0.1:8000/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    const res = await fetch(`http://127.0.0.1:8000/generate_plan/1`);
    const planData = await res.json();
    navigate('/plan', { state: { plan: planData } });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Enter Your Profile</h1>
      <label>Age: <input type="number" value={age} onChange={e=>setAge(e.target.value)} /></label><br/>
      <label>Weight: <input type="number" value={weight} onChange={e=>setWeight(e.target.value)} /></label><br/>
      <label>Height: <input type="number" value={height} onChange={e=>setHeight(e.target.value)} /></label><br/>
      <label>Goal:
        <select value={goal} onChange={e=>setGoal(e.target.value)}>
          <option value="lose">Lose</option>
          <option value="gain">Gain</option>
          <option value="maintain">Maintain</option>
        </select>
      </label><br/>
      <button onClick={submitProfile}>Generate Plan</button>
    </div>
  );
}
