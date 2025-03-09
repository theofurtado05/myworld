import React from 'react';
import '../index.css'

const SearchBar = ({ searchQuery, setSearchQuery, handleSearch }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-10 flex w-4/5 max-w-lg">
      <input
        type="text"
        className="flex-grow !px-4 h-[50px] border border-gray-300 rounded-l-md text-base focus:outline-none"
        placeholder="Digite o nome do país ou cidade (Ex: Brasil, Buzios)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button
        className="px-4 w-[100px] py-2.5 bg-green-500 text-white border-none rounded-r-md cursor-pointer text-base hover:bg-green-600 transition-colors"
        onClick={handleSearch}
      >
        Buscar
      </button>
    </div>
  );
};

export default SearchBar;