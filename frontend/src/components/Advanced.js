import React from 'react';
import Lottie from 'lottie-react';
import constructionAnimation from '../assets/website_in_progress.json'; // Replace with your actual file path
import backgroundImage from './../assets/space_background_1.jpg'; // Ensure you have this image

const Advanced = () => {
  return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            backgroundPosition: 'center', // Explicitly centers the image
            filter: 'brightness(0.6)' 
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10"></div>
  
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="bg-gray-200/50 p-8 rounded-xl shadow-lg max-w-2xl w-full mx-4 text-center">
          <Lottie 
            animationData={constructionAnimation} 
            loop={true} 
            className="mx-auto mb-6 w-full max-w-[400px] max-h-[300px] h-auto"
          />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Our website is currently under construction.
            </h1>
            <p className="text-lg text-gray-600">
              We will be back soon with a new and improved experience.
            </p>
          </div>
        </div>
      </div>
    );
  };
export default Advanced;