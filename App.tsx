
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Terminal, 
  Settings, 
  LayoutDashboard, 
  Plus, 
  Brain, 
  Loader2,
  Lock,
  Activity,
  FileBarChart,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Layers,
  FileText,
  Save,
  Info,
  CreditCard,
  MessageSquare,
  Mail,
  ChevronDown,
  Sparkles,
  Edit2,
  Notebook,
  FileCheck,
  AlertTriangle,
  Flag,
  Tag,
  Wand2,
  AlertCircle,
  Clock,
  Cloud,
  Globe,
  Cpu,
  ArrowRight,
  History,
  User,
  Zap,
  Code2,
  Boxes
} from 'lucide-react';
import VaultExplorer from './components/VaultExplorer';
import ArchitectureMap from './components/ArchitectureMap';
import TierTracker from './components/TierTracker';
import { FTETask, HistoryEntry } from './types';
import { generateHandbook, generateDailyBriefing, generateTags, summarizeTask } from './services/geminiService';

const createHistory = (action: string, user: string = 'Architect'): HistoryEntry => ({
  id: Math.random().toString(36).substr(2, 9),
  action,
  user,
  timestamp: new Date().toISOString()
});

const INITIAL_TASKS: FTETask[] = [
  {
    id: '1',
    title: 'Dashboard',
    status: 'Done',
    type: 'system',
    priority: 'High',
    content: '# Dashboard\n\n- [x] Weekly Briefing generated\n- [ ] Pending payments: 2\n- [ ] Unread WhatsApp: 5',
    timestamp: new Date().toISOString(),
    tags: ['System', 'Monitoring'],
    history: [createHistory('Asset Initialized', 'System'), createHistory('Status changed to Done', 'Architect')]
  },
  {
    id: '2',
    title: 'EMAIL_invoice_123',
    status: 'Needs_Action',
    type: 'email',
    priority: 'Medium',
    content: '--- \ntype: email \nsubject: Invoice Question\n--- \n\nClient A asks about Jan invoice.',
    timestamp: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    tags: ['Billing', 'Inquiry'],
    history: [createHistory('Asset Initialized', 'System')]
  },
  {
    id: '3',
    title: 'WHATSAPP_urgent_lead',
    status: 'Pending_Approval',
    type: 'social',
    priority: 'High',
    content: 'User "John" wants pricing for Project X. Suggested reply: "We can start at $5k/mo."',
    timestamp: new Date().toISOString(),
    tags: ['Sales', 'Urgent'],
    history: [createHistory('Asset Initialized', 'System'), createHistory('Status changed to Pending_Approval', 'Architect')]
  },
  {
    id: '4',
    title: 'FINANCE_Q1_projection',
    status: 'Done',
    type: 'finance',
    priority: 'Medium',
    content: '# Q1 Financial Projection\n\n- Expected Revenue: $45,000\n- Operations Cost: $4,500\n- ROI: 10x',
    timestamp: new Date().toISOString(),
    tags: ['Planning', 'Revenue'],
    history: [createHistory('Asset Initialized', 'System'), createHistory('Status changed to Done', 'Architect')]
  },
  {
    id: '5',
    title: 'Core_Values_Note',
    status: 'Done',
    type: 'notes',
    priority: 'Low',
    content: '# Core Values\n- Transparency\n- Rapid Execution\n- Security First',
    timestamp: new Date().toISOString(),
    tags: ['Culture', 'Internal'],
    history: [createHistory('Asset Initialized', 'System'), createHistory('Status changed to Done', 'Architect')]
  }
];

