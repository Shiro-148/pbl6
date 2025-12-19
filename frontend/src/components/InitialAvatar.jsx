import React from 'react';

export default function InitialAvatar({ name = 'Bạn', imgUrl = '', size = 32, className = '', bgColor = '#3b82f6', textColor = '#fff', title }) {
  const letter = (name || '').trim().charAt(0).toUpperCase() || 'B';
  const commonStyle = { width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: Math.max(12, Math.floor(size * 0.45)), overflow: 'hidden' };
  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={name}
        title={title || name}
        className={className}
        style={{ ...commonStyle, objectFit: 'cover', background: '#e3e8f0' }}
      />
    );
  }
  return (
    <div
      className={className}
      title={title || name}
      style={{ ...commonStyle, background: bgColor, color: textColor }}
    >
      {letter}
    </div>
  );
}
