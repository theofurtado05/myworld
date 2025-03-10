import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const AuthModal = ({ setCurrentUser, onClose, show }) => {
  const [showLogin, setShowLogin] = useState(true);

  // If show is false, don't render the modal
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="max-w-md w-full">
        {showLogin ? (
          <Login 
            setShowLogin={setShowLogin} 
            setCurrentUser={setCurrentUser} 
            onClose={onClose}
          />
        ) : (
          <Register 
            setShowLogin={setShowLogin} 
            setCurrentUser={setCurrentUser} 
            onClose={onClose}
          />
        )}
        <button 
          onClick={onClose}
          className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default AuthModal;