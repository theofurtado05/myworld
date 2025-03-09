import React, { useState } from 'react';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import Legend from './components/Legend';
import StatusMessage from './components/StatusMessage';
import './index.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      // Usamos a função global que o componente Map expõe
      if (window.searchLocationFromMap) {
        await window.searchLocationFromMap(searchQuery.trim());
      }
    }
  };

  return (
    <div className="h-full h-screen flex flex-col items-center justify-center">
      <div className="h-full w-full max-w-4xl h-full">
        
        {/* Barra de Busca */}
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
        />

        {/* Componente do Mapa */}
        <Map 
          searchQuery={searchQuery}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
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