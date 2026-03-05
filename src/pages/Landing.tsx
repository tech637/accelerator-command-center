import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Users,
  FileCheck,
  BarChart3,
  Building2,
  Rocket,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Cohort & Batch Management",
    description: "Run multiple cohorts simultaneously. Track startups from application to graduation with health scores and milestone tracking.",
  },
  {
    icon: FileCheck,
    title: "Application Pipeline",
    description: "Custom form builder, automated review workflows, and centralized response management. No more spreadsheets.",
  },
  {
    icon: BarChart3,
    title: "Portfolio Analytics",
    description: "Revenue tracking, cohort benchmarks, flagged startups, and LP-ready reports. Data that drives decisions.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Admin, program manager, and mentor roles. Control who sees what. Built for team collaboration.",
  },
];

const useCases = [
  {
    icon: Rocket,
    title: "Accelerators",
    description: "Time-bound programs, equity cohorts, demo days. Manage applications, mentors, and portfolio health at scale.",
  },
  {
    icon: Building2,
    title: "Incubators",
    description: "Longer programs, residency models, early-stage support. Track milestones, runway, and founder progress.",
  },
];

const benefits = [
  "Deploy in days, not months",
  "White-label ready for your brand",
  "No engineering required",
  "Scales from 10 to 500+ startups",
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goToLogin = () => navigate("/login");
  const goToDashboard = () => {
    sessionStorage.setItem("fromLanding", "true");
    navigate("/accelerator/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Zap className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">EERA Command Center</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Use Cases</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          </nav>
          {isAuthenticated ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={goToDashboard}>
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToLogin}>Log in</Button>
              <Button size="sm" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={goToLogin}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 pt-24 pb-20 md:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--accent)/0.12),transparent)]" />
        <div className="flex max-w-4xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            The all-in-one platform for accelerator & incubator programs
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Run your program.
            <span className="block text-accent">Scale your impact.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            EERA Command Center is a third-party SaaS platform built for accelerators and incubators. 
            Manage applications, cohorts, and portfolio—without building custom software.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            {isAuthenticated ? (
              <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={goToDashboard}>
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={goToLogin}>
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={goToLogin}>
                  Request demo
                </Button>
              </>
            )}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {benefits.map((benefit) => (
              <span key={benefit} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                {benefit}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases - Accelerator & Incubator */}
      <section id="use-cases" className="border-y bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for both
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether you run an accelerator or incubator, one platform fits your workflow.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {useCases.map((useCase) => (
              <Card key={useCase.title} className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex h-16 w-full items-center justify-center bg-accent/10 p-6 md:w-32 md:flex-col md:justify-center">
                      <useCase.icon className="h-10 w-10 text-accent" />
                      <span className="mt-2 font-semibold text-foreground md:block">{useCase.title}</span>
                    </div>
                    <div className="flex-1 p-6">
                      <p className="text-sm text-muted-foreground">{useCase.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need. Nothing you don't.
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete toolkit for program managers. Deploy as a third-party solution—no custom dev required.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 transition-colors hover:border-accent/50 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 text-center shadow-sm md:p-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Ready to run your program better?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join accelerators and incubators who use EERA Command Center to scale their operations.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              {isAuthenticated ? (
                <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={goToDashboard}>
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={goToLogin}>
                    Start free trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={goToLogin}>
                    Request demo
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <span className="font-semibold text-foreground">EERA Command Center</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>Accelerator & Incubator Management</span>
              <span>•</span>
              <span>Third-Party SaaS</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t flex flex-col gap-4 md:flex-row md:justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EERA Command Center. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              A B2B platform for startup accelerators and incubators. Deploy, customize, and scale your program operations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
