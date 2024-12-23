import React from 'react';
import backgroundImage from './../assets/space_background_1.jpg';
import HomePageData from './HomePageData';
import { NavLink } from 'react-router-dom';

const Homepage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center', // Explicitly centers the image
          filter: 'brightness(0.6)' 
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-spacex-gradient z-10"></div>

      {/* Content Container */}
      <div className="relative z-20 container mx-auto py-24 md:py-28 px-6 flex flex-col justify-center h-auto">
        <div className="max-w-4xl">
          {/* Title */}
          <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 text-white tracking-tight">
            SpaceX Data Analysis
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-2xl text-gray-300 mb-6 md:mb-12 max-w-2xl">
            Showing the latest news and statistics about SpaceX and providing tools to satisfy your curiosity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-8 sm:mb-16">
            <NavLink 
              to="/analytics" 
              className="px-4 sm:px-8 py-2 sm:py-4 bg-spacex-blue text-white font-semibold 
                        rounded-full hover:bg-opacity-90 transition duration-300 h-13 w-40 sm:w-auto"
            >
              Go To Analytics
            </NavLink>
            <NavLink 
              to="/about" 
              className="px-4 sm:px-8 py-2 sm:py-4 border-2 border-white text-white 
                        rounded-full hover:bg-white hover:text-black 
                        transition duration-300 w-40 sm:w-auto"
            >
              Learn More
            </NavLink>
          </div>
        </div>

        {/* Data and Filters - Full width */}
        <div className="w-full">
          <HomePageData />
        </div>
      </div>
    </div>
  );
};

export default Homepage;