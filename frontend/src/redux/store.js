import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./authSlice";


const rootReducer = combineReducers({
    auth: authReducer,

});

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth"], // Sadece auth'u persist et
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        })
});

export const persistor = persistStore(store);

export default store;