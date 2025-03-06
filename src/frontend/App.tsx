import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WalletList from './pages/WalletList';
import WalletDetail from './pages/WalletDetail';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wallets" element={<WalletList />} />
          <Route path="/wallets/:id" element={<WalletDetail />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App; 