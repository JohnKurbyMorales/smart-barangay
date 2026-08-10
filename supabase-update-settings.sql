-- Update system settings to Barangay Mabiga, Hermosa, Bataan
UPDATE system_settings SET
  barangay_name     = 'Barangay Mabiga',
  city_municipality = 'Hermosa',
  province          = 'Bataan',
  region            = 'Region III - Central Luzon',
  map_default_lat   = 14.8261000,
  map_default_lng   = 120.5180000,
  map_default_zoom  = 15,
  updated_at        = NOW()
WHERE id = 1;

-- Confirm
SELECT barangay_name, city_municipality, province, map_default_lat, map_default_lng, map_default_zoom
FROM system_settings WHERE id = 1;