export const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Get the network ID
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            return {
                success: true,
                account,
                chainId,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to connect to MetaMask',
            };
        }
    } else {
        return {
            success: false,
            error: 'Please install MetaMask',
        };
    }
};

export const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                return {
                    success: true,
                    account: accounts[0],
                    chainId,
                };
            }
            return {
                success: false,
                error: 'No accounts found',
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    return {
        success: false,
        error: 'MetaMask not installed',
    };
};

// Listen for account changes
export const setupAccountChangeListener = (callback) => {
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                callback({
                    success: true,
                    account: accounts[0],
                });
            } else {
                callback({
                    success: false,
                    error: 'No accounts found',
                });
            }
        });
    }
};

// Listen for chain changes
export const setupChainChangeListener = (callback) => {
    if (window.ethereum) {
        window.ethereum.on('chainChanged', (chainId) => {
            callback(chainId);
        });
    }
}; 