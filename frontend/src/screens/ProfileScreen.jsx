import React, { useEffect, useState } from 'react';
import { useNavigate }        from 'react-router-dom';
import { useAuth }            from '../contexts/AuthContext';
import apiClient              from '../services/api'
import bannerImage            from '../assets/banner.png';

const DIET_OPTIONS = [
  'dairy-free', 'gluten-free', 'nut-free',
  'vegetarian', 'vegan', 'halal', 'kosher'
];

const ProfileScreen = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    age: '', weight: '', height: '',
    goal: 'maintain', budget: '',
    dietary_restrictions: []
  });
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- pre-fill if profile exists ------------------ */
  useEffect(() => {
    (async () => {
      try {
        const p = await apiClient.fetchProfile();
        setForm({
          age:     p.age,
          weight:  p.weight,
          height:  p.height,
          goal:    p.goal,
          budget:  p.budget ?? '',
          dietary_restrictions: p.dietary_restrictions ?? []
        });
      } catch (e) {
        if (e.message !== 'HTTP 404') setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------------- handlers ------------------------------------ */
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDiet = e => {
    const chosen = Array.from(e.target.selectedOptions).map(o => o.value);
    setForm(prev => ({ ...prev, dietary_restrictions: chosen }));
  };

  const submit = async e => {
    e.preventDefault();
    setSubmitting(true); setError('');

    try {
      await apiClient.createOrUpdateProfile(form);
      const plan = await apiClient.generateMealPlan(user.id);
      navigate('/plan', { state: { plan } });
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI ------------------------------------------ */
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p>Loading your profile…</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 my-10">
      <img src={bannerImage} alt="" className="w-full h-16 object-cover rounded-sm mb-6"/>
      <h1 className="text-2xl font-bold text-center mb-6">Tell us about yourself</h1>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      <form onSubmit={submit} className="space-y-4">
        <input  type="number" name="age"    placeholder="Age"
                value={form.age}    onChange={handleChange}
                className="w-full border rounded p-2"/>

        <input  type="number" name="weight" placeholder="Weight (kg)"
                value={form.weight} onChange={handleChange}
                className="w-full border rounded p-2"/>

        <input  type="number" name="height" placeholder="Height (cm)"
                value={form.height} onChange={handleChange}
                className="w-full border rounded p-2"/>

        <select name="goal" value={form.goal} onChange={handleChange}
                className="w-full border rounded p-2">
          <option value="lose">Lose Weight</option>
          <option value="maintain">Maintain</option>
          <option value="gain">Gain Muscle</option>
        </select>

        <input  type="number" name="budget" placeholder="Budget per week ($)"
                value={form.budget} onChange={handleChange}
                className="w-full border rounded p-2"/>

        {/* dietary multi-select */}
        <div>
          <label className="block mb-1 font-medium">Dietary Restrictions</label>
          <select multiple size={DIET_OPTIONS.length}
                  value={form.dietary_restrictions}
                  onChange={handleDiet}
                  className="w-full border rounded p-2 h-40">
            {DIET_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {/* chips */}
          <div className="flex flex-wrap gap-2 mt-2">
            {form.dietary_restrictions.map(dr => (
              <span key={dr}
                    className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                {dr}
              </span>
            ))}
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className={`w-full text-white rounded-md py-2 font-medium
          ${submitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'}`}>
          {submitting ? 'Saving…' : 'Generate My Meal Plan'}
        </button>
      </form>
    </div>
  );
};

export default ProfileScreen;
