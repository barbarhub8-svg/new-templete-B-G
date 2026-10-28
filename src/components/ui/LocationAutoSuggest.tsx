import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  X,
  ChevronDown,
  Building2,
  Sparkles,
  Check,
  Compass,
  Loader2
} from 'lucide-react';

export interface LocationOption {
  id: string;
  type: 'all' | 'city' | 'area';
  city: string;
  area?: string;
  displayName: string;
  subtitle?: string;
  state?: string;
  popular?: boolean;
}

export const CURATED_LOCATIONS: LocationOption[] = [
  {
    id: 'all',
    type: 'all',
    city: 'all',
    displayName: 'All Locations',
    subtitle: 'Explore premier salons across all cities & areas',
  },
  // Jaipur Areas
  {
    id: 'jp-cscheme',
    type: 'area',
    city: 'Jaipur',
    area: 'C-Scheme',
    displayName: 'C-Scheme, Jaipur',
    subtitle: 'Statue Circle, Ashok Marg, Heritage cafes',
    state: 'Rajasthan',
    popular: true,
  },
  {
    id: 'jp-malviya',
    type: 'area',
    city: 'Jaipur',
    area: 'Malviya Nagar',
    displayName: 'Malviya Nagar, Jaipur',
    subtitle: 'Near World Trade Park, Sector 4 & GT',
    state: 'Rajasthan',
    popular: true,
  },
  {
    id: 'jp-vaishali',
    type: 'area',
    city: 'Jaipur',
    area: 'Vaishali Nagar',
    displayName: 'Vaishali Nagar, Jaipur',
    subtitle: 'Amrapali Circle, Queens Road, Nursery Circle',
    state: 'Rajasthan',
    popular: true,
  },
  {
    id: 'jp-rajapark',
    type: 'area',
    city: 'Jaipur',
    area: 'Raja Park',
    displayName: 'Raja Park, Jaipur',
    subtitle: 'Fashion market, Dhuleshwar Garden',
    state: 'Rajasthan',
    popular: true,
  },
  {
    id: 'jp-mansarovar',
    type: 'area',
    city: 'Jaipur',
    area: 'Mansarovar',
    displayName: 'Mansarovar, Jaipur',
    subtitle: 'Madhyam Marg, VT Road, City Park',
    state: 'Rajasthan',
  },
  {
    id: 'jp-civillines',
    type: 'area',
    city: 'Jaipur',
    area: 'Civil Lines',
    displayName: 'Civil Lines, Jaipur',
    subtitle: 'Jacob Road, Raj Bhavan Enclave',
    state: 'Rajasthan',
  },
  {
    id: 'jp-tonkroad',
    type: 'area',
    city: 'Jaipur',
    area: 'Tonk Road',
    displayName: 'Tonk Road, Jaipur',
    subtitle: 'Lal Kothi, Bapu Nagar, Nehru Garden',
    state: 'Rajasthan',
  },
  {
    id: 'jp-rambagh',
    type: 'area',
    city: 'Jaipur',
    area: 'Rambagh',
    displayName: 'Rambagh, Jaipur',
    subtitle: 'Bhawani Singh Road, Palace Estate',
    state: 'Rajasthan',
  },
  {
    id: 'jp-citypalace',
    type: 'area',
    city: 'Jaipur',
    area: 'City Palace',
    displayName: 'City Palace, Jaipur',
    subtitle: 'Jaleb Chowk, Old Walled City',
    state: 'Rajasthan',
  },
  // Major Cities
  {
    id: 'city-jaipur',
    type: 'city',
    city: 'Jaipur',
    displayName: 'Jaipur',
    subtitle: 'Pink City • 20+ Premier Salons & Studios',
    state: 'Rajasthan',
    popular: true,
  },
  {
    id: 'mum-bandra',
    type: 'area',
    city: 'Mumbai',
    area: 'Bandra',
    displayName: 'Bandra, Mumbai',
    subtitle: 'Pali Hill, Linking Road, Bandra West',
    state: 'Maharashtra',
    popular: true,
  },
  {
    id: 'mum-andheri',
    type: 'area',
    city: 'Mumbai',
    area: 'Andheri',
    displayName: 'Andheri, Mumbai',
    subtitle: 'Azad Nagar, Lokhandwala, Andheri West',
    state: 'Maharashtra',
  },
  {
    id: 'city-mumbai',
    type: 'city',
    city: 'Mumbai',
    displayName: 'Mumbai',
    subtitle: 'Maharashtra • Premium grooming lounges',
    state: 'Maharashtra',
    popular: true,
  },
  {
    id: 'del-cp',
    type: 'area',
    city: 'Delhi',
    area: 'Connaught Place',
    displayName: 'Connaught Place, Delhi',
    subtitle: 'Central Delhi, Inner Circle',
    state: 'Delhi',
  },
  {
    id: 'city-delhi',
    type: 'city',
    city: 'Delhi',
    displayName: 'Delhi / NCR',
    subtitle: 'National Capital Region',
    state: 'Delhi',
    popular: true,
  },
  {
    id: 'blr-koramangala',
    type: 'area',
    city: 'Bangalore',
    area: 'Koramangala',
    displayName: 'Koramangala, Bangalore',
    subtitle: 'Bengaluru South, 4th & 5th Block',
    state: 'Karnataka',
  },
  {
    id: 'city-bangalore',
    type: 'city',
    city: 'Bangalore',
    displayName: 'Bangalore',
    subtitle: 'Silicon Valley • Modern unisex lounges',
    state: 'Karnataka',
    popular: true,
  },
  {
    id: 'pune-fcroad',
    type: 'area',
    city: 'Pune',
    area: 'FC Road',
    displayName: 'FC Road, Pune',
    subtitle: 'Fergusson College Road, Shivajinagar',
    state: 'Maharashtra',
  },
  {
    id: 'city-pune',
    type: 'city',
    city: 'Pune',
    displayName: 'Pune',
    subtitle: 'Oxford of the East',
    state: 'Maharashtra',
  },
];

