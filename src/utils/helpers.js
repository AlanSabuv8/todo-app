// src/utils/helpers.js
import dayjs from "dayjs";

export function formatDateISO(iso) {
  return dayjs(iso).format("DD MMM YYYY, HH:mm");
}
