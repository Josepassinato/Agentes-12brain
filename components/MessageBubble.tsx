import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) return null;

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${
          isUser
            ? 'bg-purple-600 text-white rounded-br-none'
            : 'bg-slate-700 text-slate-100 border border-slate-600 rounded-bl-none'
        } ${message.isError ? 'bg-red-500/50 border-red-500 text-white' : ''}`}
      >
        {/* Attachments Preview */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {message.attachments.map((att, idx) => (
              <div key={idx} className="flex items-center bg-black/30 rounded p-2 text-xs backdrop-blur-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate max-w-[150px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Message Content */}
        <div className={`prose text-sm ${isUser ? 'prose-invert' : ''} max-w-none prose-p:text-current prose-headings:text-current prose-strong:text-current`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Timestamp */}
        <div className={`text-[10px] mt-1 text-right opacity-70`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
