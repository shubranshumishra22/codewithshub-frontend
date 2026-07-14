import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  Building2,
  BookOpen,
  Trophy,
  ExternalLink
} from 'lucide-react';

const interviewReadyTopics = [
  {
    rank: 1,
    topic: "Arrays & Strings (two pointers, sliding window, prefix sum)",
    priority: "Critical",
    frequencyNotes: "Single most asked topic overall, especially subarray problems; almost every interview starts here.",
    companies: "All companies - service-based and product-based"
  },
  {
    rank: 2,
    topic: "Hashing / HashMaps",
    priority: "Critical",
    frequencyNotes: "Tested for fast lookups and problem-solving ability across nearly every round.",
    companies: "Amazon, Microsoft, Google, startups"
  },
  {
    rank: 3,
    topic: "Trees & Binary Search Trees",
    priority: "Critical",
    frequencyNotes: "Binary Trees and BSTs are favorites in product-based companies.",
    companies: "Amazon, Microsoft, Google, Adobe"
  },
  {
    rank: 4,
    topic: "Dynamic Programming",
    priority: "High",
    frequencyNotes: "Toughest yet most rewarding topic; separates strong candidates in product-based interviews.",
    companies: "Google, Amazon, Meta, Flipkart"
  },
  {
    rank: 5,
    topic: "Graphs (BFS/DFS, Union-Find, shortest path)",
    priority: "High",
    frequencyNotes: "Essential for Amazon/Google-type product companies; not usually needed for service-based companies.",
    companies: "Google, Amazon"
  },
  {
    rank: 6,
    topic: "Linked Lists",
    priority: "High",
    frequencyNotes: "Common for testing understanding of pointers and dynamic memory.",
    companies: "Both service and product companies"
  },
  {
    rank: 7,
    topic: "Stacks & Queues",
    priority: "Medium-High",
    frequencyNotes: "Popular in both service-based and product-based interviews; used as building blocks.",
    companies: "Broad, very common"
  },
  {
    rank: 8,
    topic: "Greedy Algorithms",
    priority: "Medium",
    frequencyNotes: "Used for optimization problems, often paired with DP/graph rounds.",
    companies: "Amazon, Microsoft"
  },
  {
    rank: 9,
    topic: "Backtracking / Recursion",
    priority: "Medium",
    frequencyNotes: "Tests problem-solving depth; common in medium-hard rounds.",
    companies: "Google, Amazon, Meta"
  },
  {
    rank: 10,
    topic: "Binary Search (advanced variants)",
    priority: "Medium",
    frequencyNotes: "Classic questions to test efficiency; often disguised as optimization problems.",
    companies: "All companies"
  },
  {
    rank: 11,
    topic: "Heaps / Priority Queues",
    priority: "Medium-Low",
    frequencyNotes: "Common for K-th largest, scheduling, and merge-based problems.",
    companies: "Product companies"
  },
  {
    rank: 12,
    topic: "Sorting (custom comparators, merge/quick internals)",
    priority: "Medium-Low",
    frequencyNotes: "Frequently used as a building block inside other interview problems.",
    companies: "Foundational, rarely asked standalone at advanced level"
  },
  {
    rank: 13,
    topic: "Tries",
    priority: "Low-Medium",
    frequencyNotes: "Niche but shows up in autocomplete / word-search style problems.",
    companies: "Google, Amazon (specific rounds)"
  },
  {
    rank: 14,
    topic: "Segment Trees / Fenwick Trees (BIT)",
    priority: "Low",
    frequencyNotes: "Mostly for range-query heavy roles or competitive-programming-style interviews.",
    companies: "Rare - mainly quant / high-performance systems roles"
  },
  {
    rank: 15,
    topic: "Advanced Graph (Dijkstra, MST, Topological Sort variants)",
    priority: "Low",
    frequencyNotes: "Asked selectively, more common at senior/staff level.",
    companies: "Google, senior SDE rounds"
  }
];

