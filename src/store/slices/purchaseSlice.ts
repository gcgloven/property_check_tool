import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Buyer, PurchaseInputs } from "@/lib/finance";

export function makeBuyer(): Buyer {
  return { profile: "citizen", propertyCount: 1, cash: 0, cpf: 0 };
}

const initialState: PurchaseInputs = {
  price: 1_500_000,
  downPaymentPct: 0.25,
  buyers: [{ profile: "citizen", propertyCount: 1, cash: 450_000, cpf: 0 }],
};

const purchaseSlice = createSlice({
  name: "purchase",
  initialState,
  reducers: {
    setPrice(state, action: PayloadAction<number>) {
      state.price = action.payload;
    },
    setDownPaymentPct(state, action: PayloadAction<number>) {
      state.downPaymentPct = action.payload;
    },
    addBuyer(state) {
      if (state.buyers.length < 2) state.buyers.push(makeBuyer());
    },
    removeBuyer(state, action: PayloadAction<number>) {
      if (state.buyers.length > 1) state.buyers.splice(action.payload, 1);
    },
    updateBuyer(
      state,
      action: PayloadAction<{ index: number; patch: Partial<Buyer> }>,
    ) {
      const { index, patch } = action.payload;
      const buyer = state.buyers[index];
      if (buyer) state.buyers[index] = { ...buyer, ...patch };
    },
    resetPurchase() {
      return initialState;
    },
  },
});

export const {
  setPrice,
  setDownPaymentPct,
  addBuyer,
  removeBuyer,
  updateBuyer,
  resetPurchase,
} = purchaseSlice.actions;
export default purchaseSlice.reducer;
