import { Link, useLocation } from "wouter";
import { 
  ClipboardList, 
  Truck, 
  ChefHat, 
  UtensilsCrossed, 
  Factory, 
  Search, 
  Siren, 
  Users, 
  Settings,
  LogOut,
  Menu,
  History,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Daily Log", icon: ClipboardList, href: "/" },
  { label: "Inventory & Receiving", icon: Truck, href: "/inventory" },
  { label: "Dough Batches", icon: ChefHat, href: "/dough" },
  { label: "Filling Batches", icon: UtensilsCrossed, href: "/filling" },
  { label: "Production Runs", icon: Factory, href: "/production" },
  { label: "Product Catalog", icon: BookOpen, href: "/catalog" },
  { label: "Traceability", icon: Search, href: "/trace" },
  { label: "Recall Test", icon: Siren, href: "/recall" },
  { label: "Users", icon: Users, href: "/users" },
  { label: "Audit Log", icon: History, href: "/audit" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border/50">
        <h1 className="text-2xl font-display font-bold tracking-tight text-sidebar-primary-foreground">
          BOCA<span className="text-sidebar-primary">BAKERY</span>
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1 uppercase tracking-widest">Production Log</p>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a 
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-sidebar-primary text-white shadow-md shadow-orange-900/20" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-sidebar-foreground/60 group-hover:text-white")} />
                {item.label}
              </a>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50 mb-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-white">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Production Mgr</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed left-0 top-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar z-40 flex items-center px-4 border-b border-sidebar-border shadow-md">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-sidebar-accent">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-sidebar-border">
            <NavContent />
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-display font-bold text-lg text-white">BOCA BAKERY</span>
      </div>
    </>
  );
}
