// U.S. Holidays using Nager.Date API
export interface Holiday {
  name: string;
  date: Date;
  color: string;
}

// Color mapping for different holiday types
const HOLIDAY_COLORS: { [key: string]: string } = {
  "New Year's Day": '#ef4444',
  "Martin Luther King Jr. Day": '#ef4444',
  "Groundhog Day": '#ef4444',
  "Valentine's Day": '#ec4899', // pink
  "Washington's Birthday": '#ef4444', // Presidents' Day
  "St. Patrick's Day": '#22c55e', // green
  "April Fools' Day": '#f97316', // orange
  "Good Friday": '#ef4444',
  "Easter Sunday": '#ef4444',
  "Passover": '#3b82f6', // blue
  "Cinco de Mayo": '#22c55e', // green
  "Mother's Day": '#ef4444',
  "Memorial Day": '#ef4444',
  "Juneteenth": '#ef4444',
  "Independence Day": '#ef4444',
  "Labor Day": '#ef4444',
  "Columbus Day": '#ef4444',
  "Halloween": '#f97316', // orange
  "Veterans Day": '#ef4444',
  "Thanksgiving": '#ef4444',
  "Hanukkah": '#3b82f6', // blue
  "Christmas Eve": '#ef4444',
  "Christmas Day": '#ef4444',
  "Kwanzaa": '#22c55e', // green
  "New Year's Eve": '#ef4444',
  "Father's Day": '#ef4444',
  "Ash Wednesday": '#a855f7', // purple
};

// Cache for API responses
const holidayCache: { [year: number]: Holiday[] } = {};

