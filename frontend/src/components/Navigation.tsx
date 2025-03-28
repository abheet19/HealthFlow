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
  ];

  return (
    <>
      <AppBar position="static" className="bg-blue-600 px-4 py-2">
        <Toolbar className="flex items-center">
          <div className="flex items-center space-x-4 flex-grow">
            <div
              className="bg-white text-blue-500 font-bold text-lg rounded-full w-8 h-8 flex items-center justify-center hover:shadow-md cursor-pointer"
              title="Home"
            >
              +
            </div>
            <span className="text-xl font-bold text-white">
              Health Report Card
            </span>
          </div>
          {isMobile && (
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <div className="hidden sm:flex space-x-6">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                color="inherit"
                component={Link}
                to={item.path}
                className={`text-white hover:underline ${
                  currentPath === item.path ? "font-bold underline" : ""
                }`}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <div className="w-64 h-full bg-gray-100 shadow-lg flex flex-col p-4">
          <List className="flex-grow">
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.label}
                component={Link}
                to={item.path}
                onClick={toggleDrawer(false)}
                className={`hover:bg-gray-200 ${
                  currentPath === item.path ? "bg-gray-300" : ""
                }`}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <div className="text-center text-sm text-gray-500 mt-4">
            © 2025 Abheet Singh
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default Navigation;
