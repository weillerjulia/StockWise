import { BrowserRouter, Route, Routes } from "react-router-dom";

import NavBar from "./components/NavBar";
import DashboardPage from "./pages/DashboardPage";
import ProdutosPage from "./pages/ProdutosPage";
import UploadPage from "./pages/UploadPage";

function App() {
  return (
    <BrowserRouter>
      <header>
        <h1>StockWise</h1>
        <p>Sistema de apoio à decisão para estoque de autopeças.</p>
        <NavBar />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
