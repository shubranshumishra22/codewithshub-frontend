import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Terminal,
  Trophy,
  Calendar,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';
import GetInterviewReady from '../components/GetInterviewReady';

const dsaMasteryPath = [
  {
    level: 1,
    name: 'Quest Sheet',
    topics: 'Patterns, Recursion, Hashing theory',
    desc: 'Our own curated sheet containing foundational questions to warm up your coding logic.',
    subtopics: [
      'Syntax & Standard Libraries',
      'Basic Recursion Mechanics',
      'Time Complexity Calculations',
      'Hashing Maps Introduction',
    ],
    tips: 'Practice tracing recursive loops manually on paper to build core execution visualization skills.',
  },
  {
    level: 2,
    name: 'Google Sheet',
    topics: 'Rotated search, Sliding windows, Matrix traversals',
    desc: 'A handpicked list of intermediate to advanced questions frequently asked in Google interviews.',
    subtopics: [
      'Binary search on answers',
      'Hard sliding window bounds',
      'Graph DFS/BFS connectivity',
      'Prefix sum hashes',
    ],
    tips: 'Google focuses heavily on graphs, trees, and binary search. Pay special attention to optimization.',
  },
  {
    level: 3,
    name: 'Neetcode',
    topics: 'NeetCode 150 standard algorithms list',
    desc: 'The legendary curated collection of 150 problems covering all core data structures.',
    subtopics: [
      'Two pointer arrays',
      'Stack & Min Stack rules',
      'Linked list reversals',
      'Binary tree traversals',
    ],
    tips: 'Perfect list to build muscle memory across all 18 major coding patterns.',
  },
  {
    level: 4,
    name: 'Leetcode 150 Interview Questions',
    topics: 'Top 150 Interview Questions list',
    desc: 'A curated collection of the top 150 interview questions from LeetCode to build general DSA readiness.',
    subtopics: [
      'Sliding window optimizations',
      'Stack matching mechanisms',
      'Graph traversals',
      'Dynamic programming cases',
    ],
    tips: 'This sheet covers the most standard interview questions asked in general tech loops. Focus on edge cases.',
  },
];

const careerPrepPath = [
  {
    level: 1,
    name: 'Choose Language & Version Control',
    topics: 'C++ / Java / Python / JS, Git workflow, terminal',
    desc: 'Select a primary language, master the terminal command line, and use standard version control systems.',
    subtopics: [
      'Language Specific Core Syntax',
      'Terminal Shell Basics',
      'Git Initialization & Commits',
      'GitHub Repository Management',
    ],
    tips: 'Choose one primary language and stick to it. Focus on coding logic rather than switching syntaxes.',
  },
  {
    level: 2,
    name: 'Full-Stack Project Development',
    topics: 'DB Schema, REST APIs, state sync, security checks',
    desc: 'Build functional applications to showcase software design, schema integrations, and REST API controllers.',
    subtopics: [
      'Database Schema Relationships',
      'Backend Route Controllers',
      'CORS & Security Validations',
      'State-driven User Interfaces',
    ],
    tips: 'Build a single high-quality project with clean architecture rather than five generic project clones.',
  },
  {
    level: 3,
    name: 'Resume Building & AI Analysis',
    topics: 'ATS optimizations, metrics, AI review panel',
    desc: 'Structure a professional developer resume and scan it using our AI review analyzer to bypass ATS filters.',
    subtopics: [
      'ATS-Compliant Structure',
      'Quantifiable Impact Metrics',
      'Action Verb Formats',
      'AI Analysis Feedback',
    ],
    tips: 'Review your CV with our integrated AI Resume Reviewer to check metrics, verbs, and optimization warnings.',
    link: '/resume-ai',
    linkLabel: 'Launch AI Resume Reviewer ➜',
  },
  {
    level: 4,
    name: 'Spaced Repetitions & Logic Checks',
    topics: 'Active Recall, Logic Validator execution, edge cases',
    desc: 'Review weak algorithm sheets and execute logical mock tests using automated logic validators.',
    subtopics: [
      'Spaced Revision Scheduling',
      'Handling Edge Case Constraints',
      'Logic Validation Mock Steps',
      'Code Refactoring & Cleanup',
    ],
    tips: 'Use our spaced-repetition scheduler. Verify that your solutions handle empty inputs, null pointers, and integer overflows.',
  },
  {
    level: 5,
    name: 'System Design Fundamentals',
    topics: 'Load balancers, sharding, caching tiers, microservices',
    desc: 'Understand distributed architectures, horizontal scaling, database setups, and caching strategies.',
    subtopics: [
      'Load Balancers & Reverse Proxies',
      'Caching Tiers (Redis/Memcached)',
      'Database Sharding & Replication',
      'Message Queues (Kafka/RabbitMQ)',
    ],
    tips: 'Study tech blogs (Netflix, Discord, bytebytego) to see how modern web companies solve massive traffic scaling.',
  },
  {
    level: 6,
    name: 'Technical & Behavioral Mock Interviews',
    topics: 'STAR method, Big O out-loud, whiteboard code sweeps',
    desc: 'Practice explaining algorithms out loud, dry-running test matrices, and describing projects with the STAR framework.',
    subtopics: [
      'STAR Interview Answers (Situation, Task, Action, Result)',
      'Explaining Complexities Verbally',
      'Interactive Whiteboard Flows',
      'Salary & Offer Negotiations',
    ],
    tips: 'Always describe test cases and dry-run code out loud to your interviewer before typing out final solutions.',
  },
];

