import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ header, footer, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-slate-900 border border-slate-700 rounded-lg shadow-md ${className}`}
        {...props}
      >
        {header && (
          <div className="px-6 py-4 border-b border-slate-700">
            {header}
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-700 bg-slate-800">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';
