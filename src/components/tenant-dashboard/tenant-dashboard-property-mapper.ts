import type {
  TenantProperty,
  TenantRoom,
} from "./tenant-dashboard-property.types";

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const asTenantRoom = (raw: unknown): Partial<TenantRoom> | null =>
  raw && typeof raw === "object" ? (raw as Partial<TenantRoom>) : null;

const roomIdentity = (room: Partial<TenantRoom>) =>
  [
    normalizeText(room.name),
    normalizeText(room.price),
    typeof room.totalUnits === "number" ? String(room.totalUnits) : "",
    typeof room.maxGuests === "number" ? String(room.maxGuests) : "",
  ].join("|");

const resolveCanonicalId = (
  identityMap: Map<string, string>,
  identity: string,
  fallbackId: string,
) => (identityMap.get(identity) ?? fallbackId).trim();

const upsertIdentity = (
  identityMap: Map<string, string>,
  identity: string,
  canonicalId: string,
) => {
  if (identity && !identityMap.has(identity)) identityMap.set(identity, canonicalId);
};

const mergeRoomValue = (next: Partial<TenantRoom>, prev?: TenantRoom): TenantRoom => ({
  id: next.id ?? prev?.id ?? "",
  name: next.name ?? prev?.name ?? "-",
  price: next.price ?? prev?.price ?? "0",
  totalUnits: typeof next.totalUnits === "number" ? next.totalUnits : prev?.totalUnits ?? 0,
  maxGuests: typeof next.maxGuests === "number" ? next.maxGuests : prev?.maxGuests ?? 0,
});

const normalizeRooms = (rooms: unknown): TenantRoom[] => {
  const roomMap = new Map<string, TenantRoom>();
  const roomIdentityMap = new Map<string, string>();
  const roomList = Array.isArray(rooms) ? rooms : [];
  for (const rawRoom of roomList) appendRoom(roomMap, roomIdentityMap, rawRoom);
  return Array.from(roomMap.values());
};

const appendRoom = (
  roomMap: Map<string, TenantRoom>,
  identityMap: Map<string, string>,
  rawRoom: unknown,
) => {
  const room = asTenantRoom(rawRoom);
  const roomId = typeof room?.id === "string" ? room.id.trim() : "";
  const identity = room ? roomIdentity(room) : "";
  const canonicalId = resolveCanonicalId(identityMap, identity, roomId);
  if (!canonicalId) return;
  upsertIdentity(identityMap, identity, canonicalId);
  roomMap.set(canonicalId, mergeRoomValue({ ...room, id: canonicalId }, roomMap.get(canonicalId)));
};

const normalizeGallery = (galleryUrls: unknown) =>
  Array.from(
    new Set(
      (Array.isArray(galleryUrls) ? galleryUrls : []).filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      ),
    ),
  );

const propertyIdentity = (item: TenantProperty) =>
  [
    normalizeText(item.name),
    normalizeText(item.cityName),
    normalizeText(item.province),
  ].join("|");

const mergeStringList = (left: string[] = [], right: string[] = []) =>
  Array.from(new Set([...left, ...right]));

const createPropertyDraft = (
  item: TenantProperty,
  canonicalId: string,
  rooms: TenantRoom[],
): TenantProperty => ({
  id: canonicalId,
  name: item.name,
  description: item.description ?? null,
  address: item.address ?? null,
  categoryId: item.categoryId ?? null,
  categoryName: item.categoryName ?? null,
  cityName: item.cityName ?? null,
  province: item.province ?? null,
  coverUrl: item.coverUrl ?? null,
  galleryUrls: normalizeGallery(item.galleryUrls),
  rooms,
});

const mergePropertyDraft = (
  current: TenantProperty,
  next: TenantProperty,
): TenantProperty => ({
  ...current,
  name: current.name || next.name,
  description: current.description ?? next.description ?? null,
  address: current.address ?? next.address ?? null,
  categoryId: current.categoryId ?? next.categoryId ?? null,
  categoryName: current.categoryName ?? next.categoryName ?? null,
  cityName: current.cityName ?? next.cityName ?? null,
  province: current.province ?? next.province ?? null,
  coverUrl: current.coverUrl ?? next.coverUrl ?? null,
  galleryUrls: mergeStringList(current.galleryUrls, next.galleryUrls),
  rooms: normalizeRooms([...(current.rooms ?? []), ...(next.rooms ?? [])]),
});

const upsertProperty = (
  map: Map<string, TenantProperty>,
  item: TenantProperty,
  canonicalId: string,
) => {
  const next = createPropertyDraft(item, canonicalId, normalizeRooms(item.rooms));
  const current = map.get(canonicalId);
  if (!current) map.set(canonicalId, next);
  else map.set(canonicalId, mergePropertyDraft(current, next));
};

const isSamePropertyGroup = (existing: TenantProperty, candidate: TenantProperty) => {
  if (normalizeText(existing.name) !== normalizeText(candidate.name)) return false;
  const existingAddress = normalizeText(existing.address);
  const candidateAddress = normalizeText(candidate.address);
  const addressMatch = !existingAddress || !candidateAddress || existingAddress === candidateAddress;
  if (!addressMatch) return false;
  const cityMatch =
    (!normalizeText(existing.cityName) ||
      !normalizeText(candidate.cityName) ||
      normalizeText(existing.cityName) === normalizeText(candidate.cityName)) &&
    (!normalizeText(existing.province) ||
      !normalizeText(candidate.province) ||
      normalizeText(existing.province) === normalizeText(candidate.province));
  return cityMatch;
};

const mergeDuplicateProperties = (items: TenantProperty[]) => {
  const merged: TenantProperty[] = [];
  for (const item of items) mergeByGroup(merged, item);
  return merged.sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
};

const mergeByGroup = (merged: TenantProperty[], item: TenantProperty) => {
  const index = merged.findIndex((existing) => isSamePropertyGroup(existing, item));
  if (index < 0) {
    merged.push(item);
    return;
  }
  const existing = merged[index];
  if (!existing) return;
  merged[index] = mergePropertyDraft(existing, item);
};

export const mapTenantProperties = (items: TenantProperty[]) => {
  const propertyMap = new Map<string, TenantProperty>();
  const identityMap = new Map<string, string>();
  for (const item of items) {
    const propertyId = typeof item.id === "string" ? item.id.trim() : "";
    const identity = propertyIdentity(item);
    const canonicalId = resolveCanonicalId(identityMap, identity, propertyId);
    if (!canonicalId) continue;
    upsertIdentity(identityMap, identity, canonicalId);
    upsertProperty(propertyMap, item, canonicalId);
  }
  return mergeDuplicateProperties(Array.from(propertyMap.values()));
};
