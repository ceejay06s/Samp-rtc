// Location formatting constants

// Common country-specific address patterns
export const LOCATION_PATTERNS = {
  // US/Canada: "City, State, Country" or "City, State"
  'US': /^([^,]+),\s*([^,]+)(?:,\s*([^,]+))?$/,
  'CA': /^([^,]+),\s*([^,]+)(?:,\s*([^,]+))?$/,
  
  // UK: "City, County, Country" or "City, Country"
  'UK': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  
  // Australia: "City, State, Country" or "City, State"
  'AU': /^([^,]+),\s*([^,]+)(?:,\s*([^,]+))?$/,
  
  // Philippines: "City/Municipality, Province, Philippines" or "Barangay, City/Municipality, Province, Philippines"
  'PH': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  
  // European countries: "City, Country" or "City, Region, Country"
  'DE': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'FR': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'IT': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'ES': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'NL': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  
  // Asian countries: "City, Country" or "City, Region, Country"
  'JP': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'KR': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'CN': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'IN': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  
  // Latin American countries: "City, Country" or "City, State, Country"
  'BR': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'MX': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'AR': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  
  // Middle East: "City, Country" or "City, Region, Country"
  'AE': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'SA': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'TR': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  
  // African countries: "City, Country" or "City, Region, Country"
  'ZA': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'NG': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
  'EG': /^([^,]+)(?:,\s*([^,]+))?(?:,\s*([^,]+))?$/,
} as const;

// Country detection patterns
export const COUNTRY_DETECTION = {
  // US States and territories
  'US': /^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|AS|GU|MP|PR|VI)$/i,
  
  // Canadian provinces and territories
  'CA': /^(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)$/i,
  
  // UK regions
  'UK': /^(England|Scotland|Wales|Northern Ireland|London|Manchester|Birmingham|Liverpool|Leeds|Sheffield|Bristol|Glasgow|Edinburgh|Cardiff|Belfast)$/i,
  
  // Australian states and territories
  'AU': /^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/i,
  
  // Philippine provinces, regions, and common cities
  'PH': /^(Abra|Agusan del Norte|Agusan del Sur|Aklan|Albay|Antique|Apayao|Aurora|Basilan|Bataan|Batanes|Batangas|Benguet|Biliran|Bohol|Bukidnon|Bulacan|Cagayan|Camarines Norte|Camarines Sur|Camiguin|Capiz|Catanduanes|Cavite|Cebu|Cotabato|Davao de Oro|Davao del Norte|Davao del Sur|Davao Occidental|Davao Oriental|Dinagat Islands|Eastern Samar|Guimaras|Ifugao|Ilocos Norte|Ilocos Sur|Iloilo|Isabela|Kalinga|La Union|Laguna|Lanao del Norte|Lanao del Sur|Leyte|Maguindanao|Marinduque|Masbate|Metro Manila|Misamis Occidental|Misamis Oriental|Mountain Province|Negros Occidental|Negros Oriental|Northern Samar|Nueva Ecija|Nueva Vizcaya|Occidental Mindoro|Oriental Mindoro|Palawan|Pampanga|Pangasinan|Quezon|Quirino|Rizal|Romblon|Samar|Sarangani|Siquijor|Sorsogon|South Cotabato|Southern Leyte|Sultan Kudarat|Sulu|Surigao del Norte|Surigao del Sur|Tarlac|Tawi-Tawi|Zambales|Zamboanga del Norte|Zamboanga del Sur|Zamboanga Sibugay|Manila|Quezon City|Makati|Taguig|Pasig|Marikina|Caloocan|Malabon|Navotas|Valenzuela|Parañaque|Las Piñas|Muntinlupa|San Juan|Mandaluyong|Pasay|Pateros|Baguio|Davao|Cebu|Iloilo|Bacolod|Zamboanga|General Santos|Butuan|Iligan|Olongapo|Angeles|Dagupan|San Fernando|Naga|Legazpi|Roxas|Puerto Princesa|Tagaytay|Batangas|Lipa|San Pablo|Lucena|Antipolo|Cainta|Taytay|Angono|Binangonan|Cardona|Morong|Pililla|Rodriguez|San Mateo|Tanay|Teresa|Baras|Jala-Jala)$/i,
  
  // German states
  'DE': /^(Baden-Württemberg|Bayern|Berlin|Brandenburg|Bremen|Hamburg|Hessen|Mecklenburg-Vorpommern|Niedersachsen|Nordrhein-Westfalen|Rheinland-Pfalz|Saarland|Sachsen|Sachsen-Anhalt|Schleswig-Holstein|Thüringen)$/i,
  
  // French regions
  'FR': /^(Auvergne-Rhône-Alpes|Bourgogne-Franche-Comté|Bretagne|Centre-Val de Loire|Corse|Grand Est|Hauts-de-France|Île-de-France|Normandie|Nouvelle-Aquitaine|Occitanie|Pays de la Loire|Provence-Alpes-Côte d'Azur)$/i,
  
  // Japanese prefectures
  'JP': /^(Hokkaido|Aomori|Iwate|Miyagi|Akita|Yamagata|Fukushima|Ibaraki|Tochigi|Gunma|Saitama|Chiba|Tokyo|Kanagawa|Niigata|Toyama|Ishikawa|Fukui|Yamanashi|Nagano|Gifu|Shizuoka|Aichi|Mie|Shiga|Kyoto|Osaka|Hyogo|Nara|Wakayama|Tottori|Shimane|Okayama|Hiroshima|Yamaguchi|Tokushima|Kagawa|Ehime|Kochi|Fukuoka|Saga|Nagasaki|Kumamoto|Oita|Miyazaki|Kagoshima|Okinawa)$/i,
  
  // Indian states
  'IN': /^(Andhra Pradesh|Arunachal Pradesh|Assam|Bihar|Chhattisgarh|Goa|Gujarat|Haryana|Himachal Pradesh|Jharkhand|Karnataka|Kerala|Madhya Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Odisha|Punjab|Rajasthan|Sikkim|Tamil Nadu|Telangana|Tripura|Uttar Pradesh|Uttarakhand|West Bengal|Delhi|Jammu and Kashmir|Ladakh|Chandigarh|Dadra and Nagar Haveli|Daman and Diu|Lakshadweep|Puducherry|Andaman and Nicobar Islands)$/i,
} as const;

