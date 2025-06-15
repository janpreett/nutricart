import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileScreen() {
  const [age, setAge]       = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal]     = useState('maintain');
  const navigate = useNavigate();

  const submitProfile = async () => {
    if (!age || age <= 0 || !weight || weight <= 0 || !height || height <= 0) {
      alert('Please enter valid positive values for age, weight, and height');
      return;
    }
    try {
      const profile = { 
        user_id: 1, 
        age: parseInt(age), 
        weight: parseFloat(weight), 
        height: parseFloat(height), 
        goal 
      };
      const profileRes = await fetch('http://127.0.0.1:8000/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!profileRes.ok) {
        const errorData = await profileRes.json();
        throw new Error(errorData.detail || 'Failed to create profile');
      }

      const planRes = await fetch(`http://127.0.0.1:8000/generate_plan/1`);
      if (!planRes.ok) {
        const errorData = await planRes.json();
        throw new Error(errorData.detail || 'Failed to generate meal plan');
      }
      
      const planData = await planRes.json();
      navigate('/plan', { state: { plan: planData } });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
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