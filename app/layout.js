import "./globals.css";
import { DealerProvider } from "@/app/contexts/Contexts";

export const metadata = {
  title: "Schedule",
  description: "Internal requests system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DealerProvider>{children}</DealerProvider>
      </body>
    </html>
  );
}
