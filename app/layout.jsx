"use client";
import "@styles/globals.css";
import Nav from "@components/Nav";
import Provider from "@components/Provider";
import { usePathname } from "@node_modules/next/navigation";

// export const metadata = {
//   title: "Promptopia",
//   description: "Discover & Share AI Prompts",
// };

const RootLayout = ({ children }) => {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body>
        <Provider>
          <div className="main">
            <div className="gradient" />
          </div>

          <main className="app">
            {pathname !== "/verify-email" && pathname !== "/active-session" && (
              <Nav />
            )}{" "}
            {children}
          </main>
        </Provider>
      </body>
    </html>
  );
};

export default RootLayout;
