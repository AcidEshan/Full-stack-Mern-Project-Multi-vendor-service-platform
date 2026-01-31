import React, { useState } from 'react';
import { FaFilter, FaTimes, FaSearch } from 'react-icons/fa';

const SearchFilters = ({ onApplyFilters, onClearFilters }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    sort: 'price'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Apply sort immediately when changed
    if (name === 'sort') {
      const updatedFilters = { ...filters, [name]: value };
      const cleanFilters = Object.entries(updatedFilters).reduce((acc, [key, val]) => {
        if (val !== '') {
          acc[key] = val;
        }
        return acc;
      }, {});
      onApplyFilters(cleanFilters);
    }
  };

  const handleApply = () => {
    // Clean up empty values
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    onApplyFilters(cleanFilters);
    setShowFilters(false);
  };

  const handleClear = () => {
    const clearedFilters = {
      search: '',
      sort: 'price'
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const handleRemoveFilter = (filterKey) => {
    const updatedFilters = { ...filters, [filterKey]: '' };
    setFilters(updatedFilters);
    
    // Apply the updated filters immediately
    const cleanFilters = Object.entries(updatedFilters).reduce((acc, [key, value]) => {
      if (value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    onApplyFilters(cleanFilters);
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== '' && val !== 'price');

  return (
    <div className="mb-6">
      {/* Search Bar & Filter Toggle */}
      <div className="flex gap-3 mb-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleInputChange}
            placeholder="Search services..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            showFilters 
              ? 'bg-[#1B4B36] text-white' 
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FaFilter />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 bg-[#FCDE70] text-[#1B4B36] text-xs px-2 py-0.5 rounded-full">
              {Object.values(filters).filter(val => val !== '' && val !== '-createdAt').length}
            </span>
          )}
        </button>

        {/* Search Button */}
        <button
          onClick={handleApply}
          className="px-6 py-3 bg-[#1B4B36] text-white rounded-lg font-medium hover:bg-[#2d7a54] transition-colors"
        >
          Search
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Advanced Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
              >
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                {/* <option value="name">Name: A to Z</option>
                <option value="-name">Name: Z to A</option> */}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClear}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-[#1B4B36] text-white rounded-lg hover:bg-[#2d7a54] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default SearchFilters;
