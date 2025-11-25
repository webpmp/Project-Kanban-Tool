

import React, { useState, useRef } from 'react';
import { Task, User, TaskType, TaskStatus } from '../types';
import { THEMES } from '../constants';
import { BarChart3, CheckCircle, Upload, Camera, X, ChevronDown, LogOut, LayoutList, Kanban, Palette, CheckCircle2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface DashboardProps {
    tasks: Task[];
    users: User[];
    currentUser: User;
    projectImage: string;
    currentTheme?: string;
    onUpdateProjectImage: (url: string) => void;
    onHighlight: (criteria: { mode: 'type' | 'status', value: string }) => void;
    onProjectClick: () => void;
    currentViewMode?: 'kanban' | 'gantt' | 'overview' | 'calendar';
    onViewModeChange?: (mode: 'kanban' | 'gantt' | 'overview' | 'calendar') => void;
    onThemeChange?: (theme: string) => void;
}

const PROJECT_ICON_PRESETS = [
    'https://api.dicebear.com/7.x/shapes/svg?seed=ProjectA',
    'https://api.dicebear.com/7.x/shapes/svg?seed=ProjectB',
    'https://api.dicebear.com/7.x/shapes/svg?seed=ProjectC',
    'https://api.dicebear.com/7.x/shapes/svg?seed=ProjectD',
    'https://api.dicebear.com/7.x/icons/svg?seed=Work',
    'https://api.dicebear.com/7.x/icons/svg?seed=Code',
    'https://api.dicebear.com/7.x/identicon/svg?seed=Gemini',
    'https://api.dicebear.com/7.x/identicon/svg?seed=Kanban',
];

export const Dashboard: React.FC<DashboardProps> = ({ 
    tasks, 
    users, 
    currentUser,
    projectImage, 
    currentTheme,
    onUpdateProjectImage,
    onHighlight,
    onProjectClick,
    currentViewMode = 'kanban',
    onViewModeChange,
    onThemeChange
}) => {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const epicsCount = tasks.filter(t => t.type === TaskType.EPIC).length;
    const tasksCount = tasks.filter(t => t.type === TaskType.TASK).length;
    const completedTasks = tasks.filter(t => t.status === 'Complete').length;
    const totalTasks = tasks.length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Confirmation Modal State
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDangerous: true });

    const openConfirm = (title: string, message: string, action: () => void, isDangerous = true) => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: action,
            isDangerous
        });
    };

    const handleConfirmAction = () => {
        confirmConfig.onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            onUpdateProjectImage(result);
            setIsImageModalOpen(false);
          };
          reader.readAsDataURL(file);
        }
    };

    const isAdmin = currentUser.role === 'Admin';

    return (
        <>
        <div className="bg-white border-b border-gray-200 p-4 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm sticky top-0 z-30">
            
            <div className="flex items-center gap-4">
                <div 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsImageModalOpen(true);
                    }}
                    className={`
                        relative group cursor-pointer rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-xl flex-shrink-0
                        ${projectImage ? 'w-12 h-12' : 'bg-primary-600 p-3 text-white shadow-primary-200'}
                    `}
                >
                    {projectImage ? (
                        <>
                            <img src={projectImage} alt="Project Logo" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-4 h-4 text-white" />
                            </div>
                        </>
                    ) : (
                        <BarChart3 className="w-6 h-6" />
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <div onClick={onProjectClick} className="cursor-pointer group">
                        <h1 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-primary-600 transition-colors flex items-center gap-2">
                            Gemini Kanban
                        </h1>
                    </div>
                    
                    {onViewModeChange && (
                        <div className="relative flex items-center">
                            <select 
                                value={currentViewMode}
                                onChange={(e) => onViewModeChange(e.target.value as 'kanban' | 'gantt' | 'overview' | 'calendar')}
                                className="bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold py-1 pl-3 pr-8 rounded-md cursor-pointer outline-none focus:ring-2 focus:ring-primary-500 appearance-none hover:bg-gray-100 transition-colors min-w-[160px]"
                            >
                                <option value="overview">Overview</option>
                                <option value="kanban">Kanban</option>
                                <option value="gantt">Gantt</option>
                                <option value="calendar">Calendar</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats - Hidden in Calendar View */}
            {currentViewMode !== 'calendar' ? (
                <div className="flex-1 w-full overflow-x-auto flex gap-6 items-center justify-start md:justify-center px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    
                    <div 
                        onClick={() => onHighlight({ mode: 'type', value: TaskType.EPIC })}
                        className="flex flex-col items-center min-w-[80px] cursor-pointer hover:bg-gray-50 rounded-lg py-1 transition-colors group"
                        title="Click to highlight Epics"
                    >
                        <span className="text-2xl font-bold text-secondary-600 group-hover:scale-110 transition-transform">{epicsCount}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider group-hover:text-secondary-600">Epics</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>

                    <div 
                        onClick={() => onHighlight({ mode: 'type', value: TaskType.TASK })}
                        className="flex flex-col items-center min-w-[80px] cursor-pointer hover:bg-gray-50 rounded-lg py-1 transition-colors group"
                        title="Click to highlight Tasks"
                    >
                        <span className="text-2xl font-bold text-primary-600 group-hover:scale-110 transition-transform">{tasksCount}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider group-hover:text-primary-600">Tasks</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>

                    <div 
                        onClick={() => onHighlight({ mode: 'status', value: TaskStatus.COMPLETE })}
                        className="flex flex-col items-center min-w-[80px] cursor-pointer hover:bg-gray-50 rounded-lg py-1 transition-colors group"
                        title="Click to highlight Completed Items"
                    >
                        <span className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform">{progress}%</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider group-hover:text-green-600">Complete</span>
                    </div>
                </div>
            ) : (
                <div className="flex-1" />
            )}
            
            {/* Actions & User Info */}
            <div className="hidden md:flex items-center gap-4">
               <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-full pl-1 pr-3 py-1 border border-gray-200">
                   <img src={currentUser.avatarUrl} className="w-6 h-6 rounded-full" alt="Current User" />
                   <div className="flex flex-col">
                       <span className="font-bold text-gray-700 leading-none">{currentUser.name}</span>
                       <span className="text-[9px] text-gray-500 leading-none">{currentUser.role}</span>
                   </div>
               </div>
            </div>

        </div>

        {/* Project Image Modal */}
        {isImageModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h3 className="text-lg font-bold text-gray-800">Project Settings</h3>
                        <button onClick={() => setIsImageModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-6 overflow-y-auto flex-1 p-1">
                        
                        {/* Image Settings */}
                        <div>
                             <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                 <Camera className="w-4 h-4 text-gray-400" /> Project Icon
                             </h4>
                             <div className="space-y-4">
                                {/* Upload Section */}
                                <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
                                >
                                    <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                    />
                                    <div className="bg-primary-100 p-3 rounded-full mb-3 text-primary-600">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">Upload Image</p>
                                    <p className="text-xs text-gray-500 mt-1">Click to browse files</p>
                                </div>

                                {/* Presets Section */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Or choose a preset</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {PROJECT_ICON_PRESETS.map((url, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => {
                                                    onUpdateProjectImage(url);
                                                    setIsImageModalOpen(false);
                                                }}
                                                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary-500 transition-all bg-gray-50"
                                            >
                                                <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover p-1" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                        
                        {/* Divider */}
                        <div className="h-px bg-gray-100"></div>

                        {/* Theme Settings - Admin Only */}
                        {isAdmin && onThemeChange && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                     <Palette className="w-4 h-4 text-gray-400" /> Color Theme
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {THEMES.map(theme => {
                                    const primaryColor = `rgb(${theme.colors.primary[600].split(' ')[0]}, ${theme.colors.primary[600].split(' ')[1]}, ${theme.colors.primary[600].split(' ')[2]})`;
                                    const secondaryColor = `rgb(${theme.colors.secondary[500].split(' ')[0]}, ${theme.colors.secondary[500].split(' ')[1]}, ${theme.colors.secondary[500].split(' ')[2]})`;
                                    
                                    return (
                                      <button
                                        key={theme.name}
                                        onClick={() => onThemeChange(theme.name)}
                                        className={`
                                          relative p-3 rounded-xl border-2 transition-all text-left group
                                          ${currentTheme === theme.name ? 'border-primary-600 bg-primary-50/30 ring-2 ring-primary-200 ring-offset-2' : 'border-gray-100 hover:border-gray-300'}
                                        `}
                                      >
                                        <div className="flex gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: primaryColor }}></div>
                                            <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: secondaryColor }}></div>
                                        </div>
                                        <span className={`text-xs font-bold ${currentTheme === theme.name ? 'text-primary-700' : 'text-gray-600'}`}>
                                            {theme.name}
                                        </span>
                                        {currentTheme === theme.name && (
                                          <div className="absolute -top-2 -right-2 bg-primary-600 text-white rounded-full p-0.5">
                                            <CheckCircle2 className="w-3 h-3" />
                                          </div>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                            </div>
                        )}

                         {projectImage && (
                            <div className="pt-4 border-t border-gray-100">
                                <button 
                                    onClick={() => {
                                        openConfirm(
                                            'Remove Image',
                                            'Are you sure you want to remove the project image?',
                                            () => {
                                                onUpdateProjectImage('');
                                                setIsImageModalOpen(false);
                                            }
                                        );
                                    }}
                                    className="w-full py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                                >
                                    Remove Current Project Icon
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        <ConfirmModal 
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            onConfirm={handleConfirmAction}
            onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            isDangerous={confirmConfig.isDangerous}
        />
        </>
    )
}
