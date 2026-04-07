import RandomGrouper from "./components/RandomGrouper";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1">
        <RandomGrouper />
      </main>

      <footer className="border-t border-foreground/5 py-6 px-4 text-center no-print">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-foreground/40">
          <span className="font-medium">&copy; 2026 ToolboxLite</span>
          <span className="hidden sm:inline">&middot;</span>
          <Link
            href="/privacy"
            className="hover:text-violet-primary transition-colors py-3 min-h-[44px] inline-flex items-center"
          >
            隐私政策
          </Link>
          <Link
            href="/terms"
            className="hover:text-violet-primary transition-colors py-3 min-h-[44px] inline-flex items-center"
          >
            服务条款
          </Link>
        </div>
      </footer>
    </div>
  );
}
