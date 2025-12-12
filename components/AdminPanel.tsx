import React, { useState } from 'react';
import { AppConfig, UserRole, Theme } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  userRole: UserRole;
  onConfigChange: (newConfig: AppConfig) => void;
  onClearMemory: () => void;
  onManageAccounts: () => void;
  onStartStudySession: (subjectCode: string, subjectName: string) => void;
}

const SUBJECTS = [
  { code: 'MCS201', name: 'Programming in C and Python' },
  { code: 'MCS202', name: 'Computer Organization and Assembly Language' },
  { code: 'MCS203', name: 'Operating Systems and Systems Software' },
  { code: 'FEG2', name: 'Foundation Course in English-2' },
  { code: 'BCS111', name: 'Computer Basics and PC Software' },
  { code: 'BCS12', name: 'Basic Mathematics' },
  { code: 'BEVAE181', name: 'Environmental Studies' },
  { code: 'BEGLA136', name: 'English at the Workplace' }
];

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, config, userRole, onConfigChange, onClearMemory, onManageAccounts, onStartStudySession }) => {
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0].code);

  if (!isOpen) return null;

  const handleExportLogs = () => {
    const logs = {
      system: 'NEXA V9.0',
      timestamp: new Date().toISOString(),
      config: config,
      status: 'OPTIMAL'
    };
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEXA_LOGS_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStudyStart = () => {
    const subject = SUBJECTS.find(s => s.code === selectedSubject);
    if (subject) {
      onStartStudySession(subject.code, subject.name);
      onClose();
    }
  };

  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <div className="absolute top-16 right-4 w-80 bg-nexa-bg/95 border border-nexa-cyan rounded-lg backdrop-blur-md p-4 z-50 shadow-[0_0_20px_rgba(var(--rgb-cyan),0.3)] animate-fade-in max-h-[80vh] overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-4 border-b border-nexa-cyan/20 pb-2">
        <h2 className="text-nexa-cyan font-mono text-sm tracking-wider">{isAdmin ? 'ADMIN CONSOLE' : 'SETTINGS'}</h2>
        <button onClick={onClose} className="text-nexa-text/60 hover:text-nexa-text text-2xl leading-none">&times;</button>
      </div>

      <div className="space-y-6">
        
        {/* --- APPEARANCE (ALL USERS) --- */}
        <div>
          <label className="block text-nexa-text/60 text-xs font-mono mb-2 uppercase tracking-wider">Interface Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {(['DARK', 'LIGHT', 'SYSTEM'] as Theme[]).map((theme) => (
              <button
                key={theme}
                onClick={() => onConfigChange({...config, theme})}
                className={`
                  py-2 text-[10px] font-mono border transition-all duration-300
                  ${config.theme === theme 
                    ? 'border-nexa-cyan bg-nexa-cyan/20 text-nexa-text shadow-[0_0_10px_rgba(var(--rgb-cyan),0.3)]' 
                    : 'border-nexa-cyan/30 text-nexa-text/50 hover:border-nexa-cyan hover:text-nexa-cyan'}
                `}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-nexa-text/60 text-xs font-mono mb-1">HUD Animations</label>
          <button 
            onClick={() => onConfigChange({...config, animationsEnabled: !config.animationsEnabled})}
            className={`w-full py-2 text-xs font-mono border transition-colors ${config.animationsEnabled ? 'border-nexa-cyan text-nexa-cyan' : 'border-nexa-text/30 text-nexa-text/50'}`}
          >
            {config.animationsEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {isAdmin && (
          <div>
            <label className="block text-nexa-text/60 text-xs font-mono mb-1">Rotation Speed</label>
            <input 
              type="range" 
              min="0.2" 
              max="5" 
              step="0.1"
              value={config.hudRotationSpeed}
              onChange={(e) => onConfigChange({...config, hudRotationSpeed: parseFloat(e.target.value)})}
              className="w-full accent-nexa-cyan" 
            />
          </div>
        )}

        {/* --- STUDY HUB (ADMIN ONLY) --- */}
        {isAdmin && (
          <div className="bg-nexa-cyan/5 p-3 rounded border border-nexa-cyan/20">
             <h3 className="text-nexa-text text-xs font-bold font-mono tracking-widest mb-2 flex items-center gap-2">
               <span className="w-2 h-2 bg-nexa-cyan rounded-full animate-pulse"></span>
               STUDY HUB (EXAM MODE)
             </h3>
             <div className="space-y-2">
                <label className="text-[10px] text-nexa-text/60 font-mono uppercase">Select Target Subject</label>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-nexa-bg border border-nexa-cyan/50 text-nexa-text text-xs font-mono p-2 focus:outline-none focus:border-nexa-cyan"
                >
                  {SUBJECTS.map(sub => (
                    <option key={sub.code} value={sub.code}>
                      [{sub.code}] {sub.name.length > 20 ? sub.name.substring(0,20)+'...' : sub.name}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleStudyStart}
                  className="w-full py-2 bg-nexa-cyan text-nexa-bg font-bold text-xs font-mono tracking-widest hover:bg-white transition-colors mt-2"
                >
                  INITIATE PREP SEQUENCE
                </button>
                <p className="text-[9px] text-nexa-text/50 mt-1">Focuses on 90-95% probability questions based on IGNOU patterns.</p>
             </div>
          </div>
        )}

        {/* --- ACTIONS (ADMIN ONLY) --- */}
        {isAdmin && (
          <div className="pt-2 border-t border-nexa-text/10 space-y-2">
             <button 
               onClick={handleExportLogs}
               className="w-full py-2 border border-nexa-text/30 text-nexa-text/60 hover:text-nexa-text hover:border-nexa-text text-xs font-mono transition-colors"
             >
               EXPORT LOGS
             </button>
             
             <button 
               onClick={onManageAccounts}
               className="w-full py-2 border border-nexa-text/30 text-nexa-text/60 hover:text-nexa-text hover:border-nexa-text text-xs font-mono transition-colors"
             >
               MANAGE ACCOUNTS
             </button>

             <button 
               onClick={onClearMemory}
               className="w-full py-2 bg-red-900/30 border border-red-500 text-red-500 hover:bg-red-900/50 text-xs font-mono transition-colors"
             >
               PURGE MEMORY
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;