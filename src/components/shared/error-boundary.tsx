"use client";

import React from "react";
import { Alert, AlertTitle, Box, Button } from "@mui/material";
import type { ReactNode } from "react";

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<{ children: ReactNode; title: string }, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => this.setState({ error: null })}>
                Retry
              </Button>
            }
          >
            <AlertTitle>{this.props.title}</AlertTitle>
            {this.state.error.message}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}
