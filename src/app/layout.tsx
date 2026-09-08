import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

/** The app's own face — `AppFonts.geist`, one font for the whole journey. */
const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Calling changes · greeting + failures",
  description:
    "The parts of the Stimuler calling tab that are changing: the greeting slot (static control plus four memory-opener versions and their states) and the seven call failure screens.",
};

export const viewport: Viewport = {
  themeColor: "#0A0911",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.className}>
      <head>
        {/* Material Symbols Rounded — the family the app's `Icons.*_rounded`
            set is drawn from, so a glyph here is the glyph on the phone. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* `display=block` so a glyph never flashes its ligature name ("history")
            before the font lands. Loaded here rather than through next/font
            because the variable icon axes are not expressible there. */}
        {/* The `display` lint prefers `optional`, which is right for TEXT — an
            icon font has no readable fallback, so a missed swap window leaves
            the controls blank for the session. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
