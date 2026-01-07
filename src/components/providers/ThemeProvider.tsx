'use client';

import { useEffect } from 'react';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Add dark class to html element after hydration
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-scroll-behavior', 'smooth');
  }, []);

  return <>{children}</>;
}
