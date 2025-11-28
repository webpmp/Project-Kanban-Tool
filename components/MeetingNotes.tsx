import React, { useState, useEffect } from 'react';
import { MeetingNote, User, Comment } from '../types';
import { Plus, Search, Calendar, Edit2, Trash2, Check, X, FileText, Clock, ChevronRight, HelpCircle, Copy, MessageSquare, Send } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface MeetingNotesProps {
  notes: MeetingNote[];
  currentUser: User;
  onAddNote: (note: MeetingNote) => void;
  onUpdateNote: (note: MeetingNote) => void;
  onDeleteNote: (id: string) => void;
}

const NOTE_TEMPLATE = `# Purpose/Goals
- 

# Decisions
- 

# Action Items
- [ ] 

# Attendees
- 
`;

const MarkdownViewer: React.FC<{ content: string }> = ({ content }) => {
    // Helper to render inline markdown (bolding)
    const renderText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const lines = content.split('\n');
    return (
        <div className="prose prose-slate max-w-none space-y-2 text-sm text-gray-700 leading-relaxed">
            {lines.map((line, idx) => {
                if (line.startsWith('# ')) {
                    return <h1 key={idx} className="text-xl font-bold text-gray-900 mt-6 mb-2">{line.replace('# ', '')}</h1>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={idx} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                    return <h3 key={idx} className="text-base font-bold text-gray-800 mt-3 mb-1">{line.replace('### ', '')}</h3>;
                }
                if (line.trim().startsWith('- [ ]')) {
                    return (
                        <div key={idx} className="flex items-start gap-2 my-1 ml-4 text-gray-700">
                            <div className="mt-0.5 h-4 w-4 rounded border border-gray-300 bg-white flex-shrink-0"></div>
                            <span>{renderText(line.replace('- [ ]', ''))}</span>
                        </div>
                    );
                }
                if (line.trim().startsWith('- [x]')) {
                    return (
                        <div key={idx} className="flex items-start gap-2 my-1 ml-4 text-gray-400 line-through">
                            <div className="mt-0.5 h-4 w-4 rounded border border-gray-300 bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-gray-400" />
                            </div>
                            <span>{renderText(line.replace('- [x]', ''))}</span>
                        </div>
                    );
                }
                if (line.trim().startsWith('- ')) {
                    return (
                        <div key={idx} className="flex items-start gap-2 my-1 ml-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                            <span>{renderText(line.replace('- ', ''))}</span>
                        </div>
                    );
                }

                // Handle lines that might be empty or regular text
                return <p key={idx} className="min-h-[1.25rem]">{renderText(line)}</p>;
            })}
        </div>
    );
};

