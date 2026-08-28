import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Icarus",
  description: "Icarus study app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <div className="page-decoration" aria-hidden="true">
          <span className="decoration-circle decoration-circle-top" />
          <span className="decoration-circle decoration-circle-bottom" />
          <span className="decoration-swirl decoration-swirl-left" />
          <span className="decoration-swirl decoration-swirl-right" />
        </div>
        <div className="page-content">{children}</div>
      </body>
    </html>
  );
}
