import "./globals.css";

export const metadata = {
  title: "POS SaaS Multi-tenant",
  description: "Sistema de punto de venta multi-tenant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
