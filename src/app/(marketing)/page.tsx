import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <div className="flex min-h-full flex-col bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_55%),hsl(var(--background))]">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="font-semibold tracking-tight">BIR EIS</span>
          <nav className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-1 flex-col justify-center gap-6 px-4 py-24">
        <p className="text-sm font-medium text-primary">BIR EIS Middleware</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Electronic invoicing middleware for BIR EIS compliance
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Map ERP, manual, and API invoice data to BIR-ready JSON, sign with JWS,
          and transmit to EIS Cert or production—with multi-tenant access control
          built in.
        </p>
        <div className="flex gap-3">
          <Button size="lg" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">Create organization</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