const techList = [
  'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'SQL',
  'Git & GitHub', 'VS Code', 'Supabase', 'React.js', 'Algorithms',
  'Dynamic Programming', 'Binary Search', 'Linked Lists', 'System Design'
];

export default function RoadmapPage() {
  const { user } = useAuth();
  const [activeTrack, setActiveTrack] = useState('dsa'); // 'dsa' | 'career'
  const [expandedStep, setExpandedStep] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null); // 'start' | 'explore' | null

  const phrases = [
    "Searching for edge cases... 🔍",
    "Reversing a binary tree... 🌳",
    "Optimizing time complexity... 🚀",
    "LeetCode daily streak active! 🔥",
    "Coffee levels: Nominal. ☕"
  ];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 4500);
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      'content',
      'Access the ultimate, step-by-step developer preparation roadmap. Learn programming foundations, master curated DSA sheets, build projects, tailor your resume with AI, and prep for system design.'
    );

    return () => clearInterval(interval);
  }, []);

  const currentSteps = activeTrack === 'dsa' ? dsaMasteryPath : careerPrepPath;

  const handleScrollToSyllabus = (e) => {
    e.preventDefault();
    const element = document.getElementById('syllabus');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 260, damping: 24 },
    },
  };

  return (
    <>
      <main className="relative min-h-screen bg-[#0A0A0A] overflow-x-hidden text-[#FAFAFA]">
        {/* Background Grids & Ambient Glows */}
        <div className="hero-grid-overlay" />
        <div className="radial-pulse-glow top-[-10%] left-[20%]" />
        <div className="radial-pulse-glow bottom-[15%] right-[10%] opacity-40" />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 max-w-6xl mx-auto text-center z-10">

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6"
          >
            Master Coding Patterns & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-purple-400 to-[#d4a843] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(212,168,67,0.15)]">
              Conquer Tech Interviews
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-neutral-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed font-light"
          >
            An interactive, structured path guiding you from algorithmic problem-solving to system design and landing high-end software engineer roles.
          </motion.p>

          {/* Mascot walking ON the buttons */}
          <div className="relative w-full max-w-xl mx-auto mt-32 mb-16 select-none overflow-visible flex flex-col items-center">
            
            {/* The Mascot sits in the normal layout flow right above the buttons */}
            <div className="w-full h-[60px] relative pointer-events-none overflow-visible mb-[0px] z-20 flex justify-center">
              <motion.div
                animate={{
                  x: ["-180px", "180px", "180px", "-180px", "-180px"],
                  scaleX: [1, 1, -1, -1, 1],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.46, 0.5, 0.96, 1]
                }}
                className="absolute bottom-0 flex flex-col items-center"
              >
                {/* Speech bubble - scaleX counteracts parent scaleX to keep text readable */}
                <motion.div
                  animate={{
                    scaleX: [1, 1, -1, -1, 1]
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.46, 0.5, 0.96, 1]
                  }}
                  className="absolute bottom-full mb-2.5 px-3 py-1.5 bg-[#151515] border border-neutral-800 text-[10px] font-mono text-[#d4a843] rounded-md shadow-2xl whitespace-nowrap"
                >
                  {phrases[currentPhraseIndex]}
                </motion.div>

                {/* Minecraft Style Graduation Mascot with Laptop */}
                <svg 
                  width="72" 
                  height="72" 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  shapeRendering="crispEdges"
                  className="filter drop-shadow-[0_4px_14px_rgba(212,168,67,0.35)]"
                >
                  {/* Graduation Hat (Blocky Diamond Shape) */}
                  <rect x="9" y="0" width="2" height="1" fill="#18181B" />
                  <rect x="7" y="1" width="6" height="1" fill="#18181B" />
                  <rect x="5" y="2" width="10" height="1" fill="#18181B" />
                  <rect x="3" y="3" width="14" height="1" fill="#18181B" />
                  <rect x="5" y="4" width="10" height="1" fill="#18181B" />
                  <rect x="7" y="5" width="6" height="1" fill="#18181B" />
                  {/* Gold tassel */}
                  <rect x="14" y="3" width="1" height="3" fill="#D4A843" />
                  <rect x="13" y="6" width="2" height="1" fill="#D4A843" />

                  {/* Head Box */}
                  <rect x="6" y="6" width="8" height="7" fill="#D1A077" />
                  {/* Hair */}
                  <rect x="6" y="6" width="8" height="2" fill="#4A3525" />
                  <rect x="6" y="8" width="1" height="2" fill="#4A3525" />
                  <rect x="13" y="8" width="1" height="2" fill="#4A3525" />
                  
                  {/* Minecraft blocky eyes */}
                  <rect x="7" y="9" width="1" height="1" fill="#FFFFFF" />
                  <rect x="8" y="9" width="1" height="1" fill="#2563EB" />
                  <rect x="11" y="9" width="1" height="1" fill="#2563EB" />
                  <rect x="12" y="9" width="1" height="1" fill="#FFFFFF" />

                  {/* Blinking blocky eyelids animation */}
                  <motion.rect 
                    x="7" y="9" width="2" height="1" 
                    fill="#D1A077" 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: [0, 0, 1, 0, 0] }}
                    transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.93, 0.96, 1] }}
                    style={{ originY: 0 }}
                  />
                  <motion.rect 
                    x="11" y="9" width="2" height="1" 
                    fill="#D1A077" 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: [0, 0, 1, 0, 0] }}
                    transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.93, 0.96, 1] }}
                    style={{ originY: 0 }}
                  />

                  {/* Nose */}
                  <rect x="9" y="10" width="2" height="1" fill="#A57550" />
                  {/* Mouth */}
                  <rect x="8" y="11" width="4" height="1" fill="#7A4F30" />

                  {/* Shirt (Teal) */}
                  <rect x="5" y="13" width="10" height="4" fill="#0EA5E9" />
                  <rect x="9" y="13" width="2" height="1" fill="#D1A077" />

                  {/* Left Arm */}
                  <rect x="3" y="13" width="2" height="2" fill="#0EA5E9" />
                  <rect x="3" y="15" width="2" height="2" fill="#D1A077" />
                  
                  {/* Right Arm holding laptop */}
                  <rect x="15" y="13" width="2" height="2" fill="#0EA5E9" />
                  <rect x="15" y="15" width="2" height="2" fill="#D1A077" />

                  {/* Blocky Laptop held in right hand */}
                  {/* Laptop Base (Dark Grey) */}
                  <rect x="16" y="14" width="3" height="1" fill="#374151" />
                  {/* Laptop screen lid (Dark Grey) */}
                  <rect x="18" y="11" width="1" height="3" fill="#374151" />
                  {/* Laptop screen display (Cyan glow) */}
                  <rect x="17" y="12" width="1" height="2" fill="#22D3EE" />

                  {/* Pants (Blue) */}
                  <rect x="5" y="17" width="10" height="3" fill="#2563EB" />
                  {/* Shoes (Grey) */}
                  <rect x="5" y="19" width="3" height="1" fill="#4B5563" />
                  <rect x="12" y="19" width="3" height="1" fill="#4B5563" />
                </svg>
              </motion.div>
            </div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 w-full"
            >
              <Link 
                to="/sheets" 
                className="bg-white text-black font-semibold w-[280px] py-4 !rounded-md hover:bg-neutral-200 transition-colors select-none text-base tracking-wide pointer-events-auto shadow-xl text-center"
                onMouseEnter={() => setHoveredButton('start')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                Start Learning Today
              </Link>
              <a
                href="#syllabus"
                onClick={handleScrollToSyllabus}
                className="border border-neutral-700 text-white bg-transparent font-semibold w-[160px] py-4 !rounded-md hover:bg-white/5 hover:border-neutral-500 transition-colors select-none text-base tracking-wide pointer-events-auto text-center"
                onMouseEnter={() => setHoveredButton('explore')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                Explore Roadmap
              </a>
            </motion.div>
          </div>

          {/* Interactive Hero Visualizer: Get Interview Ready Priority Tracker */}
          <GetInterviewReady />
        </section>

        {/* Tech Marquee */}
        <section className="relative z-10 w-full mb-20">
          <div className="tech-marquee-wrapper py-6 border-y border-neutral-900/70 bg-[#070708]/30">
            <div className="tech-marquee-track select-none">
              {/* First loop */}
              {techList.map((tech, i) => (
                <div
                  key={`tech-l1-${i}`}
                  className="flex items-center gap-2 px-5 py-2 rounded-full border border-neutral-800/80 bg-neutral-900/30 text-neutral-400 font-mono text-xs tracking-wider hover:text-white hover:border-amber-500/20 hover:bg-[#d4a843]/5 transition-all duration-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                  {tech}
                </div>
              ))}
              {/* Second loop */}
              {techList.map((tech, i) => (
                <div
                  key={`tech-l2-${i}`}
                  className="flex items-center gap-2 px-5 py-2 rounded-full border border-neutral-800/80 bg-neutral-900/30 text-neutral-400 font-mono text-xs tracking-wider hover:text-white hover:border-amber-500/20 hover:bg-[#d4a843]/5 transition-all duration-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bento Feature Grid */}
        <section className="relative z-10 px-6 max-w-6xl mx-auto mb-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-4">Complete Preparation Ecosystem</h2>
            <p className="text-neutral-400 max-w-xl mx-auto font-light">
              Every tool and system you need to scale your algorithms skill and pass technical engineering interview loops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Bento Card 1: DSA Sheets */}
            <div className="bento-card flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                  <Code2 size={20} />
                </div>
                <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Curated DSA Sheets</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6 font-light">
                  Access selective handpicked problems to build conceptual pattern recognition.
                </p>
              </div>

              <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-neutral-900/60">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-neutral-300">Amazon Top 50</span>
                  <span className="text-[#d4a843] font-semibold">68% Solved</span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#d4a843] h-1.5 rounded-full" style={{ width: '68%' }} />
                </div>
                <div className="flex justify-between items-center text-xs font-mono pt-1">
                  <span className="text-neutral-300">Sliding Window</span>
                  <span className="text-purple-400 font-semibold">12% Solved</span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>

            {/* Bento Card 2: AI Resume Reviewer */}
            <div className="bento-card flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-xl font-semibold text-white tracking-tight mb-2">AI Resume Analyzer</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6 font-light">
                  Evaluate your resume against top ATS keywords, quantifiable metrics and get recommendations.
                </p>
              </div>

              <div className="flex gap-4 items-center bg-black/40 p-4 rounded-xl border border-neutral-900/60">
                <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="#a855f7"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={151}
                      strokeDashoffset={151 - (151 * 87) / 100}
                    />
                  </svg>
                  <span className="text-[11px] font-semibold text-white font-mono">87%</span>
                </div>
                <div className="space-y-1 text-[11px] font-mono leading-none">
                  <div className="text-emerald-400 font-medium">✓ Clean Layout Template</div>
                  <div className="text-emerald-400 font-medium">✓ 14 impact metrics</div>
                  <div className="text-yellow-500">⚠ Missing system tags</div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Spaced Repetitions */}
            <div className="bento-card flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                  <Calendar size={20} />
                </div>
                <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Spaced Repetitions</h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6 font-light">
                  Retain logic patterns permanently using our integrated active recall review queue.
                </p>
              </div>

              <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-neutral-900/60 text-xs font-mono">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>due today</span>
                  <span className="text-amber-400">Reverse Linked List</span>
                </div>
                <div className="w-full h-px bg-neutral-900/60" />
                <div className="flex justify-between items-center text-neutral-300">
                  <span>tomorrow</span>
                  <span className="text-purple-400">Merge K Lists</span>
                </div>
                <div className="w-full h-px bg-neutral-900/60" />
                <div className="flex justify-between items-center text-neutral-500">
                  <span>in 3 days</span>
                  <span>LRU Cache Design</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Syllabus Timeline Track section */}
        <section id="syllabus" className="relative z-10 px-6 max-w-4xl mx-auto mb-32 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-4">Curriculum Syllabus</h2>
            <p className="text-neutral-400 max-w-xl mx-auto font-light">
              Choose your career focus and start traversing interactive learning nodes.
            </p>
          </div>

          {/* Track Switcher */}
          <div className="roadmap-track-switcher-wrap mb-16">
            <div className="roadmap-track-switcher p-1 bg-neutral-900/60 border border-neutral-800/80 rounded-full flex gap-1">
              <button
                className={`relative z-10 track-tab px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                  activeTrack === 'dsa' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => {
                  setActiveTrack('dsa');
                  setExpandedStep(null);
                }}
              >
                {activeTrack === 'dsa' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-neutral-800/80 rounded-full -z-10 border border-neutral-700/50 shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="flex items-center gap-2">
                  <Code2 size={15} className={activeTrack === 'dsa' ? 'text-amber-400' : 'text-neutral-500'} />
                  DSA Mastery Path
                </span>
              </button>
              <button
                className={`relative z-10 track-tab px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                  activeTrack === 'career' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => {
                  setActiveTrack('career');
                  setExpandedStep(null);
                }}
              >
                {activeTrack === 'career' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-neutral-800/80 rounded-full -z-10 border border-neutral-700/50 shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="flex items-center gap-2">
                  <Briefcase size={15} className={activeTrack === 'career' ? 'text-purple-400' : 'text-neutral-500'} />
                  Career & Interview Path
                </span>
              </button>
            </div>
          </div>

          {/* Timeline Layout */}
          <div className="roadmap-timeline-section">
            <div className="roadmap-timeline-line" />

            <motion.div
              key={activeTrack}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="roadmap-timeline-steps"
            >
              {currentSteps.map((step, index) => {
                const isExpanded = expandedStep === index;

                return (
                  <motion.div
                    key={step.level}
                    variants={cardVariants}
                    className="roadmap-step-item"
                  >
                    {/* Timeline Node Ring */}
                    <div className="roadmap-timeline-node node-premium select-none font-mono">
                      <span className="node-number">{step.level}</span>
                    </div>

                    {/* Level Card */}
                    <div
                      className={`roadmap-step-card premium-step-card ${isExpanded ? 'is-expanded-card' : ''}`}
                      onClick={() => setExpandedStep(isExpanded ? null : index)}
                    >
                      <div className="step-card-main">
                        <div className="step-card-content">
                          <div className="step-badge-row">
                            <span className="step-level-tag font-mono text-[9px]">Stage {step.level}</span>
                            <span className="step-topics-preview font-mono text-[10px] text-neutral-500">{step.topics}</span>
                          </div>
                          <h4 className="text-white text-lg font-semibold tracking-tight transition-colors group-hover:text-amber-400">{step.name}</h4>
                          <p className="step-description text-neutral-400 text-xs sm:text-sm font-light mt-1">{step.desc}</p>
                        </div>

                        <div className="step-card-arrow">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Expandable Accordion */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className="step-card-accordion"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()} // Prevent card collapse when clicking inside accordion
                          >
                            <div className="accordion-divider" />

                            <div className="accordion-details">
                              <div className="details-col-left">
                                <h5 className="font-mono">📚 Core Syllabus</h5>
                                <ul className="subtopics-list mt-3">
                                  {step.subtopics.map((sub, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300">
                                      <CheckCircle2 size={13} className="bullet-check text-emerald-400" />
                                      <span>{sub}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="details-col-right flex flex-col justify-between">
                                <div>
                                  <h5 className="font-mono">💡 Mentor's Secret Tip</h5>
                                  <p className="mentor-tip-text mt-3 text-xs sm:text-sm text-neutral-300 border-l border-amber-500/40 pl-3">
                                    {step.tips}
                                  </p>
                                </div>

                                {/* Direct Links integration */}
                                <div className="mt-4">
                                  {step.link ? (
                                    <Link to={step.link} className="step-cta-button highlight-cta select-none">
                                      {step.linkLabel}
                                    </Link>
                                  ) : activeTrack === 'dsa' ? (
                                    <Link to="/sheets" className="step-cta-button select-none font-semibold hover:border-[#d4a843]/40 hover:text-white transition-colors">
                                      Go to DSA Practice Quest ➜
                                    </Link>
                                  ) : (
                                    <div className="step-completed-placeholder flex items-center gap-2 text-xs text-neutral-500 select-none">
                                      <Sparkles size={13} className="sparkle-gold text-amber-500 animate-pulse" />
                                      <span>Prepare this stage thoroughly to advance</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
