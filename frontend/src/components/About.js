import React, { useEffect } from 'react';
import backgroundImage from './../assets/space_background_1.jpg';
import apiClient from './../apiClient';

const About = () => {

  const [dateTime, setDateTime] = React.useState('');

  useEffect(() => {
    const fetchDateTime = async () => {
      try {
        const response = await apiClient.get('/last_refresh'); 
        console.log('Last Refresh:', response.data[0].last_refresh);
        setDateTime(response.data[0].last_refresh);
      } catch (err) {
        console.error('Error fetching data from the API:', err);
      }
    };

    fetchDateTime();
  }, []); // Empty dependency array to run on mount

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
          <p className="text-lg md:text-2xl text-gray-300 mb-6 md:mb-12 text-justify">
          This website aims to provide all the information about SpaceX launches and landings. 
          </p>
          <p className="text-lg md:text-2xl text-gray-300 mb-6 md:mb-12 text-justify">
          It is not affiliated in any way to SpaceX and the data is obtained through the Launch Library 2 API.
          </p>
          <p className="text-lg md:text-2xl text-gray-300 mb-6 md:mb-12 text-justify">
          The website is in continuous progress and new tools will be added in order to make this site the most exhaustive data analysis tool about SpaceX.
          </p>
          <p className="text-lg md:text-2xl text-gray-300 mb-6 md:mb-12 text-justify">
          For a better experience on Analytics use a desktop computer or desktop mode in your phone.
          </p>
          <p className="text-lg md:text-2xl text-gray-300 mb-6 md:mb-12 text-justify">
          Last refresh:  <span className="text-white ml-2">{dateTime} UTC</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;