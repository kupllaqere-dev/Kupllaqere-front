import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api/admin";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Items from "./pages/Items";
import Online from "./pages/Online";
import Mail from "./pages/Mail";
import Submissions from "./pages/Submissions";

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="players" element={<Players />} />
          <Route path="items" element={<Items />} />
          <Route path="online" element={<Online />} />
          <Route path="mail" element={<Mail />} />
          <Route path="submissions" element={<Submissions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
