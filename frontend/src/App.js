import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './index.css'; // Ensure Tailwind is imported
import Homepage from './components/Homepage';
import AnalyticsTab from './components/Analytics';
import Starlink from './components/Starlink';
import Advanced from './components/Advanced';
import About from './components/About';
import CustomTooltip from './components/CustomTooltip';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Analytics } from "@vercel/analytics/react";
import apiClient from './apiClient';

const NAVIGATION_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/starlink', label: 'Starlink' },
  // { path: '/advanced', label: 'Advanced' },
  { path: '/about', label: 'About' }
];

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const siteNameRef = useRef(null);

  const [dateTime, setDateTime] = React.useState('');

  useEffect(() => {
    const fetchDateTime = async () => {
      try {
        const response = await apiClient.get('/last_refresh'); 
        // console.log('Last Refresh:', response.data[0].last_refresh);
        setDateTime(response.data[0].last_refresh);
      } catch (err) {
        console.error('Error fetching data from the API:', err);
      }
    };

    fetchDateTime();
  }, []); // Empty dependency array to run on mount

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup the event listener
    return () => window.removeEventListener('resize', handleResize);
  }, [window.innerWidth]);

  useEffect(() => {
    document.title = "SpaceX Numbers"; // Or whatever your site's name should be
  }, []);

  const siteName = windowWidth <= 350 ? 'SpX Num' : 'SpaceX Numbers';

  return (
    <BrowserRouter>
      <nav className="bg-transparent absolute top-0 left-0 right-0 z-50">
        <div className="container h-12 mx-auto px-4 py-4">
          <div className="flex justify-between items-center border-b border-white/20 pb-4 h-12">
            <div className="flex items-center space-x-2">
              <NavLink 
                to="/" 
                ref={siteNameRef}
                className="text-white text-3xl font-bold tracking-wide overflow-x-auto"
              >
                {siteName}
              </NavLink>
              <CustomTooltip 
                dateTime={dateTime}
                siteNameRef={siteNameRef}
              />
            </div>
            <ul className="hidden md:flex space-x-6 lg:space-x-8 ml-auto mr-6">
              {NAVIGATION_ITEMS.map(({ path, label }, index) => (
                <li key={path} className={`${index >= 4 ? 'hidden lg:block' : ''}`}>
                  <NavLink 
                    to={path} 
                    className={({ isActive }) => 
                      `text-xl sm:text-2xl hover:text-white transition duration-300 ${
                        isActive ? 'text-white font-semibold' : 'text-white/70'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="md:block">
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
          </div>
          {/* Mobile Dropdown */}
          {isOpen && (
            <div className="block">
              <ul className="flex flex-col items-end space-y-4 py-6 px-6 bg-black bg-opacity-95 rounded-3xl w-fit ml-auto">
                {NAVIGATION_ITEMS.map(({ path, label }) => (
                  <li key={path}>
                    <NavLink 
                      to={path} 
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) => 
                        `text-xl hover:text-white transition duration-300 ${
                          isActive ? 'text-white font-semibold' : 'text-white/70'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </nav>
      <div className="mt"> 
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/analytics" element={<AnalyticsTab />} />
          <Route path="/starlink" element={<Starlink />} />
          <Route path="/advanced" element={<Advanced />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;