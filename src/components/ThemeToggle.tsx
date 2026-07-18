"use client";

/* Label/icon swap is pure CSS (light: variant) - no state, no hydration flicker */
export function ThemeToggle() {
  const toggle = () => {
    const light = document.documentElement.classList.toggle("light");
    localStorage.setItem("theme", light ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className="flex cursor-pointer items-center gap-2 rounded-sm border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <svg className="light:hidden" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
      </svg>
      <svg className="hidden light:block" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <span className="light:hidden">light mode</span>
      <span className="hidden light:inline">dark mode</span>
    </button>
  );
}
