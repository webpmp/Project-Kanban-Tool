

import React, { useState, useEffect } from 'react';
import { StatusUpdate, User, Comment } from '../types';
import { ArrowLeft, Calendar, ArrowRight, Edit2, Save, X, Trash2, MessageSquare, Send } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface StatusUpdateDetailProps {
    update: StatusUpdate;
    allUpdates: StatusUpdate[];
    currentUser: User;
    users: User[];
    onBack: () => void;
    onSelectUpdate: (id: string) => void;
    onSave: (update: StatusUpdate) => void;
    onDelete: (id: string) => void;
}

export const StatusUpdateDetail: React.FC<StatusUpdateDetailProps> = ({ update, allUpdates, currentUser, users, onBack, onSelectUpdate, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedUpdate, setEditedUpdate] = useState<StatusUpdate>(update);
    const [commentText, setCommentText] = useState('');
    
    // Comment Editing State
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

    // Reset state when the displayed update changes
    useEffect(() => {
        setEditedUpdate(update);
        setIsEditing(false);
        setCommentText('');
        setEditingCommentId(null);
        setEditCommentText('');
    }, [update]);

    const handleSave = () => {
        onSave(editedUpdate);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedUpdate(update);
        setIsEditing(false);
    };

    const handleDelete = () => {
        openConfirm(
            'Delete Update',
            'Are you sure you want to delete this status update? This action cannot be undone.',
            () => onDelete(update.id)
        );
    };

    const handleAddComment = () => {
        if (!commentText.trim()) return;
        
        const newComment: Comment = {
            id: Math.random().toString(36).substr(2, 9),
            author: currentUser.name,
            text: commentText,
            timestamp: Date.now()
        };

        const updated = {
            ...update,
            comments: [...(update.comments || []), newComment]
        };
        
        onSave(updated);
        setCommentText('');
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
        if (!editCommentText.trim()) return;
        
        const updatedComments = (update.comments || []).map(c => 
            c.id === commentId ? { ...c, text: editCommentText, editedAt: Date.now() } : c
        );

        const updatedUpdate = { ...update, comments: updatedComments };
        onSave(updatedUpdate);
        setEditingCommentId(null);
        setEditCommentText('');
    };

    const handleDeleteComment = (commentId: string) => {
        openConfirm(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            () => {
                const updatedComments = (update.comments || []).filter(c => c.id !== commentId);
                const updatedUpdate = { ...update, comments: updatedComments };
                onSave(updatedUpdate);
            }
        );
    };

    const getStatusColor = (status?: string) => {
        switch(status) {
            case 'On Track': return 'bg-green-100 text-green-700 border-green-200';
            case 'Risks': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Blocked': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const canEdit = currentUser.name === update.author || currentUser.role === 'Admin';

    const authorUser = users.find(u => u.name === update.author);
    const authorRole = authorUser ? (authorUser.jobTitle || authorUser.role) : 'Member';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Status Update</h1>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {canEdit && !isEditing && (
                        <>
                         <button 
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm transition-colors"
                         >
                             <Trash2 className="w-4 h-4" /> Delete
                         </button>
                         <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-bold text-sm transition-colors"
                         >
                             <Edit2 className="w-4 h-4" /> Edit
                         </button>
                        </>
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
                                disabled={!editedUpdate.title || !editedUpdate.content}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 max-w-6xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        {isEditing ? (
                            // Edit Mode Form
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Title</label>
                                        <input 
                                            type="text" 
                                            value={editedUpdate.title}
                                            onChange={(e) => setEditedUpdate({...editedUpdate, title: e.target.value})}
                                            className="w-full text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Type</label>
                                            <select
                                                value={editedUpdate.type}
                                                onChange={(e) => setEditedUpdate({...editedUpdate, type: e.target.value as any})}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                                            >
                                                <option value="Daily">Daily</option>
                                                <option value="Weekly">Weekly</option>
                                                <option value="Monthly">Monthly</option>
                                                <option value="Ad-hoc">Ad-hoc</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Date</label>
                                            <input 
                                                type="date" 
                                                value={editedUpdate.date}
                                                onChange={(e) => setEditedUpdate({...editedUpdate, date: e.target.value})}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Project Health</label>
                                        <select
                                            value={editedUpdate.projectStatus || 'On Track'}
                                            onChange={(e) => setEditedUpdate({...editedUpdate, projectStatus: e.target.value as any})}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                                        >
                                            <option value="On Track">On Track</option>
                                            <option value="Risks">Risks</option>
                                            <option value="Blocked">Blocked</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Content</label>
                                        <textarea 
                                            rows={12}
                                            value={editedUpdate.content}
                                            onChange={(e) => setEditedUpdate({...editedUpdate, content: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                {/* Meta Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                            update.type === 'Weekly' ? 'bg-primary-100 text-primary-700' :
                                            update.type === 'Daily' ? 'bg-green-100 text-green-700' :
                                            update.type === 'Monthly' ? 'bg-secondary-100 text-secondary-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {update.type}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(update.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                    {update.projectStatus && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(update.projectStatus)}`}>
                                            {update.projectStatus}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">{update.title}</h1>

                                <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-200">
                                        {update.author.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{update.author}</p>
                                        <p className="text-xs text-gray-500">{authorRole}</p>
                                    </div>
                                </div>

                                <div className="prose prose-slate max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {update.content}
                                </div>

                                {/* Comments Section */}
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-gray-400" />
                                        Comments ({update.comments?.length || 0})
                                    </h3>
                                    
                                    <div className="space-y-6 mb-6">
                                        {update.comments?.map(comment => {
                                            const commentAuthor = users.find(u => u.name === comment.author);
                                            const isAuthor = currentUser.name === comment.author;
                                            const isAdmin = currentUser.role === 'Admin';
                                            const canManageComment = isAuthor || isAdmin;
                                            const isEditingThis = editingCommentId === comment.id;

                                            return (
                                                <div key={comment.id} className="flex gap-3 group">
                                                    <img 
                                                        src={commentAuthor?.avatarUrl || `https://ui-avatars.com/api/?name=${comment.author}&background=random`} 
                                                        alt={comment.author}
                                                        className="w-8 h-8 rounded-full object-cover mt-1"
                                                    />
                                                    <div className="bg-gray-50 rounded-lg p-3 flex-1 border border-gray-100 relative">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-sm text-gray-900">{comment.author}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                                {canManageComment && !isEditingThis && (
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button 
                                                                            onClick={() => handleStartEditComment(comment)}
                                                                            className="p-1 text-gray-400 hover:text-primary-600 rounded hover:bg-primary-50"
                                                                            title="Edit"
                                                                        >
                                                                            <Edit2 className="w-3 h-3" />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDeleteComment(comment.id)}
                                                                            className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {isEditingThis ? (
                                                            <div className="mt-2 space-y-2">
                                                                <textarea
                                                                    value={editCommentText}
                                                                    onChange={(e) => setEditCommentText(e.target.value)}
                                                                    className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                                                                    rows={3}
                                                                    autoFocus
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button 
                                                                        onClick={handleCancelEditComment}
                                                                        className="px-3 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleSaveEditedComment(comment.id)}
                                                                        className="px-3 py-1 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                                                                {comment.editedAt && (
                                                                    <span className="block text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">Edited</span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!update.comments || update.comments.length === 0) && (
                                            <p className="text-gray-500 text-sm italic">No comments yet. Be the first to share your thoughts.</p>
                                        )}
                                    </div>

                                    {/* Add Comment */}
                                    <div className="flex gap-3">
                                         <img 
                                            src={currentUser.avatarUrl} 
                                            alt={currentUser.name}
                                            className="w-8 h-8 rounded-full object-cover mt-1"
                                        />
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-12 py-4 text-sm leading-relaxed text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                                rows={2}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleAddComment();
                                                    }
                                                }}
                                            />
                                            <button 
                                                onClick={handleAddComment}
                                                disabled={!commentText.trim()}
                                                className="absolute right-2 bottom-2.5 p-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            History
                         </h3>
                         <div className="space-y-0 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                            {allUpdates.map(u => {
                                const isActive = u.id === update.id;
                                return (
                                    <div 
                                        key={u.id} 
                                        onClick={() => !isEditing && onSelectUpdate(u.id)} // Disable switching while editing to prevent data loss/complexity
                                        className={`relative pl-8 py-3 cursor-pointer group transition-all rounded-r-lg hover:bg-gray-50 ${isActive ? '' : isEditing ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`}
                                    >
                                        <div className={`absolute left-[11px] top-5 w-2 h-2 rounded-full border-2 border-white shadow-sm z-10 transition-all duration-300 ${isActive ? 'bg-primary-600 scale-125 ring-2 ring-primary-100' : 'bg-gray-300 group-hover:bg-primary-400'}`}></div>
                                        
                                        <div className="text-[10px] font-bold text-gray-400 mb-0.5 flex justify-between pr-2">
                                            <span>{new Date(u.date).toLocaleDateString()}</span>
                                            {isActive && <span className="text-primary-600 flex items-center gap-1">Viewing <ArrowLeft className="w-3 h-3 rotate-180" /></span>}
                                        </div>
                                        <h4 className={`text-sm font-bold leading-tight pr-2 ${isActive ? 'text-primary-600' : 'text-gray-700 group-hover:text-primary-600'}`}>
                                            {u.title}
                                        </h4>
                                    </div>
                                );
                            })}
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