const creditUrl = 'https://shubranshu.vercel.app/';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>built by </span>
      <a href={creditUrl} target="_blank" rel="noreferrer">
        Shubranshu
      </a>
    </footer>
  );
}
