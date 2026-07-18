"use client";

/* Native Popover API: open/close and light-dismiss come from the platform.
   JS only closes the menu after a link tap (hash navigation keeps it open otherwise). */
export function MobileMenu({ links }: { links: readonly { href: string; label: string }[] }) {
  const close = () => document.getElementById("mobile-menu")?.hidePopover();

  return (
    <div className="sm:hidden">
      <button
        type="button"
        popoverTarget="mobile-menu"
        aria-label="Open menu"
        className="grid size-8 cursor-pointer place-items-center rounded-sm border border-line text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      <div id="mobile-menu" popover="auto" className="mobile-menu">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={close}
            className="block px-3 py-2.5 font-mono text-sm text-body transition-colors hover:text-accent"
          >
            {l.label}
          </a>
        ))}
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener"
          onClick={close}
          className="block border-t border-line px-3 py-2.5 font-mono text-sm text-accent"
        >
          resume.pdf ↗
        </a>
      </div>
    </div>
  );
}
