import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './index.css'; // Ensure Tailwind is imported
import Homepage from './components/Homepage';
import Analytics from './components/Analytics';
import AdvancedAnalytics from './components/AdvancedAnalytics';

function App() {
  return (
    <BrowserRouter>
      <nav className="bg-transparent absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b border-white/20 pb-4">
            <div className="text-white text-3xl font-bold tracking-wide mb-4 sm:mb-0">SpaceX Numbers</div>
            <ul className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
              <li>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `text-2xl text-white/70 hover:text-white transition duration-300 ${
                      isActive ? 'text-white font-semibold' : ''
                    }`
                  }
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/analytics" 
                  className={({ isActive }) => 
                    `text-2xl text-white/70 hover:text-white transition duration-300 ${
                      isActive ? 'text-white font-semibold' : ''
                    }`
                  }
                >
                  Analytics
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/advanced-analytics" 
                  className={({ isActive }) => 
                    `text-2xl text-white/70 hover:text-white transition duration-300 ${
                      isActive ? 'text-white font-semibold' : ''
                    }`
                  }
                >
                  Advanced Analytics
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;