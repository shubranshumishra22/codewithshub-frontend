const creditUrl =
  'https://l.instagram.com/?u=https%3A%2F%2Fshubranshu.vercel.app%2F%3Futm_source%3Dig%26utm_medium%3Dsocial%26utm_content%3Dlink_in_bio%26fbclid%3DPAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGn4AIMJfOfGze7BzjPiiGiZKyx2TFG14Jq8P0x8EcawxKlqUb7tkc4pRLtN8s_aem_0c027neaBxEAYCOPjrAAZg&e=AUDi0JJe6OliBrvVx6LsAsi8iicGmcjxPpxtub7gGHikTV_d9vDWG8ckXLLSoLFKorojibmKmFqqZBHcxlb9vWKQN6KIaL_XsW-z4bDzqJvzSgl0Gla2o-lq27ynz2JMG_S7ynb1MmGK3IquzICqA42LJXeX';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>build by</span>
      <a href={creditUrl} target="_blank" rel="noreferrer">
        shubranshu.vercel.app
      </a>
    </footer>
  );
}
