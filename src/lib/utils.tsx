import React from 'react';

export function parseTextWithLinks(text: string) {
  if (!text) return null;

  // Regex to detect http/https URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      let label = "🔗 Abrir Link";
      if (part.includes("maps.app.goo.gl") || part.includes("google.com/maps")) {
        label = "📍 Ver no Google Maps";
      } else if (part.includes("waze.com")) {
        label = "🚗 Abrir no Waze";
      } else if (part.includes("1drv.ms") || part.includes("onedrive") || part.includes("drive.google")) {
        label = "📄 Documento / Roteiro";
      }

      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 my-1 rounded-lg text-xs font-semibold bg-[#1C52A4]/10 dark:bg-white/10 text-[#1C52A4] dark:text-amber-300 hover:bg-[#1C52A4] hover:text-white transition-all border border-[#1C52A4]/20 dark:border-white/20"
        >
          {label}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Robustly extracts the month number (1..12) from date strings.
 * Supports formats like:
 * - Single day: "22/08", "22/8", "22/08/2026"
 * - Multi-day range: "22 e 23/08", "22, 23 e 24/08", "15 a 18/10", "22/08 a 25/08"
 * - Text months: "22 e 23 de Agosto", "15 de Outubro"
 */
export function extractMonthFromDate(dateStr: string): number {
  if (!dateStr) return new Date().getMonth() + 1;
  const str = dateStr.trim().toLowerCase();

  // 1. Check DD/MM/YYYY or DD/MM format (e.g. "03/07/1985", "15/08", "03/07/85")
  const standardDateMatch = str.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (standardDateMatch) {
    const month = parseInt(standardDateMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return month;
    }
  }

  // 2. Try matching any slash format with month number (1..12) (e.g. "22 e 23/08")
  const slashMatches = str.match(/\/(\d{1,2})/g);
  if (slashMatches && slashMatches.length > 0) {
    for (const match of slashMatches) {
      const m = parseInt(match.replace('/', ''), 10);
      if (m >= 1 && m <= 12) return m;
    }
  }

  // 3. Try matching Portuguese month names or abbreviations
  const monthsMap: { [key: string]: number } = {
    janeiro: 1, jan: 1,
    fevereiro: 2, fev: 2,
    março: 3, marco: 3, mar: 3,
    abril: 4, abr: 4,
    maio: 5, mai: 5,
    junho: 6, jun: 6,
    julho: 7, jul: 7,
    agosto: 8, ago: 8,
    setembro: 9, set: 9,
    outubro: 10, out: 10,
    novembro: 11, nov: 11,
    dezembro: 12, dez: 12
  };

  for (const key of Object.keys(monthsMap)) {
    if (str.includes(key)) {
      return monthsMap[key];
    }
  }

  return new Date().getMonth() + 1;
}

/**
 * Checks if a given date string or month represents a date that is TODAY or in the FUTURE.
 * Hides past events from showing up in the current events list.
 */
export function isDateTodayOrFuture(dateStr: string, itemMonth?: number): boolean {
  if (!dateStr && !itemMonth) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  const str = (dateStr || '').trim().toLowerCase();

  // Check 4-digit year if present (e.g., 2025 vs 2026)
  const yearMatch = str.match(/\b(20\d\d)\b/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    if (y < currentYear) return false;
    if (y > currentYear) return true;
  }

  const m = itemMonth || extractMonthFromDate(str);
  if (m < currentMonth) return false;
  if (m > currentMonth) return true;

  // If in the current month, check the day(s)
  const dayMatches = str.match(/\b([0-2]?\d|3[01])\b/g);
  if (dayMatches && dayMatches.length > 0) {
    const dayNumbers = dayMatches
      .map(d => parseInt(d, 10))
      .filter(d => d >= 1 && d <= 31);

    if (dayNumbers.length > 0) {
      // For multi-day ranges (e.g., "15 a 18/08"), max day is 18. If max day < currentDay, it's in the past.
      const maxDay = Math.max(...dayNumbers);
      if (maxDay < currentDay) return false;
    }
  }

  return true;
}
