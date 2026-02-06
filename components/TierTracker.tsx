
import React from 'react';
import { HackathonTier } from '../types';
import { Trophy, Star, Zap, Crown } from 'lucide-react';

const TierTracker: React.FC = () => {
  const tiers = [
    {
      id: HackathonTier.BRONZE,
      name: 'Bronze',
      icon: <Zap className="w-5 h-5" />,
      color: 'border-orange-500/30 bg-orange-500/5 text-orange-400',
      points: ['Dashboard.md', '1 Watcher', 'Folder Structure']
    },
    {
      id: HackathonTier.SILVER,
      name: 'Silver',
      icon: <Star className="w-5 h-5" />,
      color: 'border-slate-400 bg-slate-400/5 text-slate-200',
      points: ['MCP Servers', 'Reasoning Loop', 'HITL Workflow']
    },
    {
      id: HackathonTier.GOLD,
      name: 'Gold',
      icon: <Trophy className="w-5 h-5" />,
      color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
      points: ['Ralph Wiggum Loop', 'Weekly CEO Briefing', 'Odoo ERP']
    },
    {
      id: HackathonTier.PLATINUM,
      name: 'Platinum',
      icon: <Crown className="w-5 h-5" />,
      color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400',
      points: ['Always-On Cloud', 'Synced Vaults', 'Delegation']
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
      {tiers.map(tier => (
        <div key={tier.id} className={`p-5 rounded-2xl border-2 ${tier.color} transition-transform hover:-translate-y-1`}>
          <div className="flex items-center gap-3 mb-4">
            {tier.icon}
            <h4 className="text-lg font-bold">{tier.name}</h4>
          </div>
          <ul className="space-y-2">
            {tier.points.map((p, idx) => (
              <li key={idx} className="text-xs flex items-center gap-2 opacity-80">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default TierTracker;
