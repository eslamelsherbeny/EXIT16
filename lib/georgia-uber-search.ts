import rawDatabase from '@/lib/georgia_locations_slim.json'
import { getCoordinatesForArea } from '@/lib/georgia-coordinates'
import {
  geocodeGeorgiaBuildingAction,
  reverseGeocodeGeorgiaPinAction,
} from '@/actions/georgia-geocode-action'
import type { LocaleCode } from '@/lib/i18n'

export type GeorgiaPlaceSuggestion = {
  id: string
  primaryText: string
  secondaryText: string
  street: string
  houseNumber: string
  areaId: string
  displayAreaLabel: string
  lat: number
  lng: number
  category: 'landmark' | 'street' | 'district' | 'city'
}

export type GeorgiaMapThemeMode =
  | 'streets'
  | 'sivrce'
  | 'realistic'
  | 'photoreal'
  | 'hybrid'
  | 'minimal'
  | 'contrast'
  | '3d'
  | 'satellite'

const CITY_KEY_ALIASES: Record<string, string> = {
  achalkalaki: 'akhalkalaki',
  chkhorotsqu: 'chkhorotsku',
  dedoplistsqaro: 'dedoplistskaro',
  tetritsqaro: 'tetritskaro',
  tqibuli: 'tkibuli',
  qazbegi: 'kazbegi',
  qvareli: 'kvareli',
  'akhal atoni': 'gudauta',
  apkhazeti: 'sokhumi',
}

export function resolveCityKeyInDb(rawCityName: string): string {
  const clean = (rawCityName || '')
    .replace(/\bMunicipality\b/gi, '')
    .replace(/\bAvtonomiuri Respublika\b/gi, '')
    .trim()
    .toLowerCase()
  return CITY_KEY_ALIASES[clean] || clean
}

const DISTRICT_KEY_ALIASES: Record<string, string> = {
  navtlugi: 'Navtlughi',
  dampalo: 'Dampalos Dasakhleba',
  aprika: 'Aprika',
}

export function resolveDistrictKeyInDb(rawDistKey: string): string {
  const clean = (rawDistKey || '').trim()
  return DISTRICT_KEY_ALIASES[clean.toLowerCase()] || clean
}

export const GEORGIA_CITY_COORDINATES: Record<
  string,
  { lat: number; lng: number; areaId: string }
> = {
  tbilisi: { lat: 41.7151, lng: 44.8271, areaId: 'Tbilisi - Saburtalo' },
  batumi: { lat: 41.6355, lng: 41.6115, areaId: 'Batumi - New Boulevard' },
  kutaisi: { lat: 42.2679, lng: 42.718, areaId: 'Kutaisi' },
  rustavi: { lat: 41.5495, lng: 44.9932, areaId: 'Rustavi' },
  kobuleti: {
    lat: 41.8214,
    lng: 41.7766,
    areaId: 'Batumi - Chakvi / Green Cape',
  },
  bakuriani: { lat: 41.7497, lng: 43.5325, areaId: 'Bakuriani' },
  gudauri: { lat: 42.4779, lng: 44.4761, areaId: 'Gudauri' },
  borjomi: { lat: 41.839, lng: 43.3891, areaId: 'Borjomi' },
  telavi: {
    lat: 41.9198,
    lng: 45.4731,
    areaId: 'Kakheti - Telavi / Kvareli',
  },
  gori: { lat: 41.9842, lng: 44.1158, areaId: 'Tbilisi - Didi Digomi' },
}

export function getCityCoordinatesAndArea(cityName: string): {
  lat: number
  lng: number
  areaId: string
} {
  const key = resolveCityKeyInDb(cityName)
  if (GEORGIA_CITY_COORDINATES[key]) {
    return GEORGIA_CITY_COORDINATES[key]
  }
  const cities = (rawDatabase as any).cities || {}
  if (cities[key]) {
    return {
      lat: Number(cities[key].lat) || 41.7151,
      lng: Number(cities[key].lng) || 44.8271,
      areaId:
        key === 'batumi'
          ? 'Batumi - New Boulevard'
          : key === 'tbilisi'
            ? 'Tbilisi - Saburtalo'
            : cities[key].nameEn || 'Tbilisi - Saburtalo',
    }
  }
  return { lat: 41.7151, lng: 44.8271, areaId: 'Tbilisi - Saburtalo' }
}

export const DISTRICT_TRANSLATIONS: Record<
  string,
  {
    ar: string
    ru: string
    en: string
    ka: string
    areaId: string
    lat?: number
    lng?: number
  }
