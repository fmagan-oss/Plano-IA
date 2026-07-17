import type { Metadata } from 'next';
import './globals.css';
import { ProProvider } from './providers';
import Header from './components/Header';

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
        <ProProvider>
          <Header />
          <main>{children}</main>
          <footer className="site-footer">
            <div className="footer-inner">
              <span>© {new Date().getFullYear()} CatPilot — Category management assisté.</span>
              <span className="footer-links">
                <a href="/#offres">Offres</a>
                <a href="/app">Application</a>
                <a href="mailto:contact@catpilot.app">Contact</a>
              </span>
            </div>
          </footer>
        </ProProvider>
      </body>
    </html>
  );
}
