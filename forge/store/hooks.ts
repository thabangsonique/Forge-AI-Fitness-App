import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./index";

// Typed aliases so components never write useSelector<RootState> by hand and
// never lose dispatch/action type-checking.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();