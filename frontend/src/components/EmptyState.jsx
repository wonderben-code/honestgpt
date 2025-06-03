import React from 'react';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionText,
  actionIcon: ActionIcon 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && actionText && (
        <button
          onClick={action}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
          {actionText}
          {ActionIcon && <ActionIcon size={20} />}
        </button>
      )}
    </div>
  );
}