interface LocationAutoSuggestProps {
  value: LocationOption | null;
  onChange: (location: LocationOption) => void;
  availableShops?: any[];
  className?: string;
  placeholder?: string;
}

export function LocationAutoSuggest({
  value,
  onChange,
  availableShops = [],
  className = '',
  placeholder = 'Select city or area…',
}: LocationAutoSuggestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic locations: Merge curated list with distinct locations found in available shops
  const allLocations = useMemo(() => {
    const list = [...CURATED_LOCATIONS];
    const existingIds = new Set(list.map((l) => l.id.toLowerCase()));

    // Extract dynamic areas & cities from available shops
    availableShops.forEach((shop) => {
      const city = shop.city ? String(shop.city).trim() : '';
      const landmark = shop.landmark ? String(shop.landmark).trim() : '';

      if (landmark && city) {
        const id = `dynamic-${city.toLowerCase()}-${landmark.toLowerCase()}`;
        if (!existingIds.has(id)) {
          existingIds.add(id);
          list.push({
            id,
            type: 'area',
            city,
            area: landmark,
            displayName: `${landmark}, ${city}`,
            subtitle: shop.address ? String(shop.address).slice(0, 45) : `${city} locality`,
          });
        }
      }

      if (city) {
        const cityId = `dynamic-city-${city.toLowerCase()}`;
        if (!existingIds.has(cityId)) {
          existingIds.add(cityId);
          list.push({
            id: cityId,
            type: 'city',
            city,
            displayName: city,
            subtitle: `${city} • Verified Salons`,
          });
        }
      }
    });

    return list;
  }, [availableShops]);

  // Filter suggestions based on input
  const filteredOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allLocations;

    return allLocations.filter((opt) => {
      if (opt.id === 'all') return true;
      const matchName = opt.displayName.toLowerCase().includes(q);
      const matchCity = opt.city.toLowerCase().includes(q);
      const matchArea = opt.area?.toLowerCase().includes(q) ?? false;
      const matchSub = opt.subtitle?.toLowerCase().includes(q) ?? false;
      return matchName || matchCity || matchArea || matchSub;
    });
  }, [allLocations, searchQuery]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight on options change
  useEffect(() => {
    setHighlightIndex(0);
  }, [filteredOptions]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (loc: LocationOption) => {
      onChange(loc);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onChange]
  );

  // HTML5 Geolocation detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectMessage('Geolocation not supported by browser');
      setTimeout(() => setDetectMessage(null), 3000);
      return;
    }

    setDetectingLocation(true);
    setDetectMessage('Detecting your location…');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDetectingLocation(false);

        // Approximate detection based on Indian coordinates
        let matched: LocationOption | undefined;

        // Coordinates bounding Jaipur approx: 26.7 to 27.1, 75.6 to 76.0
        if (latitude >= 26.6 && latitude <= 27.2 && longitude >= 75.5 && longitude <= 76.1) {
          matched = CURATED_LOCATIONS.find((l) => l.id === 'jp-cscheme');
          setDetectMessage('Detected: C-Scheme, Jaipur');
        } else if (latitude >= 18.8 && latitude <= 19.4) {
          matched = CURATED_LOCATIONS.find((l) => l.id === 'mum-bandra');
          setDetectMessage('Detected: Bandra, Mumbai');
        } else if (latitude >= 28.4 && latitude <= 28.9) {
          matched = CURATED_LOCATIONS.find((l) => l.id === 'del-cp');
          setDetectMessage('Detected: Connaught Place, Delhi');
        } else if (latitude >= 12.8 && latitude <= 13.1) {
          matched = CURATED_LOCATIONS.find((l) => l.id === 'blr-koramangala');
          setDetectMessage('Detected: Koramangala, Bangalore');
        } else {
          // Default to Jaipur premier hub
          matched = CURATED_LOCATIONS.find((l) => l.id === 'city-jaipur');
          setDetectMessage('Location set to Jaipur');
        }

        if (matched) {
          setTimeout(() => {
            handleSelect(matched!);
            setDetectMessage(null);
          }, 600);
        }
      },
      (error) => {
        setDetectingLocation(false);
        setDetectMessage('Could not retrieve GPS (using Jaipur)');
        const fallback = CURATED_LOCATIONS.find((l) => l.id === 'jp-cscheme')!;
        setTimeout(() => {
          handleSelect(fallback);
          setDetectMessage(null);
        }, 1200);
      },
      { timeout: 7000 }
    );
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightIndex]) {
        handleSelect(filteredOptions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isAll = !value || value.id === 'all';

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-full min-w-[150px] sm:min-w-[180px] py-3 pl-3.5 pr-8 bg-[#141414]/90 backdrop-blur-md border rounded-2xl flex items-center gap-2 text-left transition-all duration-300 shadow-xl cursor-pointer ${
          isOpen || !isAll
            ? 'border-gold/60 text-white shadow-gold-sm bg-[#161410]'
            : 'border-white/15 hover:border-gold/40 text-white/80'
        }`}
      >
        <div className="w-5 h-5 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-3.5 h-3.5 text-gold" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <span className="block text-[10px] text-gold/80 font-semibold uppercase tracking-wider leading-none mb-0.5">
            {isAll ? 'Location' : value?.type === 'area' ? 'Area' : 'City'}
          </span>
          <span className="block text-xs sm:text-sm font-medium text-white truncate font-inter">
            {isAll ? placeholder : value.displayName}
          </span>
        </div>

        {/* Clear button if specific location is selected */}
        {!isAll ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(CURATED_LOCATIONS[0]);
            }}
            title="Reset to All Locations"
            className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
          </span>
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 text-gold/70 transition-transform duration-200 pointer-events-none ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Floating Auto-Suggestion Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[300px] sm:w-[350px] max-w-[90vw] bg-[#121212]/98 backdrop-blur-xl border border-gold/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Search Box Header */}
          <div className="p-3 border-b border-white/10 bg-[#161616]/80">
            <div className="relative flex items-center bg-[#0D0D0D] border border-white/15 focus-within:border-gold/60 rounded-xl px-3 py-2 transition-all">
              <Search className="w-4 h-4 text-gold/70 flex-shrink-0 mr-2" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, area, or landmark…"
                className="w-full bg-transparent text-xs text-white placeholder-white/40 outline-none font-inter"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Quick Detect Location Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="mt-2.5 w-full py-2 px-3 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold flex items-center justify-center gap-2 text-xs font-semibold font-inter transition-all cursor-pointer hover:border-gold/60 active:scale-[0.99]"
            >
              {detectingLocation ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                  <span>Detecting GPS Coordinates…</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-gold animate-pulse" />
                  <span>Use My Current Location</span>
                </>
              )}
            </button>

            {detectMessage && (
              <p className="text-[11px] text-center text-gold/90 font-inter mt-1.5 animate-in fade-in">
                {detectMessage}
              </p>
            )}
          </div>

          {/* Popular Areas Quick Chips (visible when not searching) */}
          {!searchQuery && (
            <div className="p-3 border-b border-white/8 bg-[#0E0E0E]">
              <span className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 font-inter">
                Popular in Jaipur & Metros
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'C-Scheme', id: 'jp-cscheme' },
                  { name: 'Malviya Nagar', id: 'jp-malviya' },
                  { name: 'Vaishali Nagar', id: 'jp-vaishali' },
                  { name: 'Raja Park', id: 'jp-rajapark' },
                  { name: 'Bandra', id: 'mum-bandra' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const match = CURATED_LOCATIONS.find((l) => l.id === item.id);
                      if (match) handleSelect(match);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      value?.id === item.id
                        ? 'bg-gold text-[#0A0A0A] border-gold font-bold'
                        : 'bg-[#181818] border-white/10 text-white/70 hover:text-white hover:border-gold/40'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions List */}
          <div className="max-h-[260px] overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-gold/30">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Compass className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/60 text-xs font-inter">No matching city or area found</p>
                <p className="text-white/30 text-[11px] font-inter mt-1">
                  Try searching "C-Scheme", "Malviya Nagar", or "Jaipur"
                </p>
              </div>
            ) : (
              filteredOptions.map((loc, idx) => {
                const isSelected = value?.id === loc.id;
                const isHighlighted = highlightIndex === idx;

                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`w-full px-3.5 py-2.5 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-gold/15 text-gold'
                        : isHighlighted
                        ? 'bg-white/5 text-white'
                        : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          loc.type === 'area'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : loc.type === 'city'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-gold/10 text-gold border border-gold/20'
                        }`}
                      >
                        {loc.type === 'area' ? (
                          <MapPin className="w-3.5 h-3.5" />
                        ) : loc.type === 'city' ? (
                          <Building2 className="w-3.5 h-3.5" />
                        ) : (
                          <Compass className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-inter font-medium text-xs sm:text-sm text-white truncate">
                            {loc.displayName}
                          </span>
                          {loc.popular && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-gold/20 text-gold border border-gold/30 uppercase">
                              Popular
                            </span>
                          )}
                        </div>
                        {loc.subtitle && (
                          <p className="text-[11px] text-white/40 truncate font-inter mt-0.5">
                            {loc.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
