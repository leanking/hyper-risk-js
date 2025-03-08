import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import { config } from '../config/wagmi';

// Create a client for React Query
const queryClient = new QueryClient();

interface ConnectKitProviderWrapperProps {
  children: ReactNode;
}

export const ConnectKitProviderWrapper = ({ children }: ConnectKitProviderWrapperProps) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          customTheme={{
            // Match the app's color scheme
            "--ck-connectbutton-background": "#9333ea", // purple-600
            "--ck-connectbutton-hover-background": "#7e22ce", // purple-700
            "--ck-connectbutton-active-background": "#6b21a8", // purple-800
            "--ck-connectbutton-color": "#ffffff",
            "--ck-body-background": "#f9fafb", // gray-50
            "--ck-body-background-secondary": "#f3f4f6", // gray-100
            "--ck-body-background-tertiary": "#e5e7eb", // gray-200
            "--ck-body-color": "#1f2937", // gray-800
            "--ck-primary-button-background": "#9333ea", // purple-600
            "--ck-primary-button-hover-background": "#7e22ce", // purple-700
            "--ck-primary-button-active-background": "#6b21a8", // purple-800
            "--ck-primary-button-color": "#ffffff",
            // Dark mode colors
            "--ck-body-background-muted": "#111827", // dark:gray-900
            "--ck-body-color-muted": "#f9fafb", // dark:gray-50
            "--ck-body-color-secondary": "#e5e7eb", // dark:gray-200
          }}
          options={{
            hideBalance: false,
            hideTooltips: false,
            walletConnectCTA: "modal",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}; 