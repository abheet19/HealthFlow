import * as React from "react";
import { AppBar, Toolbar, Button } from "@mui/material";
import { Link } from "react-router-dom";

const Navigation: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" component={Link} to="/it">IT</Button>
        <Button color="inherit" component={Link} to="/ent">ENT</Button>
        <Button color="inherit" component={Link} to="/vision">Vision</Button>
        <Button color="inherit" component={Link} to="/general">General</Button>
        <Button color="inherit" component={Link} to="/dental">Dental</Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
