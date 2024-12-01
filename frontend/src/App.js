// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './styles/App.css';
import Tab1 from './components/Tab1';
import Tab2 from './components/Tab2';
import Tab3 from './components/Tab3';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ backgroundColor: '#333', color: 'white', padding: '1rem', textAlign: 'center' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <li><NavLink to="/" style={({ isActive }) => ({ color: isActive ? '#fff' : '#666', textDecoration: 'none' })} >Tab 1</NavLink></li>
          <li><NavLink to="/tab2" style={({ isActive }) => ({ color: isActive ? '#fff' : '#666', textDecoration: 'none' })} >Tab 2</NavLink></li>
          <li><NavLink to="/tab3" style={({ isActive }) => ({ color: isActive ? '#fff' : '#666', textDecoration: 'none' })} >Tab 3</NavLink></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<Tab1 />} />
        <Route path="/tab2" element={<Tab2 />} />
        <Route path="/tab3" element={<Tab3 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;