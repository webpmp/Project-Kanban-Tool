
import React, { useState, useEffect } from 'react';
import { ProjectDetails, User, Task, TaskType, StatusUpdate, TaskStatus } from '../types';
import { ArrowLeft, Calendar, FileText, Link as LinkIcon, Edit2, Save, X, Activity, PlusCircle, ArrowRight, ChevronDown, ChevronRight, FileSpreadsheet, FileCode, FileVideo, FileImage, File, Figma, Trash2, Shield, Flag, CheckCircle2, Clock, Plus, Briefcase } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ProjectOverviewProps {
  projectDetails: ProjectDetails;
  users: User[];
  currentUser: User;
  tasks: Task[];
  statusUpdates: StatusUpdate[];
  onUpdateDetails: (details: ProjectDetails) => void;
  onBack: () => void;
  onManageTeam: () => void;
  onTaskClick: (task: Task) => void;
  onCreateStatus: () => void;
  onViewStatusUpdate: (id: string) => void;
  onDeleteStatus: (id: string) => void;
}

const getFileIconConfig = (url: string, title: string) => {
    // Try to get extension from URL, fallback to title
    let filename = url;
    if (!filename || filename === '#' || filename.length < 2) filename = title;
    
    const ext = filename.split('.').pop()?.toLowerCase();

    switch(ext) {
        case 'pdf': 
            return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' };
        case 'doc': 
        case 'docx': 
        case 'txt':
            return { icon: FileText, color: 'text-primary-600', bg: 'bg-primary-50' };
        case 'xls':
        case 'xlsx':
        case 'csv': 
            return { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' };
        case 'fig':
        case 'jam': 
            return { icon: Figma, color: 'text-secondary-500', bg: 'bg-secondary-50' };
        case 'xml':
        case 'html':
        case 'json':
        case 'yaml':
        case 'md':
            return { icon: FileCode, color: 'text-orange-500', bg: 'bg-orange-50' };
        case 'mov':
        case 'mp4': 
            return { icon: FileVideo, color: 'text-pink-500', bg: 'bg-pink-50' };
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'svg':
        case 'gif':
            return { icon: FileImage, color: 'text-indigo-500', bg: 'bg-indigo-50' };
        default: 
            return { icon: File, color: 'text-gray-400', bg: 'bg-gray-50' };
    }
};

const getStatusBadgeColor = (status?: string) => {
    switch(status) {
        case 'On Track': return 'bg-green-100 text-green-700 border border-green-200';
        case 'Risks': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
        case 'Blocked': return 'bg-red-100 text-red-700 border border-red-200';
        default: return 'hidden';
    }
};

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  projectDetails,
  users,
  currentUser,
  tasks,
  statusUpdates,
  onUpdateDetails,
  onBack,
  onManageTeam,
  onTaskClick,
  onCreateStatus,
  onViewStatusUpdate,
  onDeleteStatus,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState<ProjectDetails>(projectDetails);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  
  // Sort updates by date descending
  const sortedUpdates = [...statusUpdates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(null);

  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETE).length;
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

  const isAdmin = currentUser.role === 'Admin';
  const milestones = tasks.filter(t => t.isMilestone).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  useEffect(() => {
    setEditedDetails(projectDetails);
  }, [projectDetails]);

  // Expand the most recent update by default
  useEffect(() => {
      if (sortedUpdates.length > 0) {
          setExpandedUpdateId(sortedUpdates[0].id);
      }
  }, [statusUpdates.length]);

  const handleSave = () => {
    onUpdateDetails(editedDetails);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDetails(projectDetails);
    setIsEditing(false);
  };

  const handleAddLink = () => {
    if (newLinkUrl) {
      setEditedDetails(prev => ({
        ...prev,
        docs: [...prev.docs, { title: newLinkTitle || newLinkUrl, url: newLinkUrl }]
      }));
      setNewLinkTitle('');
      setNewLinkUrl('');
    }
  };

  const handleRemoveLink = (index: number) => {
    openConfirm(
        'Remove Link',
        'Are you sure you want to remove this documentation link?',
        () => {
            setEditedDetails(prev => ({
                ...prev,
                docs: prev.docs.filter((_, i) => i !== index)
            }));
        }
    );
  };

  const toggleUpdate = (id: string) => {
      setExpandedUpdateId(prev => prev === id ? null : id);
  }

  const handleDeleteStatus = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      openConfirm(
          'Delete Update',
          'Are you sure you want to delete this status update? This action cannot be undone.',
          () => onDeleteStatus(id)
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
            <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
            <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Project Overview</h1>
        </div>
        
        {isAdmin && !isEditing && (
             <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-bold text-sm transition-colors"
             >
                 <Edit2 className="w-4 h-4" /> Edit Details
             </button>
        )}

        {isEditing && (
            <div className="flex gap-2">
                <button 
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                >
                    <Save className="w-4 h-4" /> Save Changes
                </button>
            </div>
        )}
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full p-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content (Project Details, Documentation & Milestones) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Main Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <FileText className="w-64 h-64" />
                    </div>
                    
                    <div className="relative z-0">
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Project Name</label>
                                    <input 
                                        type="text" 
                                        value={editedDetails.name}
                                        onChange={(e) => setEditedDetails({...editedDetails, name: e.target.value})}
                                        className="w-full text-3xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Start Date</label>
                                        <input 
                                            type="date" 
                                            value={editedDetails.startDate}
                                            onChange={(e) => setEditedDetails({...editedDetails, startDate: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Finish Date</label>
                                        <input 
                                            type="date" 
                                            value={editedDetails.endDate}
                                            onChange={(e) => setEditedDetails({...editedDetails, endDate: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Description</label>
                                    <textarea 
                                        rows={4}
                                        value={editedDetails.description}
                                        onChange={(e) => setEditedDetails({...editedDetails, description: e.target.value})}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-2">
                                    <h1 className="text-4xl font-bold text-gray-900">{projectDetails.name}</h1>
                                    <div className="flex flex-col items-end">
                                        <span className="text-4xl font-bold text-green-600 tracking-tight">{progress}%</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Complete</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(projectDetails.startDate).toLocaleDateString()} - {new Date(projectDetails.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2">
                                        <span className={`w-2 h-2 rounded-full ${new Date() > new Date(projectDetails.endDate) ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                        <span>{new Date() > new Date(projectDetails.endDate) ? 'Overdue' : 'Active'}</span>
                                    </div>
                                </div>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    {projectDetails.description}
                                </p>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Documentation - Moved from Sidebar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-primary-500" /> Documentation
                    </h3>
                    
                    <div className="space-y-3">
                        {(isEditing ? editedDetails.docs : projectDetails.docs).map((doc, idx) => {
                            const { icon: Icon, color, bg } = getFileIconConfig(doc.url, doc.title);
                            
                            return (
                                <div key={idx} className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all">
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-primary-600 truncate flex-1">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center border border-gray-100 ${bg} ${color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="truncate">{doc.title}</span>
                                    </a>
                                    {isEditing && (
                                        <button 
                                            onClick={() => handleRemoveLink(idx)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        
                        {projectDetails.docs.length === 0 && !isEditing && (
                            <div className="text-center py-8 text-gray-400 text-sm italic bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                                No documentation linked.
                            </div>
                        )}
                    </div>

                    {isEditing && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                             <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Add New Link</label>
                             <div className="space-y-2">
                                 <input 
                                    placeholder="Link Title (e.g. PRD)"
                                    value={newLinkTitle}
                                    onChange={(e) => setNewLinkTitle(e.target.value)}
                                    className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded outline-none focus:border-primary-500 text-gray-900"
                                 />
                                 <div className="flex gap-2">
                                     <input 
                                        placeholder="https://... (ends in .pdf, .docx, etc for icons)"
                                        value={newLinkUrl}
                                        onChange={(e) => setNewLinkUrl(e.target.value)}
                                        className="flex-1 text-xs p-2 bg-gray-50 border border-gray-200 rounded outline-none focus:border-primary-500 text-gray-900"
                                     />
                                     <button 
                                        onClick={handleAddLink}
                                        disabled={!newLinkUrl}
                                        className="bg-primary-600 text-white p-2 rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                     >
                                         <Plus className="w-4 h-4" />
                                     </button>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Milestones Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Flag className="w-5 h-5 text-yellow-500" /> Project Milestones
                    </h3>
                    
                    <div className="space-y-4">
                        {milestones.map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => onTaskClick(task)}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md hover:border-primary-100 transition-all group"
                            >
                                <div className={`p-2 rounded-full ${task.status === 'Complete' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                    {task.status === 'Complete' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <h4 className="font-bold text-gray-800 group-hover:text-primary-600 transition-colors">{task.title}</h4>
                                        <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100">
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${task.status === 'Complete' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400" />
                            </div>
                        ))}

                        {milestones.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm italic bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                                No milestones set. Flag a task as a milestone to see it here.
                            </div>
                        )}
                    </div>
                </div>

            </div>
            
            {/* Sidebar (Updates & Team) */}
            <div className="space-y-6">
                
                {/* Recent Status Updates */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary-500" /> Recent Updates
                        </h3>
                        <button 
                            onClick={onCreateStatus}
                            className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-lg transition-colors"
                            title="Post Update"
                        >
                            <PlusCircle className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {sortedUpdates.slice(0, 5).map(update => (
                            <div key={update.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => toggleUpdate(update.id)}>
                                    <div className="pr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${
                                                update.type === 'Weekly' ? 'bg-primary-500' :
                                                update.type === 'Daily' ? 'bg-green-500' : 'bg-secondary-500'
                                            }`}></span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{update.type}</span>
                                            <span className="text-[10px] text-gray-400">• {new Date(update.date).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-sm leading-tight group-hover:text-primary-600 transition-colors">
                                            {update.title}
                                        </h4>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {update.projectStatus && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusBadgeColor(update.projectStatus)}`}>
                                                {update.projectStatus}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-2">
                                            {isAdmin && (
                                                <button 
                                                    onClick={(e) => handleDeleteStatus(e, update.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                    title="Delete Update"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                            <button className="text-gray-300 hover:text-gray-500">
                                                {expandedUpdateId === update.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Expanded Content Preview */}
                                {expandedUpdateId === update.id && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <p className="text-xs text-gray-600 line-clamp-3 mb-3 leading-relaxed">
                                            {update.content}
                                        </p>
                                        <button 
                                            onClick={() => onViewStatusUpdate(update.id)}
                                            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                        >
                                            Read full update <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {sortedUpdates.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-xs italic">
                                No updates yet.
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                        <button onClick={() => onViewStatusUpdate(sortedUpdates[0]?.id)} className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">
                            View All History
                        </button>
                    </div>
                </div>

                {/* Team Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-secondary-500" /> Team
                        </h3>
                        <button 
                            onClick={onManageTeam}
                            className="text-xs font-bold text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-lg transition-colors"
                        >
                            Manage
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {users.map(user => (
                            <div 
                                key={user.id} 
                                onClick={() => {
                                    if (isAdmin) onManageTeam();
                                }}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isAdmin ? 'cursor-pointer hover:bg-primary-50 group' : ''}`}
                                title={isAdmin ? "Click to manage team" : `${user.name} (${user.role})`}
                            >
                                <div className="relative flex-shrink-0">
                                    <img 
                                        src={user.avatarUrl} 
                                        alt={user.name} 
                                        className="w-10 h-10 rounded-full border border-gray-200 object-cover shadow-sm" 
                                    />
                                    {user.role === 'Admin' && (
                                        <div className="absolute -bottom-1 -right-1 bg-primary-500 text-white p-[3px] rounded-full ring-2 ring-white">
                                            <Shield className="w-2 h-2 fill-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-bold truncate ${isAdmin ? 'group-hover:text-primary-700 text-gray-800' : 'text-gray-800'}`}>
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {user.jobTitle || user.role}
                                    </p>
                                </div>
                                {isAdmin && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 className="w-3.5 h-3.5 text-primary-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        <button 
                            onClick={onManageTeam}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-primary-300 group-hover:text-primary-500 group-hover:bg-primary-50 transition-all flex-shrink-0">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-gray-500 group-hover:text-primary-600">Add Member</span>
                        </button>
                    </div>
                </div>

            </div>

        </div>

      </div>

      <ConfirmModal 
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          isDangerous={confirmConfig.isDangerous}
      />
    </div>
  );
};