> = {
  Vake: { ar: 'فاكي (Vake)', ru: 'Ваке (Vake)', en: 'Vake', ka: 'ვაკე', areaId: 'Tbilisi - Vake', lat: 41.709, lng: 44.7565 },
  Saburtalo: { ar: 'سابورتالو (Saburtalo)', ru: 'Сабуртало (Saburtalo)', en: 'Saburtalo', ka: 'საბურთალო', areaId: 'Tbilisi - Saburtalo', lat: 41.7275, lng: 44.743 },
  Vashlijvari: { ar: 'فاشليجفاري (Vashlijvari)', ru: 'Вашлиджвари', en: 'Vashlijvari', ka: 'ვაშლიჯვარი', areaId: 'Tbilisi - Saburtalo', lat: 41.758, lng: 44.761 },
  Vedzisi: { ar: 'فيدزيسي (Vedzisi)', ru: 'Ведзиси', en: 'Vedzisi', ka: 'ვეძისი', areaId: 'Tbilisi - Saburtalo', lat: 41.737, lng: 44.756 },
  Tkhinvali: { ar: 'تخينفالي (Tkhinvali)', ru: 'Тхинвали', en: 'Tkhinvali', ka: 'თხინვალა', areaId: 'Tbilisi - Vake', lat: 41.724, lng: 44.695 },
  'Kus Tba': { ar: 'كوس تبا (Kus Tba)', ru: 'Кус Тба', en: 'Kus Tba', ka: 'კუს ტბა', areaId: 'Tbilisi - Vake', lat: 41.7005, lng: 44.754 },
  Lisi: { ar: 'ليسي (Lisi)', ru: 'Лиси', en: 'Lisi', ka: 'ლისი', areaId: 'Tbilisi - Lisi Lake', lat: 41.744, lng: 44.716 },
  'Lisis Tba': { ar: 'بحيرة ليسي (Lisis Tba)', ru: 'Озеро Лиси', en: 'Lisis Tba', ka: 'ლისის ტბა', areaId: 'Tbilisi - Lisi Lake', lat: 41.7425, lng: 44.734 },
  Mukhatgverdi: { ar: 'موخاتغفيردي (Mukhatgverdi)', ru: 'Мухатгверди', en: 'Mukhatgverdi', ka: 'მუხათგვერდი', areaId: 'Tbilisi - Didi Digomi', lat: 41.812, lng: 44.749 },
  Mukhattsqaro: { ar: 'موخاتسقارو (Mukhattsqaro)', ru: 'Мухатцкаро', en: 'Mukhattsqaro', ka: 'მუხათწყარო', areaId: 'Tbilisi - Saburtalo', lat: 41.739, lng: 44.675 },
  Bagebi: { ar: 'باغيبي (Bagebi)', ru: 'Багеби', en: 'Bagebi', ka: 'ბაგები', areaId: 'Tbilisi - Vake', lat: 41.708, lng: 44.732 },
  'Sop. Dighomi': { ar: 'سوب. ديغومي (Sop. Dighomi)', ru: 'Село Дигоми', en: 'Sop. Dighomi', ka: 'დიღომი', areaId: 'Tbilisi - Didi Digomi', lat: 41.778, lng: 44.731 },
  'Dighmis Chala': { ar: 'ديغميس تشالا (Dighmis Chala)', ru: 'Дигмис Чала', en: 'Dighmis Chala', ka: 'დიღმის ჭალა', areaId: 'Tbilisi - Didi Digomi', lat: 41.785, lng: 44.782 },
  Koshigora: { ar: 'كوشيغورا (Koshigora)', ru: 'Кошигора', en: 'Koshigora', ka: 'კოშეგორა', areaId: 'Tbilisi - Didi Digomi', lat: 41.796, lng: 44.759 },
  'Dighomi 1-9': { ar: 'ديغومي 1-9 (Dighomi 1-9)', ru: 'Дигоми 1-9', en: 'Dighomi 1-9', ka: 'დიღმის მასივი', areaId: 'Tbilisi - Didi Digomi', lat: 41.768, lng: 44.773 },
  'Nutsubidzis Perdobi': { ar: 'هضبة نوتسوبيدزه (Nutsubidze)', ru: 'Плато Нуцубидзе', en: 'Nutsubidzis Perdobi', ka: 'ნუცუბიძის ფერდობი', areaId: 'Tbilisi - Saburtalo', lat: 41.731, lng: 44.719 },
  Didgori: { ar: 'ديدغوري (Didgori)', ru: 'Дидгори', en: 'Didgori', ka: 'დიდგორი', areaId: 'Tbilisi - Didi Digomi', lat: 41.792, lng: 44.702 },
  'Didi Dighomi': { ar: 'ديدي ديغومي (Didi Dighomi)', ru: 'Диди Дигоми', en: 'Didi Dighomi', ka: 'დიდი დიღომი', areaId: 'Tbilisi - Didi Digomi', lat: 41.789, lng: 44.754 },
  'Vazha-Pshavelas Kvartlebi': { ar: 'مربعات فاجا بشافيلا', ru: 'Кварталы Важа-Пшавела', en: 'Vazha-Pshavelas Kvartlebi', ka: 'ვაჟა-ფშაველას კვარტლები', areaId: 'Tbilisi - Saburtalo', lat: 41.724, lng: 44.728 },
  Zurgovana: { ar: 'زورغوفانا (Zurgovana)', ru: 'Зургована', en: 'Zurgovana', ka: 'ზურგოვანა', areaId: 'Tbilisi - Didi Digomi', lat: 41.795, lng: 44.748 },
  Varketili: { ar: 'فاركيتيلي (Varketili)', ru: 'Варкетили', en: 'Varketili', ka: 'ვარკეთილი', areaId: 'Tbilisi - Varketili', lat: 41.693, lng: 44.872 },
  Isani: { ar: 'إيساني (Isani)', ru: 'Исани', en: 'Isani', ka: 'ისანი', areaId: 'Tbilisi - Isani', lat: 41.6865, lng: 44.841 },
  Lilo: { ar: 'ليلو (Lilo)', ru: 'Лило', en: 'Lilo', ka: 'ლილო', areaId: 'Tbilisi - Samgori', lat: 41.678, lng: 44.965 },
  'Mesame Masivi': { ar: 'ميسامي ماسيفي (Mesame Masivi)', ru: 'Третий массив', en: 'Mesame Masivi', ka: 'მესამე მასივი', areaId: 'Tbilisi - Varketili', lat: 41.696, lng: 44.862 },
  'Moskovis Ave.': { ar: 'جادة موسكو (Moskovis Ave.)', ru: 'Московский пр.', en: 'Moskovis Ave.', ka: 'მოსკოვის გამზირი', areaId: 'Tbilisi - Samgori', lat: 41.673, lng: 44.868 },
  Aprika: { ar: 'أفريكا (Aprika)', ru: 'Африка', en: 'Aprika', ka: 'აფრიკა', areaId: 'Tbilisi - Samgori', lat: 41.668, lng: 44.895 },
  'Aeroportis Dasakhleba': { ar: 'حي المطار (Aeroportis)', ru: 'Пос. Аэропорта', en: 'Aeroportis Dasakhleba', ka: 'აეროპორტის დასახლება', areaId: 'Tbilisi - Samgori', lat: 41.679, lng: 44.945 },
  'Dampalos Dasakhleba': { ar: 'دامبالو (Dampalos)', ru: 'Дампало', en: 'Dampalos Dasakhleba', ka: 'დამპალოს დასახლება', areaId: 'Tbilisi - Samgori', lat: 41.682, lng: 44.881 },
  Vazisubani: { ar: 'فازيسوباني (Vazisubani)', ru: 'Вазисубани', en: 'Vazisubani', ka: 'ვაზისუბანი', areaId: 'Tbilisi - Isani', lat: 41.702, lng: 44.854 },
  Navtlughi: { ar: 'نافتلوغي (Navtlughi)', ru: 'Навтлуги', en: 'Navtlughi', ka: 'ნავთლუღი', areaId: 'Tbilisi - Isani', lat: 41.679, lng: 44.852 },
  Orkhevi: { ar: 'أورخيفي (Orkhevi)', ru: 'Орхеви', en: 'Orkhevi', ka: 'ორხევი', areaId: 'Tbilisi - Samgori', lat: 41.687, lng: 44.912 },
  Samgori: { ar: 'سامغوري (Samgori)', ru: 'Самгори', en: 'Samgori', ka: 'სამგორი', areaId: 'Tbilisi - Samgori', lat: 41.683, lng: 44.858 },
  Ponichala: { ar: 'فونيتشالا (Ponichala)', ru: 'Поничала', en: 'Ponichala', ka: 'ფონიჭალა', areaId: 'Tbilisi - Krtsanisi', lat: 41.635, lng: 44.885 },
  'Varketilis Meurneoba': { ar: 'مزرعة فاركيتيلي', ru: 'Варкетилис Меурнеоба', en: 'Varketilis Meurneoba', ka: 'ვარკეთილის მეურნეობა', areaId: 'Tbilisi - Varketili', lat: 41.708, lng: 44.892 },
  Gldani: { ar: 'غلداني (Gldani)', ru: 'Глдани', en: 'Gldani', ka: 'გლდანი', areaId: 'Tbilisi - Gldani', lat: 41.795, lng: 44.819 },
  Gldanula: { ar: 'غلدانولا (Gldanula)', ru: 'Глданула', en: 'Gldanula', ka: 'გლდანულა', areaId: 'Tbilisi - Gldani', lat: 41.812, lng: 44.818 },
  'Tbilisis Zghva': { ar: 'بحر تبليسي (Tbilisis Zghva)', ru: 'Тбилисское море', en: 'Tbilisis Zghva', ka: 'თბილისის ზღვა', areaId: 'Tbilisi - Tbilisi Sea', lat: 41.758, lng: 44.845 },
  Temka: { ar: 'تيمكا (Temka)', ru: 'Темка', en: 'Temka', ka: 'თემქა', areaId: 'Tbilisi - Nadzaladevi', lat: 41.778, lng: 44.812 },
  'Koniakis Dasakhleba': { ar: 'كونياكي (Koniakis)', ru: 'Коньячный пос.', en: 'Koniakis Dasakhleba', ka: 'კონიაკის დასახლება', areaId: 'Tbilisi - Gldani', lat: 41.782, lng: 44.798 },
  Lotkini: { ar: 'لوتكيني (Lotkini)', ru: 'Лоткини', en: 'Lotkini', ka: 'ლოტკინი', areaId: 'Tbilisi - Nadzaladevi', lat: 41.742, lng: 44.812 },
  Mukhiani: { ar: 'موخياني (Mukhiani)', ru: 'Мухиани', en: 'Mukhiani', ka: 'მუხიანი', areaId: 'Tbilisi - Gldani', lat: 41.786, lng: 44.832 },
  Nadzaladevi: { ar: 'نادزالاديفي (Nadzaladevi)', ru: 'Надзаладеви', en: 'Nadzaladevi', ka: 'ნაძალადევი', areaId: 'Tbilisi - Nadzaladevi', lat: 41.738, lng: 44.798 },
  Sanzona: { ar: 'سانزونا (Sanzona)', ru: 'Санзона', en: 'Sanzona', ka: 'სანზონა', areaId: 'Tbilisi - Nadzaladevi', lat: 41.759, lng: 44.792 },
  Avshniani: { ar: 'أفشنياني (Avshniani)', ru: 'Авшниани', en: 'Avshniani', ka: 'ავშნიანი', areaId: 'Tbilisi - Gldani', lat: 41.781, lng: 44.828 },
  Avchala: { ar: 'أفتشالا (Avchala)', ru: 'Авчала', en: 'Avchala', ka: 'ავჭალა', areaId: 'Tbilisi - Gldani', lat: 41.815, lng: 44.792 },
  Zahesi: { ar: 'زاهيسي (Zahesi)', ru: 'Загэс', en: 'Zahesi', ka: 'ზაჰესი', areaId: 'Tbilisi - Gldani', lat: 41.825, lng: 44.765 },
  Giorgitsminda: { ar: 'جيورجيتسميندا (Giorgitsminda)', ru: 'Гиоргицминда', en: 'Giorgitsminda', ka: 'გიორგიწმინდა', areaId: 'Tbilisi - Gldani', lat: 41.805, lng: 44.842 },
  Zghvisubani: { ar: 'زغفيسوباني (Zghvisubani)', ru: 'Згвисубани', en: 'Zghvisubani', ka: 'ზღვისუბანი', areaId: 'Tbilisi - Nadzaladevi', lat: 41.775, lng: 44.818 },
  'Gldanis Masivi': { ar: 'غلداني ماسيفي', ru: 'Массив Глдани', en: 'Gldanis Masivi', ka: 'გლდანის მასივი', areaId: 'Tbilisi - Gldani', lat: 41.794, lng: 44.816 },
  Didube: { ar: 'ديدوبي (Didube)', ru: 'Дидубе', en: 'Didube', ka: 'დიდუბე', areaId: 'Tbilisi - Didube', lat: 41.742, lng: 44.779 },
  'Dighmis Masivi': { ar: 'ديغميس ماسيفي (Dighmis Masivi)', ru: 'Дигомский массив', en: 'Dighmis Masivi', ka: 'დიღმის მასივი', areaId: 'Tbilisi - Digomi Massive', lat: 41.762, lng: 44.778 },
  Kukia: { ar: 'كوكيا (Kukia)', ru: 'Кукия', en: 'Kukia', ka: 'კუკია', areaId: 'Tbilisi - Chugureti / Marjanishvili', lat: 41.721, lng: 44.812 },
  Chughureti: { ar: 'تشوغوريتي (Chughureti)', ru: 'Чугурети', en: 'Chughureti', ka: 'ჩუღურეთი', areaId: 'Tbilisi - Chugureti / Marjanishvili', lat: 41.714, lng: 44.802 },
  Ivertubani: { ar: 'إيفيرتوباني (Ivertubani)', ru: 'Ивертубани', en: 'Ivertubani', ka: 'ივერთუბანი', areaId: 'Tbilisi - Chugureti / Marjanishvili', lat: 41.732, lng: 44.835 },
  'Svanetis Ubani': { ar: 'سفانيتيس أوباني (Svanetis Ubani)', ru: 'Сванетис Убани', en: 'Svanetis Ubani', ka: 'სვანეთის უბანი', areaId: 'Tbilisi - Chugureti / Marjanishvili', lat: 41.708, lng: 44.818 },
  'Dzveli Tbilisi': { ar: 'تبليسي القديمة (Dzveli Tbilisi)', ru: 'Старый Тбилиси', en: 'Dzveli Tbilisi', ka: 'ძველი თბილისი', areaId: 'Tbilisi - Old Tbilisi', lat: 41.691, lng: 44.808 },
  Elia: { ar: 'إيليا (Elia)', ru: 'Элия', en: 'Elia', ka: 'ელია', areaId: 'Tbilisi - Avlabari', lat: 41.698, lng: 44.825 },
  Vera: { ar: 'فيرا (Vera)', ru: 'Вера', en: 'Vera', ka: 'ვერა', areaId: 'Tbilisi - Vera', lat: 41.706, lng: 44.782 },
  Krtsanisi: { ar: 'كرتسانيسي (Krtsanisi)', ru: 'Крцаниси', en: 'Krtsanisi', ka: 'კრწანისი', areaId: 'Tbilisi - Krtsanisi', lat: 41.672, lng: 44.818 },
  Mtatsminda: { ar: 'متاتسميندا (Mtatsminda)', ru: 'Мтацминда', en: 'Mtatsminda', ka: 'მთაწმინდა', areaId: 'Tbilisi - Mtatsminda', lat: 41.696, lng: 44.792 },
  Sololaki: { ar: 'سولولاكي (Sololaki)', ru: 'Сололаки', en: 'Sololaki', ka: 'სოლოლაკი', areaId: 'Tbilisi - Old Tbilisi', lat: 41.6905, lng: 44.798 },
  'Tsavkisis Veli': { ar: 'تسافكيسيس فيلي', ru: 'Цавкисис Вели', en: 'Tsavkisis Veli', ka: 'წავკისის ველი', areaId: 'Tbilisi - Tabakhmela / Kojori', lat: 41.678, lng: 44.758 },
  Abanotubani: { ar: 'أبانوتوباني (Abanotubani)', ru: 'Абанотубани', en: 'Abanotubani', ka: 'აბანოთუბანი', areaId: 'Tbilisi - Old Tbilisi', lat: 41.688, lng: 44.811 },
  Avlabari: { ar: 'أفلاباري (Avlabari)', ru: 'Авлабари', en: 'Avlabari', ka: 'ავლაბარი', areaId: 'Tbilisi - Avlabari', lat: 41.6925, lng: 44.821 },
  Ortachala: { ar: 'أورتاتشالا (Ortachala)', ru: 'Ортачала', en: 'Ortachala', ka: 'ორთაჭალა', areaId: 'Tbilisi - Ortachala', lat: 41.675, lng: 44.828 },
  Metekhi: { ar: 'ميتيخي (Metekhi)', ru: 'Метехи', en: 'Metekhi', ka: 'მეტეხი', areaId: 'Tbilisi - Avlabari', lat: 41.69, lng: 44.815 },
  Tsveri: { ar: 'تسفيري (Tsveri)', ru: 'Цвери', en: 'Tsveri', ka: 'წვერი', areaId: 'Tbilisi - Tabakhmela / Kojori', lat: 41.662, lng: 44.675 },
  Akhaldaba: { ar: 'أخالدابا (Akhaldaba)', ru: 'Ахалдаба', en: 'Akhaldaba', ka: 'ახალდაბა', areaId: 'Tbilisi - Tabakhmela / Kojori', lat: 41.702, lng: 44.668 },
  Betania: { ar: 'بيتانيا (Betania)', ru: 'Бетания', en: 'Betania', ka: 'ბეთანია', areaId: 'Tbilisi - Tabakhmela / Kojori', lat: 41.69, lng: 44.615 },
  Kaklebi: { ar: 'كاكليبي (Kaklebi)', ru: 'Каклеби', en: 'Kaklebi', ka: 'კაკლები', areaId: 'Tbilisi - Vake', lat: 41.701, lng: 44.718 },
  Kiketi: { ar: 'كيكيتي (Kiketi)', ru: 'Кикети', en: 'Kiketi', ka: 'კიკეთი', areaId: 'Tbilisi - Tabakhmela / Kojori', lat: 41.655, lng: 44.648 },
  Kojori: { ar: 'كوجوري (Kojori)', ru: 'Коджори', en: 'Kojori', ka: 'კოჯორი', areaId: 'Tbilisi - Tabakhmela / Kojori', lat: 41.66, lng: 44.704 },
  Okrokana: { ar: 'أوكروكانا (Okrokana)', ru: 'Окрокана', en: 'Okrokana', ka: 'ოქროყანა', areaId: 'Tbilisi - Mtatsminda', lat: 41.685, lng: 44.768 },
  Tabakhmela: { ar: 'تاباخميلا (Tabakhmela)', ru: 'Табахмела', en: 'Tabakhmela', ka: 'ტაბახმელა', areaId: 'Tbilisi - Tabakhmela / Kojori', lat: 41.658, lng: 44.748 },
  Shindisi: { ar: 'شينديسي (Shindisi)', ru: 'Шиндиси', en: 'Shindisi', ka: 'შინდისი', areaId: 'Tbilisi - Tabakhmela / Kojori', lat: 41.668, lng: 44.758 },
  Tsavkisi: { ar: 'تسافكيسي (Tsavkisi)', ru: 'Цавкиси', en: 'Tsavkisi', ka: 'წავკისი', areaId: 'Tbilisi - Tabakhmela / Kojori', lat: 41.675, lng: 44.742 },
  Tsqneti: { ar: 'تسقنيتي (Tsqneti)', ru: 'Цхнети', en: 'Tsqneti', ka: 'წყნეთი', areaId: 'Tbilisi - Vake', lat: 41.694, lng: 44.698 },
  Mskhaldidi: { ar: 'مسخالديدي (Mskhaldidi)', ru: 'Мсхалдиди', en: 'Mskhaldidi', ka: 'მსხალდიდი', areaId: 'Tbilisi - Lisi Lake', lat: 41.755, lng: 44.665 },
  Tsodoreti: { ar: 'تسودوريتي (Tsodoreti)', ru: 'Цодорети', en: 'Tsodoreti', ka: 'წოდორეთი', areaId: 'Tbilisi - Lisi Lake', lat: 41.748, lng: 44.652 },
  Adlia: { ar: 'أدليا (Adlia)', ru: 'Адлия', en: 'Adlia', ka: 'ადლია', areaId: 'Batumi - New Boulevard', lat: 41.612, lng: 41.602 },
  'Aeroportis Ubani': { ar: 'حي المطار (Aeroportis Ubani)', ru: 'Район Аэропорта', en: 'Aeroportis Ubani', ka: 'აეროპორტის უბანი', areaId: 'Batumi - Airport District', lat: 41.608, lng: 41.605 },
  'Aghmasheneblis Ubani': { ar: 'حي أغماشينيبيلي (Aghmasheneblis)', ru: 'Район Агмашенебели', en: 'Aghmasheneblis Ubani', ka: 'აღმაშენებლის უბანი', areaId: 'Batumi - Bagrationi', lat: 41.625, lng: 41.618 },
  'Akhali Bulvari': { ar: 'البوليفارد الجديد (Akhali Bulvari)', ru: 'Новый Бульвар', en: 'Akhali Bulvari', ka: 'ახალი ბულვარი', areaId: 'Batumi - New Boulevard', lat: 41.628, lng: 41.605 },
  'Bagrationis Ubani': { ar: 'حي باغراتيوني (Bagrationis)', ru: 'Район Багратиони', en: 'Bagrationis Ubani', ka: 'ბაგრატიონის უბანი', areaId: 'Batumi - Bagrationi', lat: 41.635, lng: 41.632 },
  Bartskhana: { ar: 'بارتسخانا (Bartskhana)', ru: 'Барцхана', en: 'Bartskhana', ka: 'ბარცხანა', areaId: 'Batumi - Old Boulevard / Center', lat: 41.648, lng: 41.665 },
  'Boni-Gorodokis Ubani': { ar: 'بوني غورودوك (Boni-Gorodoki)', ru: 'Бони-Городок', en: 'Boni-Gorodokis Ubani', ka: 'ბონი-გოროდოკის უბანი', areaId: 'Batumi - Old Boulevard / Center', lat: 41.645, lng: 41.652 },
  Bulvari: { ar: 'البوليفارد (Bulvari)', ru: 'Бульвар', en: 'Bulvari', ka: 'ბულვარი', areaId: 'Batumi - Old Boulevard / Center', lat: 41.651, lng: 41.631 },
  Gonio: { ar: 'غونيو (Gonio)', ru: 'Гонио', en: 'Gonio', ka: 'გონიო', areaId: 'Batumi - Gonio / Kvariati', lat: 41.573, lng: 41.574 },
  'Tamaris Dasakhleba': { ar: 'تاماري (Tamaris Dasakhleba)', ru: 'Поселок Тамари', en: 'Tamaris Dasakhleba', ka: 'თამარის დასახლება', areaId: 'Batumi - Makhinjauri', lat: 41.655, lng: 41.672 },
  Todogauri: { ar: 'تودوغوري (Todogauri)', ru: 'Тодогаури', en: 'Todogauri', ka: 'თოდოგაური', areaId: 'Batumi - Airport District', lat: 41.618, lng: 41.658 },
  'Kakhabris Ubani': { ar: 'كاخيري (Kakhabris Ubani)', ru: 'Кахабери', en: 'Kakhabris Ubani', ka: 'კახაბრის უბანი', areaId: 'Batumi - Airport District', lat: 41.615, lng: 41.628 },
  Kvariati: { ar: 'كفارياتي (Kvariati)', ru: 'Квариати', en: 'Kvariati', ka: 'კვარიათი', areaId: 'Batumi - Gonio / Kvariati', lat: 41.552, lng: 41.568 },
  Makhinjauri: { ar: 'ماخينجاوري (Makhinjauri)', ru: 'Махинджаури', en: 'Makhinjauri', ka: 'მახინჯაური', areaId: 'Batumi - Makhinjauri', lat: 41.675, lng: 41.695 },
  Mejinistsqali: { ar: 'ميجينيسكالي (Mejinistsqali)', ru: 'Меджинисцкали', en: 'Mejinistsqali', ka: 'მეჯინისწყალი', areaId: 'Batumi - Airport District', lat: 41.605, lng: 41.625 },
  'Mtsvane Kontskhi': { ar: 'الرأس الأخضر (Mtsvane Kontskhi)', ru: 'Зеленый Мыс', en: 'Mtsvane Kontskhi', ka: 'მწვანე კონცხი', areaId: 'Batumi - Chakvi / Green Cape', lat: 41.695, lng: 41.712 },
  Chakvi: { ar: 'تشاكفي (Chakvi)', ru: 'Чакви', en: 'Chakvi', ka: 'ჩაქვი', areaId: 'Batumi - Chakvi / Green Cape', lat: 41.725, lng: 41.732 },
  'Rustavelis Ubani': { ar: 'حي روستافيلي (Rustavelis Ubani)', ru: 'Район Руставели', en: 'Rustavelis Ubani', ka: 'რუსთაველის უბანი', areaId: 'Batumi - Rustaveli Avenue', lat: 41.649, lng: 41.632 },
  'Dzveli Batumi': { ar: 'باتومي القديمة (Dzveli Batumi)', ru: 'Старый Батуми', en: 'Dzveli Batumi', ka: 'ძველი ბათუმი', areaId: 'Batumi - Old Boulevard / Center', lat: 41.651, lng: 41.639 },
  'Dzveli Batumis Ubani': { ar: 'حي باتومي القديمة', ru: 'Район Старого Батуми', en: 'Dzveli Batumis Ubani', ka: 'ძველი ბათუმის უბანი', areaId: 'Batumi - Old Boulevard / Center', lat: 41.651, lng: 41.639 },
  'Khimshiashvilis Ubani': { ar: 'خيمشياشفيلي (Khimshiashvilis)', ru: 'Район Химшиашвили', en: 'Khimshiashvilis Ubani', ka: 'ხიმშიაშვილის უბანი', areaId: 'Batumi - Khimshiashvili', lat: 41.638, lng: 41.615 },
  'Javakhishvilis Ubani': { ar: 'حي جافاخيشفيلي (Javakhishvilis)', ru: 'Район Джавахишвили', en: 'Javakhishvilis Ubani', ka: 'ჯავახიშვილის უბანი', areaId: 'Batumi - Bagrationi', lat: 41.639, lng: 41.626 },
}

