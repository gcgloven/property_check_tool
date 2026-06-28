import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  DownpaymentSavingPropertyInputs,
  DownpaymentSavingState,
  SavingBuyer,
  ScenarioName,
  TimelineInputs,
} from "@/lib/finance";

function makeSavingBuyer(name: string): SavingBuyer {
  return {
    name,
    currentCpf: 0,
    currentCashSavings: 0,
    extraSavings: 0,
    monthlyCpfContribution: 0,
    monthlyCashSaving: 0,
  };
}

const defaultProperty: DownpaymentSavingPropertyInputs = {
  squareFeet: 1000,
  psf: 2000,
  manualPropertyValueEnabled: false,
  manualPropertyValue: 2000000,
  downpaymentPercent: 25,
  legalFee: 5000,
};

const defaultTimeline: TimelineInputs = {
  optionFeePercent: 1,
  exerciseFeePercent: 4,
  otpExerciseDays: 14,
  stampDutyDueDaysAfterExercise: 14,
  completionWeeksAfterExercise: 12,
};

const defaultBuyers: SavingBuyer[] = [
  {
    name: "Person A",
    currentCpf: 60000,
    currentCashSavings: 15000,
    extraSavings: 80000,
    monthlyCpfContribution: 2000,
    monthlyCashSaving: 2000,
  },
  {
    name: "Person B",
    currentCpf: 50000,
    currentCashSavings: 100000,
    extraSavings: 50000,
    monthlyCpfContribution: 1800,
    monthlyCashSaving: 5000,
  },
];

const initialState: DownpaymentSavingState = {
  property: defaultProperty,
  buyers: defaultBuyers,
  timeline: defaultTimeline,
  scenario: "baseCase",
};

const downpaymentSavingSlice = createSlice({
  name: "downpaymentSaving",
  initialState,
  reducers: {
    setPropertyField(
      state,
      action: PayloadAction<Partial<DownpaymentSavingPropertyInputs>>,
    ) {
      state.property = { ...state.property, ...action.payload };
    },
    updateBuyer(
      state,
      action: PayloadAction<{ index: number; patch: Partial<SavingBuyer> }>,
    ) {
      const { index, patch } = action.payload;
      const buyer = state.buyers[index];
      if (buyer) {
        state.buyers[index] = { ...buyer, ...patch };
      }
    },
    addBuyer(state) {
      if (state.buyers.length < 2) {
        state.buyers.push(makeSavingBuyer(`Person ${String.fromCharCode(65 + state.buyers.length)}`));
      }
    },
    removeBuyer(state, action: PayloadAction<number>) {
      if (state.buyers.length > 1) {
        state.buyers.splice(action.payload, 1);
      }
    },
    setTimelineField(
      state,
      action: PayloadAction<Partial<TimelineInputs>>,
    ) {
      state.timeline = { ...state.timeline, ...action.payload };
    },
    setScenario(state, action: PayloadAction<ScenarioName>) {
      state.scenario = action.payload;
    },
    resetDownpaymentSaving() {
      return initialState;
    },
  },
});

export const {
  setPropertyField,
  updateBuyer,
  addBuyer,
  removeBuyer,
  setTimelineField,
  setScenario,
  resetDownpaymentSaving,
} = downpaymentSavingSlice.actions;
export default downpaymentSavingSlice.reducer;
