import React from 'react';
import backgroundImage from './../assets/space_background_1.jpg';
import HomePageData from './HomePageData'; // Adjust the path according to your project structure

const Homepage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          filter: 'brightness(0.6)' 
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-spacex-gradient z-10"></div>

      {/* Content Container */}
      <div className="relative z-20 container mx-auto px-6 py-24 flex flex-col justify-center h-[calc(100vh+300px)]">
        <div className="max-w-4xl">
          {/* Title */}
          <h1 className="text-7xl font-bold mb-6 text-white tracking-tight">
            SpaceX Data Analysis
          </h1>

          {/* Subtitle */}
          <p className="text-2xl text-gray-300 mb-12 max-w-2xl">
            Showing the latest news and statistics about SpaceX and providing tools to satisfy your curiosity.
          </p>

          {/* CTA Buttons */}
          <div className="flex space-x-6 mb-16">
            <a 
              href="#" 
              className="px-8 py-4 bg-spacex-blue text-white font-semibold 
                         rounded-full hover:bg-opacity-90 transition duration-300"
            >
              Go To Analytics
            </a>
            <a 
              href="#" 
              className="px-8 py-4 border-2 border-white text-white 
                         rounded-full hover:bg-white hover:text-black 
                         transition duration-300"
            >
              Learn More
            </a>
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