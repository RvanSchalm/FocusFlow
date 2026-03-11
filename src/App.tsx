import { HashRouter, Link, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { BoardView } from "./components/BoardView";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { Sidebar } from "./components/Sidebar";
import { useStore } from "./store/useStore";

function App() {
  const initialize = useStore((state) => state.initialize);
  const isLoading = useStore((state) => state.isLoading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading FocusFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <ConfirmProvider>
      <HashRouter>
        <div className="flex h-screen bg-zinc-950 text-zinc-100">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/board/:boardId" element={<BoardView />} />
              <Route
                path="/"
                element={
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select a board to get started
                  </div>
                }
              />
              <Route
                path="*"
                element={
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <h1 className="text-4xl font-bold text-zinc-400">404</h1>
                    <p className="text-zinc-500">Page not found</p>
                    <Link
                      to="/"
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                    >
                      Go Home
                    </Link>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </ConfirmProvider>
  );
}

export default App;
