
import React from 'react';

export const AnimatedDots = ({className = "bg-current"}: {className?: string}) => (
    <div className="flex items-center gap-0.5">
        <span className={`w-1.5 h-1.5 ${className} rounded-full animate-bounce [animation-delay:-0.3s]`}></span>
        <span className={`w-1.5 h-1.5 ${className} rounded-full animate-bounce [animation-delay:-0.15s]`}></span>
        <span className={`w-1.5 h-1.5 ${className} rounded-full animate-bounce`}></span>
    </div>
);
