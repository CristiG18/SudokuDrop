import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="min-h-screen flex flex-col px-6 pt-6">
      <Link to="/" className="soft-card w-10 h-10 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="jewel-panel p-6 max-w-sm">
          <h1 className="text-2xl font-black mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground">{blurb}</p>
          <p className="text-xs text-muted-foreground mt-4">Coming in Phase 2 ✨</p>
        </div>
      </div>
    </div>
  );
}
