import React from 'react';

/**
 * Board component - Renders the 3x3 Tic-Tac-Toe grid
 * @param {Array} board - Current board state (9 elements)
 * @param {Function} onSquareClick - Function to handle square clicks
 * @param {Array} winningSquares - Array of winning square indices for highlighting
 * @param {boolean} gameOver - Whether the game has ended
 * @param {Function} renderSquare - Function to render individual squares
 */
const Board = ({ board, onSquareClick, winningSquares, gameOver, renderSquare }) => {
  return (
    <div className="board">
      {/* Render 3x3 grid using CSS Grid */}
      {board.map((_, index) => renderSquare(index))}
    </div>
  );
};

export default Board;
