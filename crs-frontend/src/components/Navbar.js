import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Menu,
    Container,
    Avatar,
    Button,
    Tooltip,
    MenuItem,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle,
    Dashboard,
    Description,
    Assessment,
    Info,
    AddCircle,
    Person,
    Logout,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from 'notistack';

const Navbar = () => {
    const { isAuthenticated, logout } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [anchorElUser, setAnchorElUser] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = async () => {
        try {
            await logout();
            enqueueSnackbar('Logged out successfully', { variant: 'success' });
            navigate('/login');
        } catch (error) {
            enqueueSnackbar('Failed to logout', { variant: 'error' });
        }
        handleCloseUserMenu();
    };

    const menuItems = [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', auth: true },
        { text: 'Submit Report', icon: <AddCircle />, path: '/submit', auth: true },
        { text: 'Statistics', icon: <Assessment />, path: '/statistics', auth: true },
        { text: 'About', icon: <Info />, path: '/about', auth: false },
    ];

    const userMenuItems = [
        { text: 'Profile', icon: <Person />, onClick: () => navigate('/profile') },
        { text: 'Logout', icon: <Logout />, onClick: handleLogout },
    ];

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ my: 2 }}>
                CRS
            </Typography>
            <List>
                {menuItems.map((item) => (
                    (!item.auth || isAuthenticated) && (
                        <ListItem
                            button
                            component={RouterLink}
                            to={item.path}
                            key={item.text}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    )
                ))}
            </List>
        </Box>
    );

    return (
        <>
            <AppBar position="sticky">
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        {isMobile && (
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{ mr: 2 }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}

                        <Typography
                            variant="h6"
                            noWrap
                            component={RouterLink}
                            to="/"
                            sx={{
                                mr: 2,
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '.3rem',
                                color: 'inherit',
                                textDecoration: 'none',
                                flexGrow: { xs: 1, md: 0 },
                            }}
                        >
                            CRS
                        </Typography>

                        {!isMobile && (
                            <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                                {menuItems.map((item) => (
                                    (!item.auth || isAuthenticated) && (
                                        <Button
                                            key={item.text}
                                            component={RouterLink}
                                            to={item.path}
                                            sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}
                                        >
                                            {item.icon}
                                            {item.text}
                                        </Button>
                                    )
                                ))}
                            </Box>
                        )}

                        <Box sx={{ flexGrow: 0 }}>
                            {isAuthenticated ? (
                                <>
                                    <Tooltip title="Open settings">
                                        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                            <Avatar>
                                                <AccountCircle />
                                            </Avatar>
                                        </IconButton>
                                    </Tooltip>
                                    <Menu
                                        sx={{ mt: '45px' }}
                                        id="menu-appbar"
                                        anchorEl={anchorElUser}
                                        anchorOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                        keepMounted
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                        open={Boolean(anchorElUser)}
                                        onClose={handleCloseUserMenu}
                                    >
                                        {userMenuItems.map((item) => (
                                            <MenuItem key={item.text} onClick={item.onClick}>
                                                <ListItemIcon>{item.icon}</ListItemIcon>
                                                <Typography textAlign="center">{item.text}</Typography>
                                            </MenuItem>
                                        ))}
                                    </Menu>
                                </>
                            ) : (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        component={RouterLink}
                                        to="/login"
                                        sx={{ color: 'white' }}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        component={RouterLink}
                                        to="/register"
                                        variant="contained"
                                        color="secondary"
                                    >
                                        Register
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Drawer
                variant="temporary"
                anchor="left"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
                }}
            >
                {drawer}
            </Drawer>
        </>
    );
};

export default Navbar;
