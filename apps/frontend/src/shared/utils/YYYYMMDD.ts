const pad = (n: number) => String(n).padStart(2, "0");

export function YYYYMMDD(date: Readonly<Date>): string {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

export function YYYYMMDDHHMM(date: Date) {
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${YYYYMMDD(date)} ${time}`;
}
