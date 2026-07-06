/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const RegisterLotContext = createContext(null);

const GPS_ZONES = ["Lowlands", "Foothills", "Mountains", "Senqu River Valley", "Quthing Highlands"];

const STORAGE_OPTIONS = [
  "On-farm bale storage",
  "District collection point",
  "LNWMGA warehouse",
  "Buyer pickup arranged",
];

export function RegisterLotProvider({ children }) {
  const [form, setForm] = useState({
    fibreType: 0,
    grade: 0,
    weightKg: "",
    gpsZone: GPS_ZONES[0],
    seasonYear: `${new Date().getFullYear()}-A`,
    storageMethod: STORAGE_OPTIONS[0],
    handlingNotes: "",
    readyForPickup: true,
  });

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  return (
    <RegisterLotContext.Provider value={{ form, update, GPS_ZONES, STORAGE_OPTIONS }}>
      {children}
    </RegisterLotContext.Provider>
  );
}

export function useRegisterLot() {
  const ctx = useContext(RegisterLotContext);
  if (!ctx) throw new Error("useRegisterLot must be used within RegisterLotProvider");
  return ctx;
}
