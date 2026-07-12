import './globals.css';
import { I18nProvider } from './I18nContext';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';

export const metadata = {
  title: 'Mudar | ????????? — نظام إدارة التأشيرات الذكي',
  description: 'نظام إدارة طلبات التأشيرات الذكي للشركات السياحية ومكاتب الخدمات',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar">
      <body>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

