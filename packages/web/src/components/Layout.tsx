interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <main className="h-full w-full bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white overflow-hidden">
      <div className="mx-auto h-full w-full max-w-2xl border-x border-white/5">
        {children}
      </div>
    </main>
  );
}
