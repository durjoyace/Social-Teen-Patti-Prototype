import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Coins,
  Eye,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';

interface FirstGameExperienceProps {
  username: string;
  onComplete: () => void;
}

const lessons = [
  {
    title: 'This is practice.',
    body: 'Take a quiet look at the table before your friends arrive. Nothing in this lesson starts a real room or earns Club Points.',
    note: 'Practice uses play chips only. They cannot be bought, wagered for money, or cashed out.',
  },
  {
    title: 'Three decisions carry the hand.',
    body: 'You can see your cards, match the current play, or leave the hand. The table always names the result before you act.',
    note: 'Variant-specific options appear only when the server says they are available.',
  },
  {
    title: 'The server runs the real table.',
    body: 'The server shuffles, deals, validates every action, and keeps every player on the same table state.',
    note: 'A turn lasts 30 seconds. At 10 and 5 seconds you are warned; at zero, the server packs the hand automatically.',
  },
];

export function FirstGameExperience({ username, onComplete }: FirstGameExperienceProps) {
  const [step, setStep] = useState(0);
  const lesson = lessons[step];
  const isLast = step === lessons.length - 1;

  const advance = () => {
    if (isLast) onComplete();
    else setStep((value) => value + 1);
  };

  return (
    <main className="practice-onboarding h-full overflow-y-auto text-[#FFFBEA]">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 pb-6 sm:px-7 lg:px-10">
        <header className="flex min-h-[76px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="brand-mark" aria-hidden="true">TP</div>
            <div>
              <p className="font-display text-lg font-bold">Teen Patti Social</p>
              <p className="text-xs text-[#AFC2B8]">Guided practice · step {step + 1} of {lessons.length}</p>
            </div>
          </div>
          <button type="button" onClick={onComplete} className="text-button">Skip practice</button>
        </header>

        <div className="grid flex-1 items-center gap-8 py-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.72fr)] lg:gap-12">
          <section className="practice-table-shell" aria-label="Illustrative practice table">
            <div className="practice-table-felt">
              <div className="practice-seat practice-seat--top"><UserRound className="h-6 w-6" /><span>Practice seat</span></div>
              <div className="practice-seat practice-seat--left"><UserRound className="h-6 w-6" /><span>Practice seat</span></div>
              <div className="practice-seat practice-seat--right"><UserRound className="h-6 w-6" /><span>Practice seat</span></div>

              <div className="practice-table-copy">
                {step === 0 && (
                  <div className="practice-card-fan" aria-hidden="true">
                    <span /><span /><span />
                  </div>
                )}
                {step === 1 && (
                  <div className="practice-actions" aria-label="Example table actions">
                    <span><Eye className="h-5 w-5" /> See cards</span>
                    <span><Coins className="h-5 w-5" /> Chaal</span>
                    <span><XCircle className="h-5 w-5" /> Pack</span>
                  </div>
                )}
                {step === 2 && (
                  <div className="practice-verification">
                    <ShieldCheck className="h-10 w-10" />
                    <strong>Server dealt</strong>
                    <span><Check className="h-4 w-4" /> Table state verified</span>
                    <span><Clock3 className="h-4 w-4" /> 30-second turn</span>
                  </div>
                )}
              </div>

              <div className="practice-player-seat">
                <span>{username[0]?.toUpperCase() || 'Y'}</span>
                <strong>You</strong>
              </div>
            </div>
          </section>

          <section aria-live="polite" className="py-2">
            <motion.div
              key={step}
              initial={{ opacity: 0.55, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="max-w-xl font-display text-[2.75rem] font-black leading-[0.98] tracking-[-0.035em] text-[#FFFBEA] sm:text-5xl lg:text-6xl">{lesson.title}</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#C7D8CF]">{lesson.body}</p>
              <div className="mt-7 flex items-start gap-3 rounded-[14px] bg-[#101B17] p-4 shadow-[inset_0_0_0_1px_#344A3F]">
                {step === 2 ? <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#E0BD76]" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#E0BD76]" />}
                <p className="text-sm leading-6 text-[#B7C9C0]">{lesson.note}</p>
              </div>
            </motion.div>

            <div className="mt-9 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                disabled={step === 0}
                className="utility-button utility-button--secondary max-w-[116px] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button type="button" onClick={advance} className="utility-button utility-button--primary max-w-xs">
                {isLast ? 'Open the clubhouse' : 'Continue'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex gap-2" aria-label={`Step ${step + 1} of ${lessons.length}`}>
              {lessons.map((_, index) => (
                <span key={index} className={index === step ? 'h-1.5 w-10 rounded-full bg-[#D59F3E]' : 'h-1.5 w-4 rounded-full bg-[#344A3F]'} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
