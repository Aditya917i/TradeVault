import "./globals.css";
import Sidebar from "./components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#07090d] text-white">
        <Sidebar />

        <main className="min-h-screen lg:ml-64">
          {children}
        </main>
      </body>
    </html>
  );
}