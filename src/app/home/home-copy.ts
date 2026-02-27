import { HOME_COPY_EN } from "./home-copy-en";
import { HOME_COPY_ID } from "./home-copy-id";

export const HOME_COPY = {
  id: HOME_COPY_ID,
  en: HOME_COPY_EN,
} as const;

export type HomeCopy = (typeof HOME_COPY)[keyof typeof HOME_COPY];
