import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WalletList from './pages/WalletList';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wallets" element={<WalletList />} />
          <Route path="/wallets/:id" element={<div className="container"><h1>Wallet Detail</h1><p>This page is under construction.</p></div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
