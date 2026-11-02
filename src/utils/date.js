// Local YYYY-MM-DD (toISOString() would give the UTC date, which is off by a day near midnight).
export const getLocalDateStr = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};
