import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { ChefHat, Download, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' };

const CUISINES = ['North Indian', 'South Indian', 'Bengali', 'Gujarati', 'Punjabi', 'Kerala', 'Maharashtrian', 'Mixed Indian'];
const DIETS = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian', 'Jain'];
const MEALS_OPTIONS = [2, 3, 4, 5];
const PRESET_GOALS = ['General Wellness', 'Weight Loss', 'Muscle Gain', 'Sugar Control', 'Heart Healthy', 'Maintain Weight'];

const GOAL_META = {
  'Weight Loss':      { color: 'bg-orange-100 text-orange-700 border-orange-200',  icon: '🔥' },
  'Muscle Gain':      { color: 'bg-blue-100 text-blue-700 border-blue-200',        icon: '💪' },
  'Sugar Control':    { color: 'bg-green-100 text-green-700 border-green-200',     icon: '🩸' },
  'Heart Healthy':    { color: 'bg-red-100 text-red-700 border-red-200',           icon: '❤️' },
  'Maintain Weight':  { color: 'bg-slate-100 text-slate-600 border-slate-200',     icon: '⚖️' },
  'General Wellness': { color: 'bg-purple-100 text-purple-700 border-purple-200',  icon: '🌿' },
};
const DEFAULT_META = { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '🎯' };

function getGoalMeta(goal) {
  return GOAL_META[goal] || DEFAULT_META;
}

// ── Dynamic Goals Combo Input ──────────────────────────────────────────────
function GoalComboInput({ goals, onChange }) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = PRESET_GOALS.filter(
    g => g.toLowerCase().includes(inputValue.toLowerCase()) && !goals.includes(g)
  );

  const addGoal = (goal) => {
    const trimmed = goal.trim();
    if (trimmed && !goals.includes(trimmed)) {
      onChange([...goals, trimmed]);
    }
    setInputValue('');
    setShowDropdown(false);
  };

  const removeGoal = (goal) => {
    onChange(goals.filter(g => g !== goal));
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addGoal(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && goals.length > 0) {
      removeGoal(goals[goals.length - 1]);
    }
  };

  const showList = showDropdown && (inputValue.length > 0 || filtered.length > 0);

  return (
    <div className="relative">
      {/* Tags + Input box */}
      <div
        className="min-h-[44px] w-full flex flex-wrap gap-1.5 items-center px-3 py-2 border border-slate-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-indigo-300 transition-all cursor-text"
        onClick={() => document.getElementById('goal-combo-input').focus()}
      >
        {goals.map(g => {
          const meta = getGoalMeta(g);
          return (
            <span
              key={g}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none ${meta.color}`}
            >
              <span>{meta.icon}</span>
              {g}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeGoal(g); }}
                className="ml-0.5 hover:opacity-50 transition-opacity font-bold text-sm leading-none"
                aria-label={`Remove ${g}`}
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          id="goal-combo-input"
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={goals.length === 0 ? 'Type or pick a goal…' : '+ Add another goal'}
          className="flex-1 min-w-[140px] text-sm font-medium text-slate-700 outline-none bg-transparent placeholder-slate-400"
        />
      </div>

      {/* Dropdown */}
      {showList && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {filtered.map(g => (
            <button
              key={g}
              type="button"
              onMouseDown={() => addGoal(g)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 transition-colors text-left"
            >
              <span className="text-base">{getGoalMeta(g).icon}</span>
              {g}
              <span className="ml-auto text-xs text-slate-300">preset</span>
            </button>
          ))}
          {inputValue.trim() && !PRESET_GOALS.includes(inputValue.trim()) && !goals.includes(inputValue.trim()) && (
            <button
              type="button"
              onMouseDown={() => addGoal(inputValue)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 border-t border-slate-100 transition-colors text-left font-semibold"
            >
              <span className="text-base">🎯</span>
              Add <span className="mx-1 font-bold">"{inputValue.trim()}"</span> as custom goal
            </button>
          )}
          {filtered.length === 0 && !inputValue.trim() && (
            <div className="px-4 py-3 text-xs text-slate-400 text-center italic">All preset goals added ✓</div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
        Press
        <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono text-xs">Enter</kbd>
        or
        <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono text-xs">,</kbd>
        to add a custom goal &nbsp;·&nbsp; click × to remove
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MealPlanner() {
  const email = localStorage.getItem('userEmail');
  const [form, setForm] = useState({ cuisine: 'South Indian', diet: 'Vegetarian', meals: 3, calories: 1800, height: 170, weight: 65 });
  const [goals, setGoals] = useState(['General Wellness']);
  const [plan, setPlan] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-save calorie target to profile for Dashboard synchronization
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.calories && !isNaN(form.calories)) {
        try {
          await api.post('/user/save-calories', { 
            email, 
            calories: parseInt(form.calories) 
          });
        } catch (err) {
          console.error("Failed to save calorie target", err);
        }
      }
    }, 1000); // 1-second debounce
    return () => clearTimeout(timer);
  }, [form.calories, email]);

  const combinedGoal = goals.length > 0 ? goals.join(', ') : 'General Wellness';

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setPlan(null);
    try {
      const res = await api.post('/generate-meal-plan', {
        email,
        cuisine: form.cuisine,
        diet: form.diet,
        meals: parseInt(form.meals),
        calories: parseInt(form.calories) || 1800,
        goal: combinedGoal,
        height: parseFloat(form.height) || 170.0,
        weight: parseFloat(form.weight) || 65.0,
      });
      setPlan(res.data.plan);
      setConditions(res.data.conditions || []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to generate meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!plan) return;
    let text = `SmartEats – 7-Day Personalised Meal Plan\n`;
    text += `Cuisine: ${form.cuisine} | Diet: ${form.diet} | Calories: ~${form.calories} kcal/day\n`;
    text += `Goals: ${combinedGoal}\n`;
    if (conditions.length) text += `Health Conditions: ${conditions.join(', ')}\n`;
    text += `\n${'='.repeat(60)}\n\n`;
    Object.entries(plan).forEach(([day, meals], i) => {
      text += `${DAY_LABELS[i] || day.toUpperCase()}\n${'─'.repeat(40)}\n`;
      text += `🌅 Breakfast: ${meals.breakfast}\n`;
      text += `☀️  Lunch:     ${meals.lunch}\n`;
      text += `🌙 Dinner:    ${meals.dinner}\n`;
      if (meals.snacks !== 'N/A') text += `🍎 Snacks:    ${meals.snacks}\n`;
      text += '\n';
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'SmartEats_MealPlan.txt';
    a.click();
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-100 p-2.5 rounded-xl">
            <ChefHat className="text-indigo-600" size={26} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Diet Planner</h1>
        </div>
        <p className="text-slate-500 text-base">
          Generate a personalised 7-day meal plan based on your health profile and preferences.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-700 mb-5">Your Preferences</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Cuisine */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cuisine</label>
            <select
              value={form.cuisine}
              onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {CUISINES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Diet */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Diet Type</label>
            <select
              value={form.diet}
              onChange={e => setForm(f => ({ ...f, diet: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {DIETS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          {/* Meals / day */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Meals per Day</label>
            <select
              value={form.meals}
              onChange={e => setForm(f => ({ ...f, meals: parseInt(e.target.value) }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {MEALS_OPTIONS.map(m => <option key={m} value={m}>{m} meals</option>)}
            </select>
          </div>

          {/* Calories */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Calories (optional)</label>
            <input
              type="number"
              value={form.calories}
              onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
              placeholder="e.g. 1800"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Height */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Height (cm)</label>
            <input
              type="number"
              value={form.height}
              onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
              placeholder="e.g. 175"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Weight (kg)</label>
            <input
              type="number"
              value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
              placeholder="e.g. 70"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        {/* Health Goals — full-width dynamic combo */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Health Goals
            <span className="ml-2 normal-case font-normal text-slate-400">— choose presets or type your own</span>
          </label>
          <GoalComboInput goals={goals} onChange={setGoals} />
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <button
            id="generate-btn"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-60 text-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ChefHat size={18} />}
            {loading ? 'Generating Plan...' : 'Generate 7-Day Plan'}
          </button>
          {plan && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm"
            >
              <Download size={16} />
              Download Plan
            </button>
          )}
          {plan && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition-all text-sm"
            >
              <RefreshCw size={16} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 mb-6">
          <AlertTriangle className="text-red-500 shrink-0" size={18} />
          <span className="text-red-700 text-sm">{error}</span>
          <button onClick={handleGenerate} disabled={loading} className="ml-auto text-xs font-bold text-red-600 underline">
            Retry
          </button>
        </div>
      )}

      {/* Health conditions banner */}
      {plan && conditions.length > 0 && conditions[0] !== 'No conditions detected' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-amber-800 text-sm font-bold mb-1">Personalised for your health conditions</p>
            <p className="text-amber-700 text-xs">{conditions.join(' • ')}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-2/5 mb-4"></div>
              {[...Array(4)].map((_, j) => (
                <div key={j} className="mb-3">
                  <div className="h-3 bg-slate-100 rounded w-1/4 mb-1.5"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 7-Day Plan Grid */}
      {plan && !loading && (
        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-800">Your 7-Day Diet Plan</h2>
              {goals.map(g => {
                const meta = getGoalMeta(g);
                return (
                  <span key={g} className={`px-3 py-1 rounded-full text-xs font-bold border ${meta.color}`}>
                    {meta.icon} {g}
                  </span>
                );
              })}
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-semibold">
              {form.cuisine} • {form.diet} • ~{form.calories} kcal/day
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(plan).map(([day, meals], idx) => (
              <div
                key={day}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
                  <span className="text-white font-extrabold text-sm tracking-wide">{DAY_LABELS[idx] || day}</span>
                  <span className="text-indigo-200 text-xs font-medium">Day {idx + 1}</span>
                </div>
                <div className="p-5 space-y-3">
                  {Object.entries(meals).map(([mealType, mealText]) =>
                    mealText !== 'N/A' ? (
                      <div key={mealType}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{MEAL_ICONS[mealType]}</span>
                          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{mealType}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-snug pl-5">{mealText}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!plan && !loading && !error && (
        <div className="text-center py-20 text-slate-400">
          <ChefHat size={60} className="mx-auto mb-4 text-slate-200" />
          <p className="text-lg font-semibold">Select your preferences and generate a plan</p>
          <p className="text-sm mt-1">Your plan will be personalised based on your health profile</p>
        </div>
      )}
    </div>
  );
}
