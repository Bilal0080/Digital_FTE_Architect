
export enum HackathonTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

export interface HistoryEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

export interface FTETask {
  id: string;
  title: string;
  status: 'Needs_Action' | 'In_Progress' | 'Pending_Approval' | 'Done';
  type: 'email' | 'finance' | 'social' | 'system' | 'notes';
  priority: 'High' | 'Medium' | 'Low';
  content: string;
  timestamp: string;
  dueDate?: string;
  tags?: string[];
  history?: HistoryEntry[];
}

export interface HandbookSection {
  title: string;
  content: string;
}
