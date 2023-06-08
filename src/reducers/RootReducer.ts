import { combineReducers } from "redux";
import optionReducer from "./OptionReducer";

export type Action<T> = { type: string, value: T };
export type ActionGenerator<T> = (value: T) => Action<T>;

const rootReducer = combineReducers({
    optionReducer,
});
export default rootReducer;