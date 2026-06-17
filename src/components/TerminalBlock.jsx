import { useEffect, useState } from 'react';

const terminalLines = [
  { type: 'command', text: 'npm run dsa:focus' },
  { type: 'output', text: 'loading striver a-z sheet...' },
  { type: 'output-highlight', text: '191 problems indexed' },
  { type: 'blank', text: '' },
  { type: 'command', text: 'track --today' },
  { type: 'output', text: 'solve, revise, repeat' },
  { type: 'output-highlight', text: 'streak engine ready' },
];

export default function TerminalBlock() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    const timeouts = terminalLines.map((line, index) => {
      const delay = line.type === 'command' ? 420 : line.type === 'blank' ? 80 : 55;
      elapsed += index === 0 ? 420 : delay;

      return setTimeout(() => {
        setVisibleCount(index + 1);
      }, elapsed);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <section className="mt-7 bg-[#111214] border border-[#242629] rounded-xl overflow-hidden">
      <div className="relative bg-[#1c1e21] border-b border-[#242629] px-4 py-3 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#333]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#333]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#333]" />
        <span className="absolute left-1/2 -translate-x-1/2 text-[#d8dae0]/40 text-xs font-mono">
          dsa-quest.sh
        </span>
      </div>

      <div className="p-5 font-mono text-sm">
        {terminalLines.slice(0, visibleCount).map((line, index) => {
          if (line.type === 'blank') {
            return <div key={`${line.type}-${index}`} className="h-3" />;
          }

          if (line.type === 'command') {
            return (
              <div key={`${line.type}-${index}`} className="leading-loose">
                <span className="text-[#d8dae0]/40">$ </span>
                <span className="text-[#e8eaed]">{line.text}</span>
              </div>
            );
          }

          return (
            <div
              key={`${line.type}-${index}`}
              className={`pl-5 text-xs leading-loose ${
                line.type === 'output-highlight' ? 'text-[#e8eaed]' : 'text-[#d8dae0]/60'
              }`}
            >
              {line.text}
            </div>
          );
        })}
        <span className="inline-block w-2 h-3.5 bg-[#e8eaed] align-middle animate-[blink_1s_step-end_infinite]" />
      </div>
    </section>
  );
}
