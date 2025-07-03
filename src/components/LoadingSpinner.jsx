import React from 'react';

const LoadingSpinner = ({ size = 'h-8 w-8' }) => (
    <div className="flex justify-center items-center p-4">
        <div className={`animate-spin rounded-full border-b-2 border-amber-300 ${size}`}></div>
    </div>
);

export default LoadingSpinner;