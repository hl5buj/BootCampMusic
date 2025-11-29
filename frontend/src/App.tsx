import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TrackDetail from './pages/TrackDetail';
import AdminUpload from './pages/AdminUpload';
import AdminManage from './pages/AdminManage';
import AdminEdit from './pages/AdminEdit';

const App: React.FC = () => {
  return (
    <Router>
      <MusicPlayerProvider>
        <div className="bg-dark min-h-screen text-white font-sans">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/track/:id" element={<TrackDetail />} />
            <Route path="/admin/upload" element={<AdminUpload />} />
            <Route path="/admin/manage" element={<AdminManage />} />
            <Route path="/admin/edit/:id" element={<AdminEdit />} />
          </Routes>
        </div>
      </MusicPlayerProvider>
    </Router>
  );
};

export default App;

