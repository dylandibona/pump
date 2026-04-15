import type { Metadata, Viewport } from 'next';
import { Monoton, Pacifico, Space_Mono, Outfit } from 'next/font/google';
import './globals.css';

// Monoton — brand mark ONLY (retrowave header "PUMP" title). Never below the
// scene. Single weight.
const monoton = Monoton({
  weight: '400',
  variable: '--font-monoton',
  subsets: ['latin'],
  display: 'swap',
});

// Pacifico — session names and primary CTA. Personality layer. Single weight.
const pacifico = Pacifico({
  weight: '400',
  variable: '--font-pacifico',
  subsets: ['latin'],
  display: 'swap',
});

// Space Mono — all numerical/data display (weights, reps, tags, timestamps).
const spaceMono = Space_Mono({
  weight: ['400', '700'],
  variable: '--font-space-mono',
  subsets: ['latin'],
  display: 'swap',
});

// Outfit — all UI text (exercise names at 800, labels at 700, body copy).
const outfit = Outfit({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pump - Workout Tracker',
  description: "Dylan's personal workout tracker. Log gym sessions and cardio with ease.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pump',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F0FCFB',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceMono.variable} ${monoton.variable} ${pacifico.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
