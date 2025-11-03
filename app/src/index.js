import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import App from './App';
// import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import './polyfill'; // 添加这行

const root = ReactDOM.createRoot(document.getElementById('root'));

// 钱包配置
const wallets = [new PhantomWalletAdapter()];

root.render(
  <ConnectionProvider endpoint={clusterApiUrl('devnet')}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);