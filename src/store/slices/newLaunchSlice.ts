import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { NewLaunchInputs } from "@/lib/finance";

const initialState: NewLaunchInputs = {
  todayMonth: new Date().toISOString().slice(0, 7),
  topMonth: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3).toISOString().slice(0, 7),
  priceToday: 1_800_000,
  preTopAppreciationPct: 0.04,
  buyerProfile: "citizen",
  propertyCount: 1,
  interestRate: 0.035,
  loanTenureYears: 30,
  estimatedRentalAtTop: 5_500,
  rentalGrowthPct: 0.03,
  postTopAppreciationPct: 0.03,
  horizonYearsAfterTop: 5,
  currentMonthlyRent: 3_500,
  postTopMode: "self-stay",
};

const newLaunchSlice = createSlice({
  name: "newLaunch",
  initialState,
  reducers: {
    updateNewLaunch(state, action: PayloadAction<Partial<NewLaunchInputs>>) {
      return { ...state, ...action.payload };
    },
    resetNewLaunch() {
      return initialState;
    },
  },
});

export const { updateNewLaunch, resetNewLaunch } = newLaunchSlice.actions;
export default newLaunchSlice.reducer;
