import '../styles/globals.css';
import { PrivyProvider } from '@privy-io/react-auth';

function MyApp({ Component, pageProps }) {
  return (
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
            default: { http: ['https://testnet-rpc.monad.xyz'] },
            public: { http: ['https://testnet-rpc.monad.xyz'] },
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
            default: { http: ['https://testnet-rpc.monad.xyz'] },
            public: { http: ['https://testnet-rpc.monad.xyz'] },
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
  );
}

export default MyApp;