// Common country names and abbreviations
export const COUNTRY_NAMES = {
  'US': ['United States', 'USA', 'America', 'United States of America'],
  'CA': ['Canada', 'Canadian'],
  'UK': ['United Kingdom', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Great Britain', 'Britain'],
  'AU': ['Australia', 'Australian'],
  'PH': ['Philippines', 'Philippine', 'Filipino', 'Filipina'],
  'DE': ['Germany', 'German', 'Deutschland'],
  'FR': ['France', 'French'],
  'IT': ['Italy', 'Italian'],
  'ES': ['Spain', 'Spanish'],
  'NL': ['Netherlands', 'Holland', 'Dutch'],
  'JP': ['Japan', 'Japanese'],
  'KR': ['South Korea', 'Korea', 'Korean'],
  'CN': ['China', 'Chinese'],
  'IN': ['India', 'Indian'],
  'BR': ['Brazil', 'Brazilian'],
  'MX': ['Mexico', 'Mexican'],
  'AR': ['Argentina', 'Argentine'],
  'AE': ['United Arab Emirates', 'UAE', 'Emirates'],
  'SA': ['Saudi Arabia', 'Saudi'],
  'TR': ['Turkey', 'Turkish'],
  'ZA': ['South Africa', 'South African'],
  'NG': ['Nigeria', 'Nigerian'],
  'EG': ['Egypt', 'Egyptian'],
} as const;

// Philippine location indicators for enhanced detection
export const PHILIPPINE_INDICATORS = [
  'barangay', 'poblacion', 'san', 'santa', 'santo', 'santa maria', 'san jose',
  'san antonio', 'san miguel', 'san fernando', 'san carlos', 'san pablo',
  'san juan', 'san mateo', 'san pedro', 'san lorenzo', 'san isidro',
  'quezon', 'makati', 'taguig', 'pasig', 'marikina', 'caloocan', 'malabon',
  'navotas', 'valenzuela', 'parañaque', 'las piñas', 'muntinlupa', 'mandaluyong',
  'pasay', 'pateros', 'baguio', 'davao', 'cebu', 'iloilo', 'bacolod',
  'zamboanga', 'general santos', 'butuan', 'iligan', 'olongapo', 'angeles',
  'dagupan', 'naga', 'legazpi', 'roxas', 'puerto princesa', 'tagaytay',
  'batangas', 'lipa', 'lucena', 'antipolo', 'cainta', 'taytay', 'angono',
  'binangonan', 'cardona', 'morong', 'pililla', 'rodriguez', 'tanay',
  'teresa', 'baras', 'jala-jala'
] as const; 