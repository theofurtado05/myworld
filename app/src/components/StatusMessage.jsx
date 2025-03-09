import React from 'react';

const StatusMessage = ({ loading, error }) => {
  return (
    <>
      {loading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 p-2.5 bg-white bg-opacity-80 rounded-md">
          Buscando localização...
        </div>
      )}
      
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 p-2.5 bg-red-500 text-white rounded-md">
          Localização não encontrada. Tente novamente.
        </div>
      )}
    </>
  );
};

export default StatusMessage;