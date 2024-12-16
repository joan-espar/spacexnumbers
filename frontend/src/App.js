import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './index.css'; // Ensure Tailwind is imported
import Homepage from './components/Homepage';
import Analytics from './components/Analytics';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import { FaBars, FaTimes } from 'react-icons/fa'; // Assuming you're using react-icons for icons

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BrowserRouter>
      <nav className="bg-transparent absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center border-b border-white/20 pb-4">
            <div className="text-white text-3xl font-bold tracking-wide">SpaceX Numbers</div>
            <div className="md:hidden">
              {isOpen ? (
                <FaTimes 
                  className="text-white text-2xl cursor-pointer"
                  onClick={() => setIsOpen(!isOpen)}
                />
              ) : (
                <FaBars 
                  className="text-white text-2xl cursor-pointer"
                  onClick={() => setIsOpen(!isOpen)}
                />
              )}
            </div>
            <ul className="hidden md:flex space-x-8">
              <li>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `text-xl sm:text-2xl  hover:text-white transition duration-300 ${
                      isActive ? 'text-white font-semibold' : 'text-white/70'
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
                    `text-xl sm:text-2xl hover:text-white transition duration-300 ${
                      isActive ? 'text-white font-semibold' : 'text-white/70'
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
                    `text-xl sm:text-2xl hover:text-white transition duration-300 ${
                      isActive ? 'text-white font-semibold' : 'text-white/70'
                    }`
                  }
                >
                  Advanced
                </NavLink>
              </li>
            </ul>
          </div>
          {/* Mobile Dropdown */}
          {isOpen && (
            <div className="md:hidden">
              <ul className="flex flex-col items-end space-y-4 py-6 px-6 bg-black bg-opacity-95 rounded-3xl w-fit ml-auto">
                <li>
                  <NavLink 
                    to="/" 
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => 
                      `text-xl hover:text-white transition duration-300 ${
                        isActive ? 'text-white font-semibold' : 'text-white/70'
                      }`
                    }
                  >
                    Home
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/analytics" 
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => 
                      `text-xl hover:text-white transition duration-300 ${
                        isActive ? 'text-white font-semibold' : 'text-white/70'
                      }`
                    }
                  >
                    Analytics
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/advanced-analytics" 
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => 
                      `text-xl hover:text-white transition duration-300 ${
                        isActive ? 'text-white font-semibold' : 'text-white/70'
                      }`
                    }
                  >
                    Advanced
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>
      <div className="mt"> 
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;