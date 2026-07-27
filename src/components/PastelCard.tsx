import React from 'react';

interface PastelCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'darker';
  onClick?: () => void;
  id?: string;
}

export const PastelCard: React.FC<PastelCardProps> = ({
  children,
  className = '',
  variant = 'primary',
  onClick,
  id,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-[#cbe8fa] text-[#0a2533] border border-[#00f2ff]/30 shadow-[0_4px_20px_rgba(0,242,255,0.15)]';
      case 'accent':
        return 'bg-[#d1eefc] text-[#0a2533] border border-[#00f2ff]/60 shadow-[0_0_20px_rgba(0,242,255,0.25)]';
      case 'darker':
        return 'bg-[#b8e4f9] text-[#0a2533] border border-[#00f2ff]/40 shadow-[0_4px_20px_rgba(0,242,255,0.18)]';
      case 'primary':
      default:
        return 'bg-[#d1eefc] text-[#0a2533] border border-[#00f2ff]/35 shadow-[0_4px_20px_rgba(0,242,255,0.15)]';
    }
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`rounded-[16px] p-5 sm:p-6 transition-all duration-300 ${getVariantStyles()} ${
        onClick ? 'cursor-pointer hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgba(56,189,248,0.3)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
