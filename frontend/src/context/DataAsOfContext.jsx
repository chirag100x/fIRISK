import React, { createContext, useContext, useState } from 'react';

const DataAsOfContext = createContext({
  asOf: null,
  setAsOf: () => {},
});

export function DataAsOfProvider({ children }) {
  const [asOf, setAsOf] = useState(null);

  return (
    <DataAsOfContext.Provider value={{ asOf, setAsOf }}>
      {children}
    </DataAsOfContext.Provider>
  );
}

export function useDataAsOf() {
  return useContext(DataAsOfContext);
}

export default DataAsOfContext;