export function getDistrictCoordinates(
  districtKey: string,
  fallbackAreaId: string
): { lat: number; lng: number } {
  const canonicalKey = resolveDistrictKeyInDb(districtKey)

  const entry =
    DISTRICT_TRANSLATIONS[canonicalKey] ||
    Object.values(DISTRICT_TRANSLATIONS).find(
      (d) => d.en.toLowerCase() === canonicalKey.toLowerCase()
    )
  if (entry?.lat && entry?.lng) {
    return { lat: entry.lat, lng: entry.lng }
  }

  const cities = (rawDatabase as any).cities || {}
  const cityMatch = cities[resolveCityKeyInDb(canonicalKey)]
  if (cityMatch?.lat && cityMatch?.lng) {
    return { lat: Number(cityMatch.lat), lng: Number(cityMatch.lng) }
  }

  for (const cityObj of Object.values<any>(cities)) {
    for (const [dKey, dObj] of Object.entries<any>(cityObj?.districts || {})) {
      if (
        dKey.toLowerCase() === canonicalKey.toLowerCase() &&
        dObj?.lat &&
        dObj?.lng
      ) {
        return { lat: Number(dObj.lat), lng: Number(dObj.lng) }
      }
    }
  }

  return getCoordinatesForArea(fallbackAreaId)
}

