import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import MainPage from "./pages/MainPage";
import AdminPage from "./pages/AdminPage";

import "./index.css"; // Asegúrate de importar los estilos

function AppWrapper() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      document.body.classList.add("auth-background");
    } else {
      document.body.classList.remove("auth-background");
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/main" element={<MainPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
