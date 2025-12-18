"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, FishSymbol, LogOut, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth-actions"; 
import { useFormStatus } from "react-dom";

function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <Button 
      variant="ghost" 
      type="submit" 
      size="sm" 
      className="text-muted-foreground hover:text-red-500"
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </Button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  const isActive = (path: string) => pathname === path;

  // Don't show navbar on login page
  if (pathname === "/login") return null;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center px-4 sm:px-6 max-w-[1800px] mx-auto">
        {/* Logo area */}
        <div className="flex items-center gap-2 font-bold text-lg sm:text-xl mr-4 sm:mr-8">
          <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
            <FishSymbol className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="hidden sm:inline">Grand Koi</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium">
          <Link
            href="/"
            className={`transition-colors hover:text-primary whitespace-nowrap ${
              isActive("/") ? "text-foreground font-bold" : "text-muted-foreground"
            }`}
          >
            <span className="hidden sm:inline">Single Upload</span>
            <span className="sm:hidden">Single</span>
          </Link>
          <Link
            href="/bulk"
            className={`transition-colors hover:text-primary whitespace-nowrap ${
              isActive("/bulk") ? "text-foreground font-bold" : "text-muted-foreground"
            }`}
          >
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Bulk</span>
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-9 w-9"
          >
            <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <div className="w-px h-6 bg-border mx-1"></div>

          {/* Logout Button */}
          <form action={logoutAction}>
            <LogoutButton />
          </form>
        </div>
      </div>
    </nav>
  );
}