import { useState } from 'react'
import './App.css'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import ProfileScreen from './screens/ProfileScreen.jsx';
import PlanScreen    from './screens/PlanScreen.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<ProfileScreen />} />
        <Route path="/plan"    element={<PlanScreen />} />
      </Routes>
    </Router>
  );
}