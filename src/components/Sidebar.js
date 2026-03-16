import React from "react";
import { Box, Button, List, ListItem, ListItemText } from "@mui/material";

const Sidebar = ({ onSignOut }) => {
  return (
    <Box
      sx={{
        width: 250,
        height: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 2,
      }}
    >
      <List>
        <ListItem button>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button>
          <ListItemText primary="Settings" />
        </ListItem>
        {/* Add more navigation items as needed */}
      </List>
      <Button
        variant="contained"
        color="secondary"
        onClick={onSignOut}
        sx={{ marginTop: "auto" }}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default Sidebar;
