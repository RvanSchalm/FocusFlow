import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BoardView } from "./components/BoardView";
import { Sidebar } from "./components/Sidebar";

function App() {
  return (
    <BrowserRouter>
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
