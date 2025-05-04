// src/context/RACContext.jsx
import { createContext, useContext, useState } from 'react';

const RACContext = createContext();

export function RACProvider({ children }) {
  const [racData, setRacData] = useState({
    etd: '',
    blockOnATA: '',
    actualTimes: {},
    manualTargets: {},
    result: null,
  });

  return (
    <RACContext.Provider value={{ racData, setRacData }}>
      {children}
    </RACContext.Provider>
  );
}

export function useRAC() {
  return useContext(RACContext);
}
