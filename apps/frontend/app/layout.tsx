import './globals.css';

export const metadata = {
  title: 'SkyRush — Vuelo en tiempo real',
  description: 'Juego de cohete crash en tiempo real con créditos de práctica.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
