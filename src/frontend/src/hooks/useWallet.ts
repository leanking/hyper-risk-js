import { useAccount, useBalance, useDisconnect } from 'wagmi';

export const useWallet = () => {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
  });

  // Format address for display
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    disconnect,
    balance,
    formattedAddress: formatAddress(address),
  };
};

export default useWallet; 