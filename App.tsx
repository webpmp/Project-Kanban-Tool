

import React, { useState, useRef, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Card } from './components/Card';
import { TaskModal } from './components/TaskModal';
import { TeamManagement } from './components/TeamManagement';
import { ProjectOverview } from './components/ProjectOverview';
import { CreateStatusUpdate } from './components/CreateStatusUpdate';
import { StatusUpdateDetail } from './components/StatusUpdateDetail';
import { ConfirmModal } from './components/ConfirmModal';
import { GanttChart } from './components/GanttChart';
import { AIAssistant } from './components/AIAssistant';
import { Task, Swimlane, SortOption, User, TaskType, ProjectDetails, StatusUpdate } from './types';
import { INITIAL_SWIMLANES, INITIAL_TASKS, PRIORITY_ORDER, MOCK_USERS, INITIAL_STATUS_UPDATES, THEMES } from './constants';
import { Plus, ArrowUpDown, Settings, Search, Trash2, GripVertical } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'board' | 'team' | 'overview' | 'create-status' | 'status-detail' | 'gantt'>('board');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [swimlanes, setSwimlanes] = useState<Swimlane[]>(INITIAL_SWIMLANES);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>(INITIAL_STATUS_UPDATES);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTheme, setCurrentTheme] = useState(THEMES[0].name);
  
  // Status Update View State
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);

  // Mock Authenticated User (defaults to first admin)
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  
  // Project Settings
  const [projectImage, setProjectImage] = useState<string>('');
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
      name: "Gemini Kanban",
      description: "A powerful, AI-enhanced Kanban board with swimlanes, epics, dependencies, and team analytics. Designed to streamline workflows and improve team collaboration through visual management.",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      docs: [
          { title: "Product Requirements Document", url: "#" },
          { title: "Figma Design System", url: "#" },
          { title: "API Documentation", url: "#" }
      ]
  });
  
  // Highlight Logic
  const [highlightCriteria, setHighlightCriteria] = useState<{ mode: 'type' | 'status', value: string } | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // For editing swimlane names
  const [editingLane, setEditingLane] = useState<string | null>(null);
  const [newLaneName, setNewLaneName] = useState('');

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDangerous: true });

  // Apply Theme Effect
  useEffect(() => {
    const theme = THEMES.find(t => t.name === currentTheme) || THEMES[0];
    const root = document.documentElement;

    // Apply Primary Colors
    Object.entries(theme.colors.primary).forEach(([shade, value]) => {
      root.style.setProperty(`--primary-${shade}`, value);
    });

    // Apply Secondary Colors
    Object.entries(theme.colors.secondary).forEach(([shade, value]) => {
      root.style.setProperty(`--secondary-${shade}`, value);
    });

  }, [currentTheme]);

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
      if (confirmConfig.onConfirm) {
          confirmConfig.onConfirm();
      }
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Team Management Handlers
  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleUpdateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    // Update current user if self-updated
    if (currentUser.id === user.id) {
        setCurrentUser(user);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    // Optionally remove assignee from tasks
    setTasks(prev => prev.map(t => {
        const user = users.find(u => u.id === userId);
        if (user && t.assignee === user.name) {
            return { ...t, assignee: '' };
        }
        return t;
    }));
  };

  const handleTaskSave = (updatedTask: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === updatedTask.id);
      if (exists) {
        return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      }
      return [...prev, updatedTask];
    });
    setModalOpen(false);
    setCurrentTask(null);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setModalOpen(false);
    setCurrentTask(null);
  };

  const handleTaskClick = (task: Task) => {
    setCurrentTask(task);
    setModalOpen(true);
  };

  const handleLaneDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('application/gemini-lane', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLaneOrTaskDrop = (e: React.DragEvent, laneId: string, dropIndex: number) => {
    e.preventDefault();
    
    // 1. Handle Lane Reorder
    const laneIndexStr = e.dataTransfer.getData('application/gemini-lane');
    if (laneIndexStr) {
        const dragIndex = parseInt(laneIndexStr, 10);
        if (!isNaN(dragIndex) && dragIndex !== dropIndex) {
            const newSwimlanes = [...swimlanes];
            const [removed] = newSwimlanes.splice(dragIndex, 1);
            newSwimlanes.splice(dropIndex, 0, removed);
            
            // Update order property and state
            setSwimlanes(newSwimlanes.map((l, i) => ({ ...l, order: i })));
        }
        return;
    }

    // 2. Handle Task Move
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, phase: laneId } : t));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const openNewTaskModal = () => {
    setCurrentTask(null);
    setModalOpen(true);
  };

  const handleHighlight = (criteria: { mode: 'type' | 'status', value: string }) => {
      if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
      }
      setHighlightCriteria(criteria);
      highlightTimeoutRef.current = setTimeout(() => {
          setHighlightCriteria(null);
      }, 5000);
  };

  // Swimlane Management
  const startEditLane = (lane: Swimlane) => {
      setEditingLane(lane.id);
      setNewLaneName(lane.name);
  };

  const saveLaneName = () => {
      if(editingLane && newLaneName.trim()) {
          setSwimlanes(prev => prev.map(l => l.id === editingLane ? { ...l, name: newLaneName } : l));
      }
      setEditingLane(null);
  };

  const handleAddLane = () => {
    const newId = `lane-${Date.now()}`;
    const newLane: Swimlane = {
        id: newId,
        name: 'New Lane',
        order: swimlanes.length
    };
    setSwimlanes(prev => [...prev, newLane]);
    // Automatically start editing the new lane
    setEditingLane(newId);
    setNewLaneName('New Lane');
  };

  const handleDeleteLane = (laneId: string) => {
      const lane = swimlanes.find(l => l.id === laneId);
      const laneName = lane ? lane.name : 'Unknown';
      const laneTasks = tasks.filter(t => t.phase === laneId);
      
      if (laneTasks.length > 0) {
          alert(`Cannot delete swimlane "${laneName}".\n\nIt contains ${laneTasks.length} tasks. Please move or delete them first.`);
          return;
      }
      
      openConfirm(
          'Delete Swimlane',
          `Are you sure you want to delete the swimlane "${laneName}"? This action cannot be undone.`,
          () => {
             setSwimlanes(prev => prev.filter(l => l.id !== laneId));
          }
      );
  };

  // Sorting Logic
  const getSortedTasks = (laneId: string) => {
    const laneTasks = tasks.filter(t => t.phase === laneId);
    
    // Filter by search
    const filtered = laneTasks.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.assignee.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'priority') {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      if (sortBy === 'assignee') {
        return (a.assignee || '').localeCompare(b.assignee || '');
      }
      return 0;
    });
  };

  const handleCreateStatusUpdate = (newUpdate: StatusUpdate) => {
      setStatusUpdates(prev => [newUpdate, ...prev]);
      setCurrentView('overview');
  };

  const handleUpdateStatusUpdate = (updated: StatusUpdate) => {
      setStatusUpdates(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const handleDeleteStatusUpdate = (id: string) => {
      setStatusUpdates(prev => prev.filter(u => u.id !== id));
      if (selectedStatusId === id) {
          setCurrentView('overview');
          setSelectedStatusId(null);
      }
  };

  const handleViewStatusUpdate = (id: string) => {
      setSelectedStatusId(id);
      setCurrentView('status-detail');
  }
  
  const handleViewModeChange = (mode: 'kanban' | 'gantt' | 'overview') => {
      if (mode === 'gantt') {
          setCurrentView('gantt');
      } else if (mode === 'overview') {
          setCurrentView('overview');
      } else {
          setCurrentView('board');
      }
  }

  const renderContent = () => {
    if (currentView === 'team') {
      return (
        <TeamManagement 
          users={users}
          currentUser={currentUser}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onBack={() => setCurrentView('board')}
        />
      );
    }

    if (currentView === 'create-status') {
        return (
            <CreateStatusUpdate 
                currentUser={currentUser}
                onSave={handleCreateStatusUpdate}
                onCancel={() => setCurrentView('overview')}
            />
        );
    }

    if (currentView === 'status-detail') {
        const update = statusUpdates.find(u => u.id === selectedStatusId);
        if (!update) {
            setCurrentView('overview');
            return null;
        }
        return (
            <StatusUpdateDetail 
                update={update}
                allUpdates={statusUpdates}
                currentUser={currentUser}
                users={users}
                onBack={() => setCurrentView('overview')}
                onSelectUpdate={handleViewStatusUpdate}
                onSave={handleUpdateStatusUpdate}
                onDelete={handleDeleteStatusUpdate}
            />
        )
    }

    if (currentView === 'overview') {
      return (
          <ProjectOverview 
              projectDetails={projectDetails}
              users={users}
              currentUser={currentUser}
              tasks={tasks}
              statusUpdates={statusUpdates}
              onUpdateDetails={setProjectDetails}
              onBack={() => setCurrentView('board')}
              onManageTeam={() => setCurrentView('team')}
              onTaskClick={handleTaskClick}
              onCreateStatus={() => setCurrentView('create-status')}
              onViewStatusUpdate={handleViewStatusUpdate}
              onDeleteStatus={handleDeleteStatusUpdate}
          />
      )
    }
    
    if (currentView === 'gantt') {
        return (
            <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
                <Dashboard 
                    tasks={tasks} 
                    users={users} 
                    currentUser={currentUser}
                    projectImage={projectImage}
                    currentTheme={currentTheme}
                    onUpdateProjectImage={setProjectImage}
                    onHighlight={handleHighlight}
                    onProjectClick={() => setCurrentView('overview')}
                    currentViewMode="gantt"
                    onViewModeChange={handleViewModeChange}
                    onThemeChange={setCurrentTheme}
                />
                <GanttChart 
                  tasks={tasks} 
                  onTaskClick={handleTaskClick} 
                  onAddTask={openNewTaskModal}
                  highlightFilter={highlightCriteria}
                />
            </div>
        )
    }

    // Default: Kanban Board
    return (
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
        <Dashboard 
          tasks={tasks} 
          users={users} 
          currentUser={currentUser}
          projectImage={projectImage}
          currentTheme={currentTheme}
          onUpdateProjectImage={setProjectImage}
          onHighlight={handleHighlight}
          onProjectClick={() => setCurrentView('overview')}
          currentViewMode="kanban"
          onViewModeChange={handleViewModeChange}
          onThemeChange={setCurrentTheme}
        />
        
        {/* Toolbar */}
        <div className="px-6 py-3 flex flex-col md:flex-row gap-4 items-center justify-between bg-white border-b border-gray-200">
            <div className="flex gap-2 items-center bg-gray-100 px-3 py-1.5 rounded-lg w-full md:w-auto">
                <Search className="w-4 h-4 text-gray-400" />
                <input 
                   type="text" 
                   placeholder="Search tasks..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="bg-transparent border-none focus:outline-none text-sm w-full"
                />
            </div>
            
            <div className="flex gap-3 items-center w-full md:w-auto justify-end">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden md:inline">Sort by:</span>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-transparent border-none font-semibold focus:outline-none cursor-pointer"
                    >
                        <option value="priority">Priority</option>
                        <option value="dueDate">Due Date</option>
                        <option value="assignee">Assignee</option>
                    </select>
                </div>
                <button 
                  onClick={openNewTaskModal}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow transition-all"
                >
                    <Plus className="w-4 h-4" /> New Task
                </button>
            </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex gap-6 h-full min-w-max">
            {swimlanes.map((lane, index) => (
              <div 
                  key={lane.id} 
                  className="flex flex-col w-80 h-full bg-gray-100/50 rounded-xl border border-gray-200/60 flex-shrink-0 backdrop-blur-sm group/lane"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleLaneOrTaskDrop(e, lane.id, index)}
              >
                {/* Lane Header */}
                <div 
                  className={`p-3 flex items-center border-b border-gray-200 bg-gray-50/80 rounded-t-xl group/header ${currentUser.role === 'Admin' && !editingLane ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  draggable={currentUser.role === 'Admin' && !editingLane}
                  onDragStart={(e) => handleLaneDragStart(e, index)}
                >
                   {currentUser.role === 'Admin' && !editingLane && (
                       <GripVertical className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 hover:text-gray-600" />
                   )}
                   
                   <div className="flex-1 flex justify-between items-center min-w-0">
                       {editingLane === lane.id ? (
                           <input 
                              autoFocus
                              className="w-full text-sm font-bold px-2 py-1 rounded border border-primary-400 outline-none bg-white text-slate-900 shadow-sm"
                              value={newLaneName}
                              onChange={(e) => setNewLaneName(e.target.value)}
                              onBlur={saveLaneName}
                              onKeyDown={(e) => e.key === 'Enter' && saveLaneName()}
                           />
                       ) : (
                           <div 
                              className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0"
                              onClick={() => startEditLane(lane)}
                              title="Click to rename"
                           >
                               <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide truncate">{lane.name}</h2>
                               <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">{getSortedTasks(lane.id).length}</span>
                               <Settings className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                       )}

                       {/* Delete Lane Button - Admin Only */}
                       {currentUser.role === 'Admin' && !editingLane && (
                           <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   handleDeleteLane(lane.id);
                               }}
                               onMouseDown={(e) => e.stopPropagation()}
                               className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-md transition-all opacity-0 group-hover/lane:opacity-100"
                               title="Delete Swimlane"
                           >
                               <Trash2 className="w-3.5 h-3.5" />
                           </button>
                       )}
                   </div>
                </div>

                {/* Lane Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                   {getSortedTasks(lane.id).map(task => (
                      <Card 
                          key={task.id} 
                          task={task} 
                          users={users} 
                          onClick={handleTaskClick} 
                          isDimmed={
                            highlightCriteria !== null && (
                              highlightCriteria.mode === 'type' 
                                ? task.type !== highlightCriteria.value 
                                : task.status !== highlightCriteria.value
                            )
                          }
                      />
                   ))}
                   {getSortedTasks(lane.id).length === 0 && (
                       <div className="h-32 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs font-medium italic">
                           Drop tasks here
                       </div>
                   )}
                </div>
              </div>
            ))}

            {/* Add New Lane Button - Admin Only */}
            {currentUser.role === 'Admin' && (
                <div className="flex flex-col w-80 h-full flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleAddLane}
                        className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-500 hover:bg-primary-50/50 transition-all gap-2 bg-gray-50/30"
                    >
                        <div className="p-3 bg-white rounded-full shadow-sm">
                             <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm">Add Swimlane</span>
                    </button>
                </div>
            )}

          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <TaskModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        task={currentTask}
        allTasks={tasks}
        users={users}
        currentUser={currentUser}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        swimlanes={swimlanes}
      />
      <AIAssistant 
        tasks={tasks}
        users={users}
        statusUpdates={statusUpdates}
        currentUser={currentUser}
        projectName={projectDetails.name}
      />
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        isDangerous={confirmConfig.isDangerous}
      />
    </>
  );
};

export default App;