const KA_CHAR_MAP: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i',
  კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's',
  ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts',
  ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
}

type DbStreetRecord = {
  ka: string
  en: string
  coreEn: string
  districtKey: string
  cityNameEn: string
  areaId: string
}

let _kaToEnLookup: Map<string, string> | null = null
let _enToKaLookup: Map<string, string> | null = null
let _allDbStreetsList: DbStreetRecord[] | null = null

function stripStreetTypeWords(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(
      /\b(street|st\.?|avenue|ave\.?|lane|dead[- ]end|exit|square|highway|alley|bridge|descent|rise|gorge|ravine)\b/g,
      ''
    )
    .replace(/[^\w\s]/g, '')
    .trim()
}

function ensureDbIndexes() {
  if (_kaToEnLookup && _enToKaLookup && _allDbStreetsList) return
  _kaToEnLookup = new Map<string, string>()
  _enToKaLookup = new Map<string, string>()
  _allDbStreetsList = []

  const cities = (rawDatabase as any).cities || {}
  for (const [cityKey, cityObj] of Object.entries<any>(cities)) {
    const cityNameEn = cityObj?.nameEn || cityKey
    for (const [distKey, distObj] of Object.entries<any>(
      cityObj?.districts || {}
    )) {
      const trans = DISTRICT_TRANSLATIONS[distKey]
      const areaId =
        trans?.areaId ||
        (cityKey === 'batumi'
          ? 'Batumi - New Boulevard'
          : cityKey === 'tbilisi'
            ? 'Tbilisi - Saburtalo'
            : cityNameEn)

      for (const st of distObj?.streets || []) {
        const ka = (st.ka || '').trim()
        const en = (st.en || '').trim()
        const coreEn = stripStreetTypeWords(en)
        if (ka && en) {
          _kaToEnLookup.set(ka, en)
          _enToKaLookup.set(en.toLowerCase(), ka)
          if (coreEn.length >= 3 && !_enToKaLookup.has(coreEn)) {
            _enToKaLookup.set(coreEn, ka)
          }
        }
        if (en) {
          _allDbStreetsList.push({
            ka,
            en,
            coreEn,
            districtKey: distKey === 'All' ? cityNameEn : distKey,
            cityNameEn,
            areaId,
          })
        }
      }
    }
  }
}

export function matchStreetAndDistrictToOurDatabase(params: {
  rawStreet: string
  rawStreetKa?: string
  rawSuburb: string
  rawCity: string
  locale: LocaleCode
}): {
  street: string
  areaId: string
  displayLabel: string
} {
  ensureDbIndexes()
  const { rawStreet, rawStreetKa = '', rawSuburb, rawCity, locale } = params

  const cleanStreetInput = ensureNonGeorgianTextForLocale(
    rawStreet || rawStreetKa,
    locale
  )
  const cleanSuburbInput = ensureNonGeorgianTextForLocale(rawSuburb, 'en')
  const cleanCityInput =
    ensureNonGeorgianTextForLocale(rawCity, 'en') || 'Tbilisi'

  const normalizedQueryStreet = stripStreetTypeWords(cleanStreetInput)

  if (_allDbStreetsList && (normalizedQueryStreet.length >= 3 || rawStreetKa)) {
    const exactOrCloseMatch = _allDbStreetsList.find((item) => {
      if (rawStreetKa && item.ka === rawStreetKa.trim()) return true
      if (rawStreet && item.ka && item.ka === rawStreet.trim()) return true
      return (
        item.coreEn === normalizedQueryStreet ||
        (item.coreEn.length >= 4 &&
          normalizedQueryStreet.length >= 4 &&
          (item.coreEn.includes(normalizedQueryStreet) ||
            normalizedQueryStreet.includes(item.coreEn)))
      )
    })

    if (exactOrCloseMatch) {
      return {
        street:
          locale === 'ka'
            ? exactOrCloseMatch.ka || exactOrCloseMatch.en
            : exactOrCloseMatch.en,
        areaId: exactOrCloseMatch.areaId,
        displayLabel:
          exactOrCloseMatch.districtKey.toLowerCase() ===
          exactOrCloseMatch.cityNameEn.toLowerCase()
            ? exactOrCloseMatch.cityNameEn
            : `${exactOrCloseMatch.districtKey}, ${exactOrCloseMatch.cityNameEn}`,
      }
    }
  }

  const matchedDistrictKey = Object.keys(DISTRICT_TRANSLATIONS).find(
    (k) =>
      cleanSuburbInput.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(cleanSuburbInput.toLowerCase())
  )

  if (matchedDistrictKey && cleanSuburbInput.length >= 3) {
    const distInfo = DISTRICT_TRANSLATIONS[matchedDistrictKey]
    const cityLabel = distInfo.areaId.startsWith('Batumi')
      ? 'Batumi'
      : 'Tbilisi'
    return {
      street: cleanStreetInput,
      areaId: distInfo.areaId,
      displayLabel: `${matchedDistrictKey}, ${cityLabel}`,
    }
  }

  const fallbackAreaId = mapDetectedAddressToGeorgiaAreaId(rawCity, rawSuburb)
  const parts = [cleanSuburbInput || cleanCityInput, cleanCityInput].filter(
    Boolean
  )
  return {
    street: cleanStreetInput,
    areaId: fallbackAreaId,
    displayLabel: [...new Set(parts)].join(', '),
  }
}

