import { SEARCH_COPY_EN } from "./search-copy-en";
import { SEARCH_COPY_ID } from "./search-copy-id";

export const SEARCH_COPY = {
  id: SEARCH_COPY_ID,
  en: SEARCH_COPY_EN,
} as const;

export type SearchCopy = (typeof SEARCH_COPY)[keyof typeof SEARCH_COPY];
