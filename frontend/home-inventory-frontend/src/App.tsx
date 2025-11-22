import { useState } from "react";
import { useRoutes } from "react-router-dom";
import { routes } from "./routes";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { PageTitleProvider } from "./contexts/PageTitleContext";
import { Toaster } from "react-hot-toast";
import "./styles/design-system.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menu = useRoutes(routes);

  return (
    <PageTitleProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Top Bar - Fixed */}
        <TopBar />

        {/* Sidebar - Fixed 30% width */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area - 82% width, scrollable */}
        <main className="fixed left-[18%] top-16 right-0 bottom-0 overflow-y-auto bg-white dark:bg-gray-900 p-6">
          {menu}
        </main>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
      <Toaster position="top-right" />
    </PageTitleProvider>
  );
}

export default App;