export function ensureNonGeorgianTextForLocale(
  rawText: string,
  locale: LocaleCode
): string {
  const clean = (rawText || '').trim()
  if (!clean || locale === 'ka') return clean
  if (!/[ა-ჰ]/.test(clean)) return clean

  ensureDbIndexes()
  if (_kaToEnLookup?.has(clean)) {
    return _kaToEnLookup.get(clean)!
  }

  const replacedTypes = clean
    .replace(/ქუჩა/g, 'Street')
    .replace(/გამზირი/g, 'Avenue')
    .replace(/ჩიხი/g, 'Dead End')
    .replace(/შესახვევი/g, 'Lane')
    .replace(/გასასვლელი/g, 'Exit')
    .replace(/მოედანი/g, 'Square')
    .replace(/გზატკეცილი/g, 'Highway')

  const romanized = Array.from(replacedTypes)
    .map((ch) => KA_CHAR_MAP[ch] ?? ch)
    .join('')

  return romanized
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
}

export function getLocalizedDistrictLabel(
  districtKey: string,
  locale: LocaleCode,
  nameKaFallback?: string
): string {
  const canonicalKey = resolveDistrictKeyInDb(districtKey)
  const entry = DISTRICT_TRANSLATIONS[canonicalKey]
  if (locale === 'ka') {
    return entry?.ka || nameKaFallback || canonicalKey
  }
  if (!entry) return ensureNonGeorgianTextForLocale(canonicalKey, locale)
  if (locale === 'ar') return entry.ar
  if (locale === 'ru') return entry.ru
  return entry.en
}

export interface DistrictItem {
  key: string
  label: string
  nameKa: string
  areaId: string
  totalStreets: number
}

export function getCityDistrictsFromDb(
  cityId: string,
  locale: LocaleCode
): DistrictItem[] {
  const cities = (rawDatabase as any).cities || {}
  const dbCityKey = resolveCityKeyInDb(cityId)
  const cityObj = cities[dbCityKey]
  if (!cityObj || !cityObj.districts) return []

  const list: DistrictItem[] = []
  for (const [distKey, distVal] of Object.entries<any>(cityObj.districts)) {
    if (distKey === 'All') continue
    const trans = DISTRICT_TRANSLATIONS[distKey]
    const defaultArea =
      dbCityKey === 'batumi'
        ? 'Batumi - New Boulevard'
        : 'Tbilisi - Saburtalo'

    list.push({
      key: distKey,
      label: getLocalizedDistrictLabel(distKey, locale, distVal.nameKa),
      nameKa: distVal.nameKa || trans?.ka || distKey,
      areaId: trans?.areaId || defaultArea,
      totalStreets: distVal.streets?.length || 0,
    })
  }
  return list
}

export interface StreetItem {
  ka: string
  en: string
  display: string
  districtKey: string
  districtLabel: string
  areaId: string
  slug: string
}

export function getDistrictStreetsFromDb(
  cityId: string,
  districtKey: string | null,
  locale: LocaleCode,
  searchQuery = ''
): StreetItem[] {
  const cities = (rawDatabase as any).cities || {}
  const dbCityKey = resolveCityKeyInDb(cityId)
  const cityObj = cities[dbCityKey]
  const cleanSearch = searchQuery.trim().toLowerCase()

  if (!cityObj || !cityObj.districts) return []

  const districtKeys = Object.keys(cityObj.districts).filter((k) => k !== 'All')
  const hasRealDistricts = districtKeys.length > 0

  if (hasRealDistricts && !districtKey && !cleanSearch) {
    return []
  }

  const canonicalDistKey = districtKey
    ? resolveDistrictKeyInDb(districtKey)
    : null

  const matchedDistrictKey = canonicalDistKey
    ? Object.keys(cityObj.districts).find(
        (k) => k.toLowerCase() === canonicalDistKey.toLowerCase()
      )
    : null

  if (hasRealDistricts && districtKey && !matchedDistrictKey && !cleanSearch) {
    return []
  }

  const results: StreetItem[] = []
  const seenSlugs = new Set<string>()

  const districtsToScan = matchedDistrictKey
    ? [[matchedDistrictKey, cityObj.districts[matchedDistrictKey]]]
    : Object.entries<any>(cityObj.districts)

  for (const [dKey, dVal] of districtsToScan) {
    const trans = DISTRICT_TRANSLATIONS[dKey]
    const cityFallbackArea = getCityCoordinatesAndArea(cityId).areaId
    const areaId = trans?.areaId || cityFallbackArea

    for (const st of dVal?.streets || []) {
      const cleanEn = st.en || ensureNonGeorgianTextForLocale(st.ka, 'en')
      if (cleanSearch) {
        const matchEn = cleanEn.toLowerCase().includes(cleanSearch)
        const matchKa = st.ka?.toLowerCase().includes(cleanSearch)
        if (!matchEn && !matchKa) continue
      }

      const uniqueKey = st.slug || `${dKey}-${cleanEn}-${st.ka}`
      if (seenSlugs.has(uniqueKey)) continue
      seenSlugs.add(uniqueKey)

      const displayLabel = locale === 'ka' ? st.ka || cleanEn : cleanEn

      results.push({
        ka: st.ka || '',
        en: cleanEn,
        display: displayLabel,
        districtKey: dKey === 'All' ? cityObj.nameEn : dKey,
        districtLabel:
          dKey === 'All'
            ? cityObj.nameEn
            : getLocalizedDistrictLabel(dKey, locale, dVal.nameKa),
        areaId,
        slug: uniqueKey,
      })
    }
  }

  return results
}

export function ensureMapLibreRTLPlugin() {
  if (typeof window === 'undefined') return
  const maplibregl = (window as any).maplibregl
  if (!maplibregl) return

  try {
    const status = maplibregl.getRTLTextPluginStatus?.()
    if (status === 'unavailable') {
      maplibregl.setRTLTextPlugin(
        'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
        true
      )
    }
  } catch {}
}

