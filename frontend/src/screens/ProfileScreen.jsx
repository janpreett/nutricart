import React, { useEffect, useState } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useAuth }      from '../contexts/AuthContext';
import apiClient        from '../services/api';
import bannerImage      from '../assets/banner.png';

const DIETS = [
  'dairy-free','gluten-free','nut-free',
  'vegetarian','vegan','halal','kosher'
];

export default function ProfileScreen () {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [form, setForm] = useState({
    age:'', weight:'', height:'',
    goal:'maintain', budget:'',
    dietary_restrictions:[]
  });
  const [error,setError]       = useState('');
  const [loading,setLoading]   = useState(true);
  const [saving,setSaving]     = useState(false);

  /* fetch existing profile (if any) */
  useEffect(() => { (async () => {
    try {
      const p = await apiClient.fetchProfile();
      setForm({
        age:p.age, weight:p.weight, height:p.height,
        goal:p.goal, budget:p.budget ?? '',
        dietary_restrictions:p.dietary_restrictions ?? []
      });
    } catch (e) {
      if (e.message !== 'HTTP 404') setError(e.message);
    } finally { setLoading(false); }
  })(); }, []);

  /* handlers */
  const onField = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const onDiet = e => {
    const list = Array.from(e.target.selectedOptions).map(o => o.value);
    setForm(prev => ({ ...prev, dietary_restrictions:list }));
  };

  const submit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await apiClient.createOrUpdateProfile({
        ...form,
        budget: form.budget === '' ? null : Number(form.budget)
      });
      const plan = await apiClient.generateMealPlan(user.id);
      navigate('/plan', { state:{ plan } });
    } catch (err) { setError(err.message); }
    finally      { setSaving(false); }
  };

  /* UI ------------------------------------------------------------------- */
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p>Loading your profile…</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 my-10">
      <img src={bannerImage} alt=""
           className="w-full h-16 object-cover rounded-sm mb-6" />
      <h1 className="text-2xl font-bold text-center mb-6">
        Tell us about yourself
      </h1>
      {error && error!=='Profile not found' && (
        <p className="text-red-600 text-center mb-4">{error}</p>
      )}

      <form onSubmit={submit} className="space-y-4">
        <input name="age" type="number" placeholder="Age"
               value={form.age} onChange={onField}
               className="w-full border rounded p-2"/>

        <input name="weight" type="number" placeholder="Weight (kg)"
               value={form.weight} onChange={onField}
               className="w-full border rounded p-2"/>

        <input name="height" type="number" placeholder="Height (cm)"
               value={form.height} onChange={onField}
               className="w-full border rounded p-2"/>

        <select name="goal" value={form.goal} onChange={onField}
                className="w-full border rounded p-2">
          <option value="lose">Lose Weight</option>
          <option value="maintain">Maintain</option>
          <option value="gain">Gain Muscle</option>
        </select>

        <input name="budget" type="number" placeholder="Budget per week ($)"
               value={form.budget} onChange={onField}
               className="w-full border rounded p-2"/>

        {/* diet multi-select */}
        <div>
          <label className="block mb-1 font-medium">Dietary Restrictions</label>
          <select multiple size={DIETS.length}
                  value={form.dietary_restrictions}
                  onChange={onDiet}
                  className="w-full border rounded p-2 h-40">
            {DIETS.map(d => <option key={d}>{d}</option>)}
          </select>

          <div className="flex flex-wrap gap-2 mt-2">
            {form.dietary_restrictions.map(dr => (
              <span key={dr}
                    className="text-xs px-2 py-1 bg-indigo-100
                               text-indigo-700 rounded-full">
                {dr}
              </span>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className={`w-full text-white rounded py-2 font-medium
            ${saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'}`}>
          {saving ? 'Saving…' : 'Generate My Meal Plan'}
        </button>
        
        {/* Security Settings Section */}
        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Security Questions</p>
                <p className="text-xs text-gray-500">Set up questions for password recovery</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/security-questions')}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Manage →
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Password</p>
                <p className="text-xs text-gray-500">Reset your account password</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Reset →
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
