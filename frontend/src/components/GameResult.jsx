import React from 'react';

const GameResult = ({ percent, score, total, timer, onPlayAgain, onReview, onRetry, wrongCount }) => (
  <div className="multiple-choice-center">
    <div className="multiple-choice-result">
      <div className="multiple-choice-trophy">
        <i className="bx bx-trophy"></i>
      </div>
      <div className="multiple-choice-title">Quiz Complete!</div>
      <div className="multiple-choice-percent">{percent}%</div>
      <div className="multiple-choice-correct">
        {score} of {total} questions correct
      </div>
      <div className="multiple-choice-time">
        <i className="bx bx-time"></i> Time: {timer}
      </div>
      <div className="multiple-choice-actions">
        <button className="multiple-choice-btn play" onClick={onPlayAgain}>
          <i className="bx bx-refresh"></i> Play Again
        </button>
        <button className="multiple-choice-btn review" onClick={onReview}>
          <i className="bx bx-book-open"></i> Review Answers
        </button>
        <button className="multiple-choice-btn retry" onClick={onRetry}>
          <i className="bx bx-x"></i> Retry Wrong ({wrongCount})
        </button>
      </div>
    </div>
  </div>
);

export default GameResult;