export function getReliableGeorgiaMapStyle(
  mode: GeorgiaMapThemeMode = 'realistic'
): string | Record<string, any> {
  ensureMapLibreRTLPlugin()

  if (mode === 'photoreal' || mode === 'satellite') {
    return {
      version: 8,
      sources: {
        'google-satellite-hybrid': {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
          ],
          tileSize: 256,
          maxzoom: 20,
        },
      },
      layers: [
        {
          id: 'satellite-hybrid-layer',
          type: 'raster',
          source: 'google-satellite-hybrid',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    }
  }

  if (mode === 'minimal' || mode === 'sivrce') {
    return 'https://tiles.openfreemap.org/styles/positron'
  }

  return 'https://tiles.openfreemap.org/styles/liberty'
}

function buildMapLabelLanguageExpression(locale: LocaleCode): any[] {
  if (locale === 'ru') {
    return [
      'coalesce',
      ['get', 'name:ru'],
      ['get', 'name:en'],
      ['get', 'name:latin'],
      ['get', 'name'],
    ]
  }
  if (locale === 'ka') {
    return ['coalesce', ['get', 'name:ka'], ['get', 'name']]
  }
  if (locale === 'ar') {
    return [
      'coalesce',
      ['get', 'name:ar'],
      ['get', 'name:en'],
      ['get', 'name:latin'],
      ['get', 'name_en'],
      ['get', 'name'],
    ]
  }
  return [
    'coalesce',
    ['get', 'name:en'],
    ['get', 'name:latin'],
    ['get', 'name_en'],
    ['get', 'name'],
  ]
}

export function apply3DBuildingsToMap(
  map: any,
  locale: LocaleCode = 'en',
  mode: GeorgiaMapThemeMode = 'realistic',
  is3d = true
) {
  if (!map) return
  ensureMapLibreRTLPlugin()

  try {
    map.resize()
    const style = map.getStyle()
    if (!style?.layers) return

    if (mode === 'hybrid') {
      if (!map.getSource('google-satellite-underlay')) {
        map.addSource('google-satellite-underlay', {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
          ],
          tileSize: 256,
          maxzoom: 20,
        })
      }
      const firstExtrusionOrSymbol = style.layers.find(
        (l: any) =>
          l.type === 'fill-extrusion' ||
          l.type === 'symbol' ||
          String(l.id || '').includes('building')
      )?.id
      if (!map.getLayer('google-satellite-underlay-layer')) {
        map.addLayer(
          {
            id: 'google-satellite-underlay-layer',
            type: 'raster',
            source: 'google-satellite-underlay',
            paint: { 'raster-opacity': 0.92 },
          },
          firstExtrusionOrSymbol
        )
      }
    } else if (map.getLayer('google-satellite-underlay-layer')) {
      try {
        map.removeLayer('google-satellite-underlay-layer')
      } catch {}
    }

    const themeColors = {
      realistic: {
        bg: '#f2ede4',
        park: '#b8dfa6',
        water: '#94c4df',
        bldg2d: '#dfd3c5',
        bldg2dOutline: '#c8b7a6',
        bldg3d: ['#dfd5c8', '#cbbba8', '#b09d88'],
      },
      streets: {
        bg: '#f4efe8',
        park: '#c6e6b8',
        water: '#9ecae1',
        bldg2d: '#e4d9ca',
        bldg2dOutline: '#d0c2b0',
        bldg3d: ['#e8ddd0', '#d6c5b3', '#bca690'],
      },
      sivrce: {
        bg: '#edf1f7',
        park: '#d0e8dd',
        water: '#a6cee3',
        bldg2d: '#d9e1ec',
        bldg2dOutline: '#c3cfdf',
        bldg3d: ['#dce3ed', '#c6d0de', '#aab6c8'],
      },
      minimal: {
        bg: '#f8fafc',
        park: '#e4f2e9',
        water: '#cbd5e1',
        bldg2d: '#e5e7eb',
        bldg2dOutline: '#d1d5db',
        bldg3d: ['#e2e8f0', '#cbd5e1', '#94a3b8'],
      },
      contrast: {
        bg: '#f6e2ce',
        park: '#b8e0b2',
        water: '#8fc4e0',
        bldg2d: '#edd0b4',
        bldg2dOutline: '#64748b',
        bldg3d: ['#e5c4a3', '#cca37e', '#9c7554'],
      },
      hybrid: {
        bg: '#0f172a',
        park: '#1e293b',
        water: '#1e3a8a',
        bldg2d: '#d6c7b8',
        bldg2dOutline: '#ffffff',
        bldg3d: ['#d6c7b8', '#bca896', '#9e8977'],
      },
    }

    const activePalette =
      themeColors[mode as keyof typeof themeColors] || themeColors.realistic

    const building3dColorExpr = [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'render_height'], ['get', 'height'], 12],
      0,
      activePalette.bldg3d[0],
      22,
      activePalette.bldg3d[1],
      55,
      activePalette.bldg3d[2],
    ]

    const labelLangExpr = buildMapLabelLanguageExpression(locale)

    let firstSymbolLayerId: string | undefined
    let vectorSourceName = 'openmaptiles'
    let detectedTextFont: string[] = ['Noto Sans Regular']

    for (const layer of style.layers) {
      const layerId = String(layer.id || '').toLowerCase()
      const sourceLayer = String(
        (layer as any)['source-layer'] || ''
      ).toLowerCase()

      if ((layer as any).source && (layer as any)['source-layer']) {
        vectorSourceName = (layer as any).source
      }
      if (layer.type === 'symbol' && !firstSymbolLayerId) {
        firstSymbolLayerId = layer.id
      }
      if (layer.type === 'symbol') {
        try {
          const existingFont = map.getLayoutProperty(layer.id, 'text-font')
          if (Array.isArray(existingFont) && existingFont.length > 0) {
            detectedTextFont = existingFont
          }
        } catch {}
      }

      if (layer.type === 'background' && mode !== 'hybrid') {
        try {
          map.setPaintProperty(layer.id, 'background-color', activePalette.bg)
        } catch {}
      }

      if (layer.type === 'fill') {
        try {
          if (
            layerId.includes('park') ||
            layerId.includes('grass') ||
            layerId.includes('wood') ||
            layerId.includes('forest') ||
            layerId.includes('vegetation')
          ) {
            if (mode !== 'hybrid') {
              map.setPaintProperty(layer.id, 'fill-color', activePalette.park)
            }
          } else if (layerId.includes('water') && mode !== 'hybrid') {
            map.setPaintProperty(layer.id, 'fill-color', activePalette.water)
          } else if (
            layerId.includes('building') ||
            sourceLayer === 'building'
          ) {
            map.setPaintProperty(layer.id, 'fill-color', activePalette.bldg2d)
            map.setPaintProperty(
              layer.id,
              'fill-outline-color',
              activePalette.bldg2dOutline
            )
            map.setPaintProperty(
              layer.id,
              'fill-opacity',
              mode === 'hybrid' ? 0.35 : 0.9
            )
          }
        } catch {}
      }

      if (
        layer.type === 'fill-extrusion' &&
        layer.id !== 'selected-building-3d-highlight'
      ) {
        try {
          map.setLayoutProperty(
            layer.id,
            'visibility',
            is3d ? 'visible' : 'none'
          )
          map.setLayerZoomRange(layer.id, 13, 24)
          map.setPaintProperty(
            layer.id,
            'fill-extrusion-color',
            building3dColorExpr
          )
          map.setPaintProperty(layer.id, 'fill-extrusion-height', [
            'coalesce',
            ['get', 'render_height'],
            ['get', 'height'],
            12,
          ])
          map.setPaintProperty(layer.id, 'fill-extrusion-base', [
            'coalesce',
            ['get', 'render_min_height'],
            ['get', 'min_height'],
            0,
          ])
          map.setPaintProperty(
            layer.id,
            'fill-extrusion-opacity',
            mode === 'hybrid' ? 0.85 : 0.93
          )
        } catch {}
      }

      if (layer.type === 'symbol') {
        if (
          layerId.includes('housenumber') ||
          layerId.includes('house-number') ||
          sourceLayer === 'housenumber'
        ) {
          if (layer.id !== 'aqar-housenumbers-top-layer') {
            try {
              map.setLayoutProperty(layer.id, 'visibility', 'none')
            } catch {}
          }
          continue
        }

        if (layerId.includes('poi') || sourceLayer === 'poi') {
          try {
            map.setLayoutProperty(
              layer.id,
              'visibility',
              mode === 'minimal' ? 'none' : 'visible'
            )
            map.setLayoutProperty(layer.id, 'text-field', labelLangExpr)
          } catch {}
          continue
        }

        try {
          const currentField = map.getLayoutProperty(layer.id, 'text-field')
          if (currentField) {
            map.setLayoutProperty(layer.id, 'text-field', labelLangExpr)
          }
        } catch {}
      }
    }

    const hasExtrusion = style.layers.some(
      (l: any) =>
        l.type === 'fill-extrusion' &&
        l.id !== 'selected-building-3d-highlight'
    )
    if (!hasExtrusion && map.getSource(vectorSourceName)) {
      try {
        map.addLayer(
          {
            id: 'aqar-3d-buildings-base',
            type: 'fill-extrusion',
            source: vectorSourceName,
            'source-layer': 'building',
            minzoom: 13,
            layout: {
              visibility: is3d ? 'visible' : 'none',
            },
            paint: {
              'fill-extrusion-color': building3dColorExpr as any,
              'fill-extrusion-height': [
                'coalesce',
                ['get', 'render_height'],
                ['get', 'height'],
                12,
              ],
              'fill-extrusion-base': [
                'coalesce',
                ['get', 'render_min_height'],
                ['get', 'min_height'],
                0,
              ],
              'fill-extrusion-opacity': 0.92,
            },
          },
          firstSymbolLayerId
        )
      } catch {}
    }

    if (!map.getSource('selected-building-highlight')) {
      map.addSource('selected-building-highlight', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
    }
    if (!map.getLayer('selected-building-3d-highlight')) {
      map.addLayer(
        {
          id: 'selected-building-3d-highlight',
          type: 'fill-extrusion',
          source: 'selected-building-highlight',
          paint: {
            'fill-extrusion-color': '#ea580c',
            'fill-extrusion-height': is3d
              ? ['coalesce', ['get', 'render_height'], ['get', 'height'], 18]
              : 0.25,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.95,
          },
        },
        firstSymbolLayerId
      )
    } else {
      try {
        map.setPaintProperty(
          'selected-building-3d-highlight',
          'fill-extrusion-height',
          is3d
            ? ['coalesce', ['get', 'render_height'], ['get', 'height'], 18]
            : 0.25
        )
      } catch {}
    }

    if (map.getSource(vectorSourceName)) {
      if (map.getLayer('aqar-housenumbers-top-layer')) {
        try {
          map.removeLayer('aqar-housenumbers-top-layer')
        } catch {}
      }
      try {
        map.addLayer({
          id: 'aqar-housenumbers-top-layer',
          type: 'symbol',
          source: vectorSourceName,
          'source-layer': 'housenumber',
          minzoom: 16.8,
          maxzoom: 24,
          layout: {
            'text-field': ['coalesce', ['get', 'housenumber'], ['get', 'name']],
            'text-font': detectedTextFont,
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              16.8,
              9.5,
              17.5,
              10.5,
              19,
              12,
            ],
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'text-padding': 2,
          },
          paint: {
            'text-color': mode === 'hybrid' ? '#ffffff' : '#334155',
            'text-halo-color':
              mode === 'hybrid' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)',
            'text-halo-width': 1.4,
            'text-opacity': 0.92,
          },
        })
      } catch {}
    }
  } catch {}
}

