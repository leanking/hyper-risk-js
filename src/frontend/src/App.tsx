import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard';
import Header from './components/Header';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Header />
        <main className="flex-grow">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <Routes location={location}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/:walletAddress" element={<Dashboard />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </PageTransition>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
