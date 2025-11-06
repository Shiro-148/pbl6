import React from 'react';

const GameHeader = ({ center, right, left }) => (
  <div className="match-game-header">
    <div className="match-game-header-left">{left}</div>
    <div className="match-game-header-center">{center}</div>
    <div className="match-game-header-right">{right}</div>
  </div>
);

export default GameHeader;
