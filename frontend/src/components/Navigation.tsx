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
import { Link } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const Navigation: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentPath = window.location.pathname;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      <AppBar
        position="static"
        elevation={0}
        className="bg-surface/70 backdrop-blur-xl border-b border-glass-border px-4 py-2"
      >
        <Toolbar className="flex items-center">
          <div className="flex items-center space-x-3 flex-grow">
            <div
              className="bg-accent-gradient text-[#061018] font-display font-bold text-lg rounded-full w-8 h-8 flex items-center justify-center shadow-lg shadow-accent-2/30 hover:scale-105 transition-transform cursor-pointer"
              title="Home"
            >
              +
            </div>
            <span className="text-xl font-display font-semibold text-text">
              Health Report Card
            </span>
          </div>
          {isMobile && (
            <IconButton
              edge="end"
              onClick={toggleDrawer(true)}
              className="!text-text"
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          <div className="hidden sm:flex space-x-2">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                component={Link}
                to={item.path}
                className={`!normal-case !rounded-lg !px-3 !py-1.5 !text-sm !font-medium transition-colors ${
                  currentPath === item.path
                    ? "!text-[#061018] !bg-accent-gradient"
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
            © 2025 Abheet Singh
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default Navigation;
