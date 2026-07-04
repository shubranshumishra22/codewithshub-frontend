const creditUrl = 'https://shubranshu.vercel.app/';

export default function SiteFooter() {
  return (
    <footer className="w-full max-w-[1200px] mx-auto flex items-center justify-center gap-1.5 p-3 mt-auto border-t border-[#232327] text-xs text-[#55555d]">
      <span>built by </span>
      <a href={creditUrl} target="_blank" rel="noreferrer" className="text-[#93939c] font-medium hover:text-[#f2f2f4] transition-colors">
        Shubranshu
      </a>
    </footer>
  );
}
