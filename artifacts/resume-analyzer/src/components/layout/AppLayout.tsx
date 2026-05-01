import { Link, useLocation } from "wouter";
import { UserButton, useUser, Show } from "@clerk/react";
import { 
  FileText, 
  LayoutDashboard, 
  UploadCloud, 
  Briefcase,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload Resume", icon: UploadCloud },
  { href: "/jobs", label: "Job Matches", icon: Briefcase },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const NavItems = () => (
    <>
      {NAV_LINKS.map((link) => {
        const isActive = location === link.href || location.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Navbar */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 border-b bg-card">
        <Link href="/dashboard">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src={`${basePath}/logo.svg`} alt="Logo" className="w-8 h-8 text-primary" />
            <span className="font-bold text-lg">ResuMatch</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <UserButton />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-12 flex flex-col gap-2">
              <NavItems />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="p-6">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={`${basePath}/logo.svg`} alt="Logo" className="w-8 h-8 text-primary" />
              <span className="font-bold text-xl tracking-tight">ResuMatch</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1.5">
          <NavItems />
        </nav>
        <div className="p-4 border-t flex items-center gap-3">
          <UserButton />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">My Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
