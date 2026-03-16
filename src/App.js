import React from "react";
import Sidebar from "./components/Sidebar";

const App = () => {
  const handleSignOut = () => {
    // Add your sign-out logic here (e.g., clearing tokens, redirecting to login)
    console.log("User signed out");
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar onSignOut={handleSignOut} />
      {/* Add main content here */}
    </div>
  );
};

export default App;
