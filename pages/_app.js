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
            default: { http: ['https://rpc.ankr.com/monad_testnet'] },
            public: { http: ['https://rpc.ankr.com/monad_testnet'] },
          },
          blockExplorers: {
            default: { name: 'Monad Explorer', url: 'https://explorer.testnet.monad.xyz' },
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
            default: { name: 'Monad Explorer', url: 'https://explorer.testnet.monad.xyz' },
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
