import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Compass, Layers, ShieldAlert, Sparkles, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

const roadmapSteps = [
  { level: 1, name: 'Learn the Basics', topics: 'Patterns, Recursion, Hashing theory', desc: 'Get comfortable with syntax, loops, conditional flows, basic mathematics, and hashing concepts.' },
  { level: 2, name: 'Sorting Techniques', topics: 'Selection, Bubble, Insertion, Merge, Quick Sort', desc: 'Understand comparison sorts, divide & conquer, and sorting efficiency (time & space complex).' },
  { level: 3, name: 'Arrays (Easy, Medium, Hard)', topics: '2Sum, Kadane\'s, Stock Buy/Sell, Next Permutation', desc: 'Master array manipulations, sliding window basics, prefix sums, and two-pointer strategies.' },
  { level: 4, name: 'Binary Search', topics: 'Search space, Rotated sorted arrays, Book allocation', desc: 'Learn searching bounds, logarithmic search algorithms, and applying binary search on answers.' },
  { level: 5, name: 'Strings', topics: 'Anagrams, Isomorphic, Longest palindromic substring', desc: 'Manipulate strings, search sub-patterns, and utilize ASCII mapping tables.' },
  { level: 6, name: 'Linked Lists', topics: 'Singly LL, Doubly LL, Cycle detection, Flattening', desc: 'Understand node pointers, dummy nodes, list reversals, and slow/fast pointer hacks.' },
  { level: 7, name: 'Recursion & Backtracking', topics: 'Subsets, Combination Sum, N-Queens, Sudoku', desc: 'Build recursive search trees, try all options, and prune invalid recursive states (backtrack).' },
  { level: 8, name: 'Bit Manipulation', topics: 'XOR logic, Power of 2, Count set bits', desc: 'Perform bitwise logical operations, mask indices, and optimize bit patterns.' },
  { level: 9, name: 'Stack & Queues', topics: 'Monotonic stack, Min Stack, LRU Cache, Sliding Window Max', desc: 'Use FIFO/LIFO structures to solve linear tracking problems and design caching indexes.' },
  { level: 10, name: 'Sliding Window & Two Pointers', topics: 'Distinct substrings, window limits', desc: 'Manage contiguous subsegments using variable size windows and pointer boundaries.' },
  { level: 11, name: 'Heaps / Priority Queues', topics: 'K-sorted, Median in stream, Task scheduler', desc: 'Fetch dynamic min/max elements in logarithmic time. Master heapifications.' },
  { level: 12, name: 'Greedy Algorithms', topics: 'Fractional Knapsack, Platforms, Cookies', desc: 'Solve scheduling and optimization problems by picking the locally optimal choice at each step.' },
  { level: 13, name: 'Binary Trees', topics: 'Traversals, Depth, Views, Diameter, LCA', desc: 'Understand hierarchical graphs, height calculations, and tree traversal orderings.' },
  { level: 14, name: 'Binary Search Trees', topics: 'BST insertion, validation, Inorder Successor', desc: 'Maintain elements in sorted tree orders. Perform search, inserts, and deletes.' },
  { level: 15, name: 'Graphs', topics: 'BFS/DFS, Dijkstra, MST, Topological Sort, Bridges', desc: 'Represent connectivity networks. Find shortest paths, minimum spans, and cut nodes.' },
  { level: 16, name: 'Dynamic Programming', topics: 'Grids, Knapsack, LIS, Stock DP, Matrix Chain', desc: 'Optimize recursion by caching sub-results (Memoization/Tabulation). Solve state problems.' },
  { level: 17, name: 'Tries', topics: 'Implement Trie, Prefix queries, Max XOR match', desc: 'Design spelling search trees and fast prefix match index pools.' }
];

export default function RoadmapPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Best DSA Preparation Roadmap for Beginners | CodeWithShub';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      'content',
      'The ultimate, step-by-step DSA preparation roadmap for beginners. Learn how to start learning DSA from scratch, track your progress, and prepare for top coding interviews.'
    );

    return () => {
      document.title = 'DSA Quest';
    };
  }, []);

  return (
    <main className="sheet-shell" style={{ paddingTop: '100px' }}>
      <div className="sheet-card auth-entrance" style={{ maxWidth: '1000px' }}>
        
        {/* Header Block */}
        <div className="sheet-header" style={{ flexDirection: 'column', gap: '8px', marginBottom: '40px', textAlign: 'center', alignItems: 'center' }}>
          <h1 style={{ marginTop: '16px', color: '#fff', fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
            Best DSA Preparation Roadmap
          </h1>
          <p className="sheet-subtitle" style={{ maxWidth: '640px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}>
            A comprehensive, step-by-step guide designed to take you from programming basics to advanced technical algorithms.
          </p>
        </div>

        {/* Strategy Guide Cards */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '24px', borderBottom: '0.5px solid #242629', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} style={{ color: '#39d353' }} />
            How to Learn DSA from Scratch
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <article className="topic-card" style={{ padding: '20px' }}>
              <strong style={{ color: '#fff', fontSize: '1rem', display: 'block', marginBottom: '8px' }}>
                1. Stick to One Language
              </strong>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                Choose C++, Java, Python, or JavaScript. Focus on algorithm logic instead of syntax switching.
              </p>
            </article>

            <article className="topic-card" style={{ padding: '20px' }}>
              <strong style={{ color: '#fff', fontSize: '1rem', display: 'block', marginBottom: '8px' }}>
                2. Solve Topic-Wise
              </strong>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                Master one level before advancing. Do not jump to Trees or Graphs before understanding Recursion and Arrays.
              </p>
            </article>

            <article className="topic-card" style={{ padding: '20px' }}>
              <strong style={{ color: '#fff', fontSize: '1rem', display: 'block', marginBottom: '8px' }}>
                3. Space Out Revisions
              </strong>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                Re-solve problems after 1, 3, and 7 days. Our spaced-repetition scheduler generates these slots automatically.
              </p>
            </article>

            <article className="topic-card" style={{ padding: '20px' }}>
              <strong style={{ color: '#fff', fontSize: '1rem', display: 'block', marginBottom: '8px' }}>
                4. Focus on Complexities
              </strong>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                Never just write code. Explain the Time Complexity (Big O) and Space Complexity for every single algorithm.
              </p>
            </article>
          </div>
        </section>

        {/* Visual Roadmap Timeline */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '32px', borderBottom: '0.5px solid #242629', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} style={{ color: '#8a6a2a' }} />
            Step-by-Step Level Map
          </h2>

          <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '1.5px solid #242629', marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {roadmapSteps.map((step) => (
              <div key={step.level} style={{ position: 'relative' }}>
                {/* Timeline Orb */}
                <div style={{
                  position: 'absolute',
                  left: '-33px',
                  top: '4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#111214',
                  border: '2px solid #39d353',
                  boxShadow: '0 0 8px rgba(57, 211, 83, 0.4)',
                  zIndex: 2
                }} />

                {/* Level Card */}
                <div className="topic-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: '1 1 400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#39d353', background: 'rgba(57, 211, 83, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                        LEVEL {step.level}
                      </span>
                      <strong style={{ fontSize: '1.15rem', color: '#fff' }}>
                        {step.name}
                      </strong>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: '4px 0 8px' }}>
                      {step.desc}
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', display: 'block', fontFamily: 'monospace' }}>
                      Key Focus: {step.topics}
                    </span>
                  </div>

                  <div>
                    {user ? (
                      <Link
                        to="/"
                        className="auth-button"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
                      >
                        Open Sheet
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        className="sheet-progress-link"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
                      >
                        Track Level
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <SiteFooter />
    </main>
  );
}
