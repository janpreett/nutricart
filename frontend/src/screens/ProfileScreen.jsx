import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bannerImage from '../assets/banner.png';

export default function ProfileScreen() {
  const [age, setAge]       = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal]     = useState('maintain');
  const navigate = useNavigate();

  const submitProfile = async () => {
    const user_id = Math.floor(Math.random() * 1000000);
    const profile = { user_id, age, weight, height, goal };
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
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 my-10 overflow-hidden">
      <div className="mb-4 -mx-8 -mt-8">
        <img 
          src={bannerImage} 
          alt="Healthy Food" 
          className="w-full object-cover rounded-sm h-16"
        />
      </div>
      <h1 className="text-2xl font-bold text-center mb-6">Tell us about yourself</h1>
      
      <div className="space-y-4 flex flex-col items-center">
        <div className="flex items-center" style={{ marginBottom: '10px' }}>
          <label className="font-medium text-gray-700 w-28 text-right" style={{ marginRight: '67px' }}>Age:</label>
          <input 
            type="number" 
            value={age} 
            onChange={e=>setAge(e.target.value)} 
            className="w-56 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
            placeholder="Enter your age"
          />
        </div>
        
        <div className="flex items-center" style={{ marginBottom: '10px' }}>
          <label className="font-medium text-gray-700 w-28 text-right" style={{ marginRight: '17px' }}>Weight (kg):</label>
          <input 
            type="number" 
            value={weight} 
            onChange={e=>setWeight(e.target.value)} 
            className="w-56 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
            placeholder="Enter your weight"
          />
        </div>
        
        <div className="flex items-center" style={{ marginBottom: '10px' }}>
          <label className="font-medium text-gray-700 w-28 text-right" style={{ marginRight: '15px' }}>Height (cm):</label>
          <input 
            type="number" 
            value={height} 
            onChange={e=>setHeight(e.target.value)} 
            className="w-56 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
            placeholder="Enter your height"
          />
        </div>
        
        <div className="flex items-center" style={{ marginBottom: '10px' }}>
          <label className="font-medium text-gray-700 w-28 text-right" style={{ marginRight: '15px' }}>Goal:</label>
          <select 
            value={goal} 
            onChange={e=>setGoal(e.target.value)}
            className="w-56 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
          >
            <option value="lose">Lose Weight</option>
            <option value="gain">Gain Weight</option>
            <option value="maintain">Maintain Weight</option>
          </select>
        </div>
        
        <div className="pt-6 mt-2 flex justify-center">
          <button 
            onClick={submitProfile}
            className="w-56 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md py-2.5 transition duration-300 ease-in-out shadow-sm hover:shadow-md"
          >
            Generate My Meal Plan
          </button>
        </div>
      </div>
    </div>
  );
}
