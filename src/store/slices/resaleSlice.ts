import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ResaleInputs } from "@/lib/finance";

const initialState: ResaleInputs = {
  purchaseDate: new Date().toISOString().slice(0, 10),
  price: 1_500_000,
  downPaymentPct: 0.25,
  interestRate: 0.035,
  loanTenureYears: 30,
  buyerProfile: "citizen",
  propertyCount: 1,
  mode: "rent-out",
  monthlyRental: 4_500,
  rentalGrowthPct: 0.03,
  vacancyPct: 0.05,
  maintenancePct: 0.1,
  appreciationPct: 0.03,
  horizonYears: 10,
};

const resaleSlice = createSlice({
  name: "resale",
  initialState,
  reducers: {
    updateResale(state, action: PayloadAction<Partial<ResaleInputs>>) {
      return { ...state, ...action.payload };
    },
    resetResale() {
      return initialState;
    },
  },
});

export const { updateResale, resetResale } = resaleSlice.actions;
export default resaleSlice.reducer;
