import Link from "next/link";
import Logo from "~/components/Logo";
import { ThemeToggle } from "~/components/ThemeToggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone dark:border-border bg-white dark:bg-background sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Logo width={140} />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-charcoal dark:text-foreground">
            <Link href="/about" className="hover:text-olive dark:hover:text-olive-light transition-colors">About</Link>
            <Link href="/team" className="hover:text-olive dark:hover:text-olive-light transition-colors">Team</Link>
            <Link href="/programs" className="hover:text-olive dark:hover:text-olive-light transition-colors">Programs</Link>
            <Link href="/contact" className="hover:text-olive dark:hover:text-olive-light transition-colors">Contact</Link>
            <Link
              href="/donate"
              className="rounded-full bg-olive px-5 py-2 text-white hover:bg-olive-dark transition-colors"
            >
              Donate
            </Link>
            <ThemeToggle />
          </nav>
          {/* Mobile nav toggle placeholder */}
          <button className="md:hidden text-charcoal dark:text-foreground" aria-label="Open menu">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-charcoal text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <Logo width={120} />
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                Workforce Development — creating meaningful employment for those in recovery.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Navigate</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-olive-light transition-colors">About</Link></li>
                <li><Link href="/team" className="hover:text-olive-light transition-colors">Team</Link></li>
                <li><Link href="/programs" className="hover:text-olive-light transition-colors">Programs</Link></li>
                <li><Link href="/donate" className="hover:text-olive-light transition-colors">Donate</Link></li>
                <li><Link href="/contact" className="hover:text-olive-light transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Get in Touch</h3>
              <p className="mt-3 text-sm">
                <a href="mailto:trellis.wd@gmail.com" className="hover:text-olive-light transition-colors">
                  trellis.wd@gmail.com
                </a>
              </p>
              <p className="mt-1 text-sm text-gray-400">Sunbury, PA</p>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Trellis Workforce Development. 501(c)(3) pending.
          </div>
        </div>
      </footer>
    </div>
  );
}
