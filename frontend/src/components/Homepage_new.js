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
        {/* Data and Filters - Full width */}
        <div className="w-full">
          <HomePageData />
        </div>
      </div>
    </div>
  );
};

export default Homepage;