export async function getUSHolidays(year: number): Promise<Holiday[]> {
  // Check cache first
  if (holidayCache[year]) {
    return holidayCache[year];
  }

  const holidays: Holiday[] = [];

  try {
    // Fetch US public holidays from Nager.Date API
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`);

    if (!response.ok) {
      throw new Error('Failed to fetch holidays from API');
    }

    const apiHolidays = await response.json();

    // Convert API holidays to our format
    apiHolidays.forEach((holiday: any) => {
      const color = HOLIDAY_COLORS[holiday.name] || '#ef4444';
      holidays.push({
        name: holiday.name,
        date: new Date(holiday.date),
        color: color,
      });
    });
  } catch (error) {
    console.error('Error fetching holidays from API:', error);
    // Fall back to basic holidays if API fails
    return getFallbackHolidays(year);
  }

  // Add non-federal holidays that Nager.Date doesn't include
  const additionalHolidays = getAdditionalHolidays(year);
  holidays.push(...additionalHolidays);

  // Cache the results
  holidayCache[year] = holidays;

  return holidays;
}

// Additional holidays not included in Nager.Date API
function getAdditionalHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // Groundhog Day - February 2
  holidays.push({
    name: "Groundhog Day",
    date: new Date(year, 1, 2),
    color: '#ef4444',
  });

  // Valentine's Day - February 14
  holidays.push({
    name: "Valentine's Day",
    date: new Date(year, 1, 14),
    color: '#ec4899', // pink
  });

  // St. Patrick's Day - March 17
  holidays.push({
    name: "St. Patrick's Day",
    date: new Date(year, 2, 17),
    color: '#22c55e', // green
  });

  // April Fools' Day - April 1
  holidays.push({
    name: "April Fools' Day",
    date: new Date(year, 3, 1),
    color: '#f97316', // orange
  });

  // Cinco de Mayo - May 5
  holidays.push({
    name: "Cinco de Mayo",
    date: new Date(year, 4, 5),
    color: '#22c55e', // green
  });

  // Mother's Day - Second Sunday in May
  holidays.push({
    name: "Mother's Day",
    date: getNthDayOfMonth(year, 4, 0, 2), // 2nd Sunday of May
    color: '#ef4444',
  });

  // Father's Day - Third Sunday in June
  holidays.push({
    name: "Father's Day",
    date: getNthDayOfMonth(year, 5, 0, 3), // 3rd Sunday of June
    color: '#ef4444',
  });

  // Halloween - October 31
  holidays.push({
    name: "Halloween",
    date: new Date(year, 9, 31),
    color: '#f97316', // orange
  });

  // Christmas Eve - December 24
  holidays.push({
    name: "Christmas Eve",
    date: new Date(year, 11, 24),
    color: '#ef4444',
  });

  // Kwanzaa - December 26
  holidays.push({
    name: "Kwanzaa",
    date: new Date(year, 11, 26),
    color: '#22c55e', // green
  });

  // New Year's Eve - December 31
  holidays.push({
    name: "New Year's Eve",
    date: new Date(year, 11, 31),
    color: '#ef4444',
  });

  return holidays;
}

// Fallback holidays in case API fails
function getFallbackHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // New Year's Day
  holidays.push({
    name: "New Year's Day",
    date: new Date(year, 0, 1),
    color: '#ef4444',
  });

  // MLK Jr. Day - Third Monday in January
  holidays.push({
    name: "Martin Luther King Jr. Day",
    date: getNthDayOfMonth(year, 0, 1, 3),
    color: '#ef4444',
  });

  // Presidents' Day - Third Monday in February
  holidays.push({
    name: "Washington's Birthday",
    date: getNthDayOfMonth(year, 1, 1, 3),
    color: '#ef4444',
  });

  // Memorial Day - Last Monday in May
  holidays.push({
    name: "Memorial Day",
    date: getLastDayOfMonth(year, 4, 1),
    color: '#ef4444',
  });

  // Juneteenth - June 19
  holidays.push({
    name: "Juneteenth",
    date: new Date(year, 5, 19),
    color: '#ef4444',
  });

  // Independence Day - July 4
  holidays.push({
    name: "Independence Day",
    date: new Date(year, 6, 4),
    color: '#ef4444',
  });

  // Labor Day - First Monday in September
  holidays.push({
    name: "Labor Day",
    date: getNthDayOfMonth(year, 8, 1, 1),
    color: '#ef4444',
  });

  // Columbus Day - Second Monday in October
  holidays.push({
    name: "Columbus Day",
    date: getNthDayOfMonth(year, 9, 1, 2),
    color: '#ef4444',
  });

  // Veterans Day - November 11
  holidays.push({
    name: "Veterans Day",
    date: new Date(year, 10, 11),
    color: '#ef4444',
  });

  // Thanksgiving - Fourth Thursday in November
  holidays.push({
    name: "Thanksgiving",
    date: getNthDayOfMonth(year, 10, 4, 4),
    color: '#ef4444',
  });

  // Christmas Day - December 25
  holidays.push({
    name: "Christmas Day",
    date: new Date(year, 11, 25),
    color: '#ef4444',
  });

  // Add additional holidays
  const additionalHolidays = getAdditionalHolidays(year);
  holidays.push(...additionalHolidays);

  return holidays;
}

// Helper function to get the Nth occurrence of a day in a month
// dayOfWeek: 0=Sunday, 1=Monday, etc.
function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();

  // Calculate the date of the first occurrence of the desired day
  let daysToAdd = (dayOfWeek - firstDayOfWeek + 7) % 7;

  // Add weeks to get to the Nth occurrence
  daysToAdd += (n - 1) * 7;

  return new Date(year, month, 1 + daysToAdd);
}

// Helper function to get the last occurrence of a day in a month
function getLastDayOfMonth(year: number, month: number, dayOfWeek: number): Date {
  // Start from the last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const lastDayOfWeek = lastDay.getDay();

  // Calculate how many days to go back
  let daysToSubtract = (lastDayOfWeek - dayOfWeek + 7) % 7;

  return new Date(year, month, lastDay.getDate() - daysToSubtract);
}

// Helper function to check if a date matches a holiday
export function getHolidayForDate(date: Date, holidays: Holiday[]): Holiday | undefined {
  return holidays.find(holiday => {
    return holiday.date.getDate() === date.getDate() &&
           holiday.date.getMonth() === date.getMonth() &&
           holiday.date.getFullYear() === date.getFullYear();
  });
}

// Helper function to format a date to compare only date parts (not time)
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}
