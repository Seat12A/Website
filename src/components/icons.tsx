/*
 * Icons of the pages other than the home page: Google Material Symbols (Rounded, weight 400), from npm
 * (@material-symbols/svg-400), never from a CDN. Only the icons imported here end up in the site: to add one, find
 * its name on fonts.google.com/icons, import its SVG below and export a component. Each icon is a React component
 * (pass it as an object, shadcn rule) that sizes itself like lucide's: 1em by default, `size-*` and the components'
 * `[&_svg]` rules apply.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import add from '@material-symbols/svg-400/rounded/add.svg?raw';
import arrowBack from '@material-symbols/svg-400/rounded/arrow_back.svg?raw';
import arrowOutward from '@material-symbols/svg-400/rounded/arrow_outward.svg?raw';
import cancelFill from '@material-symbols/svg-400/rounded/cancel-fill.svg?raw';
import checkCircle from '@material-symbols/svg-400/rounded/check_circle.svg?raw';
import checkCircleFill from '@material-symbols/svg-400/rounded/check_circle-fill.svg?raw';
import errorFill from '@material-symbols/svg-400/rounded/error-fill.svg?raw';
import helpFill from '@material-symbols/svg-400/rounded/help-fill.svg?raw';
import calendarToday from '@material-symbols/svg-400/rounded/calendar_today.svg?raw';
import check from '@material-symbols/svg-400/rounded/check.svg?raw';
import chevronLeft from '@material-symbols/svg-400/rounded/chevron_left.svg?raw';
import chevronRight from '@material-symbols/svg-400/rounded/chevron_right.svg?raw';
import circleFill from '@material-symbols/svg-400/rounded/circle-fill.svg?raw';
import close from '@material-symbols/svg-400/rounded/close.svg?raw';
import cloudOff from '@material-symbols/svg-400/rounded/cloud_off.svg?raw';
import contentCopy from '@material-symbols/svg-400/rounded/content_copy.svg?raw';
import del from '@material-symbols/svg-400/rounded/delete.svg?raw';
import factCheck from '@material-symbols/svg-400/rounded/fact_check.svg?raw';
import filterList from '@material-symbols/svg-400/rounded/filter_list.svg?raw';
import keyboardArrowDown from '@material-symbols/svg-400/rounded/keyboard_arrow_down.svg?raw';
import moreHoriz from '@material-symbols/svg-400/rounded/more_horiz.svg?raw';
import openInNew from '@material-symbols/svg-400/rounded/open_in_new.svg?raw';
import publicIcon from '@material-symbols/svg-400/rounded/public.svg?raw';
import refresh from '@material-symbols/svg-400/rounded/refresh.svg?raw';
import search from '@material-symbols/svg-400/rounded/search.svg?raw';
import searchOff from '@material-symbols/svg-400/rounded/search_off.svg?raw';
import sell from '@material-symbols/svg-400/rounded/sell.svg?raw';
import swapVert from '@material-symbols/svg-400/rounded/swap_vert.svg?raw';

export type Icon = (props: React.ComponentProps<'svg'>) => React.JSX.Element;

/* The SVG files hold one path in a 960-unit box (viewBox 0 -960 960 960), with a margin of 1/12 on each side; the
   viewBox crops it so that a 16px icon looks as big as lucide's did. */
function make(svg: string, name: string): Icon {
  const d = svg.match(/ d="([^"]+)"/)?.[1] ?? '';
  const Component = ({ className, ...props }: React.ComponentProps<'svg'>) => (
    <svg viewBox="80 -880 800 800" fill="currentColor" aria-hidden="true" className={cn('size-[1em] shrink-0', className)} {...props}>
      <path d={d} />
    </svg>
  );
  Component.displayName = name;
  return Component;
}

/* verdicts: a different shape for each, so the colour is never the only cue */
export const VerdictTrueIcon = make(checkCircleFill, 'VerdictTrueIcon');
export const VerdictMostlyTrueIcon = make(checkCircle, 'VerdictMostlyTrueIcon');
export const VerdictMisleadingIcon = make(errorFill, 'VerdictMisleadingIcon');
export const VerdictFalseIcon = make(cancelFill, 'VerdictFalseIcon');
export const VerdictUnverifiableIcon = make(helpFill, 'VerdictUnverifiableIcon');

export const AddIcon = make(add, 'AddIcon');
export const ArrowBackIcon = make(arrowBack, 'ArrowBackIcon');
export const ArrowOutwardIcon = make(arrowOutward, 'ArrowOutwardIcon');
export const CalendarIcon = make(calendarToday, 'CalendarIcon');
export const CheckIcon = make(check, 'CheckIcon');
export const ChevronLeftIcon = make(chevronLeft, 'ChevronLeftIcon');
export const ChevronRightIcon = make(chevronRight, 'ChevronRightIcon');
export const ChevronDownIcon = make(keyboardArrowDown, 'ChevronDownIcon');
export const CircleIcon = make(circleFill, 'CircleIcon');
export const CloseIcon = make(close, 'CloseIcon');
export const CloudOffIcon = make(cloudOff, 'CloudOffIcon');
export const CopyIcon = make(contentCopy, 'CopyIcon');
export const DeleteIcon = make(del, 'DeleteIcon');
export const FactCheckIcon = make(factCheck, 'FactCheckIcon');
export const FilterIcon = make(filterList, 'FilterIcon');
export const MoreIcon = make(moreHoriz, 'MoreIcon');
export const OpenInNewIcon = make(openInNew, 'OpenInNewIcon');
export const GlobeIcon = make(publicIcon, 'GlobeIcon');
export const RefreshIcon = make(refresh, 'RefreshIcon');
export const SearchIcon = make(search, 'SearchIcon');
export const SearchOffIcon = make(searchOff, 'SearchOffIcon');
export const TagIcon = make(sell, 'TagIcon');
export const SortIcon = make(swapVert, 'SortIcon');
