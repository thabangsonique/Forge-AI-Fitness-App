// utils/formatDuration.ts

export const formatDuration = (totalSeconds: number): string => {
  //make sure seconds are a whole number and are not negative number
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);

  //actual display format.
  const paddingMinutes = minutes.toString().padStart(2, "0");
  const paddingSeconds = paddingMinutes.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours} : ${minutes} : ${seconds}`;
  }

  return `${minutes} : ${seconds}`;
};

export const formatMinutes = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);

  return `${minutes} min`;
};
//format date.
export const formatDate = (dateString: Date): string => {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Johannesburg",
  });
};

export const formatElapsedTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
