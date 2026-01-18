import { cn } from '../utils/cn';

export type TableTheme = 'classic' | 'royal' | 'neon' | 'diwali' | 'ocean';

interface ThemeConfig {
  name: string;
  feltGradient: string;
  feltTexture: string;
  borderColor: string;
  rimColor: string;
  accentColor: string;
  glowColor: string;
  backgroundColor: string;
}

export const TABLE_THEMES: Record<TableTheme, ThemeConfig> = {
  classic: {
    name: 'Classic Green',
    feltGradient: 'from-green-800 via-green-900 to-green-950',
    feltTexture: 'opacity-30',
    borderColor: 'border-yellow-700/80',
    rimColor: 'from-yellow-900 to-yellow-800',
    accentColor: 'text-yellow-400',
    glowColor: 'shadow-green-500/20',
    backgroundColor: 'from-gray-900 via-gray-900 to-black'
  },
  royal: {
    name: 'Royal Purple',
    feltGradient: 'from-purple-900 via-purple-950 to-indigo-950',
    feltTexture: 'opacity-20',
    borderColor: 'border-gold-500/80',
    rimColor: 'from-amber-800 to-amber-900',
    accentColor: 'text-amber-400',
    glowColor: 'shadow-purple-500/30',
    backgroundColor: 'from-purple-950 via-gray-900 to-black'
  },
  neon: {
    name: 'Neon Nights',
    feltGradient: 'from-gray-900 via-gray-950 to-black',
    feltTexture: 'opacity-10',
    borderColor: 'border-cyan-500/60',
    rimColor: 'from-cyan-900 to-blue-900',
    accentColor: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/40',
    backgroundColor: 'from-gray-950 via-blue-950/50 to-black'
  },
  diwali: {
    name: 'Diwali Special',
    feltGradient: 'from-red-900 via-orange-950 to-red-950',
    feltTexture: 'opacity-25',
    borderColor: 'border-yellow-500/70',
    rimColor: 'from-yellow-700 to-orange-800',
    accentColor: 'text-yellow-300',
    glowColor: 'shadow-orange-500/30',
    backgroundColor: 'from-red-950 via-orange-950/50 to-black'
  },
  ocean: {
    name: 'Ocean Blue',
    feltGradient: 'from-blue-900 via-blue-950 to-slate-950',
    feltTexture: 'opacity-20',
    borderColor: 'border-sky-500/50',
    rimColor: 'from-slate-700 to-slate-800',
    accentColor: 'text-sky-400',
    glowColor: 'shadow-blue-500/30',
    backgroundColor: 'from-slate-900 via-blue-950/50 to-black'
  }
};

interface GameTableSurfaceProps {
  theme: TableTheme;
  children: React.ReactNode;
  className?: string;
}

export function GameTableSurface({ theme, children, className }: GameTableSurfaceProps) {
  const config = TABLE_THEMES[theme];

  return (
    <div className={cn(
      'relative w-full max-w-md aspect-[4/5] rounded-[60px] overflow-hidden',
      config.glowColor,
      className
    )}>
      {/* Felt surface */}
      <div className={cn('absolute inset-0 bg-gradient-to-b', config.feltGradient)} />

      {/* Felt texture */}
      <div className={cn('absolute inset-0', config.feltTexture)}>
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px'
        }} />
      </div>

      {/* Ambient light effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />

      {/* Wood rim border */}
      <div className={cn(
        'absolute inset-0 rounded-[60px] border-[12px]',
        config.borderColor
      )}>
        <div className={cn(
          'absolute inset-0 rounded-[48px] border-4 border-white/10'
        )} />
      </div>

      {/* Inner decoration ring */}
      <div className="absolute inset-8 rounded-[40px] border border-white/10" />

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}

// Theme selector component
interface ThemeSelectorProps {
  currentTheme: TableTheme;
  onSelect: (theme: TableTheme) => void;
}

export function ThemeSelector({ currentTheme, onSelect }: ThemeSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide p-2">
      {(Object.keys(TABLE_THEMES) as TableTheme[]).map((theme) => {
        const config = TABLE_THEMES[theme];
        const isSelected = currentTheme === theme;

        return (
          <button
            key={theme}
            onClick={() => onSelect(theme)}
            className={cn(
              'flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden transition-all',
              'ring-2 ring-offset-2 ring-offset-black',
              isSelected ? 'ring-yellow-500 scale-105' : 'ring-transparent hover:ring-white/30'
            )}
          >
            <div className={cn('w-full h-full bg-gradient-to-br', config.feltGradient)}>
              <div className="w-full h-full flex items-center justify-center">
                <span className={cn('text-xs font-medium', config.accentColor)}>
                  {config.name.split(' ')[0]}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
