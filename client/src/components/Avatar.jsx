import React, { useState } from 'react';

const Avatar = ({ src, name = 'User', size = 'md', className = '', onlineStatus, isOnline }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Deterministic background color based on name string
  const getBGColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-emerald-500 text-white',
      'bg-blue-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-orange-500 text-white',
      'bg-teal-500 text-white',
      'bg-indigo-500 text-white',
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Extract initials
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Sizes map
  const sizes = {
    xs: 'w-7 h-7 text-[10px] rounded-lg',
    sm: 'w-9 h-9 text-xs rounded-xl',
    md: 'w-11 h-11 text-sm rounded-2xl',
    lg: 'w-16 h-16 text-lg rounded-[22px]',
    xl: 'w-24 h-24 text-2xl rounded-[32px]',
    xxl: 'w-32 h-32 text-4xl rounded-[40px]',
  };

  const selectedSize = sizes[size] || sizes.md;
  const initials = getInitials(name);
  const bgColor = getBGColor(name);
  
  const showDot = isOnline || onlineStatus === 'online';

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      {src && !error ? (
        <div className={`relative overflow-hidden ${selectedSize.split(' ')[0]} ${selectedSize.split(' ')[1]} ${selectedSize.split(' ').slice(2).join(' ')}`}>
          {loading && (
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          )}
          <img
            src={src}
            alt={name}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              loading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>
      ) : (
        <div className={`flex items-center justify-center font-bold font-sans tracking-wider shadow-soft ${selectedSize} ${bgColor}`}>
          {initials}
        </div>
      )}

      {/* Online indicator badge dot */}
      {showDot && (
        <span className={`absolute bottom-0 right-0 block rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 ${
          size === 'xs' || size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'
        }`}></span>
      )}
    </div>
  );
};

export default Avatar;
