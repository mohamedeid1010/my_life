import { useState, useEffect, useRef } from 'react';
import { Activity, Target, Dumbbell, Calendar, Moon, ChevronUp, ChevronDown, Check, ArrowRight, Globe } from 'lucide-react';
import { t } from '../config/translations';
import usePreferences from '../hooks/usePreferences';

const ICON_MAP = { Activity, Dumbbell, Target, Calendar, Moon };

const PAGE_DESCRIPTIONS = {
  en: {
    overview: 'A complete snapshot of your daily activity, goals, and achievements.',
    habits: 'Build and track daily habits with streaks, analytics, and smart reminders.',
    gym: 'Log workouts, track body stats, and follow your fitness systems.',
    planner: 'Plan your week with tasks and priorities to stay organized.',
    salah: 'Track your daily prayers and never miss a salah.',
  },
  ar: {
    overview: 'ملخص شامل لنشاطك اليومي، أهدافك، والإنجازات.',
    habits: 'ابني وتتبع عاداتك اليومية مع سلاسل الإنجاز والتحليلات.',
    gym: 'سجل تمارينك، تتبع إحصائيات جسمك، واتبع نظامك الرياضي.',
    planner: 'خطط أسبوعك بالمهام والأولويات وابقَ منظمًا.',
    salah: 'تتبع صلواتك اليومية وما تفوتش صلاة.',
  },
};

const PAGE_EMOJIS = {
  overview: '📊',
  habits: '✅',
  gym: '🏋️',
  planner: '📅',
  salah: '🕌',
};

/* ═══════════════════════════════════════════════════
   STEP 1 — Epic Welcome Splash Animation
   ═══════════════════════════════════════════════════ */
function WelcomeSplash({ onContinue }) {
  const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=particles, 3=ready
  const canvasRef = useRef(null);

  // Phase progression
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: Math.random() * 2.5 + 0.5,
        color: ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#a78bfa'][Math.floor(Math.random() * 5)],
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: '#0a0a14' }}>
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Gradient orbs */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            animation: 'onb-pulse 4s ease-in-out infinite',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
            animation: 'onb-float 6s ease-in-out infinite',
          }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
            animation: 'onb-float 8s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {/* Logo with glow */}
        <div
          className="relative transition-all duration-1000 ease-out"
          style={{
            opacity: phase >= 0 ? 1 : 0,
            transform: phase >= 0 ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(30px)',
          }}
        >
          {/* Glow ring */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              filter: 'blur(25px)',
              opacity: phase >= 1 ? 0.4 : 0,
              transform: 'scale(1.5)',
              transition: 'opacity 1s ease',
            }}
          />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex items-center justify-center p-3 border border-white/10 backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))',
              boxShadow: '0 20px 60px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <img src="/horizon-logo.png" alt="Horizon" className="w-full h-full object-contain brightness-125 drop-shadow-2xl" />
          </div>
        </div>

        {/* App name with reveal */}
        <div
          className="text-center transition-all duration-1000 ease-out"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <h1
            className="text-5xl sm:text-7xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%',
              animation: 'onb-gradient 4s ease infinite',
            }}
          >
            Horizon
          </h1>
        </div>

        {/* Tagline */}
        <p
          className="text-base sm:text-lg font-medium text-center max-w-xs transition-all duration-1000 ease-out"
          style={{
            color: 'rgba(255,255,255,0.5)',
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'translateY(0)' : 'translateY(15px)',
          }}
        >
          Your life, tracked & elevated.
        </p>

        {/* Animated line */}
        <div
          className="h-px transition-all duration-1000 ease-out"
          style={{
            width: phase >= 2 ? '200px' : '0px',
            background: 'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, transparent)',
          }}
        />

        {/* CTA Button */}
        <button
          onClick={onContinue}
          className="mt-4 px-10 py-4 rounded-2xl font-bold text-white text-base flex items-center gap-3 transition-all duration-700 ease-out hover:scale-105 active:scale-95"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(20px)',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            boxShadow: '0 10px 40px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <span>Get Started</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Bottom dots indicator */}
      <div
        className="absolute bottom-8 flex gap-2 transition-all duration-500"
        style={{ opacity: phase >= 3 ? 1 : 0 }}
      >
        <div className="w-6 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 2 — Language Selection
   ═══════════════════════════════════════════════════ */