// Professional Workflow State Machine
const VALID_TRANSITIONS: Record<FTETask['status'], FTETask['status'][]> = {
  'Needs_Action': ['In_Progress'],
  'In_Progress': ['Pending_Approval', 'Done', 'Needs_Action'],
  'Pending_Approval': ['Done', 'In_Progress'],
  'Done': ['In_Progress']
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<FTETask[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<FTETask>(INITIAL_TASKS[0]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [isBriefing, setIsBriefing] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployTarget, setDeployTarget] = useState<'Vercel' | 'Streamlit' | null>(null);
  const [handbookInput, setHandbookInput] = useState({ name: '', focus: '' });
  const [selectedStack, setSelectedStack] = useState<string[]>([]);
  const [includeAllNotes, setIncludeAllNotes] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = tasks.find(t => t.id === selectedTask.id);
    if (current) {
      setSelectedTask(current);
    } else if (tasks.length > 0) {
      setSelectedTask(tasks[0]);
    }
  }, [tasks, selectedTask.id]);

  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTask.history]);

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const toggleStackItem = (item: string) => {
    setSelectedStack(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const updateTask = useCallback((taskId: string, updates: Partial<FTETask>, historyMsg?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newHistory = historyMsg 
          ? [...(t.history || []), createHistory(historyMsg)]
          : t.history;
        return { ...t, ...updates, history: newHistory };
      }
      return t;
    }));
  }, []);

  const handleUpdateTaskStatus = (taskId: string, newStatus: FTETask['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    if (oldStatus === newStatus) return;

    // Enforce Workflow Granularity
    const allowed = VALID_TRANSITIONS[oldStatus];
    if (!allowed.includes(newStatus)) {
      let errorMessage = `Workflow Violation: Cannot transition from '${oldStatus.replace('_', ' ')}' to '${newStatus.replace('_', ' ')}'.`;
      
      if (oldStatus === 'Needs_Action' && newStatus === 'Done') {
        errorMessage = "Quality Gate: Tasks must be 'In Progress' before being marked as 'Done'.";
      } else if (oldStatus === 'Needs_Action' && newStatus === 'Pending_Approval') {
        errorMessage = "Pre-requisite missing: You must start work ('In Progress') before requesting approval.";
      } else if (oldStatus === 'Done' && (newStatus === 'Needs_Action' || newStatus === 'Pending_Approval')) {
        errorMessage = "Audit Trail Reset: Completed tasks must revert to 'In Progress' for modifications.";
      }

      setTransitionError(errorMessage);
      setTimeout(() => setTransitionError(null), 5000);
      return;
    }

    updateTask(taskId, { status: newStatus }, `Status updated: ${oldStatus} -> ${newStatus}`);
    setTransitionError(null);
  };

  const handleUpdateTaskPriority = (taskId: string, newPriority: FTETask['priority']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTask(taskId, { priority: newPriority }, `Priority changed to ${newPriority}`);
  };

  const handleUpdateDueDate = (taskId: string, date: string) => {
    updateTask(taskId, { dueDate: date || undefined }, `Due date set to ${date || 'none'}`);
  };

  const handleUpdateContent = (taskId: string, content: string) => {
    updateTask(taskId, { content });
  };
  
  const handleSaveContent = () => {
    updateTask(selectedTask.id, { content: selectedTask.content }, 'Manual content save');
  };

  const addTask = (newTask: Omit<FTETask, 'id' | 'timestamp'>) => {
    const task: FTETask = {
      ...newTask,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      tags: [],
      history: [createHistory('Asset Initialized', 'Architect')]
    };
    setTasks(prev => [task, ...prev]);
    setSelectedTask(task);
  };

  const handleGenerateHandbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handbookInput.name || !handbookInput.focus) return;
    
    setIsGenerating(true);
    try {
      const manuallySelectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
      const autoNoteTasks = includeAllNotes ? tasks.filter(t => t.type === 'notes') : [];
      const allContextTasks = Array.from(new Set([...manuallySelectedTasks, ...autoNoteTasks]));
      
      setGenerationStatus(`Condensing ${allContextTasks.length} Contexts...`);
      const summarizedContexts = await Promise.all(allContextTasks.map(async (t) => {
        try {
          const summary = await summarizeTask(t.content);
          return `Summarized Task Logic (${t.type}, Priority: ${t.priority}): ${t.title}\nKey Actions & Points:\n${summary}`;
        } catch (err) {
          console.error(`Failed to summarize task ${t.title}:`, err);
          return `Operational Context (${t.type}): ${t.title} (Summary Generation Failed - Using Raw Header)`;
        }
      }));

      setGenerationStatus('Composing Handbook...');
      const content = await generateHandbook(
        handbookInput.name, 
        handbookInput.focus, 
        summarizedContexts,
        selectedStack
      );
      
      const newTask: FTETask = {
        id: `h-${Date.now()}`,
        title: `Handbook_${handbookInput.name.replace(/\s+/g, '_')}`,
        status: 'Done',
        type: 'system',
        priority: 'Medium',
        content,
        timestamp: new Date().toISOString(),
        tags: ['Generated', 'AI-Consultancy', ...selectedStack],
        history: [
          createHistory('Asset Initialized', 'System'), 
          createHistory(`Knowledge Synthesis complete with stack: ${selectedStack.join(', ') || 'N/A'}`, 'Gemini')
        ]
      };
      setTasks(prev => [newTask, ...prev]);
      setSelectedTask(newTask);
      setSelectedTaskIds(new Set());
      setIncludeAllNotes(false);
      setHandbookInput({ name: '', focus: '' });
      setSelectedStack([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleSimulateDeploy = (target: 'Vercel' | 'Streamlit') => {
    setIsDeploying(true);
    setDeployTarget(target);
    setTimeout(() => {
      setIsDeploying(false);
      setDeployTarget(null);
      updateTask(selectedTask.id, {}, `Deployed to ${target}`);
      alert(`${target} Deployment Successful! Your Digital FTE is now live on the edge.`);
    }, 3000);
  };

  const handleGenerateBriefing = async () => {
    if (selectedTaskIds.size === 0) return;
    
    setIsBriefing(true);
    try {
      const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
      const contents = selectedTasks.map(t => `File: ${t.title}.md\nPriority: ${t.priority}\nContent:\n${t.content}`);
      const content = await generateDailyBriefing(contents);
      
      const newTask: FTETask = {
        id: `b-${Date.now()}`,
        title: `Briefing_${new Date().toISOString().split('T')[0]}`,
        status: 'Done',
        type: 'system',
        priority: 'High',
        content,
        timestamp: new Date().toISOString(),
        tags: ['Briefing', 'Management'],
        history: [createHistory('Asset Initialized', 'System'), createHistory('Daily audit synthesized', 'Gemini')]
      };
      
      setTasks(prev => [newTask, ...prev]);
      setSelectedTask(newTask);
      setSelectedTaskIds(new Set());
    } catch (error) {
      console.error(error);
    } finally {
      setIsBriefing(false);
    }
  };

  const handleGenerateTaskTags = async () => {
    if (!selectedTask.content) return;
    setIsGeneratingTags(true);
    try {
      const suggestedTags = await generateTags(selectedTask.content);
      updateTask(selectedTask.id, { tags: suggestedTags }, 'Tags generated by AI');
    } catch (error) {
      console.error("Tag generation error:", error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleDeleteTask = (ids: string | string[]) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    if (tasks.length <= idArray.length) return;
    setTasks(prev => prev.filter(t => !idArray.includes(t.id)));
    
    const remainingSelections = new Set(selectedTaskIds);
    idArray.forEach(id => remainingSelections.delete(id));
    setSelectedTaskIds(remainingSelections);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Needs_Action': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Pending_Approval': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'In_Progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getPriorityTextColor = (priority: FTETask['priority']) => {
    switch (priority) {
      case 'High': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Low': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const DD = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <VaultExplorer 
        tasks={tasks} 
        onSelectTask={setSelectedTask} 
        selectedTaskId={selectedTask.id} 
        selectedTaskIds={selectedTaskIds}
        onToggleSelection={toggleTaskSelection}
        onAddTask={addTask}
        onDeleteTask={handleDeleteTask}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            <h1 className="font-bold text-sm tracking-tight">DIGITAL FTE ORCHESTRATOR</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Active</span>
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-6 py-8">
            
            <section className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-xs font-semibold mb-6">
                <Brain className="w-4 h-4" />
                <span>Personal AI Employee Hackathon 0</span>
              </div>
              <h2 className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                Hire your first <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">Digital FTE</span>
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                Autonomous, professional-grade, and cloud-ready. Scale your operations with Vercel-optimized AI workers.
              </p>
            </section>

            <div className="grid grid-cols-1 gap-12 mb-16">
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                  <h3 className="text-lg font-bold text-white">The Architecture</h3>
                </div>
                <ArchitectureMap />
              </section>
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                  <h3 className="text-lg font-bold text-white">Milestones</h3>
                </div>
                <TierTracker />
              </section>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI Orchestrator</h3>
                  </div>

                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white leading-none">Operational Handbook</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">Compress task context into actionable AI logic.</p>
                    <form onSubmit={handleGenerateHandbook} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">FTE Alias / Company</label>
                        <input 
                          type="text" 
                          value={handbookInput.name}
                          onChange={(e) => setHandbookInput(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-white"
                          placeholder="e.g. SalesEngine"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Directives</label>
                        <textarea 
                          value={handbookInput.focus}
                          onChange={(e) => setHandbookInput(prev => ({ ...prev, focus: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none h-20 resize-none transition-all text-white"
                          placeholder="What is the core mission?..."
                        />
                      </div>

                      {/* NEW TECH STACK SELECTION */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Core Tech Blueprint</label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: 'Spec Kit', icon: <Boxes className="w-3 h-3" /> },
                            { id: 'Claude Code', icon: <Code2 className="w-3 h-3" /> },
                            { id: 'Qwen', icon: <Zap className="w-3 h-3" /> }
                          ].map(tech => (
                            <button
                              key={tech.id}
                              type="button"
                              onClick={() => toggleStackItem(tech.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                                selectedStack.includes(tech.id)
                                  ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                              }`}
                            >
                              {tech.icon}
                              {tech.id}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div 
                            onClick={() => setIncludeAllNotes(!includeAllNotes)}
                            className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${includeAllNotes ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-950 border-slate-700 group-hover:border-slate-600'}`}
                          >
                            {includeAllNotes && <FileCheck className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase select-none">Summarize all Vault Notes</span>
                        </label>
                      </div>

                      <button 
                        disabled={isGenerating}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {isGenerating ? (generationStatus || 'Processing...') : 'Build Handbook'}
                      </button>
                    </form>
                  </div>

                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <FileBarChart className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white leading-none">Briefing Engine</h3>
                    </div>
                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={handleGenerateBriefing}
                        disabled={isBriefing || selectedTaskIds.size === 0}
                        className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 border border-slate-700 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {isBriefing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                        Generate CEO Briefing
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
                <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 mr-4">
                    <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {isEditingTitle ? (
                      <input 
                        autoFocus
                        type="text"
                        value={selectedTask.title}
                        onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
                        onBlur={() => {
                          setIsEditingTitle(false);
                          updateTask(selectedTask.id, { title: selectedTask.title }, `Renamed file to ${selectedTask.title}.md`);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-sm font-mono text-white outline-none w-full"
                      />
                    ) : (
                      <span 
                        className="text-sm font-mono text-slate-300 cursor-pointer hover:text-white flex items-center gap-2"
                        onClick={() => setIsEditingTitle(true)}
                      >
                        {selectedTask.title}.md
                        <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveContent}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400" 
                      title="Save File"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-0 flex flex-col">
                  <textarea 
                    value={selectedTask.content}
                    onChange={(e) => handleUpdateContent(selectedTask.id, e.target.value)}
                    className="flex-1 p-8 bg-slate-950/40 font-mono text-sm resize-none outline-none leading-relaxed text-slate-300 placeholder-slate-600 border-none focus:bg-slate-950/60 transition-colors"
                    placeholder="# Digital FTE Documentation..."
                  />
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5" />
                    Deployment Status
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Cloud Provider</span>
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                          <Cloud className="w-2.5 h-2.5 text-indigo-400" />
                          <span className="text-[9px] font-bold text-indigo-400">AWS Edge</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleSimulateDeploy('Vercel')}
                          disabled={isDeploying}
                          className="flex flex-col items-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
                        >
                          <Globe className={`w-5 h-5 ${isDeploying && deployTarget === 'Vercel' ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Vercel</span>
                        </button>
                        <button 
                          onClick={() => handleSimulateDeploy('Streamlit')}
                          disabled={isDeploying}
                          className="flex flex-col items-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
                        >
                          <Activity className={`w-5 h-5 ${isDeploying && deployTarget === 'Streamlit' ? 'animate-bounce text-emerald-400' : 'text-slate-400'}`} />
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Streamlit</span>
                        </button>
                      </div>

                      {isDeploying && (
                        <div className="pt-2">
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 animate-progress origin-left" style={{ width: '40%' }} />
                          </div>
                          <p className="text-[8px] text-indigo-400 font-mono mt-1 animate-pulse">Initializing containers...</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Metadata Context</label>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase">Created</span>
                            </div>
                            <span className="text-[10px] font-mono text-white">{formatTimestamp(selectedTask.timestamp)}</span>
                          </div>
                          
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Tag className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase">Type</span>
                            </div>
                            <span className="text-[10px] font-mono text-white capitalize">{selectedTask.type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Task Workflow</label>
                        
                        {transitionError && (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] font-medium text-rose-400 leading-tight">
                              {transitionError}
                            </p>
                          </div>
                        )}

                        <div className="relative">
                          <select 
                            value={selectedTask.status}
                            onChange={(e) => handleUpdateTaskStatus(selectedTask.id, e.target.value as FTETask['status'])}
                            className={`appearance-none w-full outline-none cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${getStatusColor(selectedTask.status)} pr-8`}
                          >
                            <option value="Needs_Action">Needs Action</option>
                            <option value="In_Progress">In Progress</option>
                            <option value="Pending_Approval">Pending Approval</option>
                            <option value="Done">Done</option>
                          </select>
                          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${getStatusColor(selectedTask.status).split(' ')[0]}`} />
                        </div>

                        <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                          <p className="text-[9px] text-slate-500 font-bold uppercase mb-2">Allowed Steps</p>
                          <div className="flex flex-wrap gap-2">
                            {VALID_TRANSITIONS[selectedTask.status].map(next => (
                              <div key={next} className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400 font-mono capitalize">
                                <ArrowRight className="w-2.5 h-2.5" />
                                {next.replace('_', ' ')}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* NEW HISTORY SECTION */}
                      <div className="pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                           <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <History className="w-3.5 h-3.5" />
                            Activity Log
                          </label>
                          <span className="text-[8px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {selectedTask.history?.length || 0} entries
                          </span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-48">
                          <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono">
                            {selectedTask.history?.map((entry) => (
                              <div key={entry.id} className="text-[9px] border-b border-slate-800/50 last:border-0 pb-2 last:pb-0">
                                <div className="flex items-center justify-between text-slate-500 mb-1">
                                  <span className="flex items-center gap-1">
                                    <User className="w-2.5 h-2.5" />
                                    {entry.user}
                                  </span>
                                  <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                </div>
                                <p className="text-slate-300 leading-tight">
                                  {entry.action}
                                </p>
                              </div>
                            ))}
                            <div ref={historyEndRef} />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setIsConfirmingDelete(true)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Destroy Digital Asset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">System Stats</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-500 font-bold">READY</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Active FTEs</span>
                      <span className="text-white font-mono">1</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Memory usage</span>
                      <span className="text-white font-mono">14.2 MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="h-10 bg-slate-900 border-t border-slate-800 flex items-center px-6 gap-6 overflow-hidden">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Terminal className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-mono text-slate-500">FTE_ARCHITECT @ local_host: Monitoring events...</span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-mono text-slate-500 truncate italic">Ready for Vercel deployment. Context condensation complete.</span>
          </div>
        </footer>
      </main>

      {isConfirmingDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Confirm Destruction</h3>
              <p className="text-xs text-slate-400 mb-6">
                Purging <span className="text-slate-200 font-bold">"{selectedTask.title}.md"</span> is permanent. Cloud backups will be invalidated.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleDeleteTask(selectedTask.id);
                    setIsConfirmingDelete(false);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
