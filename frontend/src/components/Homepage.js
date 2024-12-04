import React from 'react';
import backgroundImage from './../assets/space_background_1.jpg'; // Ensure you have this image

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
      <div className="relative z-20 container mx-auto px-6 py-24 flex flex-col justify-center h-screen">
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

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-8 text-white">
            <div className="bg-black/40 p-6 rounded-xl border border-white/10">
              <h3 className="text-4xl font-bold mb-2">1,234+</h3>
              <p className="text-gray-300">Datasets Analyzed</p>
            </div>
            <div className="bg-black/40 p-6 rounded-xl border border-white/10">
              <h3 className="text-4xl font-bold mb-2">97%</h3>
              <p className="text-gray-300">Precision Rate</p>
            </div>
            <div className="bg-black/40 p-6 rounded-xl border border-white/10">
              <h3 className="text-4xl font-bold mb-2">42</h3>
              <p className="text-gray-300">Research Domains</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;