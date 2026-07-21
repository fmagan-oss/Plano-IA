import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { LocaleProvider } from './lib/i18n';

export const metadata: Metadata = {
  title: 'CatPilot — Le category management assisté, du fichier au planogramme',
  description:
    "CatPilot transforme un export panel (Nielsen/Circana) en plan de masse, planogramme au facing et trame de présentation acheteur. Blocs par marque, détection des nouveautés, 4 variantes stratégiques.",
  metadataBase: new URL('https://catpilot.app'),
  openGraph: {
    title: 'CatPilot — Category management assisté',
    description:
      'Du fichier panel au planogramme au facing en quelques secondes. Plan de masse, blocs marque, nouveautés, trame acheteur.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <LocaleProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
