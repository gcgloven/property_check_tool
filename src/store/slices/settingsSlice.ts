import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BuyerProfile } from "@/lib/finance";

export interface SettingsState {
  buyerProfile: BuyerProfile;
  propertyCount: 1 | 2 | 3;
}

const initialState: SettingsState = {
  buyerProfile: "citizen",
  propertyCount: 1,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setBuyerProfile(state, action: PayloadAction<BuyerProfile>) {
      state.buyerProfile = action.payload;
    },
    setPropertyCount(state, action: PayloadAction<1 | 2 | 3>) {
      state.propertyCount = action.payload;
    },
  },
});

export const { setBuyerProfile, setPropertyCount } = settingsSlice.actions;
export default settingsSlice.reducer;
