import React from 'react';

const CustomMarker = ({ color = '#e74c3c', size = 15 }) => {
  const style = {
    backgroundColor: color,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)'
  };

  return <div className="custom-marker" style={style} />;
};

export default CustomMarker;