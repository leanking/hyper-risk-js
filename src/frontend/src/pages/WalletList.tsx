import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// import '../styles/App.css'; // Removed to prevent conflicts with Tailwind

const WalletList: React.FC = () => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Placeholder for API call
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      const newWallet = {
        id: Date.now().toString(),
        address,
        name: `Wallet ${wallets.length + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setWallets([...wallets, newWallet]);
      setAddress('');
      setIsLoading(false);
    }, 1000);
  };

  const handleDeleteWallet = (id: string) => {
    // Placeholder for API call
    setWallets(wallets.filter(wallet => wallet.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white m-0">Wallets</h1>
          <Link to="/" className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">
            Back to Dashboard
          </Link>
        </div>
        <div className="p-6">
          <form onSubmit={handleAddWallet} className="mb-6">
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Wallet Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="address"
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  placeholder="Enter Ethereum address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Wallet'}
                </button>
              </div>
              {error && <div className="text-red-600 dark:text-red-400 mt-2">{error}</div>}
            </div>
          </form>

          {wallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No wallets added yet. Add a wallet to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Synced</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {wallets.map((wallet) => (
                    <tr key={wallet.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{wallet.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{wallet.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(wallet.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{wallet.lastSyncedAt ? new Date(wallet.lastSyncedAt).toLocaleDateString() : 'Never'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Link to={`/wallets/${wallet.id}`} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md">
                            View
                          </Link>
                          <button
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-md"
                            onClick={() => handleDeleteWallet(wallet.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletList; 