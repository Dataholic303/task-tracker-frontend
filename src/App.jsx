import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import WorkspacesPage from './pages/WorkspacesPage/WorkspacesPage';
import BoardPage from './pages/BoardPage/BoardPage';
import ProfilePage from './pages/ProfilePage/ProfilePage'; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/workspaces" element={<WorkspacesPage />} />
      <Route path="/workspaces/:workspaceId" element={<BoardPage />} />
      <Route path="/profile" element={<ProfilePage />} /> 
    </Routes>
  );
}

export default App;