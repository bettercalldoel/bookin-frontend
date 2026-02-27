export type PickedLocation = {
  latitude: number;
  longitude: number;
  resolvedAddress?: string;
  cityCandidate?: string;
  districtCandidate?: string;
  provinceCandidate?: string;
  countryCandidate?: string;
};

export type TenantPropertyLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  searchQuery: string;
  onPickLocation: (location: PickedLocation) => void;
};

export type ReverseGeocodeAddress = {
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
  country?: string;
};

export type ReverseGeocodePayload = {
  display_name?: string;
  address?: ReverseGeocodeAddress;
};

export type SetMarkerPosition = (
  nextLatitude: number,
  nextLongitude: number,
  options?: {
    zoom?: number;
    popupText?: string;
  },
) => void;

export type PointSelectionContext = {
  setMarkerPosition: SetMarkerPosition;
  onPickLocation: (location: PickedLocation) => void;
  setStatusMessage: (message: string) => void;
  setIsSearching: (value: boolean) => void;
};
