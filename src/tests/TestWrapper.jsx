// src/tests/TestWrapper.jsx
import React from "react";
import { MemoryRouter } from "react-router-dom";

// Dummy context (misalnya RACContext)
const RACContext = React.createContext({});
const DummyRACProvider = ({ children }) => (
  <RACContext.Provider
    value={{
      racData: {},
      setRacData: () => {},
      settings: { thresholds: {} },
      checkDeviation: () => {}
    }}
  >
    {children}
  </RACContext.Provider>
);

// Dummy Auth/session provider
const AuthContext = React.createContext({});
const DummyAuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ session: {} }}>
    {children}
  </AuthContext.Provider>
);

export const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <DummyAuthProvider>
      <DummyRACProvider>{children}</DummyRACProvider>
    </DummyAuthProvider>
  </MemoryRouter>
);
