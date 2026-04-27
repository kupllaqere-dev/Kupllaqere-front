import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api/creator";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Create from "./pages/Create";
import MySubmissions from "./pages/MySubmissions";

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
          <Route index element={<Navigate to="/create" replace />} />
          <Route path="create" element={<Create />} />
          <Route path="submissions" element={<MySubmissions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
