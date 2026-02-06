
import React from 'react';
import { Eye, Brain, Hammer, Shield, ChevronRight } from 'lucide-react';

const ArchitectureMap: React.FC = () => {
  const steps = [
    {
      title: 'Perception',
      subtitle: 'Watchers',
      icon: <Eye className="w-6 h-6 text-emerald-400" />,
      items: ['Gmail API', 'WhatsApp Web', 'Bank CSVs'],
      desc: 'Python Sentinels monitor inputs 24/7'
    },
    {
      title: 'Reasoning',
      subtitle: 'Brain',
      icon: <Brain className="w-6 h-6 text-indigo-400" />,
      items: ['Claude Code', 'Gemini Flash', 'Local-First'],
      desc: 'Processes tasks in /Needs_Action'
    },
    {
      title: 'Action',
      subtitle: 'Hands',
      icon: <Hammer className="w-6 h-6 text-rose-400" />,
      items: ['MCP Servers', 'Playwright', 'Browser Use'],
      desc: 'Executes approved tasks externally'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
      {steps.map((step, idx) => (
        <React.Fragment key={step.title}>
          <div className="relative p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-indigo-500/50 transition-all group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-900 rounded-xl">
                {step.icon}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white leading-tight">{step.title}</h4>
                <p className="text-xs text-slate-400 font-mono tracking-wider">{step.subtitle}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-4">{step.desc}</p>
            <div className="flex flex-wrap gap-2">
              {step.items.map(item => (
                <span key={item} className="px-2 py-1 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-400 font-mono">
                  {item}
                </span>
              ))}
            </div>
          </div>
          {idx < steps.length - 1 && (
            <div className="hidden md:flex items-center justify-center -mx-3 z-10">
              <ChevronRight className="w-8 h-8 text-slate-700" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ArchitectureMap;