export const MeetingNotes: React.FC<MeetingNotesProps> = ({
    notes,
    currentUser,
    onAddNote,
    onUpdateNote,
    onDeleteNote
}) => {
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    
    // Editor State
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editDate, setEditDate] = useState('');

    // Comments State
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');

    // Sort notes by date descending
    const sortedNotes = [...notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter
    const filteredNotes = sortedNotes.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    // Confirmation Modal State
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDangerous: true });

    // Removed auto-selection useEffect to keep page blank by default

    const handleCreateNew = () => {
        const newNote: MeetingNote = {
            id: `note_${Date.now()}`,
            title: 'Meeting',
            date: new Date().toISOString().split('T')[0],
            content: NOTE_TEMPLATE,
            createdAt: Date.now(),
            lastModified: Date.now(),
            comments: []
        };
        onAddNote(newNote);
        setSelectedNoteId(newNote.id);
        startEdit(newNote);
    };

    const startEdit = (note: MeetingNote) => {
        setEditTitle(note.title);
        setEditContent(note.content);
        setEditDate(note.date);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!selectedNote) return;
        onUpdateNote({
            ...selectedNote,
            title: editTitle,
            content: editContent,
            date: editDate,
            lastModified: Date.now()
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (selectedNote) {
            setEditTitle(selectedNote.title);
            setEditContent(selectedNote.content);
            setEditDate(selectedNote.date);
        }
    };

    const handleDelete = () => {
        if (!selectedNoteId) return;
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Note',
            message: 'Are you sure you want to delete this meeting note? This action cannot be undone.',
            onConfirm: () => {
                onDeleteNote(selectedNoteId);
                setSelectedNoteId(null);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            isDangerous: true
        });
    };

    const handleCopy = async () => {
        if (!selectedNote) return;
        try {
            await navigator.clipboard.writeText(selectedNote.content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    // --- Comment Handlers ---

    const handleAddComment = () => {
        if (!selectedNote || !newComment.trim()) return;
        
        const comment: Comment = {
            id: `c_${Date.now()}`,
            author: currentUser.name,
            text: newComment,
            timestamp: Date.now()
        };

        const updatedNote = {
            ...selectedNote,
            comments: [...(selectedNote.comments || []), comment]
        };

        onUpdateNote(updatedNote);
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
        if (!selectedNote || !editCommentText.trim()) return;
        
        const updatedComments = (selectedNote.comments || []).map(c => 
            c.id === commentId ? { ...c, text: editCommentText, editedAt: Date.now() } : c
        );

        onUpdateNote({ ...selectedNote, comments: updatedComments });
        setEditingCommentId(null);
        setEditCommentText('');
    };

    const handleDeleteComment = (commentId: string) => {
        if (!selectedNote) return;
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Comment',
            message: 'Are you sure you want to delete this comment?',
            onConfirm: () => {
                const updatedNote = {
                    ...selectedNote,
                    comments: (selectedNote.comments || []).filter(c => c.id !== commentId)
                };
                onUpdateNote(updatedNote);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            isDangerous: true
        });
    };

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden">
            {/* Sidebar Log */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-100 space-y-3">
                    <button 
                        onClick={handleCreateNew}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-bold shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Meeting Note
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search notes..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {filteredNotes.map(note => {
                        const isSelected = note.id === selectedNoteId;
                        return (
                            <div 
                                key={note.id}
                                onClick={() => !isEditing && setSelectedNoteId(note.id)}
                                className={`p-4 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 group ${isSelected ? 'bg-primary-50 hover:bg-primary-50 border-primary-100' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>{note.title}</h4>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(note.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{note.content.replace(/[#*-]/g, '')}</p>
                            </div>
                        )
                    })}
                    {filteredNotes.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-xs italic">
                            No notes found.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
                {selectedNote ? (
                    <>
                        {/* Header */}
                        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
                            {isEditing ? (
                                <div className="flex-1 mr-4 flex gap-4">
                                     <input 
                                        type="text" 
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="flex-1 text-xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Meeting Title"
                                        autoFocus
                                     />
                                     <input 
                                        type="date"
                                        value={editDate}
                                        onChange={e => setEditDate(e.target.value)}
                                        className="bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                     />
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {new Date(selectedNote.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-800">{selectedNote.title}</h1>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                
                                {/* Markdown Help Tooltip */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors mr-1"
                                        title="Markdown Formatting Tips"
                                    >
                                        <HelpCircle className="w-5 h-5" />
                                    </button>
                                    
                                    {showMarkdownHelp && (
                                        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
                                            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                                    <FileText className="w-4 h-4" /> Markdown Guide
                                                </h3>
                                                <button onClick={() => setShowMarkdownHelp(false)} className="text-gray-400 hover:text-gray-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-6 text-xs text-gray-600">
                                                <section>
                                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">Headings</h4>
                                                    <div className="space-y-1 font-mono bg-gray-50 p-2 rounded">
                                                        <div># Heading Level 1</div>
                                                        <div>## Heading Level 2</div>
                                                        <div>### Heading Level 3</div>
                                                    </div>
                                                </section>

                                                <section>
                                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">Emphasis</h4>
                                                    <div className="space-y-1 font-mono bg-gray-50 p-2 rounded">
                                                        <div>*Italic text* or _Italic text_</div>
                                                        <div>**Bold text** or __Bold text__</div>
                                                        <div>~~Strikethrough~~</div>
                                                    </div>
                                                </section>

                                                <section>
                                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">Lists</h4>
                                                    <div className="font-mono bg-gray-50 p-2 rounded whitespace-pre">
{`1. First ordered list item
2. Second ordered list item
  * Unordered sub-list item 1
  * Unordered sub-list item 2

* Unordered list item 1
* Unordered list item 2`}
                                                    </div>
                                                </section>

                                                <section>
                                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">Task Lists</h4>
                                                    <div className="space-y-1 font-mono bg-gray-50 p-2 rounded">
                                                        <div>- [ ] Unchecked Item</div>
                                                        <div>- [x] Checked Item</div>
                                                    </div>
                                                </section>

                                                <section>
                                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">Links and Images</h4>
                                                    <div className="space-y-1 font-mono bg-gray-50 p-2 rounded break-all">
                                                        <div>[Link to Google](https://www.google.com)</div>
                                                        <div className="mt-2">![Placeholder Image Example](via.placeholder.com "Optional title")</div>
                                                    </div>
                                                </section>

                                                <section>
                                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">Blockquotes</h4>
                                                    <div className="font-mono bg-gray-50 p-2 rounded whitespace-pre">
{`> This is a blockquote. You can use multiple lines here.
> > Nested blockquotes can be created with extra > symbols.`}
                                                    </div>
                                                </section>

                                                <section>
                                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">Code</h4>
                                                    <p className="mb-2">Inline code is marked with backticks: <code className="bg-gray-200 px-1 rounded">`const example = "hello";`</code></p>
                                                    <div className="font-mono bg-gray-50 p-2 rounded whitespace-pre">
{`\`\`\`python
def say_hello(name):
    print(f"Hello, {name}!")
\`\`\``}
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isEditing ? (
                                    <>
                                        <button 
                                            onClick={handleCancel}
                                            className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSave}
                                            disabled={!editTitle}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg font-bold text-sm shadow-sm transition-all"
                                        >
                                            <Check className="w-4 h-4" /> Save
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Copy to Clipboard"
                                        >
                                            {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <button 
                                            onClick={handleDelete}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Note"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => startEdit(selectedNote)}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-bold text-sm transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Editor / Viewer */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px] p-8">
                                {isEditing ? (
                                    <textarea 
                                        value={editContent}
                                        onChange={e => setEditContent(e.target.value)}
                                        className="w-full h-full min-h-[500px] outline-none text-sm leading-relaxed text-gray-800 resize-none bg-transparent"
                                        placeholder="Type your meeting notes here... (Markdown supported)"
                                        autoFocus
                                    />
                                ) : (
                                    <MarkdownViewer content={selectedNote.content} />
                                )}
                            </div>
                            
                            <div className="max-w-4xl mx-auto mt-4 text-xs text-gray-400 text-center flex items-center justify-center gap-2 mb-8">
                                <Clock className="w-3 h-3" /> Last modified: {new Date(selectedNote.lastModified).toLocaleString()}
                            </div>

                             {/* Comments Section - Only show when not editing note content */}
                             {!isEditing && (
                                <div className="max-w-4xl mx-auto mt-8 pt-8 border-t border-gray-200 pb-10">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-gray-400" />
                                        Comments ({selectedNote.comments?.length || 0})
                                    </h3>
                                    
                                    <div className="space-y-6 mb-6">
                                        {selectedNote.comments?.map(comment => {
                                            const isAuthor = currentUser.name === comment.author;
                                            const isAdmin = currentUser.role === 'Admin';
                                            const canManageComment = isAuthor || isAdmin;
                                            const isEditingThis = editingCommentId === comment.id;

                                            return (
                                                <div key={comment.id} className="flex gap-3 group">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mt-1 flex-shrink-0">
                                                        {comment.author.charAt(0)}
                                                    </div>
                                                    <div className="bg-white rounded-lg p-3 flex-1 border border-gray-200 shadow-sm relative">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-sm text-gray-900">{comment.author}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
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
                                                                    className="w-full p-2 text-sm bg-gray-50 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
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
                                                                    <span className="block text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">EDITED</span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!selectedNote.comments || selectedNote.comments.length === 0) && (
                                            <p className="text-gray-400 text-sm italic">No comments yet.</p>
                                        )}
                                    </div>

                                    {/* Add Comment */}
                                    <div className="flex gap-3">
                                         <img 
                                            src={currentUser.avatarUrl} 
                                            alt={currentUser.name}
                                            className="w-8 h-8 rounded-full object-cover mt-1 flex-shrink-0"
                                        />
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="w-full bg-white border border-gray-200 rounded-lg pl-4 pr-12 py-3 text-sm leading-relaxed text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none resize-none shadow-sm"
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
                                                disabled={!newComment.trim()}
                                                className="absolute right-2 bottom-2.5 p-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                             )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-bold">No note selected</p>
                        <p className="text-sm">Select a note from the sidebar or create a new one.</p>
                    </div>
                )}
            </div>

            <ConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                isDangerous={confirmConfig.isDangerous}
            />
        </div>
    );
}