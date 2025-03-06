import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// This is a placeholder component that will be replaced with actual API calls
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
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Wallets</h1>
          <Link to="/" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
        <div className="card-body">
          <form onSubmit={handleAddWallet} className="mb-4">
            <div className="form-group">
              <label htmlFor="address" className="form-label">Add Wallet Address</label>
              <div className="d-flex">
                <input
                  type="text"
                  id="address"
                  className="form-control"
                  placeholder="Enter Ethereum address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary ml-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Wallet'}
                </button>
              </div>
              {error && <div className="text-danger mt-2">{error}</div>}
            </div>
          </form>

          {wallets.length === 0 ? (
            <div className="text-center py-4">
              <p>No wallets added yet. Add a wallet to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Created</th>
                    <th>Last Synced</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet.id}>
                      <td>{wallet.name}</td>
                      <td>{wallet.address}</td>
                      <td>{new Date(wallet.createdAt).toLocaleDateString()}</td>
                      <td>{wallet.lastSyncedAt ? new Date(wallet.lastSyncedAt).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <div className="btn-group">
                          <Link to={`/wallets/${wallet.id}`} className="btn btn-sm btn-primary">
                            View
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
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