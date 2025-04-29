import React from 'react';
import Header from '../components/Header';
import InputArea from '../components/InputArea';
import ProductTable from '../components/ProductTable';
import TotalInfo from '../components/TotalInfo';
import FloatingMenu from '../components/FloatingMenu';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AppProvider } from '../contexts/AppContext';

const Index: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <main className="list-container pb-24">
            <InputArea />
            <ProductTable />
            <TotalInfo />
          </main>
          <FloatingMenu />
        </div>
      </AppProvider>
    </ThemeProvider>
  );
};

export default Index;
