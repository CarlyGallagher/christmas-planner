'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
  pendingRequestsCount: number | null;
}

export function MobileNav({ pendingRequestsCount }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/wishlists', label: 'Wishlists' },
    { href: '/dashboard/calendar', label: 'Calendar' },
    { href: '/dashboard/friends', label: 'Friends', badge: pendingRequestsCount },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-16 left-0 right-0 bg-white border-b shadow-lg z-50 md:hidden">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-green-50 text-green-600 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge !== null && link.badge !== undefined && link.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
