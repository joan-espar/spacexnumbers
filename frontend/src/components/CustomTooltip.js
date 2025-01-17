import React, { useState, useRef, useEffect } from 'react';

const CustomTooltip = ({ dateTime, siteNameRef }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    const updatePosition = () => {
      if (siteNameRef.current && tooltipRef.current && isVisible) {
        const siteNameRect = siteNameRef.current.getBoundingClientRect();
        
        // Position tooltip at the bottom-left corner of site name
        tooltipRef.current.style.left = `${siteNameRect.left}px`;
        tooltipRef.current.style.top = `${siteNameRect.bottom + 25}px`; // 10px gap below site name
      }
    };

    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, siteNameRef]);

  return (
    <div ref={iconRef} className="inline-block">
      <div 
        className="text-white cursor-pointer hover:text-gray-300 transition duration-300"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[1000] w-72 p-4 text-sm text-white bg-black rounded-lg shadow-lg"
        >
          <p>For a better experience on Analytics use a desktop computer or desktop mode in your phone.</p>
          {dateTime && <p className="mt-2 text-sm">Last refresh: <span className="ml-1">{dateTime} UTC</span> </p>}
        </div>
      )}
    </div>
  );
};

export default CustomTooltip;