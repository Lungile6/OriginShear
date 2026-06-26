/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const RegisterLotContext = createContext(null);

const GPS_ZONES = ["Lowlands", "Foothills", "Mountains", "Senqu River Valley", "Quthing Highlands"];

export function RegisterLotProvider({ children }) {
  const [form, setForm] = useState({
    fibreType: 0, // FibreType.WOOL
    grade: 0, // Grade.A
    weightKg: "",
    gpsZone: GPS_ZONES[0],
    seasonYear: `${new Date().getFullYear()}-A`,
  });

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  return (
    <RegisterLotContext.Provider value={{ form, update, GPS_ZONES }}>
      {children}
    </RegisterLotContext.Provider>
  );
}

export function useRegisterLot() {
  const ctx = useContext(RegisterLotContext);
  if (!ctx) throw new Error("useRegisterLot must be used within RegisterLotProvider");
  return ctx;
}
