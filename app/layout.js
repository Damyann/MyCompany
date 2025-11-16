import "./globals.css";

export const metadata = {
  title: "Schedule",
  description: "Internal requests system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
