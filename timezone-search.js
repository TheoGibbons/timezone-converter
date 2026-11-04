/*
 * Timezone search for the Select2 pickers on both pages.
 *
 * Zones can be found by city, state/province, country, abbreviation (PST, NZDT, IST), zone name
 * ("Pacific Time") or UTC offset ("UTC-8"). Abbreviations are only ever search terms: picking a
 * result adds the real zone (PST -> America/Los_Angeles), so daylight saving is right for any date.
 *
 * Needs jQuery, Select2 and moment-timezone loaded first.
 */
(function () {
  'use strict';

  const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  // Etc/GMT+8 etc. (Etc/GMT+0 and friends are just more names for UTC)
  const FIXED_OFFSET_NAME = /^Etc\/GMT[+-](?:[1-9]|1[0-4])$/;

  // Places people search for that aren't in any zone's name: states, provinces, big cities
  const PLACES = {
    'America/Los_Angeles': ['California', 'Sacramento', 'San Francisco', 'San Diego', 'San Jose', 'Bay Area', 'Silicon Valley', 'Oakland', 'Washington State', 'Seattle', 'Oregon', 'Portland', 'Nevada', 'Las Vegas', 'Reno', 'PST8PDT'],
    'America/Denver': ['Colorado', 'Utah', 'Salt Lake City', 'New Mexico', 'Albuquerque', 'Santa Fe', 'Wyoming', 'Montana', 'El Paso', 'MST7MDT'],
    'America/Boise': ['Idaho'],
    'America/Phoenix': ['Arizona', 'Tucson', 'Scottsdale', 'Mesa'],
    'America/Chicago': ['Illinois', 'Texas', 'Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'Wisconsin', 'Milwaukee', 'Minnesota', 'Minneapolis', 'Saint Paul', 'Iowa', 'Des Moines', 'Missouri', 'St Louis', 'Saint Louis', 'Kansas City', 'Kansas', 'Wichita', 'Oklahoma', 'Oklahoma City', 'Tulsa', 'Nebraska', 'Omaha', 'Arkansas', 'Little Rock', 'Louisiana', 'New Orleans', 'Mississippi', 'Alabama', 'Birmingham', 'Tennessee', 'Nashville', 'Memphis', 'South Dakota', 'Sioux Falls', 'North Dakota', 'Fargo', 'Bismarck', 'CST6CDT'],
    'America/New_York': ['New York City', 'NYC', 'Manhattan', 'Brooklyn', 'Washington DC', 'Washington', 'District of Columbia', 'Massachusetts', 'Boston', 'Pennsylvania', 'Philadelphia', 'Pittsburgh', 'New Jersey', 'Newark', 'Connecticut', 'Rhode Island', 'Vermont', 'New Hampshire', 'Maine', 'Delaware', 'Maryland', 'Baltimore', 'Virginia', 'Richmond', 'West Virginia', 'North Carolina', 'Charlotte', 'Raleigh', 'South Carolina', 'Georgia', 'Atlanta', 'Florida', 'Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Ohio', 'Columbus', 'Cleveland', 'Cincinnati', 'Knoxville', 'EST5EDT'],
    'America/Detroit': ['Michigan', 'Grand Rapids'],
    'America/Anchorage': ['Alaska'],
    'Pacific/Honolulu': ['Hawaii', 'Maui', 'Oahu'],
    'America/Puerto_Rico': ['San Juan'],
    'America/Toronto': ['Ontario', 'Ottawa', 'Quebec', 'Quebec City', 'Montreal'],
    'America/Vancouver': ['British Columbia'],
    'America/Edmonton': ['Alberta', 'Calgary'],
    'America/Winnipeg': ['Manitoba'],
    'America/Regina': ['Saskatchewan', 'Saskatoon'],
    'America/Halifax': ['Nova Scotia', 'Prince Edward Island', 'Charlottetown'],
    'America/Moncton': ['New Brunswick', 'Fredericton'],
    'America/St_Johns': ['Newfoundland'],
    'America/Whitehorse': ['Yukon'],
    'America/Iqaluit': ['Nunavut'],
    'America/Mexico_City': ['Guadalajara', 'Monterrey', 'Puebla'],
    'America/Tijuana': ['Baja California'],
    'America/Sao_Paulo': ['Rio de Janeiro', 'Brasilia', 'Belo Horizonte'],
    'America/Bogota': ['Medellin', 'Cali'],
    'Europe/London': ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Edinburgh', 'Glasgow', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Bristol', 'Cardiff', 'Belfast'],
    'Europe/Dublin': ['Cork', 'Galway'],
    'Europe/Paris': ['Lyon', 'Marseille', 'Toulouse', 'Nice'],
    'Europe/Berlin': ['Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Dusseldorf'],
    'Europe/Madrid': ['Barcelona', 'Valencia', 'Seville', 'Malaga'],
    'Europe/Rome': ['Milan', 'Naples', 'Turin', 'Florence', 'Venice'],
    'Europe/Amsterdam': ['Rotterdam', 'The Hague'],
    'Europe/Zurich': ['Geneva', 'Basel', 'Bern', 'Lausanne'],
    'Europe/Istanbul': ['Ankara', 'Izmir'],
    'Europe/Moscow': ['Saint Petersburg', 'St Petersburg'],
    'Asia/Kolkata': ['Mumbai', 'Bombay', 'Delhi', 'New Delhi', 'Bangalore', 'Bengaluru', 'Chennai', 'Madras', 'Hyderabad', 'Pune', 'Ahmedabad'],
    'Asia/Shanghai': ['Beijing', 'Shenzhen', 'Guangzhou', 'Chengdu', 'Hangzhou', 'Wuhan', 'Nanjing'],
    'Asia/Tokyo': ['Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka'],
    'Asia/Seoul': ['Busan', 'Incheon'],
    'Asia/Dubai': ['Abu Dhabi', 'Sharjah'],
    'Asia/Riyadh': ['Jeddah', 'Mecca', 'Medina'],
    'Asia/Karachi': ['Lahore', 'Islamabad'],
    'Asia/Ho_Chi_Minh': ['Saigon', 'Hanoi'],
    'Asia/Jakarta': ['Bandung', 'Surabaya'],
    'Asia/Manila': ['Quezon City', 'Cebu', 'Davao'],
    'Asia/Jerusalem': ['Tel Aviv', 'Haifa'],
    'Australia/Sydney': ['New South Wales', 'NSW', 'Canberra', 'Newcastle'],
    'Australia/Melbourne': ['Victoria', 'Geelong'],
    'Australia/Brisbane': ['Queensland', 'Gold Coast', 'Cairns'],
    'Australia/Adelaide': ['South Australia'],
    'Australia/Perth': ['Western Australia'],
    'Australia/Darwin': ['Northern Territory'],
    'Australia/Hobart': ['Tasmania'],
    'Pacific/Auckland': ['Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin', 'Queenstown', 'Aotearoa'],
    'Africa/Johannesburg': ['Cape Town', 'Durban', 'Pretoria'],
    'Africa/Lagos': ['Abuja'],
    'Africa/Nairobi': ['Mombasa'],
    'Africa/Casablanca': ['Rabat', 'Marrakesh']
  };

  // Other names for countries, on top of the English name the browser gives us
  const COUNTRY_ALIASES = {
    US: ['USA'],
    GB: ['UK', 'Britain', 'Great Britain'],
    AE: ['UAE'],
    NL: ['Holland'],
    CZ: ['Czech Republic'],
    TR: ['Turkey'],
    CI: ['Ivory Coast'],
    SZ: ['Swaziland'],
    MM: ['Burma']
  };

  // Abbreviations in everyday use that the timezone database doesn't have (it shows e.g. "+08" instead)
  const EXTRA_ABBREVIATIONS = {
    PT: ['America/Los_Angeles'],
    MT: ['America/Denver'],
    CT: ['America/Chicago'],
    ET: ['America/New_York'],
    NZT: ['Pacific/Auckland'],
    AET: ['Australia/Sydney'],
    SGT: ['Asia/Singapore'],
    MYT: ['Asia/Kuala_Lumpur'],
    PHT: ['Asia/Manila'],
    ICT: ['Asia/Bangkok', 'Asia/Ho_Chi_Minh', 'Asia/Phnom_Penh', 'Asia/Vientiane'],
    GST: ['Asia/Dubai', 'Asia/Muscat'],
    AST: ['Asia/Riyadh', 'Asia/Baghdad', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Bahrain', 'Asia/Aden'],
    TRT: ['Europe/Istanbul'],
    IRST: ['Asia/Tehran'],
    NPT: ['Asia/Kathmandu'],
    AFT: ['Asia/Kabul'],
    BRT: ['America/Sao_Paulo'],
    ART: ['America/Argentina/Buenos_Aires'],
    CLT: ['America/Santiago'],
    CLST: ['America/Santiago'],
    COT: ['America/Bogota'],
    PET: ['America/Lima'],
    VET: ['America/Caracas'],
    UYT: ['America/Montevideo'],
    BOT: ['America/La_Paz'],
    ECT: ['America/Guayaquil'],
    AoE: ['Etc/GMT+12'],
    Z: ['UTC']
  };

  // When several zones share an abbreviation, the one most people mean goes first
  const PREFERRED = {
    'America/Los_Angeles': ['PST', 'PDT', 'PT'],
    'America/Denver': ['MST', 'MDT', 'MT'],
    'America/Chicago': ['CST', 'CDT', 'CT'],
    'America/New_York': ['EST', 'EDT', 'ET'],
    'America/Anchorage': ['AKST', 'AKDT'],
    'Pacific/Honolulu': ['HST'],
    'America/Halifax': ['AST', 'ADT'],
    'America/St_Johns': ['NST', 'NDT'],
    'Europe/London': ['GMT', 'BST'],
    'Asia/Kolkata': ['IST'],
    'Australia/Sydney': ['AEST', 'AEDT'],
    'Australia/Adelaide': ['ACST', 'ACDT'],
    'Pacific/Auckland': ['NZST', 'NZDT']
  };

  let listed = null; // which zones go in the pickers
  let entries = null; // zone name -> search entry, built on first use
  const otherEntries = new Map(); // entries for options that aren't zones, e.g. "Unix Timestamp"
  let regionNames = null;

  /************** Utils **************/
  // "Los_Angeles", "São Paulo", "US/Pacific" -> "los angeles", "sao paulo", "us pacific"
  function normalize(text) {
    return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
  }

  // Minutes east of UTC -> "UTC-08:00"
  function formatOffset(minutes) {
    const abs = Math.abs(minutes);
    return 'UTC' + (minutes < 0 ? '-' : '+') + String(Math.floor(abs / 60)).padStart(2, '0') + ':' + String(abs % 60).padStart(2, '0');
  }

  // "UTC-8", "gmt+5:30", "+0530", "-08:00" -> minutes east of UTC, otherwise null
  function parseOffset(term) {
    const match = /^(?:utc|gmt)?\s*([+\-−])\s*(\d{1,2})(?:[:.]?(\d{2}))?$/i.exec(term);
    if (!match || Number(match[2]) > 14 || Number(match[3] || 0) > 59) {
      return null;
    }
    return (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] || 0));
  }

  // The browser's English names for a zone, e.g. "Pacific Standard Time", or null for each date
  function intlNames(name, style, dates) {
    try {
      const format = new Intl.DateTimeFormat('en-US', {timeZone: name, timeZoneName: style});
      return dates.map((date) => {
        const part = format.formatToParts(date).find((p) => p.type === 'timeZoneName');
        // Zones without a name come back as "GMT-08:00"
        return part && !/^GMT[+-]/.test(part.value) ? part.value : null;
      });
    } catch (e) {
      // Browser doesn't know this zone, or doesn't support this style
      return dates.map(() => null);
    }
  }

  function countryName(code) {
    try {
      regionNames = regionNames || new Intl.DisplayNames(['en'], {type: 'region'});
      return regionNames.of(code);
    } catch (e) {
      return null;
    }
  }

  /************** /Utils **************/

  /************** Search index **************/
  function addField(entry, text, weight) {
    const norm = text ? normalize(text) : '';
    if (!norm) {
      return;
    }
    const existing = entry.fields.get(norm);
    if (existing) {
      existing.weight = Math.max(existing.weight, weight);
    } else {
      entry.fields.set(norm, {text: text, norm: norm, words: norm.split(' '), weight: weight});
    }
  }

  function makeEntry(name, countries, now, dates) {
    const zone = moment.tz.zone(name);
    const entry = {
      name: name,
      zone: zone,
      fixed: zone.untils.length === 1,
      fields: new Map(),
      population: zone.population || 0,
      tzAbbrs: new Set(), // from the timezone database, so we know their offsets
      extraAbbrs: [],
      offsets: new Set(), // minutes east of UTC
      preferred: new Set(),
      detail: '',
      country: null,
      current: null
    };

    const segments = name.split('/').map((s) => s.replace(/_/g, ' '));
    if (!entry.fixed) {
      addField(entry, segments[segments.length - 1], 10); // the city
      segments.slice(1, -1).forEach((s) => addField(entry, s, 7)); // e.g. Indiana, North Dakota
    }
    addField(entry, name, name === 'UTC' ? 10 : 4);

    // Abbreviations and offsets used from a year ago to a year ahead
    zone.untils.forEach((until, i) => {
      const start = i ? zone.untils[i - 1] : -Infinity;
      if (until <= now - YEAR_MS || start >= now + YEAR_MS) {
        return;
      }
      entry.offsets.add(-zone.offsets[i]);
      const abbr = zone.abbrs[i];
      if (/^[A-Z]{2,6}$/.test(abbr) && abbr !== 'LMT') {
        entry.tzAbbrs.add(abbr);
        addField(entry, abbr, 8);
      }
    });

    if (entry.fixed && name !== 'UTC') {
      entry.detail = 'Fixed ' + formatOffset(-zone.offsets[0]) + ', no daylight saving';
      addField(entry, entry.detail, 3);
    } else {
      const long = intlNames(name, 'long', dates); // standard and daylight names
      const generic = intlNames(name, 'longGeneric', dates.slice(0, 1))[0]; // e.g. "Pacific Time"
      entry.detail = generic || long[0] || '';
      addField(entry, generic, 6);
      long.forEach((n) => addField(entry, n, 5));
    }

    // Antarctic stations share zones with the countries that supply them; leave those out elsewhere
    const own = countries.filter((code) => code !== 'AQ' || name.indexOf('Antarctica/') === 0);
    own.forEach((code) => {
      const weight = own.length === 1 ? 5 : 3;
      addField(entry, countryName(code), weight);
      addField(entry, code, 3);
      (COUNTRY_ALIASES[code] || []).forEach((alias) => addField(entry, alias, weight));
    });
    if (own.length === 1) {
      entry.country = countryName(own[0]);
    }

    return entry;
  }

  // List the zones people live in, plus UTC and fixed offsets. Old spellings (Asia/Calcutta),
  // US/Pacific style aliases and the many names for UTC are left out of the list, but searching
  // for them still finds the zone they stand for.
  function listing() {
    if (listed) {
      return listed;
    }

    const countriesOf = new Map();
    if (typeof moment.tz.countries === 'function') {
      moment.tz.countries().forEach((code) => moment.tz.zonesForCountry(code).forEach((name) => {
        countriesOf.set(name, (countriesOf.get(name) || []).concat(code));
      }));
    }

    const isListed = (name) => !countriesOf.size || name === 'UTC' || FIXED_OFFSET_NAME.test(name) || countriesOf.has(name);
    const all = moment.tz.names();
    listed = {
      countriesOf: countriesOf,
      names: all.filter(isListed),
      unlisted: all.filter((name) => !isListed(name))
    };
    return listed;
  }

  function index() {
    if (entries) {
      return entries;
    }

    const now = Date.now();
    const year = new Date(now).getUTCFullYear();
    const dates = [new Date(Date.UTC(year, 0, 15)), new Date(Date.UTC(year, 6, 15))];
    const list = listing();

    entries = new Map();
    list.names.forEach((name) => {
      entries.set(name, makeEntry(name, list.countriesOf.get(name) || [], now, dates));
    });

    // Unlisted names have exactly the same data as the zone they stand for. Where listed zones share
    // data too (Europe/London, Europe/Jersey), the main one is the one covering the most countries.
    const signature = (zone) => zone.offsets.join(' ') + '|' + zone.untils.join(' ');
    const weight = (entry) => (list.countriesOf.get(entry.name) || []).length * 1e12 + entry.population;
    const bySignature = new Map();
    entries.forEach((entry) => {
      const key = signature(entry.zone);
      if (!bySignature.has(key) || weight(entry) > weight(bySignature.get(key))) {
        bySignature.set(key, entry);
      }
    });

    list.unlisted.forEach((name) => {
      const zone = moment.tz.zone(name);
      const entry = zone ? bySignature.get(signature(zone)) : null;
      if (entry) {
        addField(entry, name, 3);
        addField(entry, name.split('/').pop().replace(/_/g, ' '), 5);
      }
    });

    Object.keys(PLACES).forEach((name) => {
      const entry = entries.get(name);
      (entry ? PLACES[name] : []).forEach((place) => addField(entry, place, 7));
    });

    Object.keys(EXTRA_ABBREVIATIONS).forEach((abbr) => {
      EXTRA_ABBREVIATIONS[abbr].forEach((name) => {
        const entry = entries.get(name);
        if (entry) {
          entry.extraAbbrs.push(abbr);
          addField(entry, abbr, 8);
        }
      });
    });

    Object.keys(PREFERRED).forEach((name) => {
      const entry = entries.get(name);
      if (entry) {
        entry.preferred = new Set(PREFERRED[name]);
      }
    });

    entries.forEach((entry) => {
      entry.fieldList = Array.from(entry.fields.values());
    });
    return entries;
  }

  // Search entry for a select option: a zone, or something else like "Unix Timestamp"
  function entryFor(data) {
    const entry = index().get(data.id);
    if (entry) {
      return entry;
    }
    if (!otherEntries.has(data.id)) {
      const other = {name: data.text, fields: new Map(), population: 0, tzAbbrs: new Set(), preferred: new Set()};
      addField(other, data.text, 10);
      other.fieldList = Array.from(other.fields.values());
      otherEntries.set(data.id, other);
    }
    return otherEntries.get(data.id);
  }

  // Abbreviation and offset right now, kept until the zone's next change
  function currentInfo(entry) {
    const now = Date.now();
    if (!entry.current || now >= entry.current.until) {
      const local = moment.tz(now, entry.name);
      let abbr = local.zoneAbbr();
      if (!/^[A-Za-z]{2,}$/.test(abbr)) {
        abbr = entry.extraAbbrs.find((a) => a.length > 1) || '';
      }
      entry.current = {abbr: abbr, offset: local.utcOffset(), until: entry.zone.untils.find((u) => u > now)};
    }
    return entry.current;
  }
  /************** /Search index **************/

  /************** Matching **************/
  function matchOffset(entry, offset) {
    if (!entry.zone) {
      return null;
    }
    if (entry.fixed) {
      return -entry.zone.offsets[0] === offset ? {score: 95, texts: []} : null;
    }
    if (currentInfo(entry).offset === offset) {
      return {score: 70, texts: []};
    }
    if (entry.offsets.has(offset)) {
      return {score: 50, texts: [formatOffset(offset) + ' part of the year']};
    }
    return null;
  }

  function matchText(entry, term) {
    const phrase = normalize(term);
    let best = null;

    // The exact name, e.g. "Etc/GMT+8", which would otherwise tie with "Etc/GMT-8"
    if (entry.name.toLowerCase() === term.toLowerCase()) {
      best = {score: 120, texts: []};
    } else if (phrase) {
      // Whole search found in one field: exactly, at its start, or at the start of a later word
      entry.fieldList.forEach((field) => {
        const score = field.norm === phrase ? 100 : field.norm.indexOf(phrase) === 0 ? 80 : (' ' + field.norm).indexOf(' ' + phrase) !== -1 ? 60 : 0;
        if (score && (!best || score + field.weight > best.score)) {
          best = {score: score + field.weight, texts: [field.text]};
        }
      });

      // Every word typed starts a word somewhere, e.g. "america ca" -> America/Los_Angeles (California)
      if (!best) {
        const texts = [];
        const found = phrase.split(' ').every((token) => {
          let hit = null;
          entry.fieldList.forEach((field) => {
            if ((!hit || field.weight > hit.weight) && field.words.some((word) => word.indexOf(token) === 0)) {
              hit = field;
            }
          });
          if (hit) {
            texts.push(hit.text);
          }
          return !!hit;
        });
        if (found) {
          best = {score: 40, texts: texts};
        }
      }
    }

    // Anything the plain name search used to find still turns up (but "ist" shouldn't find Boa_Vista)
    if (!best && term.length >= 4 && entry.name.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
      best = {score: 20, texts: []};
    }

    if (best) {
      const abbr = phrase.toUpperCase();
      if (entry.preferred.has(abbr) && entry.fields.has(phrase)) {
        best.score += 5;
      }
      best.abbr = entry.tzAbbrs.has(abbr) ? abbr : null;
    }
    return best;
  }

  /**
   * Select2 matcher. Ranks each match and notes why it matched for the result template, and which
   * abbreviation it was found by (e.g. "PST"), which pages read from the select2:select event data.
   */
  function matcher(params, data) {
    const term = (params.term || '').trim();
    data.rank = null;
    data.matchTexts = [];
    data.matchedAbbr = null;
    if (!term) {
      return data;
    }
    if (!data.id) {
      return null;
    }

    const entry = entryFor(data);
    const offset = parseOffset(term);
    const result = offset === null ? matchText(entry, term) : matchOffset(entry, offset);
    if (!result) {
      return null;
    }
    data.rank = result.score;
    data.matchTexts = result.texts;
    data.matchedAbbr = result.abbr || null;
    return data;
  }

  // Best match first, bigger places first among equals. With no search, pinned options lead.
  function sorter(pinned) {
    const pin = (id) => pinned.indexOf(id) === -1 ? pinned.length : pinned.indexOf(id);
    return function (results) {
      return results.slice().sort((a, b) => {
        if (a.rank !== null || b.rank !== null) {
          return (b.rank || 0) - (a.rank || 0) || entryFor(b).population - entryFor(a).population || a.text.localeCompare(b.text);
        }
        return pin(a.id) - pin(b.id) || a.text.localeCompare(b.text);
      });
    };
  }

  // Name and current abbreviation/offset, then the zone's name and country, then why it matched
  function templateResult(data) {
    const entry = data.id && !data.loading ? index().get(data.id) : null;
    if (!entry) {
      return data.text;
    }

    const $ = window.jQuery;
    const info = currentInfo(entry);
    const offset = [info.abbr, formatOffset(info.offset)].filter(Boolean).join(' · ');
    const detail = [entry.detail, entry.country].filter(Boolean).join(' · ');
    const shown = normalize([data.text, offset, detail].join(' '));
    const matches = (data.matchTexts || []).filter((text, i, all) => all.indexOf(text) === i && shown.indexOf(normalize(text)) === -1);

    // Laid out by timezone-search.css: two lines in narrow pickers, one line in wide ones
    const $row = $('<div class="tz-option"></div>').append(
      $('<span class="tz-option-name"></span>').text(data.text),
      $('<span class="tz-option-offset"></span>').text(offset)
    );
    if (detail || matches.length) {
      const $detail = $('<span class="tz-option-detail"></span>').text(detail).appendTo($row);
      matches.forEach((text) => $detail.append(' ', $('<span class="tz-option-match"></span>').text(text)));
    }
    return $row;
  }
  /************** /Matching **************/

  /************** Public **************/
  /**
   * Zones to list in the pickers, in alphabetical order
   *
   * @return {string[]}
   */
  function names() {
    return listing().names.slice();
  }

  /**
   * Fill a <select> with the zones and turn it into a Select2 picker with the search above
   *
   * @param {jQuery} select
   * @param {object} options  Select2 options
   * @param {string[]} pinned  Option values to list first when nothing has been typed
   */
  function attach(select, options, pinned) {
    const $ = window.jQuery;
    names().forEach((name) => select.append($('<option></option>').val(name).text(name)));
    select.select2($.extend({}, options, {matcher: matcher, sorter: sorter(pinned || ['UTC']), templateResult: templateResult}));
    select.on('select2:open', () => {
      $('.select2-dropdown .select2-search__field').attr('placeholder', 'e.g. California, India, PST or UTC-8');
    });
    // Building the index takes ~100ms, so do it once the page has loaded rather than on first open
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => index());
    } else {
      window.setTimeout(() => index(), 0);
    }
  }

  /**
   * When a zone was found by an abbreviation it isn't using at a given time, explain the difference,
   * e.g. America/Los_Angeles found with "PST" for a date in July, when it's on PDT.
   *
   * @param {string} name  Zone name
   * @param {string} abbr  The abbreviation that was searched for
   * @param {number} time  Unix timestamp in ms
   * @return {string|null}  HTML, or null when there's nothing to say
   */
  function abbreviationNote(name, abbr, time) {
    const zone = moment.tz.zone(name);
    if (!zone || !abbr) {
      return null;
    }

    // The offset the zone had under that abbreviation, at the nearest time it used it
    let abbrOffset = null;
    let distance = Infinity;
    zone.abbrs.forEach((a, i) => {
      if (a !== abbr) {
        return;
      }
      const start = i ? zone.untils[i - 1] : -Infinity;
      const d = time < start ? start - time : time >= zone.untils[i] ? time - zone.untils[i] : 0;
      if (d < distance) {
        distance = d;
        abbrOffset = -zone.offsets[i];
      }
    });

    const local = moment.tz(time, name);
    const offset = local.utcOffset();
    if (abbrOffset === null || abbrOffset === offset) {
      return null;
    }

    const hasAbbr = (m) => /^[A-Za-z]{2,}$/.test(m.zoneAbbr());
    const current = hasAbbr(local) ? `<b>${local.zoneAbbr()}</b> (${formatOffset(offset)})` : `<b>${formatOffset(offset)}</b>`;
    // The same wall-clock time read as the searched abbreviation
    const literal = moment.tz(time + (offset - abbrOffset) * 60 * 1000, name);
    const safeAbbr = escapeHtml(abbr);

    return `You searched for <b>${safeAbbr}</b>, but on ${local.format('dddd, MMMM Do YYYY')} ${escapeHtml(name)} is on ${current}, which is what's shown. ` +
      `${safeAbbr} is often written all year round to mean local time there. ` +
      `If a time given as ${safeAbbr} really means ${formatOffset(abbrOffset)}, then ${local.format('h:mm a')} ${safeAbbr} is ${literal.format(hasAbbr(literal) ? 'h:mm a z' : 'h:mm a')}.`;
  }

  window.TimezoneSearch = {
    names: names,
    attach: attach,
    matcher: matcher,
    sorter: sorter,
    abbreviationNote: abbreviationNote,
    formatOffset: formatOffset
  };
})();
