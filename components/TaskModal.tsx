
import React, { useState, useEffect } from 'react';
import { Task, TaskType, Priority, TaskStatus, User, Comment } from '../types';
import { PRIORITY_ORDER } from '../constants';
import { enhanceTaskDescription, generateSubtasks } from '../services/geminiService';
import { X, Sparkles, Plus, Trash2, CheckSquare, User as UserIcon, Loader2, Layers, Link as LinkIcon, ExternalLink, Flag, FileText, Edit2, Copy, ChevronDown, ChevronRight, SlidersHorizontal, Calendar } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null; // If null, creating new
  allTasks: Task[];
  users: User[];
  currentUser: User;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  swimlanes: { id: string; name: string }[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  allTasks,
  users,
  currentUser,
  onSave,
  onDelete,
  swimlanes,
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  
  // Link Inputs
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Deliverable Inputs
  const [delTitle, setDelTitle] = useState('');
  const [delUrl, setDelUrl] = useState('');

  // Comment Editing
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

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

  // Safe ID generator
  const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  // Initialize state when modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      setLinkTitle('');
      setLinkUrl('');
      setDelTitle('');
      setDelUrl('');
      setNewComment('');
      setEditingCommentId(null);
      setEditCommentText('');
      setIsDetailsExpanded(false); // Default to collapsed for less overwhelm
      if (task) {
        setEditedTask({ 
            ...task, 
            projectLinks: task.projectLinks || [],
            deliverables: task.deliverables || []
        });
      } else {
        // Default new task
        const today = new Date().toISOString().split('T')[0];
        setEditedTask({
          id: generateId(),
          type: TaskType.TASK,
          title: '',
          description: '',
          assignee: '',
          startDate: today,
          dueDate: today,
          priority: Priority.MEDIUM,
          status: TaskStatus.NOT_STARTED,
          phase: swimlanes[0]?.id || 'backlog',
          tags: [],
          subTaskIds: [],
          dependencies: [],
          projectLinks: [],
          deliverables: [],
          isMilestone: false,
          attributes: {
            Development: false,
            IXD: false,
            VXD: false,
            MXD: false,
            UXW: false,
            QA: false,
          },
          comments: [],
          createdAt: Date.now(),
        });
      }
    } else {
        setEditedTask(null); // Clean up when closed
    }
  }, [isOpen, task, swimlanes]);

  // Prevent rendering until state is initialized
  if (!isOpen || !editedTask) return null;

  const handleChange = (field: keyof Task, value: any) => {
    if (!editedTask) return;
    setEditedTask((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleAttributeChange = (attr: keyof typeof editedTask.attributes) => {
    if (!editedTask) return;
    setEditedTask((prev) => (prev ? {
      ...prev,
      attributes: {
        ...prev.attributes,
        [attr]: !prev.attributes[attr],
      },
    } : null));
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !editedTask) return;
    const comment: Comment = {
      id: generateId(),
      author: currentUser.name, 
      text: newComment,
      timestamp: Date.now(),
    };
    setEditedTask((prev) => (prev ? {
      ...prev,
      comments: [...prev.comments, comment],
    } : null));
    setNewComment('');
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleSaveEditedComment = (commentId: string) => {
    if (!editCommentText.trim() || !editedTask) return;
    const updatedComments = editedTask.comments.map(c => 
      c.id === commentId ? { ...c, text: editCommentText, editedAt: Date.now() } : c
    );
    setEditedTask(prev => prev ? { ...prev, comments: updatedComments } : null);
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!editedTask) return;
    openConfirm(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      () => {
        setEditedTask(prev => prev ? {
          ...prev,
          comments: prev.comments.filter(c => c.id !== commentId)
        } : null);
      }
    );
  };

  const handleAddLink = () => {
      if (!linkUrl.trim() || !editedTask) return;
      const newLink = {
          title: linkTitle.trim() || new URL(linkUrl).hostname,
          url: linkUrl.trim()
      };
      setEditedTask(prev => prev ? {
          ...prev,
          projectLinks: [...(prev.projectLinks || []), newLink]
      } : null);
      setLinkTitle('');
      setLinkUrl('');
  };

  const handleRemoveLink = (index: number) => {
      if (!editedTask) return;
      openConfirm(
        'Remove Link',
        'Are you sure you want to remove this link?',
        () => {
            setEditedTask(prev => prev ? {
                ...prev,
                projectLinks: (prev.projectLinks || []).filter((_, i) => i !== index)
            } : null);
        }
      );
  };

  const handleAddDeliverable = () => {
      if (!delUrl.trim() || !editedTask) return;
      const newLink = {
          title: delTitle.trim() || new URL(delUrl).hostname,
          url: delUrl.trim()
      };
      setEditedTask(prev => prev ? {
          ...prev,
          deliverables: [...(prev.deliverables || []), newLink]
      } : null);
      setDelTitle('');
      setDelUrl('');
  };

  const handleRemoveDeliverable = (index: number) => {
      if (!editedTask) return;
      openConfirm(
        'Remove Deliverable',
        'Are you sure you want to remove this deliverable?',
        () => {
            setEditedTask(prev => prev ? {
                ...prev,
                deliverables: (prev.deliverables || []).filter((_, i) => i !== index)
            } : null);
        }
      );
  };

  const handleMagicAssist = async () => {
    if (!editedTask?.title) return;
    setIsGenerating(true);
    const improvedDesc = await enhanceTaskDescription(editedTask.title, editedTask.description);
    setEditedTask(prev => (prev ? { ...prev, description: improvedDesc } : null));
    setIsGenerating(false);
  };

  const handleSuggestSubtasks = async () => {
      if (!editedTask?.title) return;
      setIsGenerating(true);
      const subtasks = await generateSubtasks(editedTask.title);
      const currentDesc = editedTask.description ? editedTask.description + '\n\n' : '';
      const subtaskList = subtasks.map(s => `- [ ] ${s.title}`).join('\n');
      
      setEditedTask(prev => (prev ? { ...prev, description: currentDesc + "**AI Suggested Subtasks:**\n" + subtaskList } : null));
      setIsGenerating(false);
  }

  const handleDeleteTask = () => {
      if (task) {
          const itemType = task.type === TaskType.EPIC ? 'Epic' : 'Task';
          openConfirm(
              `Delete ${itemType}`,
              `Are you sure you want to delete the ${itemType.toLowerCase()} "${task.title}"? This action cannot be undone.`,
              () => onDelete(task.id)
          );
      }
  };

  const handleDuplicateTask = () => {
      if (!editedTask) return;

      // Create a deep copy to ensure nested objects/arrays are not shared
      const taskCopy: Task = JSON.parse(JSON.stringify(editedTask));

      const duplicatedTask: Task = {
          ...taskCopy,
          id: generateId(),
          title: `${taskCopy.title} (Copy)`,
          comments: [], // Don't copy conversation history
          createdAt: Date.now()
      };

      onSave(duplicatedTask);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 overflow-y-auto p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 border border-slate-800 text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
             <select
                value={editedTask.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 font-bold text-sm text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
             >
                 <option value={TaskType.TASK}>Task</option>
                 <option value={TaskType.EPIC}>Epic</option>
             </select>
             <div className="h-6 w-px bg-slate-700"></div>
             <button
                onClick={() => handleChange('isMilestone', !editedTask.isMilestone)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                    editedTask.isMilestone 
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-300'
                }`}
             >
                 <Flag className={`w-4 h-4 ${editedTask.isMilestone ? 'fill-yellow-400' : ''}`} />
                 Milestone
             </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Title & Description */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder={editedTask.type === TaskType.EPIC ? "Epic Title" : "Task Title"}
              value={editedTask.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full text-2xl font-bold bg-transparent placeholder-slate-600 border-b border-slate-700 focus:border-primary-500 focus:outline-none p-3 transition-colors text-white"
              autoFocus={!task}
            />
            
            <div className="relative group">
              <div className="flex justify-between mb-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                            onClick={handleMagicAssist}
                            disabled={isGenerating}
                            className="flex items-center gap-1 text-xs text-secondary-400 hover:text-secondary-300 disabled:opacity-50 font-medium bg-secondary-900/30 border border-secondary-800 px-2 py-0.5 rounded"
                        >
                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                            Enhance
                        </button>
                         <button 
                            onClick={handleSuggestSubtasks}
                            disabled={isGenerating}
                            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50 font-medium bg-primary-900/30 border border-primary-800 px-2 py-0.5 rounded"
                        >
                           <CheckSquare className="w-3 h-3" />
                           Subtasks
                        </button>
                   </div>
              </div>
              <textarea
                rows={5}
                placeholder="Add a more detailed description..."
                value={editedTask.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none resize-none text-sm transition-all text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Primary Metadata (Always Visible) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Assignee</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                    value={editedTask.assignee}
                    onChange={(e) => handleChange('assignee', e.target.value)}
                    className="w-full pl-9 p-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-750 focus:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm appearance-none text-white truncate"
                    >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.name}>
                        {u.name}
                        </option>
                    ))}
                    </select>
                </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Status</label>
                 <select
                    value={editedTask.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 text-white truncate"
                 >
                     {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="date" 
                        value={editedTask.startDate || ''}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className="w-full pl-9 p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 text-white [color-scheme:dark]"
                    />
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Due Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="date" 
                        value={editedTask.dueDate}
                        onChange={(e) => handleChange('dueDate', e.target.value)}
                        className="w-full pl-9 p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 text-white [color-scheme:dark]"
                    />
                  </div>
              </div>
          </div>

          {/* Collapsible Section for Options */}
          <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/20">
             <button 
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-750 transition-colors"
             >
                <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <SlidersHorizontal className="w-4 h-4 text-primary-400" />
                    Task Properties
                    {!isDetailsExpanded && <span className="text-xs font-normal text-slate-500 ml-2">(Phase, Tags, Links, etc.)</span>}
                </div>
                {isDetailsExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
             </button>

             {isDetailsExpanded && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-700 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Left Column of Options */}
                    <div className="space-y-5">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Phase</label>
                                <select
                                value={editedTask.phase}
                                onChange={(e) => handleChange('phase', e.target.value)}
                                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 text-white"
                                >
                                {swimlanes.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Priority</label>
                                <select
                                value={editedTask.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 text-white"
                                >
                                {Object.values(Priority).map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                                </select>
                            </div>
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Attributes</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(editedTask.attributes || {}) as Array<keyof Task['attributes']>).map(attr => (
                                    <button
                                            key={attr}
                                            onClick={() => handleAttributeChange(attr)}
                                            className={`text-xs font-bold px-2 py-2 rounded-md border transition-all ${
                                                editedTask!.attributes[attr] 
                                                ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-900/50' 
                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-primary-500 hover:text-primary-400'
                                            }`}
                                    >
                                        {attr}
                                    </button>
                                ))}
                            </div>
                        </div>

                         {/* Custom Status Text */}
                         <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Status Note</label>
                            <input
                                type="text"
                                placeholder="e.g. 'Pending Review' (Optional)"
                                value={editedTask.customStatusText || ''}
                                onChange={(e) => handleChange('customStatusText', e.target.value)}
                                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-500"
                            />
                        </div>
                    </div>

                    {/* Right Column of Options */}
                    <div className="space-y-5">
                        
                        {/* Project Links */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Project Documentation</label>
                            
                            {/* Existing Links List */}
                            <div className="space-y-2 mb-3">
                                {editedTask.projectLinks?.map((link, idx) => (
                                    <div key={idx} className="group flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700 hover:border-slate-600 transition-colors">
                                        <LinkIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                        <a 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex-1 text-sm text-primary-400 hover:text-primary-300 hover:underline truncate"
                                            title={link.url}
                                        >
                                            {link.title || link.url}
                                        </a>
                                        <button 
                                            onClick={() => handleRemoveLink(idx)}
                                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Link */}
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 flex gap-2">
                                    <input 
                                        type="text"
                                        placeholder="Title (Optional)"
                                        value={linkTitle}
                                        onChange={(e) => setLinkTitle(e.target.value)}
                                        className="w-1/3 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-500 text-white placeholder-slate-500"
                                    />
                                    <input 
                                        type="url"
                                        placeholder="https://..."
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                                        className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-500 text-white placeholder-slate-500"
                                    />
                                </div>
                                <button 
                                    onClick={handleAddLink}
                                    disabled={!linkUrl}
                                    className="p-1.5 bg-slate-700 hover:bg-primary-600 disabled:hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg border border-slate-600 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Dependencies */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Dependencies</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {editedTask.dependencies?.map(depId => {
                                    const depTask = allTasks.find(t => t.id === depId);
                                    return (
                                        <span key={depId} className="inline-flex items-center bg-red-900/30 text-red-200 px-2 py-1 rounded-md text-xs border border-red-800 font-medium">
                                            {depTask?.title || 'Unknown'}
                                            <button 
                                            onClick={() => {
                                                const newDeps = editedTask.dependencies?.filter(d => d !== depId) || [];
                                                handleChange('dependencies', newDeps);
                                            }}
                                            className="ml-1.5 hover:text-white bg-red-800/50 rounded-full w-4 h-4 flex items-center justify-center"
                                            >×</button>
                                        </span>
                                    )
                                })}
                            </div>
                            <select
                            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 text-white"
                            onChange={(e) => {
                                if(!e.target.value) return;
                                const currentDeps = editedTask.dependencies || [];
                                if(!currentDeps.includes(e.target.value)) {
                                    handleChange('dependencies', [...currentDeps, e.target.value]);
                                }
                            }}
                            value=""
                            >
                                <option value="">Link to another task...</option>
                                {allTasks.filter(t => t.id !== editedTask!.id).map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>

                         {/* Epic Subtasks (Only if Epic) */}
                        {editedTask.type === TaskType.EPIC && (
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-secondary-400 uppercase mb-1.5 tracking-wider">
                                <Layers className="w-3 h-3" /> Child Tasks
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {editedTask.subTaskIds?.map(subId => {
                                    const subTask = allTasks.find(t => t.id === subId);
                                    return (
                                        <span key={subId} className="inline-flex items-center bg-secondary-900/30 text-secondary-200 px-2 py-1 rounded-md text-xs border border-secondary-800 font-medium">
                                            {subTask?.title || 'Unknown'}
                                            <button 
                                                onClick={() => {
                                                    const newSubs = editedTask.subTaskIds?.filter(s => s !== subId) || [];
                                                    handleChange('subTaskIds', newSubs);
                                                }}
                                                className="ml-1.5 hover:text-white bg-secondary-800/50 rounded-full w-4 h-4 flex items-center justify-center"
                                            >×</button>
                                        </span>
                                    )
                                })}
                            </div>
                            <select
                                className="w-full p-2.5 bg-secondary-900/20 border border-secondary-800/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary-500 text-white"
                                onChange={(e) => {
                                    if(!e.target.value) return;
                                    const currentSubs = editedTask.subTaskIds || [];
                                    if(!currentSubs.includes(e.target.value)) {
                                        handleChange('subTaskIds', [...currentSubs, e.target.value]);
                                    }
                                }}
                                value=""
                            >
                                <option value="">Add child task...</option>
                                {allTasks
                                    .filter(t => t.id !== editedTask!.id && t.type !== TaskType.EPIC)
                                    .map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                        )}

                        {/* Tags */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Tags</label>
                            <input 
                                    type="text"
                                    value={editedTask.tags ? editedTask.tags.join(', ') : ''}
                                    onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-slate-500"
                                    placeholder="design, bug, urgent (comma separated)"
                            />
                        </div>
                    </div>
                </div>
             )}
          </div>

          {/* Deliverables Section */}
          <div className="pt-6 mt-2 border-t border-slate-800">
             <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Deliverables</label>
             
             <div className="space-y-2 mb-3">
                 {editedTask.deliverables?.map((link, idx) => (
                     <div key={idx} className="group flex items-center gap-3 bg-slate-800 p-3 rounded border border-slate-700 hover:border-slate-600 transition-colors">
                         <div className="p-2 bg-slate-700/50 rounded text-primary-400">
                             <FileText className="w-4 h-4" />
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="text-sm font-bold text-slate-200 truncate">{link.title}</div>
                             <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-primary-400 hover:text-primary-300 hover:underline truncate block"
                             >
                                 {link.url}
                             </a>
                         </div>
                         <button 
                            onClick={() => handleRemoveDeliverable(idx)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-all opacity-0 group-hover:opacity-100"
                         >
                             <X className="w-4 h-4" />
                         </button>
                     </div>
                 ))}
                 {(!editedTask.deliverables || editedTask.deliverables.length === 0) && (
                     <div className="text-sm text-slate-500 italic px-2 border border-dashed border-slate-700/50 rounded p-3 text-center">
                         No deliverables added.
                     </div>
                 )}
             </div>

             <div className="flex gap-2 items-center">
                 <div className="flex-1 flex gap-2">
                    <input 
                        type="text"
                        placeholder="File Name"
                        value={delTitle}
                        onChange={(e) => setDelTitle(e.target.value)}
                        className="w-1/3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500 text-white placeholder-slate-500"
                    />
                    <input 
                        type="url"
                        placeholder="URL (Drive, Dropbox, Figma...)"
                        value={delUrl}
                        onChange={(e) => setDelUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDeliverable()}
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500 text-white placeholder-slate-500"
                    />
                 </div>
                 <button 
                    onClick={handleAddDeliverable}
                    disabled={!delUrl}
                    className="p-2 bg-slate-700 hover:bg-primary-600 disabled:hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg border border-slate-600 transition-colors"
                 >
                     <Plus className="w-5 h-5" />
                 </button>
             </div>
          </div>

          {/* Comments Section */}
          <div className="pt-6 border-t border-slate-800">
             <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Discussion</label>
             <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-2 scrollbar-thin">
                 {editedTask.comments.map(c => {
                   const isAuthor = c.author === currentUser.name || c.author === 'Me';
                   const isAdmin = currentUser.role === 'Admin';
                   const canManage = isAuthor || isAdmin;
                   const isEditing = editingCommentId === c.id;

                   return (
                     <div key={c.id} className="bg-slate-800 p-3 rounded-lg text-sm border border-slate-700 group">
                         <div className="flex justify-between mb-1">
                             <span className="font-bold text-slate-200">{c.author}</span>
                             <div className="flex items-center gap-2">
                               <span className="text-xs text-slate-500">{new Date(c.timestamp).toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                               {canManage && !isEditing && (
                                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleStartEditComment(c)}
                                            className="p-1 text-slate-500 hover:text-primary-400 rounded hover:bg-slate-700"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteComment(c.id)}
                                            className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-700"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                   </div>
                               )}
                             </div>
                         </div>
                         {isEditing ? (
                            <div className="mt-2 space-y-2">
                                <textarea
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={handleCancelEditComment}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-700 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => handleSaveEditedComment(c.id)}
                                        className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                         ) : (
                            <>
                              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                              {c.editedAt && (
                                  <span className="block text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">Edited</span>
                              )}
                            </>
                         )}
                     </div>
                   );
                 })}
                 {editedTask.comments.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm italic bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
                        No comments yet. Start the discussion!
                    </div>
                 )}
             </div>
             <div className="flex gap-2">
                 <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Write a comment... (Use @name to mention)"
                    className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-white placeholder-slate-500"
                 />
                 <button 
                    onClick={handleAddComment} 
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-slate-600"
                 >
                    Post
                 </button>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-xl flex justify-between items-center sticky bottom-0">
          <div className="flex gap-3">
              {task && (
                <>
                 <button 
                    onClick={handleDeleteTask}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-900/20 transition-colors text-sm font-bold"
                 >
                    <Trash2 className="w-4 h-4" /> Delete
                 </button>
                 <button 
                    onClick={handleDuplicateTask}
                    className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-bold"
                 >
                    <Copy className="w-4 h-4" /> Duplicate
                 </button>
                </>
              )}
          </div>
          
          <div className="flex gap-3">
             <button 
                onClick={onClose}
                className="px-6 py-2 text-slate-400 hover:bg-slate-800 rounded-lg font-bold text-sm transition-colors"
             >
                Cancel
             </button>
             <button 
                onClick={() => onSave(editedTask)}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-50 text-white rounded-lg font-bold text-sm shadow-lg shadow-primary-900/30 transition-all flex items-center gap-2"
             >
                <CheckSquare className="w-4 h-4" />
                {task ? 'Save Changes' : 'Post Task'}
             </button>
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
