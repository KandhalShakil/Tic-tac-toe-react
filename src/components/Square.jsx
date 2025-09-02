import React from 'react';

/**
 * Square component - Renders individual clickable square
 * @param {string|null} value - Square value ('X', 'O', or null)
 * @param {Function} onClick - Function to call when square is clicked
 * @param {boolean} isWinning - Whether this square is part of winning combination
 * @param {boolean} disabled - Whether clicking is disabled (game over)
 */
const Square = ({ value, onClick, isWinning, disabled }) => {
  /**
   * Handle click event
   */
  const handleClick = () => {
    // Don't allow clicks if disabled or square already has value
    if (disabled || value) {
      return;
    }
    onClick();
  };

  // Determine CSS classes for styling
  const getSquareClasses = () => {
    let classes = 'square';
    
    if (isWinning) {
      classes += ' square-winning';
    }
    
    if (disabled && !value) {
      classes += ' square-disabled';
    }
    
    if (value) {
      classes += ' square-filled';
    }
    
    return classes;
  };

  return (
    <button
      className={getSquareClasses()}
      onClick={handleClick}
      disabled={disabled && !value}
      aria-label={`Square ${value || 'empty'}`}
    >
      {value}
    </button>
  );
};

export default Square;
