import './globals.css';

export const metadata = {
  title: 'SkyRush — Demo de vuelo',
  description: 'Simulador de juego crash con créditos ficticios y rondas en tiempo real.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
