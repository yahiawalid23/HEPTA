import Link from "next/link";
import { useRouter } from "next/router";
import { useLang } from "@/utils/i18n";

export default function AppHeader() {
  const { lang, setLang } = useLang();
  const router = useRouter();
  const isProducts = router.pathname === "/products";
  const logoClass = isProducts ? "h-24 w-auto" : "h-12 w-auto";

  return (
    <header className="w-full" style={{ backgroundColor: '#282D31' }}>
      <div className="relative max-w-6xl mx-auto px-4 py-2 flex items-center justify-center">
        {/* Language toggle positioned to L (EN) or R (AR) */}
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className={`absolute top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg border text-sm hover:bg-white/10 transition ${lang === 'ar' ? 'right-4' : 'left-4'} text-white border-white/40`}
          title={lang === 'ar' ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
        >
          {lang === 'ar' ? 'AR' : 'EN'}
        </button>

        {/* Centered Logo/Banner */}
        <img
          src="/shop-banner.svg"
          alt="Logo"
          className={logoClass}
        />

        {/* Invisible global animation target near the opposite side of the toggle */}
        <span
          id="cart-target"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'left-6' : 'right-6'} w-3 h-3 rounded-full opacity-0`}
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
