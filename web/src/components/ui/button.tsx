import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap shrink-0',
          {
            'bg-foreground text-background hover:bg-foreground/90': variant === 'primary' || variant === 'default',
            'bg-muted/10 text-foreground hover:bg-muted/20': variant === 'secondary',
            'hover:bg-muted/10 text-foreground': variant === 'ghost',
            'border-2 border-foreground bg-transparent hover:bg-foreground hover:text-background': variant === 'outline',
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-8 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
