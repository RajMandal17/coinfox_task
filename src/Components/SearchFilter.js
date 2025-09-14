import React, { useState } from 'react';
import styled from 'styled-components';

const SearchFilterContainer = styled.div`
  margin: 20px;
  padding: 20px;
  background: #303032;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid #555;
  border-radius: 8px;
  background: #404042;
  color: white;
  font-size: 16px;
  
  &::placeholder {
    color: #aaa;
  }
  
  &:focus {
    outline: none;
    border-color: #21ce99;
    box-shadow: 0 0 0 2px rgba(33, 206, 153, 0.2);
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #555;
  border-radius: 20px;
  background: ${props => props.active ? '#21ce99' : 'transparent'};
  color: ${props => props.active ? 'white' : '#aaa'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  
  &:hover {
    background: ${props => props.active ? '#21ce99' : '#404042'};
    border-color: #21ce99;
  }
`;

const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SortLabel = styled.span`
  color: #aaa;
  font-size: 14px;
`;

const SortSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #404042;
  color: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #21ce99;
  }
`;

const SearchFilter = ({ onSearch, onFilter, onSort, searchTerm, activeFilter, sortBy }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  const [localActiveFilter, setLocalActiveFilter] = useState(activeFilter || 'all');
  const [localSortBy, setLocalSortBy] = useState(sortBy || 'value');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (filter) => {
    setLocalActiveFilter(filter);
    onFilter(filter);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setLocalSortBy(value);
    onSort(value);
  };

  return (
    <SearchFilterContainer>
      <SearchInput
        type="text"
        placeholder="Search coins in your portfolio..."
        value={localSearchTerm}
        onChange={handleSearchChange}
      />
      
      <FilterContainer>
        <FilterButton
          active={localActiveFilter === 'all'}
          onClick={() => handleFilterChange('all')}
        >
          All Coins
        </FilterButton>
        <FilterButton
          active={localActiveFilter === 'gaining'}
          onClick={() => handleFilterChange('gaining')}
        >
          Gaining
        </FilterButton>
        <FilterButton
          active={localActiveFilter === 'losing'}
          onClick={() => handleFilterChange('losing')}
        >
          Losing
        </FilterButton>
        <FilterButton
          active={localActiveFilter === 'favorites'}
          onClick={() => handleFilterChange('favorites')}
        >
          Favorites
        </FilterButton>
      </FilterContainer>
      
      <SortContainer>
        <SortLabel>Sort by:</SortLabel>
        <SortSelect value={localSortBy} onChange={handleSortChange}>
          <option value="value">Portfolio Value</option>
          <option value="name">Coin Name</option>
          <option value="performance">Performance</option>
          <option value="quantity">Quantity</option>
        </SortSelect>
      </SortContainer>
    </SearchFilterContainer>
  );
};

export default SearchFilter;

