import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Smile } from 'lucide-react';
interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
export function ChatPanel({
  isOpen,
  onClose
}: ChatPanelProps) {
  const [messages, setMessages] = useState([{
    id: 1,
    user: 'Rohan',
    text: 'Chaal!',
    type: 'text'
  }, {
    id: 2,
    user: 'Priya',
    text: 'Wait, thinking...',
    type: 'text'
  }, {
    id: 3,
    user: 'Amit',
    text: '😎',
    type: 'emoji'
  }]);
  const [input, setInput] = useState('');
  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, {
      id: Date.now(),
      user: 'You',
      text: input,
      type: 'text'
    }]);
    setInput('');
  };
  return <AnimatePresence>
      {isOpen && <>
          {/* Backdrop */}
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 0.5
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="absolute inset-0 bg-black z-40" />

          {/* Drawer */}
          <motion.div initial={{
        y: '100%'
      }} animate={{
        y: 0
      }} exit={{
        y: '100%'
      }} transition={{
        type: 'spring',
        damping: 25,
        stiffness: 200
      }} className="absolute bottom-0 left-0 right-0 h-[60%] bg-[#FFF8DC] rounded-t-3xl z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-[#D4AF37]/20 flex justify-between items-center bg-white rounded-t-3xl">
              <h3 className="font-bold text-[#8B0000]">Table Chat</h3>
              <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-full">
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              {messages.map(msg => <div key={msg.id} className={`flex flex-col ${msg.user === 'You' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-stone-500 mb-0.5 px-1">
                    {msg.user}
                  </span>
                  <div className={`px-3 py-2 rounded-xl max-w-[80%] text-sm shadow-sm
                    ${msg.user === 'You' ? 'bg-[#D4745E] text-white rounded-tr-none' : 'bg-white text-stone-800 rounded-tl-none border border-stone-100'}`}>
                    {msg.text}
                  </div>
                </div>)}
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-stone-100 flex items-center gap-2">
              <button className="p-2 text-stone-400 hover:text-[#D4AF37]">
                <Smile size={24} />
              </button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" onKeyDown={e => e.key === 'Enter' && handleSend()} />
              <button onClick={handleSend} className="p-2 bg-[#8B0000] text-white rounded-full hover:bg-[#A52A2A]">
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}