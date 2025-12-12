import React, { useEffect, useRef, useCallback } from 'react';
import { ChatMessage, UserRole, HUDState } from './types';

interface ChatPanelProps {
  messages: ChatMessage[];
  userRole?: UserRole;
  hudState?: HUDState;
  isAudioLoading?: boolean;
  onTypingComplete: () => void;
}

interface TypewriterProps {
  text: string;
  onComplete: () => void;
  onUpdate: () => void;
}

const TypewriterText: React.FC<TypewriterProps> = ({ text, onComplete, onUpdate }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let index = 0;

    const type = () => {
      if (index < text.length) {
        const currentText = text.substring(0, index + 1);
        if (spanRef.current) {
          spanRef.current.textContent = currentText;
        }
        index++;
        onUpdate(); // For scrolling
        const delay = 30 + (Math.random() * 25 - 10); // Human-like delay
        timeoutRef.current = window.setTimeout(type, delay);
      } else {
        onComplete();
      }
    };
    
    // Ensure previous text is cleared before starting
    if (spanRef.current) {
      spanRef.current.textContent = "";
    }

    type();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, onComplete, onUpdate]);
  
  return <span ref={spanRef}></span>;
};


const ChatPanel: React.FC<ChatPanelProps> = ({ messages, userRole = UserRole.USER, hudState, isAudioLoading, onTypingComplete }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, hudState, scrollToBottom]);

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="w-full max-w-3xl h-full flex flex-col bg-nexa-bg/40 border border-nexa-cyan/20 rounded-lg backdrop-blur-md overflow-hidden relative">
      <div className="w-full h-6 bg-nexa-cyan/5 border-b border-nexa-cyan/20 flex items-center justify-between px-3">
         <div className="text-[9px] text-nexa-cyan/70 font-mono tracking-widest uppercase flex items-center gap-2">
            {/* CHANGED: Red blinker for realism */}
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            /// CONVERSATION_LOG ///
         </div>
         {/* CHANGED: Red text for live feed for realism */}
         <div className="text-[8px] text-red-500 font-mono animate-pulse">LIVE_FEED</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth no-scrollbar">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isLastMessage = idx === messages.length - 1;

          let label = 'NEXA';
          if (isUser) {
            label = userRole === UserRole.ADMIN ? 'ADMIN' : 'USER';
          }
          
          const shouldAnimate = isLastMessage && !isUser && (hudState === HUDState.SPEAKING || hudState === HUDState.ANGRY);
          const showAudioLoader = isLastMessage && !isUser && isAudioLoading;
          
          const cleanTextForDisplay = msg.text.trim();

          return (
            <div key={msg.timestamp + idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`relative max-w-[90%] px-3 py-2 font-mono text-sm leading-relaxed ${isUser ? 'text-right border-r border-nexa-blue/30 bg-gradient-to-l from-nexa-blue/5 to-transparent' : 'text-left border-l border-nexa-cyan/30 bg-gradient-to-r from-nexa-cyan/5 to-transparent'}`}>
                <div className={`${isUser ? 'text-nexa-blue' : 'text-nexa-cyan'}`}>
                  {isUser ? (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  ) : (
                    <>
                      {shouldAnimate ? (
                        <TypewriterText text={cleanTextForDisplay} onComplete={onTypingComplete} onUpdate={scrollToBottom} />
                      ) : (
                        <span className="whitespace-pre-wrap">{cleanTextForDisplay}</span>
                      )}
                      {showAudioLoader && (
                        <div className="inline-flex items-center gap-1 ml-2">
                            <span className="w-1 h-1 bg-nexa-cyan/70 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-1 bg-nexa-cyan/70 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                            <span className="w-1 h-1 bg-nexa-cyan/70 rounded-full animate-pulse"></span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {msg.imageUrl && (
                    <div className="mt-2 border border-nexa-cyan/20 p-1 bg-black/50">
                        <img src={msg.imageUrl} alt="Visual explanation" className="w-full h-auto rounded-sm" />
                    </div>
                )}
                <div className={`text-[8px] uppercase tracking-widest mt-2 opacity-50 ${isUser ? 'text-nexa-blue' : 'text-nexa-cyan'}`}>
                   {label} &middot; {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Listening Indicator */}
        {hudState === HUDState.LISTENING && (
          <div className="flex justify-end animate-fade-in">
            <div className="relative max-w-[90%] px-3 py-2 font-mono text-sm leading-relaxed text-right border-r border-nexa-red/30 bg-gradient-to-l from-nexa-red/5 to-transparent">
              <div className="text-nexa-red flex items-center justify-end gap-2">
                <div className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 bg-nexa-red/70 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 bg-nexa-red/70 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-1 bg-nexa-red/70 rounded-full animate-pulse"></span>
                </div>
                <span>Listening</span>
              </div>
              <div className="text-[8px] uppercase tracking-widest mt-1 opacity-50 text-nexa-red">
                 {userRole === UserRole.ADMIN ? 'ADMIN' : 'USER'} &middot; CAPTURING
              </div>
            </div>
          </div>
        )}

        {/* Thinking Indicator */}
        {hudState === HUDState.THINKING && lastMessage?.role === 'user' && (
          <div className="flex justify-start animate-slide-up">
            <div className="relative max-w-[90%] px-3 py-2 font-mono text-sm leading-relaxed text-left border-l border-nexa-yellow/30 bg-gradient-to-r from-nexa-yellow/5 to-transparent">
              <div className="text-nexa-yellow flex items-center gap-2">
                <span>NEXA is processing</span>
                <div className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 bg-nexa-yellow/70 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 bg-nexa-yellow/70 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-1 bg-nexa-yellow/70 rounded-full animate-pulse"></span>
                </div>
              </div>
              <div className="text-[8px] uppercase tracking-widest mt-1 opacity-50 text-nexa-yellow">
                 SYSTEM &middot; THINKING
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChatPanel;