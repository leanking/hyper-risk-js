import React from 'react';
import { ConnectKitButton } from 'connectkit';

interface CustomConnectButtonProps {
  showBalance?: boolean;
  className?: string;
}

const CustomConnectButton: React.FC<CustomConnectButtonProps> = ({ 
  showBalance = false,
  className = ''
}) => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, address, ensName }) => {
        return (
          <button
            onClick={show}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isConnected
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } ${className}`}
          >
            {isConnecting && 'Connecting...'}
            {!isConnecting && !isConnected && 'Connect Wallet'}
            {!isConnecting && isConnected && (ensName || `${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`)}
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};

export default CustomConnectButton; 