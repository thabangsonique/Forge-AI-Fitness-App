import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOUR_STORAGE_KEY, TourState, initialTourState } from "./tourState";

// Same discipline as constants/onboarding.ts: writes are serialized through a
// single promise chain. That guarantees a queued save can never land after a
// queued clear, and lets callers await a known point in the queue.
let writeQueue: Promise<void> = Promise.resolve();

const enqueueWrite = (write: () => Promise<void>) => {
  writeQueue = writeQueue.then(write).catch(() => {});
  return writeQueue;
};

export const flushTourWrites = () => writeQueue;

export const loadTourState = async (): Promise<TourState | null> => {
  try {
    await writeQueue;

    const raw = await AsyncStorage.getItem(TOUR_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<TourState>;

    // Unknown/older payload shapes are discarded rather than half-migrated.
    if (parsed.version !== 1) {
      return null;
    }

    // Spread over the defaults so a payload written by an older build still
    // yields a complete state object.
    return { ...initialTourState, ...parsed };
  } catch {
    return null;
  }
};

export const saveTourState = (state: TourState) =>
  enqueueWrite(() =>
    AsyncStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state))
  );

export const clearTourState = () =>
  enqueueWrite(() => AsyncStorage.removeItem(TOUR_STORAGE_KEY));