import '../styles/globals.css';
import { PrivyProvider } from '@privy-io/react-auth';
import { Toaster } from 'react-hot-toast';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161b22',
            color: '#fff',
            border: '1px solid #30363d',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#3fb950',
              secondary: '#161b22',
            },
          },
          error: {
            iconTheme: {
              primary: '#f85149',
              secondary: '#161b22',
            },
          },
        }}
      />
      <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#6366f1',
          logo: 'https://i.imgur.com/placeholder.png',
        },
        embeddedWallets: {
          createOnLogin: 'off',
        },
        defaultChain: {
          id: 10143,
          name: 'Monad Testnet',
          network: 'monad-testnet',
          nativeCurrency: {
            decimals: 18,
            name: 'MON',
            symbol: 'MON',
          },
          rpcUrls: {
            default: { http: ['https://rpc.ankr.com/monad_testnet'] },
            public: { http: ['https://rpc.ankr.com/monad_testnet'] },
          },
          blockExplorers: {
            default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
          },
          testnet: true,
        },
        supportedChains: [{
          id: 10143,
          name: 'Monad Testnet',
          network: 'monad-testnet',
          nativeCurrency: {
            decimals: 18,
            name: 'MON',
            symbol: 'MON',
          },
          rpcUrls: {
            default: { http: ['https://rpc.ankr.com/monad_testnet'] },
            public: { http: ['https://rpc.ankr.com/monad_testnet'] },
          },
          blockExplorers: {
            default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
          },
          testnet: true,
        }],
      }}
    >
      <Component {...pageProps} />
    </PrivyProvider>
    </>
  );
}

export default MyApp;
