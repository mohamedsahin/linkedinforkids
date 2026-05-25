/**
 * Plume — icon set. Lucide-style, 24×24, stroke-based line icons.
 * Use <Icon name="trophy" size={18} /> anywhere — keep them small and consistent.
 */
import { CSSProperties, JSX } from "react";

export type IconName =
  | "feather" | "home" | "user" | "users" | "shield" | "shieldCheck"
  | "trophy"  | "star" | "book" | "palette" | "code" | "music"
  | "sparkle" | "spark" | "plus" | "check" | "checkCircle" | "x"
  | "arrowRight" | "arrowLeft" | "arrowUpRight" | "chevronRight"
  | "chevronDown" | "chevronLeft" | "eye" | "eyeOff" | "lock" | "unlock"
  | "upload" | "download" | "image" | "file" | "link" | "globe"
  | "bell" | "settings" | "search" | "filter" | "flag" | "pin"
  | "school" | "cake" | "calendar" | "clock" | "edit" | "trash"
  | "moreHorizontal" | "moreVertical" | "menu" | "grid" | "list"
  | "layers" | "award" | "target" | "activity" | "bookmark" | "quote"
  | "play" | "logout" | "mail" | "phone" | "badge" | "info" | "sun" | "heart";

type Props = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
};

const paths: Record<IconName, JSX.Element> = {
  feather: <><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" /><line x1="16" y1="8" x2="2" y2="22" /><line x1="17.5" y1="15" x2="9" y2="15" /></>,
  home:    <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></>,
  user:    <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" /></>,
  users:   <><circle cx="9" cy="8" r="3" /><path d="M3 19c.7-2.7 3-4.5 6-4.5s5.3 1.8 6 4.5" /><path d="M16.5 5.5a3 3 0 0 1 0 5" /><path d="M18 19c-.3-1.5-1.1-2.8-2.2-3.7" /></>,
  shield:  <><path d="M12 3 4 6v6c0 4.5 3.4 8.5 8 9 4.6-.5 8-4.5 8-9V6z" /></>,
  shieldCheck: <><path d="M12 3 4 6v6c0 4.5 3.4 8.5 8 9 4.6-.5 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  trophy:  <><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3" /><path d="M7 5H4v2a3 3 0 0 0 3 3" /><path d="M10 13h4v3h-4z" /><path d="M8 20h8" /><path d="M12 16v4" /></>,
  star:    <><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.7l-5.4 2.8 1.2-6L3.3 9.3l6.1-.7z" /></>,
  book:    <><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" /><path d="M4 5v15a2 2 0 0 0 2 2h13" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.9-.5-1.4 0-1.1.9-2 2-2h2.5a4.5 4.5 0 0 0 4.5-4.5C22 6.4 17.5 3 12 3z" /><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/><circle cx="11.5" cy="7.5" r="1" fill="currentColor"/><circle cx="16.5" cy="10.5" r="1" fill="currentColor"/></>,
  code:    <><polyline points="9 8 5 12 9 16" /><polyline points="15 8 19 12 15 16" /></>,
  music:   <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>,
  sparkle: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /></>,
  spark:   <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></>,
  plus:    <><path d="M12 5v14M5 12h14" /></>,
  check:   <><polyline points="4 12 10 18 20 6" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/></>,
  x:       <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  arrowRight: <><line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" /></>,
  arrowLeft:  <><line x1="20" y1="12" x2="4" y2="12" /><polyline points="10 6 4 12 10 18" /></>,
  arrowUpRight: <><line x1="7" y1="17" x2="17" y2="7" /><polyline points="9 7 17 7 17 15" /></>,
  chevronRight: <><polyline points="9 6 15 12 9 18" /></>,
  chevronDown:  <><polyline points="6 9 12 15 18 9" /></>,
  chevronLeft:  <><polyline points="15 6 9 12 15 18" /></>,
  eye:     <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff:  <><path d="M3 3l18 18" /><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.4 4.2" /><path d="M6.6 6.6A17 17 0 0 0 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.9-.7" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  lock:    <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  unlock:  <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0" /></>,
  upload:  <><path d="M12 16V4" /><polyline points="6 10 12 4 18 10" /><path d="M4 20h16" /></>,
  download: <><path d="M12 4v12" /><polyline points="6 10 12 16 18 10" /><path d="M4 20h16" /></>,
  image:   <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 17-5-5L7 21" /></>,
  file:    <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><polyline points="14 3 14 8 19 8" /></>,
  link:    <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>,
  globe:   <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><line x1="3" y1="12" x2="21" y2="12" /></>,
  bell:    <><path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 7H4c.5-1.5 2-3 2-7z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>,
  search:  <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>,
  filter:  <><polygon points="3 5 21 5 14 13 14 19 10 21 10 13 3 5" /></>,
  flag:    <><line x1="5" y1="22" x2="5" y2="4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
  pin:     <><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  school:  <><path d="m3 9 9-5 9 5-9 5z" /><path d="M5 11v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></>,
  cake:    <><rect x="3" y="13" width="18" height="8" rx="1" /><line x1="3" y1="17" x2="21" y2="17" /><line x1="8" y1="6" x2="8" y2="10" /><line x1="12" y1="4" x2="12" y2="10" /><line x1="16" y1="6" x2="16" y2="10" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></>,
  clock:   <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></>,
  edit:    <><path d="M4 20h4l11-11-4-4L4 16z" /><line x1="14" y1="6" x2="18" y2="10" /></>,
  trash:   <><polyline points="4 7 20 7" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>,
  moreHorizontal: <><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></>,
  moreVertical:   <><circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></>,
  menu:    <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>,
  grid:    <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  list:    <><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="5" cy="6" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="18" r="1" fill="currentColor" /></>,
  layers:  <><polygon points="12 3 2 8 12 13 22 8 12 3" /><polyline points="2 13 12 18 22 13" /><polyline points="2 18 12 23 22 18" /></>,
  award:   <><circle cx="12" cy="9" r="6" /><polyline points="8 14 7 22 12 19 17 22 16 14" /></>,
  target:  <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>,
  activity: <><polyline points="3 12 7 12 10 4 14 20 17 12 21 12" /></>,
  bookmark: <><path d="M6 4h12v18l-6-4-6 4z" /></>,
  quote:   <><path d="M7 7h4v4H7c0 3 1.5 4 3 4v2c-3.5 0-5-2-5-5z" /><path d="M15 7h4v4h-4c0 3 1.5 4 3 4v2c-3.5 0-5-2-5-5z" /></>,
  play:    <><polygon points="7 5 19 12 7 19" fill="currentColor" /></>,
  logout:  <><path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" /><polyline points="14 8 19 12 14 16" /><line x1="9" y1="12" x2="19" y2="12" /></>,
  mail:    <><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></>,
  phone:   <><path d="M5 4h4l2 5-2 1a12 12 0 0 0 5 5l1-2 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></>,
  badge:   <><circle cx="12" cy="9" r="6" /><polyline points="8 13 6 22 12 19 18 22 16 13" /></>,
  info:    <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.8" fill="currentColor" /></>,
  sun:     <><circle cx="12" cy="12" r="4" /><line x1="12" y1="3" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="21" /><line x1="3" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="21" y2="12" /></>,
  heart:   <><path d="M12 21s-7-4.5-9-9c-1.4-3 .5-7 4.5-7 1.8 0 3.3 1 4.5 2.5C13.2 6 14.7 5 16.5 5c4 0 5.9 4 4.5 7-2 4.5-9 9-9 9z" /></>,
};

export function Icon({ name, size = 18, strokeWidth = 1.6, className = "", style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name] ?? paths.sparkle}
    </svg>
  );
}
