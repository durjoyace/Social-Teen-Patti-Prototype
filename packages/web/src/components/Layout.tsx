interface LayoutProps {
  children: React.ReactNode;
  wide?: boolean;
}

export function Layout({ children, wide = false }: LayoutProps) {
  return (
    <main className="h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-[#07110E] text-[#F6ECD8]">
      <div className={wide ? 'h-full w-full' : 'mx-auto h-full w-full max-w-2xl border-x border-white/5'}>
        {children}
      </div>
    </main>
  );
}
