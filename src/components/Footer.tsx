export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-6 font-mono text-xs text-muted">
        <span>© 2026 Benedict Pabatao</span>
        <span>
          next.js · github pages ·{" "}
          <a
            href="https://github.com/bpabatao/bpabatao.github.io"
            target="_blank"
            rel="noopener"
            className="transition-colors hover:text-accent"
          >
            source ↗
          </a>
        </span>
      </div>
    </footer>
  );
}
