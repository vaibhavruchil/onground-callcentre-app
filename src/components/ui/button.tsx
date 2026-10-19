import * as React from 'react';
import { cn } from '../../lib/formatters.ts';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'forest' | 'pulse' | 'outline' | 'ghost' | 'destructive' | 'subtle';
  size?: 'default' | 'sm' | 'xs' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
      default:
        'bg-[#112E22] text-white hover:bg-[#194231] focus-visible:ring-[#112E22]',
      forest:
        'bg-[#15603E] text-white hover:bg-[#114E32] focus-visible:ring-[#15603E]',
      pulse:
        'bg-[#6D28D9] text-white hover:bg-[#5B21B6] focus-visible:ring-[#6D28D9]',
      outline:
        'border border-[#D5DBD3] bg-white text-[#111814] hover:bg-[#F1F4F0] focus-visible:ring-[#112E22]',
      subtle:
        'bg-[#EEF1ED] text-[#1D2822] hover:bg-[#E2E7E0] focus-visible:ring-[#112E22]',
      ghost:
        'text-[#37453D] hover:bg-[#ECEFEA] hover:text-[#111814] focus-visible:ring-[#112E22]',
      destructive:
        'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus-visible:ring-[#DC2626]',
    };

    const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
      default: 'h-9 px-3.5 py-2 text-xs font-medium rounded-md',
      sm: 'h-8 px-3 py-1.5 text-xs font-medium rounded-md',
      xs: 'h-7 px-2.5 py-1 text-[11px] font-medium rounded',
      lg: 'h-10 px-4 py-2 text-sm font-medium rounded-md',
      icon: 'h-8 w-8 rounded-md flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-45 cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