function LanguageStep({ onSelect }) {
  const [picked, setPicked] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const handlePick = (lang) => {
    setPicked(lang);
    setTimeout(() => onSelect(lang), 400);
  };

  const LANGS = [
    {
      id: 'en',
      flag: '🇬🇧',
      label: 'English',
      desc: 'Continue in English',
      dir: 'LTR',
    },
    {
      id: 'ar',
      flag: '🇪🇬',
      label: 'العربية',
      desc: 'كمّل بالعربي',
      dir: 'RTL',
    },
  ];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-4" style={{ background: '#0a0a14' }}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
        />
      </div>

      <div
        className="relative z-10 w-full max-w-md space-y-8 transition-all duration-700 ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
              border: '1px solid rgba(139,92,246,0.2)',
              boxShadow: '0 10px 40px rgba(139,92,246,0.15)',
            }}
          >
            <Globe size={28} className="text-violet-400" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Choose Your Language</h2>
          <p className="text-sm text-white/40 font-medium">اختار لغة التطبيق</p>
        </div>

        {/* Language cards */}
        <div className="space-y-4">
          {LANGS.map((lang, i) => {
            const isActive = picked === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => handlePick(lang.id)}
                className="w-full group relative flex items-center gap-5 p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: isActive ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))'
                    : 'rgba(255,255,255,0.02)',
                  boxShadow: isActive ? '0 10px 40px rgba(139,92,246,0.2)' : 'none',
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                {/* Flag */}
                <span className="text-5xl transition-transform group-hover:scale-110">{lang.flag}</span>
                
                {/* Text */}
                <div className="flex-1 text-left">
                  <span className="text-lg font-black text-white block">{lang.label}</span>
                  <span className="text-xs text-white/40 font-medium">{lang.desc}</span>
                </div>

                {/* Direction badge */}
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-widest"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {lang.dir}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                  >
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom dots indicator */}
      <div className="absolute bottom-8 flex gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <div className="w-6 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 3 — Page Selection & Order
   ═══════════════════════════════════════════════════ */
function PagesStep({ allNavPages, lang, onComplete }) {
  const L = lang;
  const isAr = L === 'ar';
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const [selected, setSelected] = useState(() =>
    allNavPages.map(p => ({ id: p.id, visible: true }))
  );

  const togglePage = (id) => {
    setSelected(prev => {
      const visibleCount = prev.filter(p => p.visible).length;
      const item = prev.find(p => p.id === id);
      if (item?.visible && visibleCount <= 1) return prev;
      return prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p);
    });
  };

  const moveItem = (index, direction) => {
    const newArr = [...selected];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newArr.length) return;
    [newArr[index], newArr[swapIndex]] = [newArr[swapIndex], newArr[index]];
    setSelected(newArr);
  };

  const visibleCount = selected.filter(p => p.visible).length;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-auto px-4 py-8"
      style={{ background: '#0a0a14', color: 'var(--text-primary, #fff)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
      </div>

      <div
        className="relative z-10 w-full max-w-lg space-y-6 transition-all duration-700 ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
            {isAr ? '٣ من ٣' : '3 of 3'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {isAr ? 'اختار صفحاتك' : 'Choose Your Pages'}
          </h1>
          <p className="text-sm text-white/40 max-w-sm mx-auto">
            {isAr
              ? 'اختار الصفحات اللي عايز تتبعها ورتبهم زي ما تحب.'
              : 'Pick the pages you want and arrange the order.'}
          </p>
        </div>

        {/* Pages list */}
        <div className="space-y-3">
          {selected.map((item, idx) => {
            const pageDef = allNavPages.find(p => p.id === item.id);
            if (!pageDef) return null;
            const isVisible = item.visible;
            const desc = PAGE_DESCRIPTIONS[L]?.[item.id] || PAGE_DESCRIPTIONS.en[item.id] || '';
            const emoji = PAGE_EMOJIS[item.id] || '📄';

            return (
              <div
                key={item.id}
                onClick={() => togglePage(item.id)}
                className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  isVisible ? 'shadow-lg' : 'opacity-40 hover:opacity-60'
                }`}
                style={{
                  background: isVisible ? 'rgba(139,92,246,0.06)' : 'rgba(0,0,0,0.2)',
                  borderColor: isVisible ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)',
                  animationDelay: `${idx * 80}ms`,
                }}
              >
                {/* Checkbox */}
                <div
                  className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 transition-all ${
                    isVisible ? 'shadow-sm' : 'border border-white/10'
                  }`}
                  style={{ background: isVisible ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent' }}
                >
                  {isVisible && <Check size={14} className="text-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{emoji}</span>
                    <span className="text-sm font-bold text-white">
                      {t(pageDef.labelKey, L)}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                </div>

                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 disabled:opacity-20 transition-all"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <span className="text-[10px] text-center font-bold text-white/30">{idx + 1}</span>
                  <button
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === selected.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 disabled:opacity-20 transition-all"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Count */}
        <div className="text-center">
          <span className="text-xs text-white/30">
            {isAr ? `${visibleCount} صفحات مختارة` : `${visibleCount} pages selected`}
          </span>
        </div>

        {/* Finish button */}
        <button
          onClick={() => onComplete(selected)}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            boxShadow: '0 10px 40px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          {isAr ? 'يلا نبدأ' : "Let's Go"}
          <ArrowRight size={18} className={isAr ? 'rotate-180' : ''} />
        </button>

        <p className="text-center text-[10px] text-white/20">
          {isAr ? 'تقدر تعدل من الإعدادات في أي وقت' : 'You can change this anytime in Settings'}
        </p>
      </div>

      {/* Bottom dots */}
      <div className="absolute bottom-8 flex gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <div className="w-6 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Onboarding — 3 Steps
   ═══════════════════════════════════════════════════ */
export default function OnboardingSetup({ allNavPages, onComplete }) {
  const { updateLanguage } = usePreferences();
  const [step, setStep] = useState(0); // 0=splash, 1=language, 2=pages
  const [chosenLang, setChosenLang] = useState('en');

  const handleLangSelect = (lang) => {
    setChosenLang(lang);
    updateLanguage(lang);
    setStep(2);
  };

  const handlePagesComplete = (navConfig) => {
    onComplete(navConfig);
  };

  return (
    <>
      {/* Global onboarding animations */}
      <style>{`
        @keyframes onb-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.25; }
        }
        @keyframes onb-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(3deg); }
        }
        @keyframes onb-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {step === 0 && <WelcomeSplash onContinue={() => setStep(1)} />}
      {step === 1 && <LanguageStep onSelect={handleLangSelect} />}
      {step === 2 && (
        <PagesStep
          allNavPages={allNavPages}
          lang={chosenLang}
          onComplete={handlePagesComplete}
        />
      )}
    </>
  );
}
