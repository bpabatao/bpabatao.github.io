import Link from "next/link";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/#work", label: "work" },
  { href: "/#projects", label: "projects" },
  { href: "/#stack", label: "stack" },
  { href: "/#contact", label: "contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-mono text-sm text-ink">
          <span className="text-accent">~/</span>bpabatao
        </Link>
        <nav className="flex items-center gap-5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="link-sweep hidden font-mono text-xs text-muted transition-colors hover:text-accent sm:block"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          <MobileMenu links={nav} />
        </nav>
      </div>
    </header>
  );
}
