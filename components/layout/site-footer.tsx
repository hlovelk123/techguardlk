export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row">
        <p className="text-center sm:text-left">© {new Date().getFullYear()} TechGuard Subscriptions.</p>
        <div className="flex items-center gap-4">
          <a className="transition hover:text-foreground" href="#">Privacy</a>
          <a className="transition hover:text-foreground" href="#">Terms</a>
          <a className="transition hover:text-foreground" href="mailto:support@example.com">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
