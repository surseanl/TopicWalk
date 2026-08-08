"use client";

import { Camera, Home, ImageIcon, User, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/camera", label: "Camera", icon: Camera },
  { href: "/photos", label: "Photos", icon: ImageIcon },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:block border-b border-border bg-background sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-6 px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/image-1786109910251.png"
              alt="TopicWalk"
              height={48}
              width={210}
              className="object-contain -ml-4"
              priority
            />
          </Link>
          <div className="flex gap-1 ml-4">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname === href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile top bar — logo only */}
      <nav className="md:hidden border-b border-border bg-background sticky top-0 z-40">
        <div className="flex h-12 items-center justify-center px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/image-1786109910251.png"
              alt="TopicWalk"
              height={48}
              width={210}
              className="object-contain -ml-4"
              priority
            />
          </Link>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background">
        <div className="grid grid-cols-5 h-16">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", href === "/camera" && "h-6 w-6")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
