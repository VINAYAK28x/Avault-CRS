import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            // TODO: Fetch user data from API
            setUser({
                name: 'John Doe',
                email: 'john@example.com',
                walletAddress: localStorage.getItem('walletAddress'),
            });
        }
        setLoading(false);
    }, []);

    const login = async (token, userData) => {
        localStorage.setItem('token', token);
        if (userData.walletAddress) {
            localStorage.setItem('walletAddress', userData.walletAddress);
        }
        setIsAuthenticated(true);
        setUser(userData);
    };

    const logout = async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('walletAddress');
        setIsAuthenticated(false);
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...userData,
        }));
    };

    if (loading) {
        return null; // or a loading spinner
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                login,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 