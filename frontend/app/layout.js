import "react-toastify/dist/ReactToastify.css";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "react-svg-map/lib/index.css";
import "leaflet/dist/leaflet.css";
import "./scss/app.scss";
import { ToastContainer } from 'react-toastify';

export const metadata = {
  title: 'Coinage - Sistema de Gestão',
  description: 'Sistema de gestão de tokens e transações blockchain.',
  icons: {
    icon: '/favicon.png',
  },
}

import ThemeProvider from "./theme-provider"
import { AlertProvider } from "@/contexts/AlertContext";
import { CompanyProvider } from "@/contexts/CompanyContext";

export default function RootLayout({ children }) {
  return (
    <>
      <html lang="pt-BR">
        <body className="font-inter  custom-tippy dashcode-app">
          <ThemeProvider>
            <AlertProvider>
              <CompanyProvider>
                {children}
                <ToastContainer
                  position="top-right"
                  autoClose={1500}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                />
              </CompanyProvider>
            </AlertProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
