import { BrowserRouter, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import AjudaPage from "./pages/AjudaPage";
import DashboardPage from "./pages/DashboardPage";
import ProdutosPage from "./pages/ProdutosPage";
import UploadPage from "./pages/UploadPage";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/ajuda" element={<AjudaPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
