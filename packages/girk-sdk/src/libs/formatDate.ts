/**
 * Lightweight date formatting — drop-in replacement for date-fns `format`.
 *
 * Supports the subset of Unicode date-field tokens used in Girk templates:
 *
 * | Token | Output           | Example          |
 * |-------|------------------|------------------|
 * | `yy`  | 2-digit year     | `26`             |
 * | `yyyy`| 4-digit year     | `2026`           |
 * | `M`   | month (unpadded) | `1` … `12`      |
 * | `MM`  | zero-padded month| `01` … `12`      |
 * | `MMM` | short month name | `Jan` … `Dec`    |
 * | `dd`  | zero-padded day  | `01` … `31`      |
 * | `d`   | day (unpadded)   | `1` … `31`       |
 * | `HH`  | zero-padded hour | `00` … `23`      |
 * | `mm`  | zero-padded min  | `00` … `59`      |
 * | `ss`  | zero-padded sec  | `00` … `59`      |
 *
 * Anything else is passed through literally, including punctuation,
 * whitespace, and unrecognized letter sequences.
 *
 * @module girk-sdk/formatDate
 */

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * Format a date using a subset of date-fns / Unicode date tokens.
 *
 * @param dateInput - A `Date`, timestamp number, or date-parseable string.
 * @param format    - Format string, e.g. `"dd MMM yyyy"` or `"yy-MM-dd"`.
 * @returns Formatted date string.
 *
 * @example
 * ```ts
 * formatDate(new Date(2026, 4, 4), "dd MMM yyyy"); // "04 May 2026"
 * formatDate("2026-05-04", "yy-MM-dd");             // "26-05-04"
 * formatDate(new Date(2026, 0, 9), "d");             // "9"
 * ```
 */
export const formatDate = (
  dateInput: Date | string | number,
  format: string,
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    return "";
  }

  const year   = date.getFullYear();
  const month  = date.getMonth();   // 0-based
  const day    = date.getDate();
  const hours  = date.getHours();
  const mins   = date.getMinutes();
  const secs   = date.getSeconds();

  // Walk the format string left-to-right, consuming known tokens first.
  let out = "";
  let i = 0;

  while (i < format.length) {
    const ch = format[i];

    // Try to match the longest known token starting at position i.
    switch (ch) {
      case "y": {
        if (format.startsWith("yyyy", i)) {
          out += String(year);
          i += 4;
        } else if (format.startsWith("yy", i)) {
          out += String(year).slice(-2);
          i += 2;
        } else {
          out += ch;
          i += 1;
        }
        break;
      }

      case "M": {
        if (format.startsWith("MMM", i)) {
          out += MONTH_SHORT[month];
          i += 3;
        } else if (format.startsWith("MM", i)) {
          out += pad2(month + 1);
          i += 2;
        } else {
          out += String(month + 1);
          i += 1;
        }
        break;
      }

      case "d": {
        if (format.startsWith("dd", i)) {
          out += pad2(day);
          i += 2;
        } else {
          out += String(day);
          i += 1;
        }
        break;
      }

      case "H": {
        if (format.startsWith("HH", i)) {
          out += pad2(hours);
          i += 2;
        } else {
          out += pad2(hours);
          i += 1;
        }
        break;
      }

      case "m": {
        if (format.startsWith("mm", i)) {
          out += pad2(mins);
          i += 2;
        } else {
          out += pad2(mins);
          i += 1;
        }
        break;
      }

      case "s": {
        if (format.startsWith("ss", i)) {
          out += pad2(secs);
          i += 2;
        } else {
          out += pad2(secs);
          i += 1;
        }
        break;
      }

      default: {
        // Literal character (punctuation, space, etc.)
        out += ch;
        i += 1;
      }
    }
  }

  return out;
};
