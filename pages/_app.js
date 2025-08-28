import "@/styles/globals.css";
import { LanguageProvider } from "@/utils/i18n";
import AppHeader from "@/components/AppHeader";

export default function App({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <AppHeader />
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
