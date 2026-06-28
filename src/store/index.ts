import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";

import resaleReducer from "./slices/resaleSlice";
import newLaunchReducer from "./slices/newLaunchSlice";
import settingsReducer from "./slices/settingsSlice";
import purchaseReducer from "./slices/purchaseSlice";
import downpaymentSavingReducer from "./slices/downpaymentSavingSlice";
import storage from "./storage";

const rootReducer = combineReducers({
  resale: resaleReducer,
  newLaunch: newLaunchReducer,
  settings: settingsReducer,
  purchase: purchaseReducer,
  downpaymentSaving: downpaymentSavingReducer,
});

const persistConfig = {
  key: "property-check-tool",
  version: 0,
  storage,
  whitelist: ["resale", "newLaunch", "settings", "purchase", "downpaymentSaving"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
