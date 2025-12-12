import React, { useState, useEffect, useRef, useCallback } from 'react';
import Auth from './components/Auth';
import HUD from './components/HUD';
import ChatPanel from './ChatPanel';
import AdminPanel from './components/AdminPanel';
import { UserProfile, UserRole, HUDState, ChatMessage, AppConfig, Theme } from './types';
import { generateTextResponse, generateSpeech, generateIntroductoryMessage, generateVisualExplanation } from './services/geminiService';
import { playMicOnSound, playMicOffSound } from './services/audioService';

// --- ICONS ---
const GearIcon = () => ( <svg className="w-5 h-5 text-nexa-cyan/80 hover:text-nexa-text transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-1.065 2.572c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 001.065-2.572c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> );
const LogoutIcon = () => ( <svg className="w-5 h-5 text-nexa-cyan/80 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> );
const MicIcon = () => ( <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4-12v8m8-8v8m-12-5v2m16-2v2" /></svg> );

// --- PRONUNCIATION FIX HELPER ---
const prepareTextForSpeech = (text: string): string => {
  let cleanText = text.replace(/[*_#`]/g, ''); // Remove markdown characters
  // Fix for 'Nexa' pronunciation (sounds like 'Nek-saa')
  cleanText = cleanText.replace(/Nexa/gi, 'Nek-saa');
  // Final, 100% correct fix for 'Lohave' by using Devanagari script for TTS.
  cleanText = cleanText.replace(/Lohave/gi, 'लोहवे');
  return cleanText.trim();
};

// --- HELPER & STATE COMPONENTS ---
const StatusBar = ({ role, onLogout, onSettings, latency }: any) => ( <div className="w-full h-16 shrink-0 flex justify-between items-center px-6 border-b border-nexa-cyan/10 bg-nexa-bg/80 backdrop-blur-md z-40 relative"> <div className="flex items-center gap-4"><div className="flex flex-col items-start"><div className="text-[10px] text-nexa-cyan font-mono tracking-widest uppercase">System Online</div><div className="flex gap-1 mt-1"><div className="w-8 h-1 bg-nexa-cyan shadow-[0_0_5px_currentColor]"></div><div className="w-2 h-1 bg-nexa-cyan/50"></div><div className="w-1 h-1 bg-nexa-cyan/20"></div></div></div>{latency !== null && (<div className="hidden sm:block text-[9px] font-mono text-nexa-cyan/60 border-l border-nexa-cyan/20 pl-4"> API LATENCY: <span className="text-nexa-text">{latency}ms</span></div>)}</div><div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none"><div className="text-xl font-bold tracking-[0.3em] text-nexa-text/90 drop-shadow-[0_0_10px_rgba(var(--rgb-cyan),0.5)]">NEXA</div></div><div className="flex items-center gap-4"><button onClick={onSettings} className="p-2 hover:bg-nexa-cyan/10 rounded-full transition-colors"><GearIcon /></button><button onClick={onLogout} className="p-2 hover:bg-red-500/10 rounded-full transition-colors"><LogoutIcon /></button></div></div> );
const ControlDeck = ({ onMicClick, hudState }: any) => ( <div className="w-full h-24 shrink-0 bg-gradient-to-t from-nexa-bg via-nexa-bg/90 to-transparent z-40 relative flex items-center justify-center pb-6"><div className="absolute bottom-0 w-full h-[1px] bg-nexa-cyan/30"></div><button onClick={onMicClick} className={`relative w-20 h-20 flex items-center justify-center transition-all duration-300 group ${hudState === HUDState.LISTENING || hudState === HUDState.ANGRY ? 'scale-110' : 'hover:scale-105 active:scale-95'} ${hudState === HUDState.IDLE ? 'animate-breathing' : ''}`}><div className={`absolute inset-0 bg-nexa-bg border ${hudState === HUDState.LISTENING || hudState === HUDState.ANGRY ? 'border-nexa-red shadow-[0_0_30px_rgba(255,42,42,0.6)]' : 'border-nexa-cyan shadow-[0_0_20px_rgba(var(--rgb-cyan),0.4)]'} transition-all duration-300`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div><div className={`relative z-10 ${hudState === HUDState.LISTENING || hudState === HUDState.ANGRY ? 'text-nexa-red animate-pulse' : 'text-nexa-cyan group-hover:text-nexa-text'} transition-colors`}><MicIcon /></div></button></div> );
const pcmToAudioBuffer = (pcmData: ArrayBuffer, context: AudioContext): AudioBuffer => { const int16Array = new Int16Array(pcmData); const float32Array = new Float32Array(int16Array.length); for (let i = 0; i < int16Array.length; i++) { float32Array[i] = int16Array[i] / 32768; } const buffer = context.createBuffer(1, float32Array.length, 24000); buffer.getChannelData(0).set(float32Array); return buffer; };

type SystemStatus = 'unauthenticated' | 'initializing' | 'ready' | 'error';
type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmationWord?: string;
};

const ConfirmationModal: React.FC<ConfirmationModalProps & { onClose: () => void }> = ({ isOpen, title, message, onConfirm, onClose, confirmationWord }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(''); // Reset input when modal opens
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = confirmationWord ? inputValue !== confirmationWord : false;

  return (
    <div className="fixed inset-0 bg-nexa-bg/80 flex items-center justify-center z-[100] backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-nexa-bg border-2 border-red-500/50 p-6 shadow-[0_0_30px_rgba(255,42,42,0.4)]">
        <h2 className="text-red-500 text-lg font-bold tracking-widest font-mono">{title}</h2>
        <p className="text-nexa-text/80 mt-4 font-sans leading-relaxed">{message}</p>
        
        {confirmationWord && (
          <div className="mt-6">
            <p className="text-xs text-center text-nexa-text/60 font-mono mb-2">To confirm, type "{confirmationWord}" below.</p>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              className="w-full bg-red-900/20 border border-red-500/50 text-nexa-text text-center font-mono tracking-[0.3em] py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="text-nexa-text/60 hover:text-nexa-text font-bold tracking-wider transition-colors">CANCEL</button>
          <button 
            onClick={onConfirm} 
            disabled={isConfirmDisabled}
            className={`bg-red-600 text-white font-bold tracking-widest py-2 px-6 transition-colors ${isConfirmDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500'}`}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountManager: React.FC<{ isOpen: boolean, onClose: () => void, onDeleteUserHistory: (mobile: string) => void }> = ({ isOpen, onClose, onDeleteUserHistory }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);

    useEffect(() => {
      if (isOpen) {
        const profiles: { [mobile: string]: UserProfile } = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nexa_user_')) {
            try {
              const user = JSON.parse(localStorage.getItem(key)!);
              if (user && user.mobile) { profiles[user.mobile] = user; }
            } catch (e) { console.error(`Failed to parse user data`, e); }
          }
        }
        const usersWithHistory: UserProfile[] = [];
        const foundMobiles = new Set<string>();
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nexa_chat_')) {
            const mobile = key.replace('nexa_chat_', '');
            if (!foundMobiles.has(mobile)) {
              const userProfile = profiles[mobile] ?? { name: `User ${mobile.slice(-4)}`, mobile, role: UserRole.USER };
              usersWithHistory.push(userProfile);
              foundMobiles.add(mobile);
            }
          }
        }
        setUsers(usersWithHistory);
      }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-nexa-bg/80 flex items-center justify-center z-[90] backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-nexa-bg/95 border border-nexa-cyan rounded-lg p-4 shadow-[0_0_20px_rgba(var(--rgb-cyan),0.3)]">
                <div className="flex justify-between items-center mb-4 border-b border-nexa-cyan/20 pb-2">
                    <h2 className="text-nexa-cyan font-mono text-sm tracking-wider">MANAGE USER DATA</h2>
                    <button onClick={onClose} className="text-nexa-text/60 hover:text-nexa-text text-2xl leading-none">&times;</button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                    {users.length > 0 ? users.map(user => (
                        <div key={user.mobile} className="flex items-center justify-between p-2 bg-nexa-cyan/5">
                            <div><p className="font-bold text-nexa-text">{user.name}</p><p className="text-xs text-nexa-text/60 font-mono">{user.mobile}</p></div>
                            <button onClick={() => onDeleteUserHistory(user.mobile)} className="bg-red-900/50 border border-red-500 text-red-500 text-xs font-mono px-3 py-1 hover:bg-red-900/80 transition-colors">DELETE HISTORY</button>
                        </div>
                    )) : (<p className="text-nexa-text/50 text-center py-4 font-mono">No user data found.</p>)}
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('unauthenticated');
  const [systemError, setSystemError] = useState<string | null>(null);

  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [hudState, setHudState] = useState<HUDState>(HUDState.IDLE);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig>({ animationsEnabled: true, hudRotationSpeed: 1, theme: 'DARK' });
  const [latency, setLatency] = useState<number | null>(null);
  const [pendingIntro, setPendingIntro] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [confirmationProps, setConfirmationProps] = useState<ConfirmationModalProps | null>(null);
  const [isAccountManagerOpen, setAccountManagerOpen] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isProcessingRef = useRef(false);
  const isStudySessionActive = useRef(false);
  
  const currentRequestIdRef = useRef<number>(0);
  
  const memoryRef = useRef<ChatMessage[]>([]);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const listeningTimeoutRef = useRef<number | null>(null);
  
  // Theme Application Logic
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let isDark = true;
      
      if (config.theme === 'LIGHT') {
        isDark = false;
      } else if (config.theme === 'SYSTEM') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.remove('light-mode');
      } else {
        root.classList.add('light-mode');
      }
    };
    
    applyTheme();

    // Listen for system changes if mode is SYSTEM
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => { if (config.theme === 'SYSTEM') applyTheme(); };
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [config.theme]);

  useEffect(() => {
    const savedUser = localStorage.getItem('nexa_user');
    if (savedUser) { handleLogin(JSON.parse(savedUser)); }
    const savedConfig = localStorage.getItem('nexa_config');
    if (savedConfig) { try { setConfig({ ...JSON.parse(savedConfig) }); } catch (e) { console.error("Failed to parse config, resetting.", e); } }
    
    const unlockHandler = () => { unlockAudioContext(); window.removeEventListener('touchstart', unlockHandler); window.removeEventListener('click', unlockHandler); };
    window.addEventListener('touchstart', unlockHandler);
    window.addEventListener('click', unlockHandler);
  }, []);

  useEffect(() => { localStorage.setItem('nexa_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { if (!user || user.role !== UserRole.ADMIN) return; const checkTime = () => { const now = new Date(); if (now.getHours() === 23 && now.getMinutes() === 0) { speakSystemMessage("Sir… 11 baj chuke hain. Kal aapko Encave Cafe duty bhi karni hai. Please rest kar lijiye… main yahin hoon.", user); } if (now.getHours() === 8 && now.getMinutes() === 0) { speakSystemMessage("Sir… aaj Encave Café duty hai, time se tayar ho jaiye.", user); } }; const interval = setInterval(checkTime, 60000); return () => clearInterval(interval); }, [user]);
  
  useEffect(() => {
    if (systemStatus === 'ready' && pendingIntro && user) {
      const introTimeout = setTimeout(() => {
        speakSystemMessage(pendingIntro, user);
        setPendingIntro(null);
      }, 500); 
      return () => clearTimeout(introTimeout);
    }
  }, [systemStatus, pendingIntro, user]);

  useEffect(() => {
    if (!isTyping && !isAudioPlaying && isProcessingRef.current) {
      if (hudState === HUDState.SPEAKING || hudState === HUDState.ANGRY) {
        setHudState(HUDState.IDLE);
        isProcessingRef.current = false;
      }
    }
  }, [isTyping, isAudioPlaying, hudState]);

  const saveMemory = (currentUser: UserProfile | null) => { if (currentUser) localStorage.setItem(`nexa_chat_${currentUser.mobile}`, JSON.stringify(memoryRef.current)); };
  const getAudioContext = () => { if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); return audioContextRef.current; };
  const unlockAudioContext = () => { const ctx = getAudioContext(); if (ctx.state === 'suspended') { ctx.resume().then(() => { try { const source = ctx.createBufferSource(); source.buffer = ctx.createBuffer(1, 1, 22050); source.connect(ctx.destination); source.start(0); } catch(e) { console.warn("Audio unlock failed", e); } }); } };

  const handleLogin = async (profile: UserProfile) => {
    unlockAudioContext();
    setUser(profile);
    setSystemStatus('initializing');
    localStorage.setItem('nexa_user', JSON.stringify(profile));
    localStorage.setItem(`nexa_user_${profile.mobile}`, JSON.stringify(profile));

    // --- REVISED MEMORY/STATE LOGIC ---
    const savedMemoryRaw = localStorage.getItem(`nexa_chat_${profile.mobile}`);
    const savedMemory = savedMemoryRaw ? JSON.parse(savedMemoryRaw) : [];
    memoryRef.current = savedMemory;
    setChatLog(savedMemory);
    setPendingIntro(null);
  
    try {
      if (savedMemory.length === 0) {
        // This is a fresh session, play intro
        setHudState(HUDState.THINKING); // Set state BEFORE rendering main UI
        
        let dynamicIntro = await generateIntroductoryMessage(profile);
        
        // Admin notification logic for fresh sessions
        if (profile.role === UserRole.ADMIN) {
          try {
            const notifications: string[] = JSON.parse(localStorage.getItem('nexa_admin_notifications') || '[]');
            if (notifications.length > 0) {
              const names = notifications.map(n => n.match(/user '(.*?)'/)?.[1]).filter(Boolean as any as (x: string | undefined) => x is string);
              if (names.length > 0) {
                const uniqueNames = [...new Set(names)];
                let nameSummary = uniqueNames.length === 1 ? uniqueNames[0] : (uniqueNames.length === 2 ? `${uniqueNames[0]} aur ${uniqueNames[1]}` : `${uniqueNames.slice(0, -1).join(', ')}, aur ${uniqueNames[uniqueNames.length - 1]}`);
                const notificationPrefix = `Sir, aapke wapas aane ka intezaar tha. Ek choti si report hai... jab aap yahan nahi the, tab ${nameSummary} aapke baare mein pooch rahe the. Aap chinta mat kijiye, maine sab aache se, apne style me, sambhal liya hai.`;
                dynamicIntro = `${notificationPrefix}\n\n${dynamicIntro}`;
              }
              localStorage.removeItem('nexa_admin_notifications');
            }
          } catch(e) { console.error("Failed to process admin notifications", e); localStorage.removeItem('nexa_admin_notifications'); }
        }
        
        setPendingIntro(dynamicIntro);

      } else {
        // This is a returning session, no intro, go to IDLE
        setHudState(HUDState.IDLE);
      }

      setSystemStatus('ready');

    } catch (e: any) {
      console.error("Initialization Error:", e);
      let friendlyError = 'Connection to NEXA Core failed. Please try again.';
      if (e.toString().includes('API_KEY_MISSING')) { friendlyError = 'SYSTEM OFFLINE: Please enter your Gemini API Key on login.'; } 
      else if (e.toString().includes('404')) { friendlyError = 'SYSTEM OFFLINE: Model not found.'; }
      setSystemError(friendlyError);
      setSystemStatus('error');
    }
  };

  const handleLogout = () => { setUser(null); setSystemStatus('unauthenticated'); localStorage.removeItem('nexa_user'); setChatLog([]); memoryRef.current = []; setHudState(HUDState.IDLE); setPendingIntro(null); };
  
  const stopAllInteraction = () => {
    currentRequestIdRef.current += 1;
    if (currentAudioSourceRef.current) {
        try { currentAudioSourceRef.current.stop(); } catch(e) { /* ignore */ }
        currentAudioSourceRef.current = null;
    }
    if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
    
    isProcessingRef.current = false;
    isStudySessionActive.current = false;
    setIsAudioLoading(false);
    setIsTyping(false);
    setIsAudioPlaying(false);
  };

  const playAudio = (buffer: ArrayBuffer, onEndCallback: () => void) => {
    if (!isProcessingRef.current) return;
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    try {
      const source = ctx.createBufferSource();
      source.buffer = pcmToAudioBuffer(buffer, ctx);
      source.connect(ctx.destination);
      currentAudioSourceRef.current = source;
      source.onended = () => { currentAudioSourceRef.current = null; onEndCallback(); };
      source.start();
    } catch (e) { onEndCallback(); throw e; }
  };
  
  const speakSystemMessage = async (displayText: string, currentUser: UserProfile | null) => {
    if (!currentUser) return;
    
    stopAllInteraction();
    const requestId = currentRequestIdRef.current;
    
    if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
    setHudState(HUDState.THINKING);
    isProcessingRef.current = true;
    setIsAudioLoading(true);

    try {
      const textForSpeech = prepareTextForSpeech(displayText);
      const audioBuffer = await generateSpeech(textForSpeech, currentUser.role);
      
      if (currentRequestIdRef.current !== requestId) return;
      setIsAudioLoading(false);
      const modelMessage: ChatMessage = { role: 'model', text: displayText, timestamp: Date.now() };
      memoryRef.current.push(modelMessage);
      saveMemory(currentUser);

      if (audioBuffer) {
        setHudState(HUDState.SPEAKING);
        setIsTyping(true);
        setIsAudioPlaying(true);
        setChatLog(prev => [...prev, modelMessage]);
        playAudio(audioBuffer, () => setIsAudioPlaying(false));
      } else {
        setChatLog(prev => [...prev, modelMessage]);
        setHudState(HUDState.IDLE);
        isProcessingRef.current = false;
      }
    } catch (e: any) {
      if (currentRequestIdRef.current !== requestId) return;
      console.error("TTS failed:", e);
      setIsAudioLoading(false);
      const modelMessage: ChatMessage = { role: 'model', text: displayText, timestamp: Date.now() };
      if (!memoryRef.current.find(m => m.timestamp === modelMessage.timestamp)) {
        memoryRef.current.push(modelMessage);
        saveMemory(currentUser);
      }
      setChatLog(prev => [...prev, modelMessage]);
      setHudState(HUDState.IDLE);
      isProcessingRef.current = false;
    }
  };

  const handleMicClick = () => {
    unlockAudioContext();
    
    if (isProcessingRef.current) {
      playMicOffSound();
      stopAllInteraction();
      recognitionRef.current?.abort();
      setHudState(HUDState.IDLE);
      return;
    }
  
    if (hudState === HUDState.LISTENING) {
      recognitionRef.current?.stop();
    } else {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'hi-IN';
  
        recognition.onstart = () => { playMicOnSound(); setHudState(HUDState.LISTENING); };
  
        recognition.onend = () => {
          if (!isProcessingRef.current) {
            playMicOffSound();
            if (listeningTimeoutRef.current) { clearTimeout(listeningTimeoutRef.current); listeningTimeoutRef.current = null; }
            setHudState(HUDState.IDLE);
          }
          recognitionRef.current = null;
        };
  
        recognition.onerror = (event: any) => { console.error("Speech Recognition Error:", event.error); setHudState(HUDState.IDLE); };
  
        recognition.onresult = (event: any) => {
          if (listeningTimeoutRef.current) { clearTimeout(listeningTimeoutRef.current); listeningTimeoutRef.current = null; }
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
             setHudState(HUDState.THINKING);
             isProcessingRef.current = true;
             recognition.stop();
             
             // OPTIMIZATION: Removed separate transliteration step. 
             // Sending raw Hindi/transcript directly to processQuery.
             const correctedTranscript = transcript.replace(/alexa|naksha|neta|next|naks|meksa|niksa/gi, 'Nexa');
             processQuery(correctedTranscript);
          }
        };
  
        recognition.start();
        if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
        listeningTimeoutRef.current = window.setTimeout(() => { recognition.abort(); }, 15000);
      } else {
        setChatLog(prev => [...prev, { role: 'model', text: `// SYSTEM ERROR: Speech Recognition not supported.`, timestamp: Date.now() }]);
      }
    }
  };

  const handleApiError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    let errorDetail = "Failed to call the Gemini API.";
    if (error && error.message) {
       errorDetail = error.message;
    }
    const errorMessage: ChatMessage = { role: 'model', text: `SYSTEM ERROR: ${errorDetail}`, timestamp: Date.now() };
    setChatLog(prev => [...prev, errorMessage]);
    setHudState(HUDState.IDLE);
    isProcessingRef.current = false;
    isStudySessionActive.current = false;
    setIsAudioLoading(false);
  };
  
  const processQuery = async (text: string, options?: { isHidden?: boolean }) => {
    stopAllInteraction();
    const requestId = currentRequestIdRef.current;
    isProcessingRef.current = true;
    setHudState(HUDState.THINKING);

    // Add message to memory for context, but only to chat log if not hidden
    const userMessage: ChatMessage = { role: 'user', text, timestamp: Date.now() };
    memoryRef.current.push(userMessage); 
    saveMemory(user);
    if (!options?.isHidden) {
      setChatLog(prev => [...prev, userMessage]); 
    }

    try {
      let modelMessage: ChatMessage;
      const historyForApi = memoryRef.current.slice(0, -1).slice(-10).map((msg: ChatMessage) => ({ role: msg.role, parts: [{ text: msg.text }] }));

      if (isStudySessionActive.current) {
        const startTime = performance.now();
        const studyPrompt = `[VISUAL EXPLANATION] Question: "${text}" Task: 1. Text: Explain the answer in simple, casual Hinglish. 2. Image: Create a simple, clear diagram or visual aid for this topic. Use minimal text on the image.`;
        const { text: explanation, imageUrl } = await generateVisualExplanation(studyPrompt, historyForApi);
        setLatency(Math.round(performance.now() - startTime));
        if (currentRequestIdRef.current !== requestId) return;
        modelMessage = { role: 'model', text: explanation, imageUrl, timestamp: Date.now() };
      } else {
        const startTime = performance.now();
        const rawAiResponse = await generateTextResponse(text, user!, historyForApi);
        setLatency(Math.round(performance.now() - startTime));
        if (currentRequestIdRef.current !== requestId) return;
        
        const stateMatch = rawAiResponse.match(/\[\[STATE:(.*?)\]\]/); 
        const nextState = stateMatch ? stateMatch[1] : null; 
        if(nextState === 'ANGRY') { setHudState(HUDState.ANGRY); navigator.vibrate?.([100, 50, 100]); }
        
        // Remove system tags [[...]], stage directions *...*, and leading/trailing spaces
        const textForDisplay = rawAiResponse
          .replace(/\[\[.*?\]\]/g, '')
          .replace(/\*.*?\*/g, '') // Remove text between asterisks
          .replace(/^\(.*\)\s*/, '') // Remove leading parentheticals
          .trim();
        
        // Activate study mode if the AI asks the trigger question
        if (textForDisplay.includes("Aapko kaunsa question samjhna hai?")) {
          isStudySessionActive.current = true;
        }

        modelMessage = { role: 'model', text: textForDisplay, timestamp: Date.now(), isAngry: nextState === 'ANGRY' };
      }

      memoryRef.current.push(modelMessage); saveMemory(user);
      setIsAudioLoading(true);
      const textForSpeech = prepareTextForSpeech(modelMessage.text); 
      const audioBuffer = await generateSpeech(textForSpeech, user!.role, modelMessage.isAngry);
      
      if (currentRequestIdRef.current !== requestId) return;
      setIsAudioLoading(false);
      
      if (audioBuffer) { 
        const finalState = modelMessage.isAngry ? HUDState.ANGRY : HUDState.SPEAKING;
        setHudState(finalState);
        setIsTyping(true);
        setIsAudioPlaying(true);
        setChatLog(prev => [...prev, modelMessage]); 
        playAudio(audioBuffer, () => setIsAudioPlaying(false)); 
      } else { 
        setChatLog(prev => [...prev, modelMessage]); 
        setHudState(HUDState.IDLE); 
        isProcessingRef.current = false; 
      }
    } catch (e) { handleApiError(e, "Process Query"); }
  };

  const handleStudySessionRequest = (subjectCode: string, subjectName: string) => {
    const studyPrompt = `[SYSTEM_OVERRIDE_COMMAND: INITIATE_EXAM_PREP_MODE] Target Subject: ${subjectCode} (${subjectName}). Goal: IGNOU BCA Term End Exam (Dec 2025). Constraint: URGENT. MINIMAL LATENCY. STRICTLY NO INTRODUCTIONS. Language: CASUAL HINGLISH ONLY. Directive: 1. Do NOT teach the whole syllabus. Focus ONLY on previous year questions. 2. Identify the Top 3 most repeated questions from the last 1-2 years of exams. 3. Start DIRECTLY by listing these 3 questions. Do NOT provide answers yet. 4. Ask me which question I want to start with ("Aapko kaunsa question samjhna hai?"). 5. Once I select a question, provide a simple, easy-to-understand answer for it in Hinglish.`;
    processQuery(studyPrompt, { isHidden: true });
  };

  const handleTypingComplete = useCallback(() => { setIsTyping(false); }, []);

  const handlePurgeRequest = () => {
    setConfirmationProps({
      isOpen: true,
      title: 'CONFIRM MEMORY PURGE',
      message: 'This action is irreversible and will delete your entire conversation history.',
      confirmationWord: 'PURGE',
      onConfirm: () => {
        setChatLog([]);
        memoryRef.current = [];
        if (user) localStorage.removeItem(`nexa_chat_${user.mobile}`);
        setConfirmationProps(null);
        setAdminPanelOpen(false);
      }
    });
  };

  const handleDeleteUserHistoryRequest = (mobile: string) => {
    setConfirmationProps({
        isOpen: true,
        title: 'DELETE USER HISTORY',
        message: `Delete all data for user ${mobile}?`,
        onConfirm: () => {
            localStorage.removeItem(`nexa_chat_${mobile}`);
            if (user && user.mobile === mobile) { setChatLog([]); memoryRef.current = []; }
            setConfirmationProps(null);
            setAccountManagerOpen(false); 
        }
    });
  };

  if (systemStatus === 'unauthenticated') { return <Auth onLogin={handleLogin} />; }
  if (systemStatus === 'initializing') { return ( <div className="fixed inset-0 bg-nexa-bg flex flex-col items-center justify-center text-nexa-cyan font-mono z-[100]"> <div className="relative w-32 h-32 flex items-center justify-center"><div className="absolute w-full h-full border-2 border-nexa-cyan rounded-full border-t-transparent animate-spin"></div><div className="text-2xl font-bold tracking-widest">NEXA</div></div><p className="mt-8 tracking-[0.3em] animate-pulse">CONNECTING TO CORE...</p></div> ); }
  if (systemStatus === 'error') { return ( <div className="fixed inset-0 bg-nexa-bg flex flex-col items-center justify-center p-6 text-center z-[100]"> <div className="border border-red-500/50 p-8 max-w-sm w-full bg-red-900/10 backdrop-blur-md"><h1 className="text-red-500 text-lg font-bold tracking-widest font-mono">CONNECTION FAILED</h1><p className="text-nexa-text/80 mt-4 font-sans leading-relaxed">{systemError}</p><button onClick={handleLogout} className="mt-8 bg-red-600 text-white font-bold tracking-widest py-3 px-8 hover:bg-red-500 transition-colors">RESTART</button></div></div> ); }

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-nexa-bg text-nexa-text font-sans selection:bg-nexa-cyan selection:text-nexa-bg transition-colors duration-500">
      <div className="perspective-grid"></div><div className="vignette"></div><div className="scanlines"></div>
      
      <ConfirmationModal isOpen={!!confirmationProps} title={confirmationProps?.title || ''} message={confirmationProps?.message || ''} confirmationWord={confirmationProps?.confirmationWord} onConfirm={() => confirmationProps?.onConfirm()} onClose={() => setConfirmationProps(null)} />

      <AccountManager isOpen={isAccountManagerOpen} onClose={() => setAccountManagerOpen(false)} onDeleteUserHistory={handleDeleteUserHistoryRequest} />

      {user && systemStatus === 'ready' && (
        <>
          <StatusBar role={user.role} onLogout={handleLogout} onSettings={() => setAdminPanelOpen(true)} latency={latency} />
          <div className="flex-1 relative flex flex-col items-center min-h-0 w-full">
            <div className="flex-[0_0_auto] py-4 sm:py-6 w-full flex items-center justify-center z-10"><HUD state={hudState} rotationSpeed={config.animationsEnabled ? config.hudRotationSpeed : 0} /></div>
            <div className="flex-1 w-full min-h-0 relative z-20 px-4 pb-4"><ChatPanel messages={chatLog} userRole={user.role} hudState={hudState} isAudioLoading={isAudioLoading} onTypingComplete={handleTypingComplete} /></div>
          </div>
          <ControlDeck onMicClick={handleMicClick} hudState={hudState} />
          <AdminPanel 
             isOpen={adminPanelOpen} 
             onClose={() => setAdminPanelOpen(false)} 
             config={config} 
             userRole={user.role}
             onConfigChange={setConfig} 
             onClearMemory={handlePurgeRequest} 
             onManageAccounts={() => { setAdminPanelOpen(false); setAccountManagerOpen(true); }}
             onStartStudySession={handleStudySessionRequest}
           /> 
        </>
      )}
    </div>
  );
};

export default App;