import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Create wagmi config for ConnectKit
export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    }),
  ],
}) 