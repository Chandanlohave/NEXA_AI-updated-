import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { playStartupSound, playUserLoginSound, playAdminLoginSound, playErrorSound } from '../services/audioService';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

// --- HELPER COMPONENTS ---

const BracketInput = ({ name, placeholder, type = 'text', value, onChange, autoFocus, variant = 'cyan', className = '' }: any) => {
  const colorClass = variant === 'red' ? 'text-red-500' : 'text-nexa-cyan';
  const borderClass = variant === 'red' ? 'bg-red-500' : 'bg-nexa-cyan';
  const placeholderClass = variant === 'red' ? 'placeholder-red-500/20' : 'placeholder-nexa-cyan/20';

  return (
    <div className="relative group z-50 my-6">
      <div className="flex items-center">
        <span className={`${colorClass} opacity-50 text-2xl font-light group-focus-within:opacity-100 transition-opacity duration-300`}>[</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          className={`w-full bg-transparent border-none text-nexa-text text-center font-mono text-base focus:ring-0 focus:outline-none ${placeholderClass} z-50 tracking-widest relative z-10 ${className}`}
          placeholder={placeholder}
          autoComplete="off"
        />
        <span className={`${colorClass} opacity-50 text-2xl font-light group-focus-within:opacity-100 transition-opacity duration-300`}>]</span>
      </div>
      <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[1px] ${borderClass} group-focus-within:w-full transition-all duration-300`}></div>
    </div>
  );
};

const GenderSelect = ({ selected, onSelect }: { selected: 'MALE' | 'FEMALE' | '', onSelect: (g: 'MALE' | 'FEMALE') => void }) => {
  return (
    <div className="flex justify-center gap-4 my-6">
      {['MALE', 'FEMALE'].map((gender) => (
        <button
          key={gender}
          onClick={() => onSelect(gender as 'MALE' | 'FEMALE')}
          className={`
            px-4 py-2 font-mono text-xs tracking-widest border transition-all duration-300
            ${selected === gender 
              ? 'border-nexa-cyan bg-nexa-cyan/20 text-nexa-text shadow-[0_0_10px_rgba(var(--rgb-cyan),0.4)]' 
              : 'border-nexa-cyan/30 text-nexa-cyan/50 hover:border-nexa-cyan hover:text-nexa-cyan'}
          `}
        >
          {gender}
        </button>
      ))}
    </div>
  );
};

const CyberButton = ({ onClick, label, secondary = false, loading = false }: any) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`
      w-full py-4 px-6 font-bold tracking-[0.2em] uppercase transition-all duration-200 z-50 cursor-pointer clip-corner relative z-20
      ${secondary 
        ? 'bg-transparent border border-nexa-cyan/30 text-nexa-cyan/60 hover:text-nexa-text hover:border-nexa-cyan' 
        : 'bg-nexa-cyan text-nexa-bg hover:bg-nexa-text hover:shadow-[0_0_20px_rgba(var(--rgb-cyan),0.6)]'
      }
    `}
    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
  >
    {loading ? (
      <span className="flex items-center justify-center gap-2">
         <span className="w-2 h-2 bg-black rounded-full animate-bounce"></span>
         PROCESSING
      </span>
    ) : label}
  </button>
);

// --- MAIN AUTH COMPONENT ---

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'INIT' | 'USER' | 'ADMIN' | 'OTP'>('INIT');
  
  // Inputs
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    apiKey: '',
    fullName: '',
    mobile: '',
    otp: '',
    gender: '' as 'MALE' | 'FEMALE' | ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [glitchText, setGlitchText] = useState('SYSTEM_LOCKED');
  const [initStatusText, setInitStatusText] = useState('TAP TO CONNECT');
  const [hasSystemKey, setHasSystemKey] = useState(false);

  useEffect(() => {
    // Check if API key exists in storage or ENV
    const storedKey = localStorage.getItem('nexa_api_key');
    const envKey = process.env.API_KEY;

    if (envKey) {
        // If Env key exists, use it and hide input
        setHasSystemKey(true);
        setFormData(prev => ({ ...prev, apiKey: envKey }));
    } else if (storedKey) {
        setFormData(prev => ({ ...prev, apiKey: storedKey }));
    }
  }, []);

  // Random glitch effect for header
  useEffect(() => {
    const headerTexts = ['SYSTEM_LOCKED', 'ENCRYPTION_ACTIVE', 'AWAITING_KEY', 'NEXA_PROTOCOL'];
    const statusTexts = ['CALIBRATING_NEURAL_NET...', 'SYNCING_CHRONO_DRIVES...', 'LINKING_SATELLITES...', 'AWAITING_CONNECTION...'];
    let headerInterval: any;
    let statusInterval: any;

    if (mode === 'INIT') {
      headerInterval = setInterval(() => {
        setGlitchText(headerTexts[Math.floor(Math.random() * headerTexts.length)]);
      }, 2000);
      statusInterval = setInterval(() => {
        setInitStatusText(statusTexts[Math.floor(Math.random() * statusTexts.length)]);
      }, 2500);
    } else {
      setGlitchText('ACCESS_GATEWAY');
    }

    return () => {
      clearInterval(headerInterval);
      clearInterval(statusInterval);
    };
  }, [mode]);

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // --- FLOW HANDLERS ---

  const initiateSystem = () => {
    playStartupSound();
    setLoading(true);
    setInitStatusText('CONNECTION_ESTABLISHED');
    setTimeout(() => {
      setLoading(false);
      setMode('USER');
    }, 1500);
  };

  const handleAdminLogin = () => {
    if (formData.username === 'Chandan' && formData.password === 'Nexa') {
      // ADMIN LOGIC:
      // If Admin provides a key, use it.
      // If Admin leaves key blank, try to use the build-time env variable.
      let keyToUse = formData.apiKey;

      if (!keyToUse || keyToUse.length < 10) {
        if (process.env.API_KEY) {
           keyToUse = process.env.API_KEY;
        } else {
           setError('// ERROR: NO SYSTEM API KEY FOUND');
           return;
        }
      }

      localStorage.setItem('nexa_api_key', keyToUse);
      
      completeLogin({
        name: 'Chandan',
        mobile: '0000000000',
        role: UserRole.ADMIN,
        gender: 'MALE'
      });
    } else {
      setError('// ERROR: INVALID CREDENTIALS');
    }
  };

  const requestOtp = () => {
    // Validation Rule: Full name must be alphabets/spaces only, min 3 chars
    const nameRegex = /^[a-zA-Z\s]{3,}$/;

    if (!nameRegex.test(formData.fullName)) {
      setError('// ERROR: INVALID NAME (MIN 3 CHARS, ALPHA ONLY)');
      return;
    }
    if (formData.mobile.length !== 10 || isNaN(Number(formData.mobile))) {
      setError('// ERROR: INVALID MOBILE (10 DIGITS)');
      return;
    }
    if (!formData.gender) {
      setError('// ERROR: GENDER IDENTITY REQUIRED');
      return;
    }
    
    // USER LOGIC:
    // If system key is present, we skip validation on formData.apiKey
    if (!hasSystemKey && formData.apiKey.length < 20) {
        setError('// ERROR: VALID GEMINI API KEY REQUIRED');
        return;
    }

    setLoading(true);
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setLoading(false);
      setMode('OTP');
    }, 1500);
  };

  const verifyOtp = () => {
    if (formData.otp === generatedOtp) {
      // Save API Key if user entered it (if not system key)
      if (!hasSystemKey) {
        localStorage.setItem('nexa_api_key', formData.apiKey);
      }
      
      completeLogin({
        name: formData.fullName,
        mobile: formData.mobile,
        role: UserRole.USER,
        gender: formData.gender as 'MALE' | 'FEMALE'
      });
    } else {
      setError('// ERROR: MISMATCH DETECTED');
    }
  };

  const completeLogin = (profile: UserProfile) => {
    setLoading(true);
    if(profile.role === UserRole.ADMIN){
      playAdminLoginSound();
    } else {
      playUserLoginSound();
    }
    onLogin(profile);
  };
  
  const switchToAdmin = () => {
    playErrorSound();
    setMode('ADMIN');
  };

  return (
    <div className="fixed inset-0 bg-nexa-bg flex flex-col items-center justify-center p-6 z-[60] overflow-hidden transition-colors duration-500">
      
      {/* --- BACKGROUND LAYERS --- */}
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-nexa-cyan/20 rounded-full animate-spin-slow"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-dashed border-nexa-cyan/20 rounded-full animate-spin-reverse-slow"></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--rgb-cyan),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--rgb-cyan),0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none"></div>

      {/* --- HEADER --- */}
      <div className="absolute top-8 text-center animate-fade-in z-50">
        <div className="text-[10px] text-nexa-cyan/50 font-mono tracking-[0.4em]">CREATED BY</div>
        <div className="text-xl font-bold text-nexa-text tracking-[0.2em]">CHANDAN LOHAVE</div>
      </div>

      {/* --- MAIN HUD CONTAINER --- */}
      <div className="relative w-full max-w-sm z-50">
        
        {/* Frame Markers (Responsive Color) */}
        <div className={`absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 ${mode === 'ADMIN' ? 'border-red-500' : 'border-nexa-cyan'} transition-all duration-500 hover:w-12 hover:h-12`}></div>
        <div className={`absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 ${mode === 'ADMIN' ? 'border-red-500' : 'border-nexa-cyan'} transition-all duration-500 hover:w-12 hover:h-12`}></div>
        <div className={`absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 ${mode === 'ADMIN' ? 'border-red-500' : 'border-nexa-cyan'} transition-all duration-500 hover:w-12 hover:h-12`}></div>
        <div className={`absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 ${mode === 'ADMIN' ? 'border-red-500' : 'border-nexa-cyan'} transition-all duration-500 hover:w-12 hover:h-12`}></div>
        
        {/* Top Status Bar */}
        <div className={`flex justify-between items-center mb-8 border-b ${mode === 'ADMIN' ? 'border-red-500/20' : 'border-nexa-cyan/20'} pb-2 transition-colors duration-500`}>
           <div className={`text-[10px] ${mode === 'ADMIN' ? 'text-red-500' : 'text-nexa-cyan'} font-mono tracking-widest`}>{glitchText}</div>
           <div className="flex gap-1">
              <div className={`w-1 h-1 ${mode === 'ADMIN' ? 'bg-red-500' : 'bg-nexa-cyan'} animate-pulse`}></div>
              <div className={`w-1 h-1 ${mode === 'ADMIN' ? 'bg-red-500' : 'bg-nexa-cyan'} animate-pulse delay-75`}></div>
              <div className={`w-1 h-1 ${mode === 'ADMIN' ? 'bg-red-500' : 'bg-nexa-cyan'} animate-pulse delay-150`}></div>
           </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className={`backdrop-blur-md border p-6 relative transition-all duration-500 ${mode === 'ADMIN' ? 'bg-red-900/10 border-red-500/20' : 'bg-nexa-bg/60 border-nexa-cyan/10'}`}>
          
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-2 bg-red-900/20 border-l-2 border-red-500 text-red-500 text-[10px] font-mono tracking-wider animate-pulse">
              {error}
            </div>
          )}

          {/* MODE: INIT */}
          {mode === 'INIT' && (
            <div className="flex flex-col items-center py-10 animate-fade-in">
               {/* Animated Core Reactor */}
               <div 
                 onClick={initiateSystem}
                 className="relative w-32 h-32 flex items-center justify-center cursor-pointer group"
               >
                  <div className="absolute inset-0 bg-nexa-cyan/10 rounded-full blur-xl group-hover:bg-nexa-cyan/30 transition-all duration-500"></div>
                  <div className="absolute w-full h-full border-2 border-nexa-cyan rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute w-[80%] h-[80%] border-2 border-dashed border-nexa-cyan/50 rounded-full animate-spin-reverse-slow"></div>
                  <div className="absolute w-[40%] h-[40%] bg-nexa-cyan rounded-full animate-pulse shadow-[0_0_20px_currentColor]"></div>
               </div>
               
               <div className="mt-8 text-center space-y-2">
                 <h1 className="text-4xl font-bold text-nexa-text tracking-widest">NEXA</h1>
                 <div className="text-nexa-cyan/60 text-xs font-mono tracking-[0.3em] group-hover:text-nexa-cyan transition-colors">
                   {loading ? 'INITIALIZING...' : initStatusText}
                 </div>
               </div>
            </div>
          )}

          {/* MODE: USER */}
          {mode === 'USER' && (
            <div className="animate-slide-up space-y-4">
               <div className="text-center">
                  <div className="text-nexa-cyan text-xs font-mono border border-nexa-cyan/30 inline-block px-2 py-1 mb-2">IDENTITY REQUIRED</div>
               </div>
               
               <div>
                 {/* Only show API Key input if system key is NOT present */}
                 {!hasSystemKey && (
                   <>
                    <BracketInput name="apiKey" placeholder="GEMINI API KEY" type="password" value={formData.apiKey} onChange={handleChange} autoFocus />
                    <div className="text-center mb-4">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[9px] text-nexa-cyan/60 hover:text-nexa-cyan underline font-mono cursor-pointer">
                            GET API KEY HERE
                        </a>
                    </div>
                   </>
                 )}

                 <BracketInput name="fullName" placeholder="NAME" value={formData.fullName} onChange={handleChange} autoFocus={hasSystemKey} />
                 <GenderSelect selected={formData.gender} onSelect={(g) => { setFormData({...formData, gender: g}); setError(''); }} />
                 <BracketInput name="mobile" placeholder="MOBILE" type="tel" value={formData.mobile} onChange={handleChange} />
               </div>

               <div className="pt-4 space-y-4">
                 <CyberButton onClick={requestOtp} label="INITIATE" loading={loading} />
                 <div className="flex justify-between items-center text-center mt-2 px-1">
                    <button onClick={() => setMode('INIT')} className="text-[9px] text-zinc-500 hover:text-nexa-cyan font-mono tracking-widest uppercase transition-colors flex items-center gap-1 group">
                       <span className="group-hover:-translate-x-1 transition-transform">&lt;&lt;</span> BACK
                    </button>
                    <button onClick={switchToAdmin} className="text-[9px] text-zinc-500 hover:text-nexa-cyan font-mono tracking-widest uppercase transition-colors">
                      // Admin Console
                    </button>
                 </div>
               </div>
            </div>
          )}

          {/* MODE: ADMIN */}
          {mode === 'ADMIN' && (
            <div className="animate-slide-up relative z-10">
               {/* Danger Background Pattern */}
               <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(220,38,38,0.05)_0px,rgba(220,38,38,0.05)_10px,transparent_10px,transparent_20px)] pointer-events-none -z-10"></div>
               
               <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 border border-red-500/50 px-3 py-1 bg-red-500/10 backdrop-blur-sm">
                     <div className="w-2 h-2 bg-red-500 animate-pulse rounded-full"></div>
                     <span className="text-red-500 text-[10px] font-mono tracking-[0.2em] uppercase">Security Level 8</span>
                  </div>
               </div>

               {/* Decorative Lock (Background) */}
               <div className="absolute top-10 right-4 opacity-5 pointer-events-none">
                  <svg className="w-24 h-24 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V6a5 5 0 0110 0v2h1zM8 6a4 4 0 018 0v2H8V6z"/></svg>
               </div>
               
               <div className="space-y-4 relative z-20">
                 <BracketInput name="username" placeholder="IDENTITY_ID" value={formData.username} onChange={handleChange} autoFocus variant="red" />
                 <BracketInput name="password" placeholder="ACCESS_KEY" type="password" value={formData.password} onChange={handleChange} variant="red" className="password-hidden" />
                 {/* ADMIN KEY INPUT: Show only if manual override needed (or system key not present) */}
                 <BracketInput name="apiKey" placeholder={hasSystemKey ? "API KEY (SYSTEM LINKED)" : "API KEY (AUTO)"} type="password" value={formData.apiKey} onChange={handleChange} variant="red" />
               </div>

               <div className="pt-8 space-y-4 relative z-20">
                 <button
                   onClick={handleAdminLogin}
                   disabled={loading}
                   className="w-full py-4 bg-red-600 text-white font-bold tracking-[0.2em] hover:bg-red-500 hover:shadow-[0_0_25px_rgba(220,38,38,0.8)] transition-all clip-corner relative overflow-hidden group"
                   style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                 >
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   <span className="relative z-10 flex items-center justify-center gap-2">
                     {loading ? 'AUTHENTICATING...' : <>AUTHORIZE OVERRIDE <span className="text-xs opacity-70">{'>>'}</span></>}
                   </span>
                 </button>
                 
                 <div className="mt-2">
                    <button onClick={() => setMode('USER')} className="text-[9px] text-red-500/60 hover:text-red-500 font-mono tracking-widest uppercase transition-colors flex items-center justify-center gap-2 w-full group">
                      <span className="group-hover:-translate-x-1 transition-transform">&lt;&lt;</span> ABORT SEQUENCE
                    </button>
                 </div>
               </div>
            </div>
          )}

          {/* MODE: OTP */}
          {mode === 'OTP' && (
            <div className="animate-slide-up text-center space-y-8 py-4">
              <div className="space-y-2">
                 <div className="text-nexa-cyan text-xs font-mono">SECURE TRANSMISSION RECEIVED</div>
                 <div className="text-nexa-text text-3xl font-mono tracking-[0.3em] border border-nexa-cyan/20 py-4 bg-nexa-cyan/5">
                   {generatedOtp}
                 </div>
                 <div className="text-[9px] text-zinc-500">Wait time: 00:00:00</div>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" 
                  maxLength={4}
                  value={formData.otp}
                  onChange={(e) => {
                    setFormData({ ...formData, otp: e.target.value });
                    setError('');
                  }}
                  className="w-full bg-transparent border-b-2 border-nexa-cyan text-nexa-text text-center text-4xl font-mono focus:outline-none py-2 tracking-[0.5em]"
                  placeholder="____"
                  autoFocus
                />
                
                <CyberButton onClick={verifyOtp} label="AUTHENTICATE" loading={loading} />
              </div>
            </div>
          )}

        </div>

        {/* Footer Data */}
        <div className="flex justify-between mt-2 px-2">
           <div className={`text-[8px] ${mode === 'ADMIN' ? 'text-red-500/40' : 'text-nexa-cyan/40'} font-mono`}>SECURE CONNECTION</div>
           <div className={`text-[8px] ${mode === 'ADMIN' ? 'text-red-500/40' : 'text-nexa-cyan/40'} font-mono`}>V.9.0.1</div>
        </div>

      </div>

      {/* --- FOOTER --- */}
      <div className="absolute bottom-16 text-center text-[8px] font-mono text-nexa-cyan/30 tracking-widest animate-fade-in z-50">
        © 2025 CHANDAN LOHAVE. ALL RIGHTS RESERVED.
      </div>

      {/* Styles for clip-path support */}
      <style>{`
        .clip-corner {
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }
      `}</style>
    </div>
  );
};

export default Auth;