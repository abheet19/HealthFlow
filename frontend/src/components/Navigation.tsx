import * as React from "react";
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { clearAccessCode } from "../config/api";
import { Link, useLocation } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const Navigation: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentPath = useLocation().pathname;
  const lockWorkspace = () => { clearAccessCode(); sessionStorage.removeItem("patientData"); window.location.reload(); };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    { label: "IT", path: "/it" },
    { label: "ENT", path: "/ent" },
    { label: "Vision", path: "/vision" },
    { label: "General", path: "/general" },
    { label: "Dental", path: "/dental" },
    { label: "Patients List", path: "/patients" } // added tab
  ];

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 text-text focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:ring-2 focus:ring-accent"
      >
        Skip to main content
      </a>
      <AppBar
        component="header"
        position="static"
        elevation={0}
        className="bg-surface/70 backdrop-blur-xl border-b border-glass-border px-4 py-2"
      >
        <Toolbar component="nav" aria-label="Primary" className="flex items-center">
          <Link
            to="/it"
            aria-label="HealthFlow home"
            className="flex items-center space-x-3 flex-grow rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <img
              src="/brand/mark.svg"
              alt=""
              className="h-8 w-8 rounded-lg shadow-lg shadow-accent-2/30 transition-transform hover:scale-105"
            />
            <span className="text-xl font-display font-semibold text-text">
              HealthFlow
            </span>
          </Link>
          <Button onClick={lockWorkspace} className="!text-text-dim">Lock</Button>
          {isMobile && (
            <IconButton
              edge="end"
              onClick={toggleDrawer(true)}
              className="!text-text"
              aria-label="Open navigation menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          <div className={isMobile ? "hidden" : "flex space-x-2"}>
            {menuItems.map((item) => (
              <Button
                key={item.label}
                component={Link}
                to={item.path}
                className={`!normal-case !rounded-lg !px-3 !py-1.5 !text-sm !font-medium transition-colors ${
                  currentPath === item.path
                    ? "!text-on-accent !bg-accent-gradient"
                    : "!text-text-dim hover:!text-text hover:!bg-white/5"
                }`}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <div className="w-64 h-full bg-surface text-text shadow-lg flex flex-col p-4">
          <List className="flex-grow">
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.label}
                component={Link}
                to={item.path}
                onClick={toggleDrawer(false)}
                className={`!rounded-lg !mb-1 hover:!bg-white/5 ${
                  currentPath === item.path ? "!bg-white/10" : ""
                }`}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <div className="text-center text-sm text-text-dim mt-4">
            © {new Date().getFullYear()} Abheet Singh
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default Navigation;
