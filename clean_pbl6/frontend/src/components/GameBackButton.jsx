import React from 'react';

const GameBackButton = ({ onClick, children }) => (
  <button className="game-back-btn" onClick={onClick}>
    <i className="bx bx-arrow-back"></i> {children || 'Back to Games'}
  </button>
);

export default GameBackButton;
