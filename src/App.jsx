// import { Routes, Route, Navigate } from 'react-router-dom';
// import LoginPage from './pages/LoginPage/LoginPage';
// import RegisterPage from './pages/RegisterPage/RegisterPage';
// import WorkspacesPage from './pages/WorkspacesPage/WorkspacesPage';
// import BoardPage from './pages/BoardPage/BoardPage';
// import ProfilePage from './pages/ProfilePage/ProfilePage'; 

// function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Navigate to="/login" />} />
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/register" element={<RegisterPage />} />
//       <Route path="/workspaces" element={<WorkspacesPage />} />
//       <Route path="/workspaces/:workspaceId" element={<BoardPage />} />
//       <Route path="/profile" element={<ProfilePage />} /> 
//     </Routes>
//   );
// }

// export default App;
import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSSE } from './hooks/SSE';
import Toast from './components/UI/Toast/Toast';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import WorkspacesPage from './pages/WorkspacesPage/WorkspacesPage';
import BoardPage from './pages/BoardPage/BoardPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';

function App() {
  const [toast, setToast] = useState(null);

  useSSE('/notifications/user', (data) => {
    setToast({ 
      message: data.message || 'Новое уведомление', 
      type: 'info' 
    });
  });

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/workspaces/:workspaceId" element={<BoardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}

export default App;