import { useState } from 'react'
import './App.css'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import ProfileScreen from './screens/ProfileScreen.jsx';
import PlanScreen    from './screens/PlanScreen.jsx';
import Layout from './components/Layout';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/"        element={<ProfileScreen />} />
          <Route path="/plan"    element={<PlanScreen />} />
        </Routes>
      </Layout>
    </Router>
  );
}