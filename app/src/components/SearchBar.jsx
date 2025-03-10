import React from 'react';
import '../index.css'

const SearchBar = ({ searchQuery, setSearchQuery, handleSearch }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full flex items-center justify-center h-[50px] container mt-[10px]">
      <input
        type="text"
        className="flex-grow !px-4 h-[50px] border border-gray-300 rounded-l-md text-base focus:outline-none"
        placeholder="Digite o nome do país ou cidade (Ex: Brasil, Buzios)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button
        className="px-4 w-[100px] h-full py-2.5 bg-green-500 text-white border-none rounded-r-md cursor-pointer text-base hover:bg-green-600 transition-colors"
        onClick={handleSearch}
      >
        Buscar
      </button>
    </div>
  );
};

export default SearchBar;