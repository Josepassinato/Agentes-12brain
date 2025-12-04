import React from 'react';

interface ChannelSelectorProps {
  currentChannel: 'whatsapp' | 'instagram' | 'facebook' | 'web';
  onChannelChange: (channel: 'whatsapp' | 'instagram' | 'facebook' | 'web') => void;
}

const ChannelSelector: React.FC<ChannelSelectorProps> = ({ currentChannel, onChannelChange }) => {
  const channels = [
    { id: 'web', label: 'Web Dashboard', icon: '💻', color: 'bg-blue-600' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: 'bg-green-500' },
    { id: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-pink-600' },
    { id: 'facebook', label: 'Facebook', icon: 'f', color: 'bg-blue-800' },
  ] as const;

  return (
    <div className="flex overflow-x-auto space-x-2 p-2 bg-slate-100 rounded-lg mb-4 scrollbar-hide">
      {channels.map((ch) => (
        <button
          key={ch.id}
          onClick={() => onChannelChange(ch.id)}
          className={`flex-shrink-0 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            currentChannel === ch.id
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <span className={`w-5 h-5 rounded-full ${ch.color} text-white flex items-center justify-center text-xs mr-2`}>
            {ch.icon}
          </span>
          <span className="inline">{ch.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ChannelSelector;