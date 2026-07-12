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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

const dsaMasteryPath = [
  {
    level: 1,
    name: 'Learn the Basics',
    topics: 'Patterns, Recursion, Hashing theory',
    desc: 'Get comfortable with basic syntax, loops, mathematical operations, and core hashing theory.',
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
    name: 'Sorting Techniques',
    topics: 'Selection, Bubble, Insertion, Merge, Quick Sort',
    desc: 'Understand comparison sorting and the divide-and-conquer strategy.',
    subtopics: [
      'O(N^2) Comparison Sorts',
      'Merge Sort (Divide & Conquer)',
      'Quick Sort (In-place Pivot)',
      'Sorting Time & Space Bounds',
    ],
    tips: 'Understand why Merge Sort takes O(N) auxiliary space while Quick Sort takes O(log N) recursion stack space.',
  },
  {
    level: 3,
    name: 'Arrays & Hashing',
    topics: '2Sum, Kadane\'s, Stock Buy/Sell, Next Permutation',
    desc: 'Master basic array traversals, two-pointers, and sliding window boundaries.',
    subtopics: [
      'Two-Pointer Scans',
      'Prefix & Suffix Accumulators',
      'Sliding Window Basics',
      'Kadane\'s Subarray Algorithm',
    ],
    tips: 'Kadane\'s algorithm is foundational. Always look for local maximums that build up to a global peak.',
  },
  {
    level: 4,
    name: 'Binary Search',
    topics: 'Search bounds, Rotated sorted arrays, Book allocation',
    desc: 'Apply divide-and-conquer boundaries to logarithmic search spaces.',
    subtopics: [
      'Monotonic Search Spaces',
      'BS on Rotated Sorted Arrays',
      'Search on Answer Space',
      'Allocation & Range Bounds',
    ],
    tips: 'Binary search applies to any monotonic function, not just sorted arrays. Try to frame search conditions clearly.',
  },
  {
    level: 5,
    name: 'Linked Lists',
    topics: 'Singly LL, Doubly LL, Cycle detection, Flattening',
    desc: 'Manipulate nodes, pointers, list reversals, and slow/fast pointer tricks.',
    subtopics: [
      'Pointer Redirection Rules',
      'Slow & Fast Pointer Strategy',
      'Cycle Detection (Floyd\'s)',
      'Recursive Node Flattening',
    ],
    tips: 'Draw list nodes on paper before writing pointer logic. A single dangling node will cause infinite loops!',
  },
  {
    level: 6,
    name: 'Recursion & Backtracking',
    topics: 'Subsets, Combination Sum, N-Queens, Sudoku',
    desc: 'Explore combinatorial search spaces and prune branches that violate constraints.',
    subtopics: [
      'State Space Trees',
      'Subset Generation Patterns',
      'Backtracking State Reversals',
      'Recursive Tree Pruning',
    ],
    tips: 'Backtracking is simply Depth First Search on a decision tree. Remember to revert state after returning.',
  },
  {
    level: 7,
    name: 'Stacks & Queues',
    topics: 'Monotonic stack, Min Stack, LRU Cache, Sliding Window Max',
    desc: 'Learn FIFO/LIFO behaviors and optimize linear tracking boundaries.',
    subtopics: [
      'LIFO/FIFO Core Mechanics',
      'Monotonic Stack Optimizations',
      'LRU Cache Index Design',
      'Sliding Window Extremums',
    ],
    tips: 'Monotonic stacks are excellent for finding the "next greater" or "previous smaller" boundaries in O(N) time.',
  },
  {
    level: 8,
    name: 'Hierarchical Trees',
    topics: 'Traversals, Depth, Views, Diameter, LCA, BST rules',
    desc: 'Master hierarchical node relationships, tree height, and search tree constraints.',
    subtopics: [
      'Inorder, Preorder, Postorder Traversals',
      'Level Order BFS traversals',
      'Lowest Common Ancestor (LCA)',
      'Binary Search Tree Properties',
    ],
    tips: 'Understand the difference between height (longest path to leaf) and depth (edges to root). Recursive tree sweeps are core.',
  },
  {
    level: 9,
    name: 'Graphs & Connectivity',
    topics: 'BFS/DFS, Dijkstra, MST, Topological Sort, Bridges',
    desc: 'Represent connection networks, traverse graphs, and calculate shortest paths.',
    subtopics: [
      'Adjacency List traversals',
      'Topological Sort & Dependency Cycles',
      'Dijkstra\'s Shortest Path',
      'Minimum Spanning Trees',
    ],
    tips: 'Dijkstra\'s algorithm requires non-negative edges. BFS is always the optimal choice for unweighted shortest paths.',
  },
  {
    level: 10,
    name: 'Dynamic Programming',
    topics: 'Grid Paths, Knapsack, LIS, Stock DP, Matrix Chain',
    desc: 'Cache subproblem results to solve complex optimization problems.',
    subtopics: [
      'Overlapping Subproblems',
      'Memoization (Top-down caching)',
      'Tabulation (Bottom-up grids)',
      'DP State Space Reduction',
    ],
    tips: 'Identify the state parameters, write a recurrence relation, and cache it. Solve recursive recursion first.',
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

export default function RoadmapPage() {
  const { user } = useAuth();
  const [activeTrack, setActiveTrack] = useState('dsa'); // 'dsa' | 'career'
  const [expandedStep, setExpandedStep] = useState(null);

  useEffect(() => {
    document.title = 'CodeWithShub';

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

    return () => {
      document.title = 'CodeWithShub';
    };
  }, []);

  const currentSteps = activeTrack === 'dsa' ? dsaMasteryPath : careerPrepPath;

  return (
    <>
    <main className="roadmap-shell">
      {/* Background glowing gradients */}
      <div className="roadmap-bg-glow-1" />
      <div className="roadmap-bg-glow-2" />

      <div className="roadmap-container auth-entrance">
        {/* Header Block Centered */}
        <div className="roadmap-header">
          <h1>Developer Career Roadmap</h1>
          <p>
            An interactive, step-by-step curriculum guiding you from algorithmic problem-solving to system design and landing high-end tech roles.
          </p>
        </div>

        {/* Track Switcher */}
        <div className="roadmap-track-switcher-wrap">
          <div className="roadmap-track-switcher">
            <button
              className={`track-tab ${activeTrack === 'dsa' ? 'active' : ''}`}
              onClick={() => {
                setActiveTrack('dsa');
                setExpandedStep(null);
              }}
            >
              <Code2 size={16} />
              <span>DSA Mastery Path</span>
            </button>
            <button
              className={`track-tab ${activeTrack === 'career' ? 'active' : ''}`}
              onClick={() => {
                setActiveTrack('career');
                setExpandedStep(null);
              }}
            >
              <Briefcase size={16} />
              <span>Career & Interview Path</span>
            </button>
          </div>
        </div>

        {/* Core Timeline section */}
        <section className="roadmap-timeline-section">
          <div className="roadmap-timeline-line" />

          <div className="roadmap-timeline-steps">
            {currentSteps.map((step, index) => {
              const isExpanded = expandedStep === index;

              // Select color nodes based on activeTrack and levels
              let nodeClass = 'node-indigo';
              if (activeTrack === 'dsa') {
                if (step.level > 7) nodeClass = 'node-violet';
                else if (step.level > 3) nodeClass = 'node-purple';
              } else {
                if (step.level > 4) nodeClass = 'node-emerald';
                else if (step.level > 2) nodeClass = 'node-purple';
              }

              return (
                <div key={step.level} className="roadmap-step-item">
                  {/* Timeline Node Ring */}
                  <div className={`roadmap-timeline-node ${nodeClass}`}>
                    <span className="node-number">{step.level}</span>
                  </div>

                  {/* Level Card */}
                  <div
                    className={`roadmap-step-card ${isExpanded ? 'is-expanded-card' : ''}`}
                    onClick={() => setExpandedStep(isExpanded ? null : index)}
                  >
                    <div className="step-card-main">
                      <div className="step-card-content">
                        <div className="step-badge-row">
                          <span className="step-level-tag">Stage {step.level}</span>
                          <span className="step-topics-preview">{step.topics}</span>
                        </div>
                        <h4>{step.name}</h4>
                        <p className="step-description">{step.desc}</p>
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
                              <h5>📚 Core Syllabus</h5>
                              <ul className="subtopics-list">
                                {step.subtopics.map((sub, i) => (
                                  <li key={i}>
                                    <CheckCircle2 size={14} className="bullet-check" />
                                    <span>{sub}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="details-col-right">
                              <h5>💡 Mentor's Secret Tip</h5>
                              <p className="mentor-tip-text">{step.tips}</p>

                              {/* Direct Links integration */}
                              {step.link ? (
                                <Link to={step.link} className="step-cta-button highlight-cta">
                                  {step.linkLabel}
                                </Link>
                              ) : activeTrack === 'dsa' ? (
                                <Link to="/" className="step-cta-button">
                                  Go to DSA Practice Quest ➜
                                </Link>
                              ) : (
                                <div className="step-completed-placeholder">
                                  <Sparkles size={14} className="sparkle-gold" />
                                  <span>Prepare this stage thoroughly to advance</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
      <SiteFooter />
    </>);
}

