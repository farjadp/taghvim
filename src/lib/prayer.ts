import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";

export const CITIES: readonly {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}[] = [
  { id: "tehran", name: "تهران", latitude: 35.6892, longitude: 51.389 },
  { id: "mashhad", name: "مشهد", latitude: 36.2605, longitude: 59.6168 },
  { id: "isfahan", name: "اصفهان", latitude: 32.6546, longitude: 51.668 },
  { id: "shiraz", name: "شیراز", latitude: 29.5918, longitude: 52.5837 },
  { id: "tabriz", name: "تبریز", latitude: 38.0962, longitude: 46.2738 },
  { id: "rasht", name: "رشت", latitude: 37.2808, longitude: 49.5832 },
  { id: "yazd", name: "یزد", latitude: 31.8974, longitude: 54.3569 },
  { id: "ahvaz", name: "اهواز", latitude: 31.3183, longitude: 48.6706 },
  { id: "qom", name: "قم", latitude: 34.6416, longitude: 50.8746 },
  { id: "bandar-abbas", name: "بندرعباس", latitude: 27.1832, longitude: 56.2666 },
  { id: "kermanshah", name: "کرمانشاه", latitude: 34.3142, longitude: 47.065 },
  { id: "zahedan", name: "زاهدان", latitude: 29.4963, longitude: 60.8629 },
];

export type PrayerTime = {
  key: string;
  label: string;
  time: string;
  timestamp: number;
};

export const PRAYER_NOTICE =
  "اوقات به‌صورت آفلاین با روش تهران و مختصات تقریبی شهر محاسبه می‌شوند؛ تقریبی‌اند و تأیید رسمی مراجع دینی نیستند. نیمه‌شب شرعی، میانهٔ غروب تا اذان صبح روز بعد است.";

const civilDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tehran",
  calendar: "gregory",
  numberingSystem: "latn",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  timeZone: "Asia/Tehran",
  numberingSystem: "arabext",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function prayerTimes(date: Date, cityId: string): PrayerTime[] {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new RangeError("Invalid date");
  }
  const city = CITIES.find((entry) => entry.id === cityId);
  if (!city) throw new RangeError(`Unknown city: ${cityId}`);

  const parts = civilDateFormatter.formatToParts(date);
  const component = (type: string) => Number(parts.find((part) => part.type === type)!.value);
  const localDate = new Date(0);
  localDate.setFullYear(component("year"), component("month") - 1, component("day"));
  localDate.setHours(12, 0, 0, 0);
  const nextDate = new Date(localDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const coordinates = new Coordinates(city.latitude, city.longitude);
  const parameters = CalculationMethod.Tehran();
  const today = new PrayerTimes(coordinates, localDate, parameters);
  const tomorrow = new PrayerTimes(coordinates, nextDate, parameters);
  const midnight = new Date((today.sunset.getTime() + tomorrow.fajr.getTime()) / 2);
  const entries: [string, string, Date][] = [
    ["fajr", "اذان صبح", today.fajr],
    ["sunrise", "طلوع آفتاب", today.sunrise],
    ["dhuhr", "اذان ظهر", today.dhuhr],
    ["sunset", "غروب آفتاب", today.sunset],
    ["maghrib", "اذان مغرب", today.maghrib],
    ["midnight", "نیمه‌شب شرعی", midnight],
  ];

  return entries.map(([key, label, instant]) => {
    const timestamp = instant.getTime();
    if (!Number.isFinite(timestamp)) {
      throw new RangeError("Prayer times cannot be calculated for this date");
    }
    return { key, label, time: timeFormatter.format(instant), timestamp };
  });
}