function isPointInsidePolygonRing(
  lng: number,
  lat: number,
  ring: number[][]
): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function getPointToRingMinDistSq(
  lng: number,
  lat: number,
  ring: number[][]
): number {
  let minSq = Infinity
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const x1 = ring[j][0]
    const y1 = ring[j][1]
    const x2 = ring[i][0]
    const y2 = ring[i][1]
    const dx = x2 - x1
    const dy = y2 - y1
    const lenSq = dx * dx + dy * dy
    let t = 0
    if (lenSq > 0) {
      t = Math.max(0, Math.min(1, ((lng - x1) * dx + (lat - y1) * dy) / lenSq))
    }
    const projX = x1 + t * dx
    const projY = y1 + t * dy
    const dSq = (lng - projX) * (lng - projX) + (lat - projY) * (lat - projY)
    if (dSq < minSq) minSq = dSq
  }
  return minSq
}

function inflatePolygonCoordsSlightly(
  polyCoords: number[][][],
  scale = 1.015
): number[][][] {
  const outer = polyCoords[0]
  if (!outer || outer.length === 0) return polyCoords
  let cx = 0
  let cy = 0
  for (const pt of outer) {
    cx += pt[0]
    cy += pt[1]
  }
  cx /= outer.length
  cy /= outer.length

  return polyCoords.map((ring) =>
    ring.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale])
  )
}

export function highlight3DBuildingAtCoordinates(
  map: any,
  lng: number,
  lat: number
) {
  if (!map || typeof map.project !== 'function') return
  try {
    const source = map.getSource('selected-building-highlight')
    if (!source || typeof source.setData !== 'function') return

    const pt = map.project([lng, lat])
    const bbox: [[number, number], [number, number]] = [
      [pt.x - 16, pt.y - 16],
      [pt.x + 16, pt.y + 16],
    ]
    const features = map.queryRenderedFeatures(bbox) || []
    const buildingFeatures = features.filter(
      (f: any) =>
        f?.layer?.id !== 'selected-building-3d-highlight' &&
        (f?.layer?.type === 'fill-extrusion' ||
          f?.sourceLayer === 'building' ||
          String(f?.layer?.id || '').includes('building')) &&
        f?.geometry &&
        (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    )

    if (buildingFeatures.length === 0) {
      source.setData({ type: 'FeatureCollection', features: [] })
      return
    }

    let bestSinglePolygonCoords: number[][][] | null = null
    let bestProps: Record<string, any> = {}
    let bestEdgeDistSq = Infinity
    let foundInside = false

    for (const feat of buildingFeatures) {
      const geom = feat.geometry
      const props = feat.properties || {}
      const polygonsList: number[][][][] =
        geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates

      for (const polyCoords of polygonsList) {
        const outerRing = polyCoords?.[0]
        if (!outerRing || outerRing.length < 3) continue

        if (isPointInsidePolygonRing(lng, lat, outerRing)) {
          bestSinglePolygonCoords = polyCoords
          bestProps = props
          foundInside = true
          break
        }

        const edgeDistSq = getPointToRingMinDistSq(lng, lat, outerRing)
        if (edgeDistSq < bestEdgeDistSq) {
          bestEdgeDistSq = edgeDistSq
          bestSinglePolygonCoords = polyCoords
          bestProps = props
        }
      }
      if (foundInside) break
    }

    if (
      bestSinglePolygonCoords &&
      (foundInside || bestEdgeDistSq < 0.000000022)
    ) {
      const baseHeight = Number(
        bestProps.render_height || bestProps.height || 14
      )
      const cleanInflatedCoords = inflatePolygonCoordsSlightly(
        bestSinglePolygonCoords,
        1.015
      )

      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: cleanInflatedCoords,
            },
            properties: {
              ...bestProps,
              render_height: baseHeight + 0.35,
              height: baseHeight + 0.35,
            },
          },
        ],
      })
    } else {
      source.setData({ type: 'FeatureCollection', features: [] })
    }
  } catch {}
}

export function mapDetectedAddressToGeorgiaAreaId(
  cityRaw: string,
  suburbRaw: string
): string {
  const combined = `${cityRaw} ${suburbRaw}`.toLowerCase()
  if (
    combined.includes('batumi') ||
    combined.includes('ბათუმი') ||
    combined.includes('батуми') ||
    combined.includes('باتومي') ||
    combined.includes('باطومي')
  ) {
    if (combined.includes('gonio') || combined.includes('kvariati'))
      return 'Batumi - Gonio / Kvariati'
    if (combined.includes('chakvi') || combined.includes('mtsvane'))
      return 'Batumi - Chakvi / Green Cape'
    if (combined.includes('makhinjauri')) return 'Batumi - Makhinjauri'
    if (combined.includes('bagrationi')) return 'Batumi - Bagrationi'
    if (combined.includes('khimshiashvili')) return 'Batumi - Khimshiashvili'
    if (combined.includes('rustaveli')) return 'Batumi - Rustaveli Avenue'
    if (combined.includes('heroes') || combined.includes('shartava'))
      return 'Batumi - Alley of Heroes'
    return 'Batumi - New Boulevard'
  }
  if (combined.includes('kutaisi') || combined.includes('ქუთაისი'))
    return 'Kutaisi'
  if (combined.includes('rustavi') || combined.includes('რუსთავი'))
    return 'Rustavi'
  if (combined.includes('bakuriani') || combined.includes('ბაკურიანი'))
    return 'Bakuriani'
  if (combined.includes('gudauri') || combined.includes('გუდაური'))
    return 'Gudauri'
  if (combined.includes('borjomi') || combined.includes('ბორჯომი'))
    return 'Borjomi'
  if (combined.includes('telavi') || combined.includes('kakheti'))
    return 'Kakheti - Telavi / Kvareli'

  if (
    combined.includes('vake') ||
    combined.includes('ვაკე') ||
    combined.includes('bagebi')
  )
    return 'Tbilisi - Vake'
  if (combined.includes('vera') || combined.includes('ვერა'))
    return 'Tbilisi - Vera'
  if (combined.includes('mtatsminda') || combined.includes('მთაწმინდა'))
    return 'Tbilisi - Mtatsminda'
  if (combined.includes('krtsanisi') || combined.includes('ortachala'))
    return 'Tbilisi - Ortachala'
  if (
    combined.includes('isani') ||
    combined.includes('ისანი') ||
    combined.includes('vazisubani')
  )
    return 'Tbilisi - Isani'
  if (combined.includes('samgori') || combined.includes('სამგორი'))
    return 'Tbilisi - Samgori'
  if (combined.includes('varketili') || combined.includes('ვარკეთილი'))
    return 'Tbilisi - Varketili'
  if (
    combined.includes('gldani') ||
    combined.includes('გლდანი') ||
    combined.includes('mukhiani')
  )
    return 'Tbilisi - Gldani'
  if (
    combined.includes('nadzaladevi') ||
    combined.includes('temka') ||
    combined.includes('sanzona')
  )
    return 'Tbilisi - Nadzaladevi'
  if (combined.includes('didube') || combined.includes('დიდუბე'))
    return 'Tbilisi - Didube'
  if (combined.includes('chughureti') || combined.includes('marjanishvili'))
    return 'Tbilisi - Chugureti / Marjanishvili'
  if (combined.includes('avlabari') || combined.includes('ავლაბარი'))
    return 'Tbilisi - Avlabari'
  if (combined.includes('dighomi') || combined.includes('დიღომი'))
    return 'Tbilisi - Didi Digomi'
  if (combined.includes('lisi')) return 'Tbilisi - Lisi Lake'

  return 'Tbilisi - Saburtalo'
}

