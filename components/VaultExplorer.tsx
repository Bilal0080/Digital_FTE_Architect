
import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  CreditCard, 
  CheckSquare, 
  Square,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Clock,
  Type as TypeIcon,
  ChevronDown,
  MessageSquare,
  Mail,
  Plus,
  X,
  Calendar,
  Notebook,
  Trash2,
  AlertTriangle,
  Flag,
  Filter,
  Check,
  Layers,
  FilePlus
} from 'lucide-react';
import { FTETask } from '../types';

interface VaultExplorerProps {
  tasks: FTETask[];
  onSelectTask: (task: FTETask) => void;
  selectedTaskId?: string;
  selectedTaskIds: Set<string>;
  onToggleSelection: (taskId: string) => void;
  onAddTask: (task: Omit<FTETask, 'id' | 'timestamp'>) => void;
  onDeleteTask: (id: string | string[]) => void;
}

type SortBy = 'title' | 'status' | 'timestamp' | 'priority' | 'dueDate';
type SortOrder = 'asc' | 'desc';
type FilterType = FTETask['type'] | 'all';
type FilterStatus = FTETask['status'] | 'all';
type FilterDueDate = 'all' | 'has_due_date' | 'overdue' | 'next_7_days';

const VaultExplorer: React.FC<VaultExplorerProps> = ({ 
  tasks, 
  onSelectTask, 
  selectedTaskId, 
  selectedTaskIds, 
  onToggleSelection,
  onAddTask,
  onDeleteTask
}) => {
  const [sortBy, setSortBy] = useState<SortBy>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterDueDate, setFilterDueDate] = useState<FilterDueDate>('all');
  
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasksToDelete, setTasksToDelete] = useState<string[] | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<FTETask['type']>('system');
  const [newPriority, setNewPriority] = useState<FTETask['priority']>('Medium');
  const [newContent, setNewContent] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const initialFolders = [
    { name: 'Needs_Action', color: 'text-orange-400' },
    { name: 'In_Progress', color: 'text-blue-400' },
    { name: 'Pending_Approval', color: 'text-yellow-400' },
    { name: 'Done', color: 'text-green-400' },
    { name: 'Logs', color: 'text-gray-400' }
  ];

  const sortedFolders = useMemo(() => {
    let folders = initialFolders;
    if (filterStatus !== 'all') {
      folders = initialFolders.filter(f => f.name === filterStatus);
    }
    if (sortBy === 'status') {
      return sortOrder === 'asc' ? folders : [...folders].reverse();
    }
    return folders;
  }, [sortBy, sortOrder, filterStatus]);

  const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };

  const sortTasks = (tasksList: FTETask[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return [...tasksList]
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => {
        if (filterDueDate === 'all') return true;
        if (!t.dueDate) return false;
        
        const taskDate = new Date(t.dueDate);
        if (filterDueDate === 'has_due_date') return !!t.dueDate;
        if (filterDueDate === 'overdue') return taskDate < today;
        if (filterDueDate === 'next_7_days') return taskDate >= today && taskDate <= nextWeek;
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'title') {
          comparison = a.title.localeCompare(b.title);
        } else if (sortBy === 'timestamp') {
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        } else if (sortBy === 'priority') {
          comparison = priorityMap[a.priority] - priorityMap[b.priority];
        } else if (sortBy === 'dueDate') {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
          comparison = dateA - dateB;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  };

  const getIconForType = (task: FTETask) => {
    if (task.status === 'Done') return <Check className="w-3.5 h-3.5 text-emerald-500 animate-check-pop" />;
    
    switch (task.type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'finance': return <CreditCard className="w-4 h-4" />;
      case 'social': return <MessageSquare className="w-4 h-4" />;
      case 'system': return <ShieldCheck className="w-4 h-4" />;
      case 'notes': return <Notebook className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: FTETask['priority']) => {
    switch (priority) {
      case 'High': return 'text-rose-500';
      case 'Medium': return 'text-amber-500';
      case 'Low': return 'text-slate-500';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    onAddTask({
      title: newTitle,
      type: newType,
      priority: newPriority,
      content: newContent || `# ${newTitle}\n\nGenerated task content...`,
      status: 'Needs_Action',
      dueDate: newDueDate || undefined
    });
    setNewTitle('');
    setNewContent('');
    setNewDueDate('');
    setNewPriority('Medium');
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (tasksToDelete) {
      onDeleteTask(tasksToDelete);
      setTasksToDelete(null);
    }
  };

  const activeFiltersCount = (filterType !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0) + (filterDueDate !== 'all' ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700 w-64 md:w-72">
      <div className="p-4 border-b border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vault</h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className={`p-1.5 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 ${activeFiltersCount > 0 ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'}`}
              title="Filter tasks"
            >
              <Filter className="w-3.5 h-3.5" />
              {activeFiltersCount > 0 && <span className="text-[10px] font-bold">{activeFiltersCount}</span>}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 transition-colors flex items-center gap-1"
                title="Sort options"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Sort By</p>
                    <button 
                      onClick={() => { setSortBy('title'); setShowSortMenu(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-slate-700 ${sortBy === 'title' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <TypeIcon className="w-3.5 h-3.5" /> Title
                    </button>
                    <button 
                      onClick={() => { setSortBy('priority'); setShowSortMenu(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-slate-700 ${sortBy === 'priority' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <Flag className="w-3.5 h-3.5" /> Priority
                    </button>
                    <button 
                      onClick={() => { setSortBy('dueDate'); setShowSortMenu(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-slate-700 ${sortBy === 'dueDate' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <Calendar className="w-3.5 h-3.5" /> Due Date
                    </button>
                    <button 
                      onClick={() => { setSortBy('timestamp'); setShowSortMenu(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-slate-700 ${sortBy === 'timestamp' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Date Created
                    </button>
                    <button 
                      onClick={() => { setSortBy('status'); setShowSortMenu(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-slate-700 ${sortBy === 'status' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <Folder className="w-3.5 h-3.5" /> Folder Status
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Order</p>
                    <button 
                      onClick={() => { setSortOrder('asc'); setShowSortMenu(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-slate-700 ${sortOrder === 'asc' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <SortAsc className="w-3.5 h-3.5" /> Ascending
                    </button>
                    <button 
                      onClick={() => { setSortOrder('desc'); setShowSortMenu(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-slate-700 ${sortOrder === 'desc' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <SortDesc className="w-3.5 h-3.5" /> Descending
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-[500px] overflow-y-auto">
                <div className="p-2 border-b border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Filter By Type</p>
                  {['all', 'email', 'finance', 'social', 'system', 'notes'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => setFilterType(type as FilterType)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-slate-700 capitalize ${filterType === type ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <span className="flex items-center gap-2">
                        {type === 'all' ? <Layers className="w-3 h-3" /> : (type === 'email' ? <Mail className="w-3 h-3" /> : <FileText className="w-3 h-3" />)}
                        {type}
                      </span>
                      {filterType === type && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-b border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Filter By Status</p>
                  {['all', 'Needs_Action', 'In_Progress', 'Pending_Approval', 'Done'].map((status) => (
                    <button 
                      key={status}
                      onClick={() => setFilterStatus(status as FilterStatus)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-slate-700 ${filterStatus === status ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <span className="truncate">{status.replace('_', ' ')}</span>
                      {filterStatus === status && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Filter By Due Date</p>
                  {[
                    { id: 'all', label: 'All Dates' },
                    { id: 'has_due_date', label: 'With Due Date' },
                    { id: 'overdue', label: 'Overdue' },
                    { id: 'next_7_days', label: 'Next 7 Days' }
                  ].map((option) => (
                    <button 
                      key={option.id}
                      onClick={() => setFilterDueDate(option.id as FilterDueDate)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-slate-700 ${filterDueDate === option.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <span className="truncate">{option.label}</span>
                      {filterDueDate === option.id && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
                {(filterType !== 'all' || filterStatus !== 'all' || filterDueDate !== 'all') && (
                  <div className="p-2 bg-slate-800/50 border-t border-slate-700">
                    <button 
                      onClick={() => { setFilterType('all'); setFilterStatus('all'); setFilterDueDate('all'); setShowFilterMenu(false); }}
                      className="w-full py-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full mb-4 flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl border border-indigo-500/50 shadow-lg shadow-indigo-500/10 transition-all group"
        >
          <FilePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>New Task</span>
        </button>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-1.5">
              {selectedTaskIds.size} Selected
            </span>
            {selectedTaskIds.size > 0 && (
              <button 
                onClick={() => setTasksToDelete(Array.from(selectedTaskIds))}
                className="p-1 text-slate-500 hover:text-rose-500 transition-colors"
                title="Delete Selected"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
             <span className="text-[10px] text-slate-500 font-mono">
              {sortBy === 'title' ? 'A-Z' : sortBy === 'timestamp' ? 'Date' : sortBy === 'priority' ? 'Prio' : sortBy === 'dueDate' ? 'Due' : 'Status'} · {sortOrder.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {sortedFolders.map(folder => {
          const folderTasks = tasks.filter(t => t.status === folder.name);
          const sortedAndFilteredTasks = sortTasks(folderTasks);
          const isDoneFolder = folder.name === 'Done';
          
          return (
            <div key={folder.name} className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-slate-300">
                <ChevronRight className="w-3 h-3 text-slate-500" />
                <Folder className={`w-4 h-4 ${folder.color}`} />
                <span>{folder.name.replace('_', ' ')}</span>
              </div>
              <div className="ml-4 space-y-1">
                {sortedAndFilteredTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`group flex items-center gap-1 rounded transition-all duration-300 overflow-hidden relative ${
                      selectedTaskId === task.id ? 'bg-indigo-900/40' : 'hover:bg-slate-800'
                    } ${isDoneFolder ? 'animate-task-done done-gradient border-l-2 border-emerald-500/30' : ''}`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelection(task.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors z-10"
                    >
                      {selectedTaskIds.has(task.id) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                      ) : (
                        <Square className={`w-3.5 h-3.5 ${isDoneFolder ? 'opacity-20' : 'opacity-0 group-hover:opacity-100'}`} />
                      )}
                    </button>
                    <button
                      onClick={() => onSelectTask(task)}
                      className={`flex-1 text-left flex items-center gap-2 py-1.5 text-xs z-10 ${
                        selectedTaskId === task.id ? 'text-indigo-300 font-medium' : (isDoneFolder ? 'text-emerald-300/80' : 'text-slate-400')
                      }`}
                    >
                      {getIconForType(task)}
                      <div className="flex flex-col truncate flex-1">
                        <span className={`truncate flex items-center gap-1.5 ${isDoneFolder ? 'line-through opacity-70' : ''}`}>
                          {task.title}.md
                          {!isDoneFolder && <div className={`w-1 h-1 rounded-full bg-current ${getPriorityColor(task.priority)}`} />}
                        </span>
                        {task.dueDate && !isDoneFolder && (
                          <span className="text-[8px] text-orange-400/80 flex items-center gap-1">
                            <Clock className="w-2 h-2" /> Due: {task.dueDate}
                          </span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTasksToDelete([task.id]);
                      }}
                      className="p-1.5 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all mr-1 z-10"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {sortedAndFilteredTasks.length === 0 && (
                  <span className="text-[10px] text-slate-600 px-6 italic">
                    {folderTasks.length > 0 ? 'No matches' : 'Empty'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-indigo-400" />
                Initialize New Task
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Task Filename</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-white"
                    placeholder="WHATSAPP_reply_customer"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Due Date (Optional)</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-white appearance-none"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Low', 'Medium', 'High'] as const).map((prio) => (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setNewPriority(prio)}
                      className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${
                        newPriority === prio 
                          ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Employee Domain (Type)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'system', label: 'System' },
                    { id: 'email', label: 'Email' },
                    { id: 'finance', label: 'Finance' },
                    { id: 'social', label: 'Social' },
                    { id: 'notes', label: 'Notes' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setNewType(type.id as FTETask['type'])}
                      className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-[10px] font-medium transition-all ${
                        newType === type.id 
                          ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Initial Context (Markdown)</label>
                <textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none h-24 resize-none transition-all text-white font-mono"
                  placeholder="# Description..."
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Create File.md
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tasksToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {tasksToDelete.length > 1 ? `Delete ${tasksToDelete.length} Tasks?` : 'Delete Task?'}
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                {tasksToDelete.length > 1 ? (
                  <>Are you sure you want to permanently remove <span className="text-slate-200 font-bold">{tasksToDelete.length} selected files</span>? This cannot be undone.</>
                ) : (
                  <>Are you sure you want to delete <span className="text-slate-200 font-bold">"{tasks.find(t => t.id === tasksToDelete[0])?.title}.md"</span>? This action is irreversible.</>
                )}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setTasksToDelete(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultExplorer;
