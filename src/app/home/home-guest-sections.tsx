"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import type { HomeCopy } from "./home-copy";
import type { HomeHeroSlide, HomePropertyCard, HomeSearchForm } from "./home-types";
import { HomeHeroCarousel } from "./home-hero-carousel";
import { HomeSearchSection } from "./home-search-section";
import { HomeDiscoverSection } from "./home-discover-section";
import { HomePropertiesSection } from "./home-properties-section";
import { HomeStatsSection } from "./home-stats-section";

type Props = {
  copy: HomeCopy;
  heroSlides: HomeHeroSlide[];
  activeSlide: number;
  setActiveSlide: (value: number | ((current: number) => number)) => void;
  searchForm: HomeSearchForm;
  setSearchForm: Dispatch<SetStateAction<HomeSearchForm>>;
  openSearchPanel: "when" | "who" | null;
  setOpenSearchPanel: (panel: "when" | "who" | null) => void;
  searchPanelRef: RefObject<HTMLDivElement | null>;
  whenSummary: string;
  whoSummary: string;
  onSubmitSearch: () => void;
  onUpdateNights: (delta: number) => void;
  onUpdateAdults: (delta: number) => void;
  onUpdateChildren: (delta: number) => void;
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  allCategoryKey: string;
  properties: HomePropertyCard[];
  loading: boolean;
  error: string | null;
  destinationNotice: string | null;
  totalProperties: number;
  categoryCount: number;
  cityCount: number;
};

export const HomeGuestSections = (props: Props) => {
  const {
    copy,
    heroSlides,
    activeSlide,
    setActiveSlide,
    searchForm,
    setSearchForm,
    openSearchPanel,
    setOpenSearchPanel,
    searchPanelRef,
    whenSummary,
    whoSummary,
    onSubmitSearch,
    onUpdateNights,
    onUpdateAdults,
    onUpdateChildren,
    categories,
    activeCategory,
    onSelectCategory,
    allCategoryKey,
    properties,
    loading,
    error,
    destinationNotice,
    totalProperties,
    categoryCount,
    cityCount,
  } = props;

  return (
    <>
      <HomeHeroCarousel copy={copy} heroSlides={heroSlides} activeSlide={activeSlide} setActiveSlide={setActiveSlide} />
      <HomeSearchSection copy={copy} searchForm={searchForm} setSearchForm={setSearchForm} openSearchPanel={openSearchPanel} setOpenSearchPanel={setOpenSearchPanel} searchPanelRef={searchPanelRef} whenSummary={whenSummary} whoSummary={whoSummary} onSubmit={onSubmitSearch} onUpdateNights={onUpdateNights} onUpdateAdults={onUpdateAdults} onUpdateChildren={onUpdateChildren} />
      <HomeDiscoverSection copy={copy} categories={categories} activeCategory={activeCategory} onSelectCategory={onSelectCategory} allCategoryKey={allCategoryKey} />
      <HomePropertiesSection copy={copy} properties={properties} loading={loading} error={error} destinationNotice={destinationNotice} onCheckAvailability={onSubmitSearch} />
      <HomeStatsSection copy={copy} totalProperties={totalProperties} categoryCount={categoryCount} cityCount={cityCount} />
    </>
  );
};