export function getInstantLocalGeorgiaSuggestions(
  query: string,
  locale: LocaleCode = 'ar',
  cityFilter?: string | null
): GeorgiaPlaceSuggestion[] {
  const rawQ = query.trim()
  if (!rawQ) return []

  const houseMatch = rawQ.match(/\s+(\d+[a-zA-Zа-яА-Я]?)$/)
  const extractedHouseNo = houseMatch ? houseMatch[1] : ''
  const q = (
    extractedHouseNo ? rawQ.slice(0, -houseMatch![0].length) : rawQ
  )
    .trim()
    .toLowerCase()

  if (!q) return []

  const cities = (rawDatabase as any).cities || {}
  const suggestions: GeorgiaPlaceSuggestion[] = []
  const seen = new Set<string>()
  const resolvedFilter = cityFilter ? resolveCityKeyInDb(cityFilter) : ''

  for (const [cityKey, cityObj] of Object.entries<any>(cities)) {
    if (
      resolvedFilter &&
      !cityKey.includes(resolvedFilter) &&
      !resolvedFilter.includes(cityKey)
    ) {
      continue
    }

    for (const [distKey, distObj] of Object.entries<any>(
      cityObj.districts || {}
    )) {
      const trans = DISTRICT_TRANSLATIONS[distKey]
      const areaId =
        trans?.areaId ||
        (cityKey === 'batumi'
          ? 'Batumi - New Boulevard'
          : cityKey === 'tbilisi'
            ? 'Tbilisi - Saburtalo'
            : cityObj.nameEn)
      const areaCoords = {
        lat: Number(distObj.lat || cityObj.lat || 41.7151),
        lng: Number(distObj.lng || cityObj.lng || 44.8271),
      }

      if (distKey !== 'All' && !extractedHouseNo) {
        const distMatch =
          distKey.toLowerCase().includes(q) ||
          (distObj.nameKa && distObj.nameKa.includes(q)) ||
          (trans?.ar && trans.ar.includes(q)) ||
          (trans?.ru && trans.ru.toLowerCase().includes(q))

        if (distMatch && !seen.has(`dist-${cityKey}-${distKey}`)) {
          seen.add(`dist-${cityKey}-${distKey}`)
          const distLabel = getLocalizedDistrictLabel(
            distKey,
            locale,
            distObj.nameKa
          )
          suggestions.push({
            id: `dist-${cityKey}-${distKey}`,
            primaryText: distLabel,
            secondaryText: `${cityObj.nameEn}`,
            street: '',
            houseNumber: '',
            areaId,
            displayAreaLabel: `${distKey}, ${cityObj.nameEn}`,
            lat: areaCoords.lat,
            lng: areaCoords.lng,
            category: 'district',
          })
        }
      }

      for (const st of distObj.streets || []) {
        const cleanEn = st.en || ''
        const matchEn = cleanEn.toLowerCase().includes(q)
        const matchKa = st.ka?.toLowerCase().includes(q)

        if (matchEn || matchKa) {
          const slugId = st.slug || `${cityKey}-${distKey}-${cleanEn}`
          if (seen.has(slugId)) continue
          seen.add(slugId)

          const displayStreet = locale === 'ka' ? st.ka || cleanEn : cleanEn
          const distLabel =
            distKey === 'All'
              ? cityObj.nameEn
              : getLocalizedDistrictLabel(distKey, locale, distObj.nameKa)

          suggestions.push({
            id: slugId,
            primaryText: extractedHouseNo
              ? `${displayStreet} ${extractedHouseNo}`
              : displayStreet,
            secondaryText: `${distLabel} · ${cityObj.nameEn}`,
            street: displayStreet,
            houseNumber: extractedHouseNo,
            areaId,
            displayAreaLabel:
              distKey === 'All'
                ? cityObj.nameEn
                : `${distKey}, ${cityObj.nameEn}`,
            lat: areaCoords.lat,
            lng: areaCoords.lng,
            category: 'street',
          })

          if (suggestions.length >= 35) return suggestions
        }
      }
    }
  }

  return suggestions
}

export async function geocodeExactBuildingInGeorgia(params: {
  street: string
  houseNumber?: string
  district?: string
  city?: string
  signal?: AbortSignal
}): Promise<{
  lat: number
  lng: number
  houseNumber?: string
  cadastralCode?: string
  naprAddress?: string
} | null> {
  ensureDbIndexes()
  const { street, houseNumber, district, city = 'Tbilisi' } = params
  const cleanStreet = street.trim()
  if (!cleanStreet) return null

  const cleanCity =
    city
      .split(',')
      .pop()
      ?.split('—')[0]
      .split('-')[0]
      .split('(')[0]
      .trim() || 'Tbilisi'

  const coreKey = stripStreetTypeWords(cleanStreet)
  const kaStreet =
    _enToKaLookup?.get(cleanStreet.toLowerCase()) ||
    _enToKaLookup?.get(coreKey) ||
    (/[ა-ჰ]/.test(cleanStreet) ? cleanStreet : '')

  const baseStreetEn = cleanStreet
    .replace(
      /\b(\d+(st|nd|rd|th)|[ivx]+)\s+(lane|dead[- ]end|exit|block|quarter)\b/gi,
      'Street'
    )
    .replace(/\b(lane|dead[- ]end|exit)\b/gi, 'Street')
    .trim()

  const res = await geocodeGeorgiaBuildingAction({
    streetEn: cleanStreet,
    streetKa: kaStreet,
    baseStreetEn,
    houseNumber: (houseNumber || '').trim(),
    district,
    city: cleanCity,
  })

  if (res && Number.isFinite(res.lat) && Number.isFinite(res.lng)) {
    return {
      lat: res.lat,
      lng: res.lng,
      houseNumber: res.houseNumber,
      cadastralCode: res.cadastralCode,
      naprAddress: res.naprAddress,
    }
  }
  return null
}

export function extractInstantAddressFromMapFeatures(
  map: any,
  locale: LocaleCode,
  point?: { x: number; y: number }
): {
  street?: string
  houseNumber?: string
  areaId?: string
  displayLabel?: string
} | null {
  if (!map || typeof map.queryRenderedFeatures !== 'function') return null
  try {
    const canvas = map.getCanvas?.()
    if (!canvas) return null
    const cx = point ? point.x : canvas.clientWidth / 2
    const cy = point ? point.y : canvas.clientHeight / 2

    const bbox: [[number, number], [number, number]] = [
      [cx - 32, cy - 32],
      [cx + 32, cy + 32],
    ]
    const features = map.queryRenderedFeatures(bbox) || []
    let detectedHouse = ''
    let detectedRawStreet = ''

    for (const f of features) {
      const p = f?.properties || {}
      const layerId = String(f?.layer?.id || '').toLowerCase()
      const sourceLayer = String(f?.sourceLayer || '').toLowerCase()

      if (!detectedHouse) {
        const hn =
          p['addr:housenumber'] ||
          p.housenumber ||
          p.house_number ||
          (layerId.includes('housenumber') || sourceLayer === 'housenumber'
            ? p.housenumber || p.name || p.ref
            : '')
        if (hn && String(hn).trim().length <= 10) {
          detectedHouse = String(hn).trim()
        }
      }
      if (!detectedRawStreet) {
        const rawName =
          (locale !== 'ka' && (p['name:en'] || p['name:latin'] || p.name_en)) ||
          p['addr:street'] ||
          p.street ||
          (sourceLayer === 'transportation_name' ? p.name : '')
        if (
          rawName &&
          typeof rawName === 'string' &&
          rawName.trim().length > 2 &&
          !/^\d+$/.test(rawName.trim())
        ) {
          detectedRawStreet = rawName.trim()
        }
      }
      if (detectedHouse && detectedRawStreet) break
    }

    if (detectedHouse || detectedRawStreet) {
      if (detectedRawStreet) {
        const matched = matchStreetAndDistrictToOurDatabase({
          rawStreet: detectedRawStreet,
          rawSuburb: '',
          rawCity: 'Tbilisi',
          locale,
        })
        return {
          street: matched.street,
          houseNumber: detectedHouse || undefined,
          areaId: matched.areaId,
          displayLabel: matched.displayLabel,
        }
      }
      return {
        houseNumber: detectedHouse || undefined,
      }
    }
  } catch {}
  return null
}

export async function reverseGeocodeGeorgiaPin(params: {
  lat: number
  lng: number
  locale: LocaleCode
  fallbackCity?: string | null
  signal?: AbortSignal
}): Promise<{
  areaId: string
  displayLabel: string
  street: string
  houseNumber: string
  cadastralCode?: string
  naprAddress?: string
}> {
  const { lat, lng, locale, fallbackCity } = params

  const serverData = await reverseGeocodeGeorgiaPinAction({
    lat,
    lng,
    locale,
    fallbackCity,
  })

  if (serverData) {
    const matched = matchStreetAndDistrictToOurDatabase({
      rawStreet: serverData.rawStreet,
      rawStreetKa: serverData.rawStreetKa,
      rawSuburb: serverData.rawSuburb,
      rawCity: serverData.rawCity,
      locale,
    })

    return {
      areaId: matched.areaId,
      displayLabel: matched.displayLabel,
      street: matched.street,
      houseNumber: serverData.rawHouse || '',
      cadastralCode: serverData.cadastralCode || '',
      naprAddress: serverData.naprAddress || '',
    }
  }

  return {
    areaId: 'Tbilisi - Saburtalo',
    displayLabel: fallbackCity || 'Tbilisi',
    street: '',
    houseNumber: '',
    cadastralCode: '',
    naprAddress: '',
  }
}

export async function searchGeorgiaPlacesLikeUber({
  query,
  cityContext,
  locale = 'ar',
}: {
  query: string
  cityContext?: string
  locale?: LocaleCode
  signal?: AbortSignal
}): Promise<GeorgiaPlaceSuggestion[]> {
  return getInstantLocalGeorgiaSuggestions(query.trim(), locale, cityContext)
}