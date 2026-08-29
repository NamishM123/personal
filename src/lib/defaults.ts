import type { Thread } from '../types';

export const DEFAULT_THREADS: Thread[] = [
  { id: 'social', name: 'Social', unit: 'minutes', weeklyGoal: 300, color: '#f472b6' },
  { id: 'classes', name: 'Classes', unit: 'minutes', weeklyGoal: 900, color: '#60a5fa' },
  { id: 'leetcode', name: 'LeetCode', unit: 'count', weeklyGoal: 14, color: '#facc15' },
  { id: 'jobs', name: 'Job Apps', unit: 'count', weeklyGoal: 25, color: '#a78bfa' },
  { id: 'clubs', name: 'Clubs', unit: 'minutes', weeklyGoal: 180, color: '#34d399' },
  { id: 'cooking', name: 'Cooking', unit: 'count', weeklyGoal: 7, color: '#fb923c' },
  { id: 'workout', name: 'Working Out', unit: 'minutes', weeklyGoal: 240, color: '#ef4444' },
];