export default function GetInterviewReady() {
  const [completedRanks, setCompletedRanks] = useState(() => {
    try {
      const saved = localStorage.getItem('dsawithshub_interview_ready_completed_ranks');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading completed ranks from localStorage", e);
    }
    return [];
  });

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    localStorage.setItem('dsawithshub_interview_ready_completed_ranks', JSON.stringify(completedRanks));
  }, [completedRanks]);

  const handleToggleComplete = (rank, e) => {
    if (e) e.stopPropagation();
    setCompletedRanks(prev => 
      prev.includes(rank) 
        ? prev.filter(r => r !== rank) 
        : [...prev, rank]
    );
  };

  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to reset your practice progress?")) {
      setCompletedRanks([]);
    }
  };

  const totalTopics = interviewReadyTopics.length;
  const completedCount = completedRanks.length;
  const overallPercentage = totalTopics > 0 
    ? Math.round((completedCount / totalTopics) * 100) 
    : 0;

  const filteredTopics = interviewReadyTopics.filter(t => {
    const matchesSearch = 
      t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.companies.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.priority.toLowerCase().includes(searchQuery.toLowerCase());

    if (priorityFilter === 'All') return matchesSearch;
    
    const priorityLower = t.priority.toLowerCase();
    if (priorityFilter === 'Critical') {
      return matchesSearch && priorityLower === 'critical';
    }
    if (priorityFilter === 'High') {
      return matchesSearch && priorityLower.includes('high');
    }
    if (priorityFilter === 'Medium') {
      return matchesSearch && (priorityLower.includes('medium') && !priorityLower.includes('high'));
    }
    if (priorityFilter === 'Low') {
      return matchesSearch && priorityLower.includes('low');
    }
    
    return matchesSearch;
  });

  const getPriorityStyles = (priority) => {
    const p = priority.toLowerCase();
    if (p === 'critical') {
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
    if (p.includes('high')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    if (p.includes('medium')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
    return 'bg-neutral-800 text-neutral-400 border-neutral-700/60';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative w-full max-w-4xl mx-auto rounded-2xl border border-neutral-800/80 bg-[#0B0B0D]/95 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/90 text-left"
    >
      {/* Top Banner Gold Accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500/30 via-[#d4a843] to-emerald-500/30" />

      {/* Header Area */}
      <div className="p-6 sm:p-8 border-b border-neutral-900/60 bg-gradient-to-b from-[#111115]/30 to-transparent flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            <span className="text-[#d4a843] font-mono text-xs tracking-[0.15em] uppercase font-semibold">Priority Syllabus</span>
          </div>
          <h2 className="text-white text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Get Interview Ready
          </h2>
          <p className="text-neutral-400 text-sm font-light leading-relaxed">
            Optimize your preparation by mastering topics sequenced by recruiter weight and interview frequency.
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-[#121216]/80 border border-neutral-800/60 rounded-xl p-4 min-w-[240px] shadow-inner">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>PREPARATION PROGRESS</span>
            <span className="font-semibold text-white">{overallPercentage}%</span>
          </div>
          
          {/* Elegant Progress Line */}
          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-2.5 mb-3">
            <motion.div 
              className="bg-gradient-to-r from-amber-500 via-[#d4a843] to-emerald-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Completed:</span>
            <span className="text-white font-medium">{completedCount} <span className="text-neutral-600">/</span> {totalTopics} Topics</span>
          </div>
        </div>
      </div>

      {/* Control Panel (Toolbar) */}
      <div className="px-6 sm:px-8 py-4 bg-[#0D0D10]/80 border-b border-neutral-900/60 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {/* Sleek Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic or company..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-800/80 bg-[#060608] text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 transition-all font-mono"
          />
        </div>

        {/* Custom Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((filter) => (
            <button
              key={filter}
              onClick={() => setPriorityFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono select-none transition-all ${
                priorityFilter === filter
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium'
                  : 'bg-[#0E0E10] text-neutral-500 border border-neutral-800/60 hover:text-neutral-300 hover:border-neutral-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Topics List */}
      <div className="p-6 sm:p-8 max-h-[420px] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-neutral-800/80 scrollbar-track-transparent pr-2">
        <AnimatePresence mode="popLayout">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((item) => {
              const isCompleted = completedRanks.includes(item.rank);
              const isExpanded = expandedIndex === item.rank;

              return (
                <motion.div
                  key={item.rank}
                  layout="position"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-xl border bg-[#111114]/40 overflow-hidden transition-all ${
                    isExpanded 
                      ? 'border-neutral-700/80 shadow-lg shadow-black/50' 
                      : 'border-neutral-800/60 hover:border-neutral-700/80 hover:bg-[#131317]/60'
                  }`}
                >
                  {/* Topic Row Header */}
                  <div 
                    onClick={() => setExpandedIndex(isExpanded ? null : item.rank)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Interactive checkbox */}
                      <button
                        onClick={(e) => handleToggleComplete(item.rank, e)}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-400 text-[#070708] shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/60'
                        }`}
                      >
                        {isCompleted && <Check size={12} strokeWidth={3} />}
                      </button>

                      {/* Rank */}
                      <span className="text-neutral-500 font-mono text-xs select-none font-semibold mt-0.5">
                        {String(item.rank).padStart(2, '0')}
                      </span>
                      
                      {/* Topic Name & Target Companies */}
                      <div className="min-w-0 flex-1">
                        <span className={`text-sm font-semibold tracking-tight block transition-colors ${
                          isCompleted 
                            ? 'text-neutral-500 line-through font-normal' 
                            : 'text-neutral-200'
                        }`}>
                          {item.topic}
                        </span>
                        
                        {/* Company list display */}
                        <div className="flex items-start gap-1 mt-1 text-[11px] text-neutral-400 font-medium leading-relaxed">
                          <span className="text-[#d4a843]/60 font-mono text-[9px] uppercase tracking-wider mt-[1.5px] flex-shrink-0">Target:</span>
                          <span className="font-sans text-[11px] text-neutral-400">{item.companies}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Priority tag & expand trigger */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono border font-semibold ${getPriorityStyles(item.priority)}`}>
                        {item.priority}
                      </span>
                      
                      <div className="text-neutral-500 hover:text-neutral-300 transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Accordion Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-3 border-t border-neutral-900 bg-[#070709]/50 text-xs sm:text-sm space-y-4">
                          {/* Frequency Notes */}
                          <div className="space-y-1">
                            <span className="text-[#d4a843] font-mono text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1.5">
                              <BookOpen size={11} className="text-amber-500/80" /> Frequency Notes
                            </span>
                            <p className="text-neutral-300 font-light pl-4 border-l border-neutral-800 leading-relaxed text-[13px]">
                              {item.frequencyNotes}
                            </p>
                          </div>

                          {/* Companies Tag Area */}
                          <div className="space-y-2">
                            <span className="text-[#d4a843] font-mono text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1.5">
                              <Building2 size={11} className="text-amber-500/80" /> Target Companies
                            </span>
                            <div className="flex flex-wrap gap-1.5 pl-4">
                              {item.companies.split(',').map((comp, idx) => {
                                const cleanComp = comp.trim();
                                return (
                                  <span 
                                    key={idx} 
                                    className="bg-neutral-900/80 border border-neutral-800/80 text-neutral-300 hover:text-[#d4a843] hover:border-[#d4a843]/30 rounded px-2.5 py-0.5 text-[10px] font-mono transition-all select-none"
                                  >
                                    {cleanComp}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Practice Action Strip */}
                          <div className="pt-2 border-t border-neutral-900/60 flex justify-between items-center text-[11px] font-mono text-neutral-500">
                            <span>Status: <strong className={isCompleted ? "text-emerald-400 font-medium" : "text-neutral-400 font-medium"}>{isCompleted ? "Mastered" : "Not Started"}</strong></span>
                            <div className="flex items-center gap-4">
                              <a
                                href={`https://leetcode.com/problemset/all/?search=${encodeURIComponent(item.topic.split('(')[0].trim())}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                              >
                                Practice on LeetCode <ExternalLink size={10} className="inline ml-0.5 text-neutral-500" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-neutral-500 font-mono text-xs border border-dashed border-neutral-850 rounded-xl"
            >
              No syllabus topics matched your query.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info / Reset */}
      <div className="px-6 sm:px-8 py-4 bg-[#0C0C0E] border-t border-neutral-900/80 flex items-center justify-between text-xs text-neutral-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Trophy size={13} className="text-amber-500/85" />
          <span>Priority checklist curated from active recruiter data.</span>
        </div>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/10 transition-all py-1 px-2.5 rounded-lg border border-transparent hover:border-rose-900/30 text-[10px]"
        >
          <RotateCcw size={10} />
          Reset Progress
        </button>
      </div>
    </motion.div>
  );
}
