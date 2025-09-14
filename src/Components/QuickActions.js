import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ActionsContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const ActionsButton = styled.button`
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #404042;
    color: white;
  }
`;

const ActionsMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: #404042;
  border: 1px solid #555;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #505052;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #555;
  }
`;

const MenuIcon = styled.span`
  font-size: 14px;
  width: 16px;
  text-align: center;
`;

const QuickActions = ({ coin, onEdit, onRemove, onToggleFavorite, isFavorite, onViewDetails, onManageAlerts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if menu is open and click is outside
      if (!isOpen) return;
      
      // Check if the click target is within our menu container
      const target = event.target;
      let isClickInside = false;
      
      try {
        if (menuRef.current) {
          // Use a more robust method to check if element contains target
          let element = target;
          while (element && element !== menuRef.current) {
            element = element.parentElement;
          }
          isClickInside = element === menuRef.current;
        }
      } catch (error) {
        console.warn('Error checking click outside:', error);
        isClickInside = false;
      }
      
      if (!isClickInside) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <ActionsContainer ref={menuRef}>
      <ActionsButton onClick={toggleMenu}>
        <i className="fa fa-ellipsis-v" aria-hidden="true"></i>
      </ActionsButton>
      
      {isOpen && (
        <ActionsMenu>
          <MenuItem onClick={() => handleAction(() => onViewDetails(coin))}>
            <MenuIcon>👁️</MenuIcon>
            View Details
          </MenuItem>
          
          <MenuItem onClick={() => handleAction(() => onManageAlerts && onManageAlerts(coin))}>
            <MenuIcon>🚨</MenuIcon>
            Manage Alerts
          </MenuItem>
          
          <MenuItem onClick={() => handleAction(() => onEdit(coin))}>
            <MenuIcon>✏️</MenuIcon>
            Edit Holdings
          </MenuItem>
          
          <MenuItem onClick={() => handleAction(() => onToggleFavorite(coin))}>
            <MenuIcon>{isFavorite ? '💔' : '❤️'}</MenuIcon>
            {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </MenuItem>
          
          <MenuItem onClick={() => handleAction(() => onRemove(coin))}>
            <MenuIcon>🗑️</MenuIcon>
            Remove from Portfolio
          </MenuItem>
        </ActionsMenu>
      )}
    </ActionsContainer>
  );
};

export default QuickActions;
