import * as Location from 'expo-location';
import { UserLocation } from '../types';
import { updateUserLocation } from '../services/userService';

export async function requestAndSaveUserLocation(uid: string): Promise<UserLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low,
  });

  let countryCode = 'XX';
  let region: string | undefined;

  try {
    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    const place = places[0];
    if (place?.isoCountryCode) countryCode = place.isoCountryCode.toUpperCase();
    if (place?.region) region = place.region;
  } catch {
    // Geocoding unavailable — keep coarse default
  }

  const location: UserLocation = {
    countryCode,
    region,
    updatedAt: new Date().toISOString(),
  };

  await updateUserLocation(uid, location);
  return location;
}

export function getRegionalBoardId(location: UserLocation | undefined, weekly: boolean): string | null {
  if (!location?.countryCode) return null;
  const prefix = weekly ? 'arcade_weekly' : 'arcade_alltime';
  if (location.region) {
    const safeRegion = location.region.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32);
    return `${prefix}_region_${location.countryCode}_${safeRegion}`;
  }
  return `${prefix}_country_${location.countryCode}`;
}
