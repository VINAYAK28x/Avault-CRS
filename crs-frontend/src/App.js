import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import SubmitReport from './components/SubmitReport';
import ReportDetails from './components/ReportDetails';
import Statistics from './components/Statistics';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import CreateAdmin from './components/CreateAdmin';
import EmailVerification from './components/EmailVerification';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import PageNotFound from './components/PageNotFound';
import AdminReportDetails from './components/AdminReportDetails';

const theme = createTheme({
    palette: {
        primary: {
            main: '#d32f2f',
            light: '#ff6659',
            dark: '#9a0007',
        },
        secondary: {
            main: '#455a64',
            light: '#718792',
            dark: '#1c313a',
        },
        background: {
            default: '#f5f5f5',
        },
    },
    typography: {
        fontFamily: [
            'Roboto',
            'Arial',
            'sans-serif',
        ].join(','),
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});

// Protected Route component for regular users
const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

// Protected Route component for admins
const AdminRoute = () => {
    // Check if user has admin role stored in localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        return <Navigate to="/admin/login" />;
    }
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
            return <Navigate to="/admin/login" />;
        }
        return <Outlet />;
    } catch (error) {
        return <Navigate to="/admin/login" />;
    }
};

const App = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <SnackbarProvider maxSnack={3}>
                    <Router>
                        <Navbar />
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/verification" element={<EmailVerification />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route path="/admin/setup" element={<CreateAdmin />} />

                            {/* Protected routes */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/submit" element={<SubmitReport />} />
                                <Route path="/reports/:id" element={<ReportDetails />} />
                                <Route path="/profile" element={<Profile />} />
                            </Route>
                            
                            {/* Admin routes */}
                            <Route element={<AdminRoute />}>
                                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                <Route path="/admin/reports/:id" element={<AdminReportDetails />} />
                            </Route>
                            
                            <Route path="*" element={<PageNotFound />} />
                        </Routes>
                    </Router>
                </SnackbarProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
