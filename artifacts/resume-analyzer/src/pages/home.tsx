import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, FileSearch, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={`${basePath}/logo.svg`} alt="Logo" className="w-8 h-8 text-primary" />
          <span className="font-bold text-xl tracking-tight">ResuMatch</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <section className="w-full max-w-5xl px-6 py-24 md:py-32 flex flex-col items-center text-center gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Precision</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground max-w-3xl leading-tight">
            Stop guessing. Start <span className="text-primary">matching.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Get instant, recruiter-grade feedback on your resume and find the exact jobs you're qualified for. No sugarcoating, just actionable data.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 text-base">
                Analyze My Resume <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="w-full bg-card border-y py-20 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Deep Analysis</h3>
              <p className="text-muted-foreground">
                We parse every line to extract your true skill profile, identifying gaps before the ATS does.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">ATS Readiness</h3>
              <p className="text-muted-foreground">
                Get a clear score of how your resume will perform in standard Applicant Tracking Systems.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Precision Matching</h3>
              <p className="text-muted-foreground">
                Compare your extracted profile against thousands of live jobs to find your highest probability matches.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm border-t">
        <p>&copy; {new Date().getFullYear()} ResuMatch. All rights reserved.</p>
      </footer>
    </div>
  );
}
