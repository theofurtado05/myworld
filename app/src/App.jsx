import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import Legend from './components/Legend';
import StatusMessage from './components/StatusMessage';
import AuthModal from './components/auth/AuthModal';
import './index.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Verificar estado de autenticação ao carregar
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(user)
      setCurrentUser(user);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      if (window.searchLocationFromMap) {
        await window.searchLocationFromMap(searchQuery.trim());
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };


  return (
    <div className="h-full h-screen flex flex-col items-center justify-center overflow-y-scroll">
      <div className="h-full w-full h-full">
        <div className='w-full bg-gray-800 flex items-center justify-center'>
          <div className="text-white !px-4 !sm:container w-full p-4 flex justify-between items-center">
              <h1 className="text-xl font-bold">Meu Mundo</h1>
              <div>
                {currentUser ? (
                  <div className="flex flex-col items-center space-x-4">
                    <span className="text-sm  md:inline">{currentUser.email}</span>
                    <button 
                      onClick={handleLogout}
                      className="bg-red-500 text-white px-4 py-4 w-full rounded hover:bg-red-600"
                    >
                      Sair
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>

        <AuthModal 
          setCurrentUser={setCurrentUser}
          onClose={() => setShowAuthModal(false)}
          show={showAuthModal}
        />

        <div className='w-full flex items-center justify-center !mt-2'>

          {/* Barra de Busca */}
          <SearchBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
          />
        </div>

        {/* Componente do Mapa */}
        
          <Map 
            searchQuery={searchQuery}
            loading={loading}
            setLoading={setLoading}
            error={error}
            setError={setError}
            currentUser={currentUser}
          />
        
        
        {/* Mensagens de Status */}
        <StatusMessage loading={loading} error={error} />
        
        {/* Legenda */}
        <Legend />
      </div>
    </div>
  );
}

export default App;