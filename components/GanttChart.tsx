import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskType, TaskStatus } from '../types';
import { Layers, Diamond, ZoomIn, ZoomOut, Monitor, Search, Plus } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, onTaskClick, onAddTask }) => {
  const [dayWidth, setDayWidth] = useState(40);
  const [isFitToScreen, setIsFitToScreen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // 1. Determine Project Range
  const allDates = tasks.flatMap(t => [
    t.startDate ? new Date(t.startDate).getTime() : t.createdAt,
    new Date(t.dueDate).getTime()
  ]);
  
  if (allDates.length === 0) {
      return <div className="p-8 text-center text-gray-500">No tasks to display.</div>;
  }

  const minDateRaw = new Date(Math.min(...allDates));
  const maxDateRaw = new Date(Math.max(...allDates));
  
  // Pad start and end
  const minDate = new Date(minDateRaw);
  minDate.setDate(minDate.getDate() - 7);
  
  const maxDate = new Date(maxDateRaw);
  maxDate.setDate(maxDate.getDate() + 14);

  // Normalize to start of week (Sunday) at midnight to ensure accurate daily diffs
  const startOfWeek = (d: Date) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      const day = date.getDay();
      const diff = date.getDate() - day;
      return new Date(date.setDate(diff));
  }

  const projectStart = startOfWeek(minDate);
  const projectEnd = startOfWeek(maxDate);

  // Calculate Weeks
  const weeks = [];
  let current = new Date(projectStart);
  while (current <= projectEnd) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
  }

  // Total days based on 5-day work week
  const totalDaysInView = weeks.length * 5;

  useEffect(() => {
      const handleResize = () => {
          if (isFitToScreen && chartContainerRef.current) {
              const containerWidth = chartContainerRef.current.clientWidth;
              setDayWidth(containerWidth / totalDaysInView);
          }
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, [isFitToScreen, totalDaysInView]);

  // Helper: Calculate business days difference from project start
  const getBusinessDaysDiff = (targetTime: number, startTime: number) => {
      const diffTime = targetTime - startTime;
      const totalDays = diffTime / (1000 * 60 * 60 * 24);
      
      const fullWeeks = Math.floor(totalDays / 7);
      const remainingDays = totalDays % 7; // Float, 0 (Sun) to ~6.99 (Sat)

      let partial = 0;
      if (remainingDays < 1) {
          // Sunday (0.0 - 0.99): visual pos is 0 (start of Mon)
          partial = 0;
      } else if (remainingDays >= 6) {
          // Saturday (6.0 - 6.99): visual pos is 5 (end of Fri)
          partial = 5;
      } else {
          // Mon (1.0) to Fri (5.99)
          // Shift by -1 so Mon starts at 0
          partial = remainingDays - 1;
      }
      
      return (fullWeeks * 5) + partial;
  };

  // Scroll to Today on mount
  useEffect(() => {
    if (chartContainerRef.current) {
        const now = new Date();
        now.setHours(12, 0, 0, 0); // Center alignment
        const businessDays = getBusinessDaysDiff(now.getTime(), projectStart.getTime());
        const initialTodayPos = businessDays * 40; // default width 40
        
        const containerWidth = chartContainerRef.current.clientWidth;
        chartContainerRef.current.scrollLeft = initialTodayPos - (containerWidth / 2);
    }
  }, []);


  // Toggle Fit
  const toggleFit = () => {
      if (!isFitToScreen) {
          setIsFitToScreen(true);
          if (chartContainerRef.current) {
             setDayWidth(chartContainerRef.current.clientWidth / totalDaysInView);
          }
      } else {
          setIsFitToScreen(false);
          setDayWidth(40); // Reset to default
      }
  };

  const handleZoomIn = () => {
      setIsFitToScreen(false);
      setDayWidth(prev => Math.min(prev + 10, 100));
  };

  const handleZoomOut = () => {
      setIsFitToScreen(false);
      setDayWidth(prev => Math.max(prev - 5, 10));
  };

  const weekWidth = dayWidth * 5;
  const totalWidth = totalDaysInView * dayWidth;

  const getPosition = (date: number) => {
      return getBusinessDaysDiff(date, projectStart.getTime()) * dayWidth;
  }

  // Sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
      if (a.type === TaskType.EPIC && b.type !== TaskType.EPIC) return -1;
      if (a.type !== TaskType.EPIC && b.type === TaskType.EPIC) return 1;
      
      const startA = a.startDate ? new Date(a.startDate).getTime() : a.createdAt;
      const startB = b.startDate ? new Date(b.startDate).getTime() : b.createdAt;
      return startA - startB;
  });

  const now = new Date();
  now.setHours(12, 0, 0, 0); // Center alignment
  const todayPos = getPosition(now.getTime());
  
  const showDays = dayWidth > 35; // "Above 100% (30px approx)"
  const showTodayLine = dayWidth >= 30; // Show line when 100% or more
  const headerHeight = showDays ? 'h-16' : 'h-12';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative h-full">
       
       {/* Toolbar */}
       <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
           <div className="text-sm font-bold text-gray-600">Timeline View</div>
           <div className="flex items-center gap-2">
               <button 
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                title="Zoom Out"
               >
                   <ZoomOut className="w-4 h-4" />
               </button>
               <span className="text-xs font-mono text-gray-400 min-w-[40px] text-center">
                   {Math.round((dayWidth / 30) * 100)}%
               </span>
               <button 
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                title="Zoom In"
               >
                   <ZoomIn className="w-4 h-4" />
               </button>
               <div className="w-px h-4 bg-gray-200 mx-2"></div>
               <button 
                onClick={toggleFit}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors border ${isFitToScreen ? 'bg-primary-50 text-primary-600 border-primary-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
               >
                   <Monitor className="w-3 h-3" />
                   Fit to Screen
               </button>
           </div>
       </div>

       <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar: Task Names */}
          <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 z-20 overflow-y-hidden flex flex-col shadow-sm">
              <div className={`${headerHeight} bg-gray-50 border-b border-gray-200 flex items-center px-4 font-bold text-xs text-gray-500 uppercase tracking-wider flex-shrink-0 transition-all`}>
                  Task Name
              </div>
              <div className="overflow-y-auto scrollbar-hide flex-1 pb-10">
                  {sortedTasks.map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => onTaskClick(task)}
                        className="h-10 px-4 flex items-center border-b border-gray-50 hover:bg-primary-50 cursor-pointer group transition-colors"
                      >
                          <span className={`truncate text-sm font-medium ${task.type === TaskType.EPIC ? 'text-secondary-700 font-bold' : 'text-gray-700'} group-hover:text-primary-700`}>
                              {task.title || 'Untitled'}
                          </span>
                      </div>
                  ))}
                  
                  {/* Add Task Button */}
                  <button 
                      onClick={onAddTask}
                      className="w-full h-10 px-4 flex items-center gap-2 text-sm text-gray-400 hover:text-primary-600 hover:bg-gray-50 border-b border-dashed border-gray-200 transition-colors font-medium group"
                  >
                      <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Add Task
                  </button>
              </div>
          </div>

          {/* Chart Area */}
          <div 
            ref={chartContainerRef}
            className="flex-1 overflow-auto relative bg-slate-50 custom-scrollbar"
          >
              <div style={{ width: totalWidth, minHeight: '100%', position: 'relative' }}>
                  
                  {/* Header (Weeks) */}
                  <div 
                    className={`sticky top-0 z-20 flex ${headerHeight} bg-white border-b border-gray-200 transition-all`}
                  >
                      {weeks.map((week, i) => {
                          // Only show week label if width is sufficient
                          const showLabel = weekWidth > 40;
                          // Calculate Monday date for display since we hide Sunday
                          const monday = new Date(week);
                          monday.setDate(monday.getDate() + 1);
                          
                          return (
                            <div 
                                key={i} 
                                className="flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/50 overflow-hidden"
                                style={{ width: weekWidth }}
                            >
                                <div className={`flex items-center justify-center text-xs font-medium text-gray-500 border-b ${showDays ? 'border-gray-200 h-1/2' : 'h-full'}`}>
                                    {showLabel && (
                                        <>
                                            <span className="font-bold text-gray-700 truncate text-center px-1">{monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            {weekWidth > 120 && <span className="text-[10px] ml-1">{monday.getFullYear()}</span>}
                                        </>
                                    )}
                                </div>

                                {showDays && (
                                    <div className="flex h-1/2">
                                        {['M', 'T', 'W', 'T', 'F'].map((day, idx) => {
                                            const dayDate = new Date(week);
                                            // week starts on Sunday. Monday is +1, Friday is +5
                                            dayDate.setDate(dayDate.getDate() + idx + 1);
                                            const dateTooltip = dayDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });

                                            return (
                                                <div 
                                                    key={idx} 
                                                    className="flex-1 flex items-center justify-center text-[10px] text-gray-400 border-r border-gray-100 last:border-0 hover:bg-gray-100 hover:text-gray-900 cursor-help transition-colors"
                                                    title={dateTooltip}
                                                >
                                                    {day}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                          )
                      })}
                  </div>

                  {/* Grid & Bars */}
                  <div className="relative pb-10">
                      
                      {/* Vertical Grid Lines */}
                      <div className="absolute inset-0 pointer-events-none flex">
                           {weeks.map((_, i) => (
                               <div key={i} className="flex-shrink-0 h-full border-r border-gray-200/50 flex" style={{ width: weekWidth }}>
                                   {showDays && (
                                       <>
                                            <div className="flex-1 border-r border-gray-100/50"></div>
                                            <div className="flex-1 border-r border-gray-100/50"></div>
                                            <div className="flex-1 border-r border-gray-100/50"></div>
                                            <div className="flex-1 border-r border-gray-100/50"></div>
                                            <div className="flex-1"></div>
                                       </>
                                   )}
                               </div>
                           ))}
                      </div>

                      {/* Task Rows */}
                      <div className="space-y-0 relative">
                          {sortedTasks.map(task => {
                              const start = task.startDate ? new Date(task.startDate).getTime() : task.createdAt;
                              const end = new Date(task.dueDate).getTime();
                              
                              // Ensure valid range
                              const validEnd = end > start ? end : start + (1000 * 60 * 60 * 24);
                              
                              const left = getPosition(start);
                              const right = getPosition(validEnd);
                              const width = right - left;

                              const isEpic = task.type === TaskType.EPIC;
                              const colorClass = isEpic 
                                ? 'bg-secondary-500 border-secondary-600 shadow-sm shadow-secondary-200' 
                                : task.status === TaskStatus.COMPLETE 
                                    ? 'bg-green-500 border-green-600' 
                                    : 'bg-primary-500 border-primary-600 shadow-sm shadow-primary-200';

                              return (
                                  <div key={task.id} className="relative h-10 w-full border-b border-transparent hover:bg-gray-100/50 transition-colors">
                                      
                                      {/* The Bar */}
                                      <div 
                                          onClick={() => onTaskClick(task)}
                                          className={`absolute top-2 h-6 rounded-md border text-white text-[10px] flex items-center px-2 overflow-hidden whitespace-nowrap transition-all hover:brightness-110 cursor-pointer ${colorClass}`}
                                          style={{ left: left, width: Math.max(width, 4) }}
                                          title={`${task.title}: ${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`}
                                      >
                                          {width > 40 && <span className="font-bold drop-shadow-md">{task.title}</span>}
                                      </div>
                                      
                                      {/* Milestone Diamond */}
                                      {task.isMilestone && (
                                          <div 
                                            className="absolute top-1/2 -translate-y-1/2 z-10"
                                            style={{ left: right - 9 }} // Center the 18px icon
                                            title="Milestone Due Date"
                                          >
                                              <div className="relative group">
                                                  <div className="w-4 h-4 bg-black rotate-45 transform shadow-lg border border-gray-700 hover:scale-125 transition-transform cursor-help"></div>
                                              </div>
                                          </div>
                                      )}

                                  </div>
                              );
                          })}
                          
                          {/* Today Line Segment */}
                          {showTodayLine && (
                              <>
                                  <div 
                                      className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
                                      style={{ left: todayPos }}
                                      title="Today"
                                  />
                                  <div 
                                      className="absolute bottom-0 w-2 h-2 bg-red-500 rounded-full z-30 pointer-events-none transform -translate-x-1/2"
                                      style={{ left: todayPos }}
                                  />
                              </>
                          )}
                      </div>

                  </div>
              </div>
          </div>
       </div>
    </div>
  );
}