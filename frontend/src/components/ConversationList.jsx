import React from 'react';
import { MessageSquare, Trash2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function ConversationList({ conversations, currentId, onSelect, onDelete }) {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Start a new chat to begin</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === currentId}
          onSelect={() => onSelect(conversation.id)}
          onDelete={() => onDelete(conversation.id)}
        />
      ))}
    </div>
  );
}

function ConversationItem({ conversation, isActive, onSelect, onDelete }) {
  const [showMenu, setShowMenu] = React.useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete();
  };

  return (
    <div
      className={clsx(
        'relative p-3 cursor-pointer transition-colors border-b border-gray-800',
        isActive ? 'bg-gray-800' : 'hover:bg-gray-800/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {conversation.title}
          </h4>
          {conversation.lastMessage && (
            <p className="text-xs text-gray-400 truncate mt-1">
              {conversation.lastMessage.role === 'user' ? 'You: ' : 'AI: '}
              {conversation.lastMessage.content}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
          </p>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded hover:bg-gray-700 transition opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>

          {showMenu && (
            <>
              {/* Click outside to close */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              
              {/* Menu */}
              <div className="absolute right-0 top-8 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}