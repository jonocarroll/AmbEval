import React from "react";

const Card = ({ className, children, ...props }) => {
  return (
    <div 
      className={`bg-white border rounded-lg shadow-sm ${className || ""}`} 
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ className, children, ...props }) => {
  return (
    <div 
      className={`p-4 border-b ${className || ""}`} 
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ className, children, ...props }) => {
  return (
    <h3 
      className={`text-lg font-semibold ${className || ""}`} 
      {...props}
    >
      {children}
    </h3>
  );
};

const CardContent = ({ className, children, ...props }) => {
  return (
    <div 
      className={`p-4 ${className || ""}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent };
