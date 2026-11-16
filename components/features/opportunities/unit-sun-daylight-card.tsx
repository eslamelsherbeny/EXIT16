// 'use client'

// import { useMemo, useState } from 'react'
// import * as SunCalc from 'suncalc'
// import { ChevronDown, ChevronUp, Sun } from 'lucide-react'
// import type { INSIGHTS_I18N } from './location-insights-data'

// function normalizeAltitudeDegrees(rawAlt: number): number {
//   if (!Number.isFinite(rawAlt)) return 0
//   const deg =
//     Math.abs(rawAlt) <= Math.PI / 2 + 0.05
//       ? (rawAlt * 180) / Math.PI
//       : rawAlt
//   return Math.max(0, Math.min(90, Math.round(deg)))
// }

// export function SunAndDaylightInteractiveCard({
//   lat,
//   lng,
//   iT,
// }: {
//   lat: number
//   lng: number
//   iT: (typeof INSIGHTS_I18N)['ar']
// }) {
//   const [isOpen, setIsOpen] = useState(true)
//   const [season, setSeason] = useState<'winter' | 'today' | 'summer'>('today')
//   const [sliderRatio, setSliderRatio] = useState(0.5)

//   const targetDate = useMemo(() => {
//     const now = new Date()
//     if (season === 'winter')
//       return new Date(Date.UTC(now.getFullYear(), 11, 21, 8, 0))
//     if (season === 'summer')
//       return new Date(Date.UTC(now.getFullYear(), 5, 21, 8, 0))
//     return now
//   }, [season])

//   const sunMetrics = useMemo(() => {
//     const times = SunCalc.getTimes(targetDate, lat, lng)
//     const base = new Date(targetDate)
//     const safeSunrise =
//       times.sunrise && !isNaN(times.sunrise.getTime())
//         ? times.sunrise
//         : new Date(new Date(base).setUTCHours(3, 50, 0, 0))
//     const safeSunset =
//       times.sunset && !isNaN(times.sunset.getTime())
//         ? times.sunset
//         : new Date(new Date(base).setUTCHours(13, 42, 0, 0))
//     const safeNoon =
//       times.solarNoon && !isNaN(times.solarNoon.getTime())
//         ? times.solarNoon
//         : new Date((safeSunrise.getTime() + safeSunset.getTime()) / 2)

//     const noonPos = SunCalc.getPosition(safeNoon, lat, lng)
//     const maxDeg = Math.max(25, normalizeAltitudeDegrees(noonPos.altitude))

//     const daylightMs = Math.max(0, safeSunset.getTime() - safeSunrise.getTime())
//     const totalHours = Math.floor(daylightMs / 3600000)
//     const totalMins = Math.floor((daylightMs % 3600000) / 60000)

//     const clampedRatio = Math.max(0, Math.min(1, sliderRatio))
//     const selectedTimeMs = safeSunrise.getTime() + daylightMs * clampedRatio
//     const selectedDate = new Date(selectedTimeMs)
//     const selectedPos = SunCalc.getPosition(selectedDate, lat, lng)

//     const rawSelectedDeg = normalizeAltitudeDegrees(selectedPos.altitude)
//     const smoothParabolicDeg = Math.round(
//       maxDeg * 4 * clampedRatio * (1 - clampedRatio)
//     )
//     const selectedHeightDeg =
//       rawSelectedDeg > 0 && rawSelectedDeg <= maxDeg
//         ? rawSelectedDeg
//         : smoothParabolicDeg

//     let dirLabel = iT.southLabel
//     if (clampedRatio < 0.25) dirLabel = iT.eastLabel
//     else if (clampedRatio < 0.42) dirLabel = iT.southEastLabel
//     else if (clampedRatio <= 0.58) dirLabel = iT.southLabel
//     else if (clampedRatio < 0.78) dirLabel = iT.southWestLabel
//     else dirLabel = iT.westLabel

//     const fmt = (d: Date) => {
//       try {
//         return d.toLocaleTimeString('en-GB', {
//           hour: '2-digit',
//           minute: '2-digit',
//           timeZone: 'Asia/Tbilisi',
//         })
//       } catch {
//         return d.toLocaleTimeString('en-GB', {
//           hour: '2-digit',
//           minute: '2-digit',
//         })
//       }
//     }

//     const halfHours = Math.floor(totalHours / 2)
//     const halfMins = Math.round(totalMins / 2)

//     return {
//       sunriseStr: fmt(safeSunrise),
//       sunsetStr: fmt(safeSunset),
//       noonStr: fmt(safeNoon),
//       selectedTimeStr: fmt(selectedDate),
//       maxDeg,
//       selectedHeightDeg,
//       dirLabel,
//       daylightStr: `${totalHours} h ${totalMins} min`,
//       eastHoursStr: `${halfHours} h ${halfMins} min`,
//       westHoursStr: `${halfHours} h ${halfMins} min`,
//       eastWindowRange: `${fmt(safeSunrise)}–${fmt(safeNoon)}`,
//       westWindowRange: `${fmt(safeNoon)}–${fmt(safeSunset)}`,
//       southWindowRange: `${fmt(safeSunrise)}–${fmt(safeSunset)}`,
//     }
//   }, [targetDate, lat, lng, sliderRatio, iT])

//   const startX = 40
//   const endX = 560
//   const baseY = 155
//   const peakHeight = season === 'summer' ? 125 : season === 'winter' ? 75 : 105
//   const tVal = sliderRatio
//   const controlX = 300
//   const controlY = baseY - peakHeight * 2

//   const sunX =
//     (1 - tVal) * (1 - tVal) * startX +
//     2 * (1 - tVal) * tVal * controlX +
//     tVal * tVal * endX
//   const sunY =
//     (1 - tVal) * (1 - tVal) * baseY +
//     2 * (1 - tVal) * tVal * controlY +
//     tVal * tVal * baseY

//   return (
//     <section className="mt-5 rounded-[22px] border border-gray-200/85 bg-white p-5 text-start shadow-2xs sm:p-6">
//       <div className="flex items-start justify-between gap-3">
//         <div className="flex items-center gap-2.5">
//           <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
//             <Sun className="size-5" />
//           </span>
//           <div>
//             <h3 className="text-sm font-black text-[#0a1122] sm:text-base">
//               {iT.sunTitle}
//             </h3>
//             <p className="text-[11px] text-gray-400">{iT.sunSub}</p>
//           </div>
//         </div>

//         <div className="flex shrink-0 items-center gap-3.5">
//           {isOpen && (
//             <div className="hidden rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-extrabold sm:inline-flex">
//               {(
//                 [
//                   { id: 'winter', label: iT.winterTab },
//                   { id: 'today', label: iT.todayTab },
//                   { id: 'summer', label: iT.summerTab },
//                 ] as const
//               ).map((tab) => (
//                 <button
//                   key={tab.id}
//                   type="button"
//                   onClick={() => setSeason(tab.id)}
//                   className={`rounded-full px-3.5 py-1 text-[11px] font-extrabold transition ${
//                     season === tab.id
//                       ? 'bg-[#2563eb] text-white shadow-2xs'
//                       : 'text-gray-600 hover:text-[#0a1122]'
//                   }`}
//                 >
//                   {tab.label}
//                 </button>
//               ))}
//             </div>
//           )}

//           <div className="hidden h-5 w-[1px] bg-gray-200 sm:block" />

//           <button
//             type="button"
//             onClick={() => setIsOpen((prev) => !prev)}
//             title={isOpen ? iT.collapseTooltip : iT.expandTooltip}
//             className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-gray-200/90 bg-gray-50/90 text-[#0a1122] shadow-2xs transition hover:border-[#2563eb] hover:bg-blue-50/50 hover:text-[#2563eb]"
//           >
//             {isOpen ? (
//               <ChevronUp className="size-4 stroke-[2.4]" />
//             ) : (
//               <ChevronDown className="size-4 stroke-[2.4]" />
//             )}
//           </button>
//         </div>
//       </div>

//       {isOpen && (
//         <>
//           <div className="mt-3 flex justify-end sm:hidden">
//             <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-extrabold">
//               {(
//                 [
//                   { id: 'winter', label: iT.winterTab },
//                   { id: 'today', label: iT.todayTab },
//                   { id: 'summer', label: iT.summerTab },
//                 ] as const
//               ).map((tab) => (
//                 <button
//                   key={tab.id}
//                   type="button"
//                   onClick={() => setSeason(tab.id)}
//                   className={`rounded-full px-3.5 py-1 text-[11px] font-extrabold transition ${
//                     season === tab.id
//                       ? 'bg-[#2563eb] text-white shadow-2xs'
//                       : 'text-gray-600 hover:text-[#0a1122]'
//                   }`}
//                 >
//                   {tab.label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="mt-5">
//             <p className="mb-2.5 text-xs font-extrabold text-[#0a1122]">
//               {iT.windowDirectionTitle}
//             </p>

//             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//               <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3.5">
//                 <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
//                   <span>{iT.northLabel}</span>
//                   <span className="text-gray-400">—</span>
//                 </div>
//                 <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200" />
//                 <p className="mt-2 text-[11px] text-gray-400">
//                   {iT.noDirectSun}
//                 </p>
//               </div>

//               <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3.5">
//                 <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
//                   <span>{iT.eastLabel}</span>
//                   <span dir="ltr">{sunMetrics.eastHoursStr}</span>
//                 </div>
//                 <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
//                   <div className="h-full w-1/2 rounded-full bg-orange-500" />
//                 </div>
//                 <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
//                   <span>{iT.brightMorning}</span>
//                   <span dir="ltr" className="font-mono">
//                     {sunMetrics.eastWindowRange}
//                   </span>
//                 </div>
//               </div>

//               <div className="rounded-2xl border border-orange-200/80 bg-orange-50/40 p-3.5">
//                 <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
//                   <span>{iT.southLabel}</span>
//                   <span dir="ltr">{sunMetrics.daylightStr}</span>
//                 </div>
//                 <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
//                   <div className="h-full w-[92%] rounded-full bg-orange-500" />
//                 </div>
//                 <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
//                   <span className="font-bold text-orange-700">
//                     {iT.veryBrightAllDay}
//                   </span>
//                   <span dir="ltr" className="font-mono">
//                     {sunMetrics.southWindowRange}
//                   </span>
//                 </div>
//               </div>

//               <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-3.5">
//                 <div className="flex items-center justify-between text-xs font-extrabold text-[#0a1122]">
//                   <span>{iT.westLabel}</span>
//                   <span dir="ltr">{sunMetrics.westHoursStr}</span>
//                 </div>
//                 <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
//                   <div className="ms-auto h-full w-1/2 rounded-full bg-orange-500" />
//                 </div>
//                 <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
//                   <span>{iT.brightAfternoon}</span>
//                   <span dir="ltr" className="font-mono">
//                     {sunMetrics.westWindowRange}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="mt-6">
//             <svg viewBox="0 0 600 185" className="w-full overflow-visible">
//               <defs>
//                 <linearGradient id="sunArcGrad" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
//                   <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
//                 </linearGradient>
//               </defs>

//               <path
//                 d={`M ${startX} ${baseY} Q ${controlX} ${controlY} ${endX} ${baseY} Z`}
//                 fill="url(#sunArcGrad)"
//               />

//               <line
//                 x1="20"
//                 y1={baseY}
//                 x2="580"
//                 y2={baseY}
//                 stroke="#e2e8f0"
//                 strokeWidth="2"
//               />

//               <path
//                 d={`M ${startX} ${baseY} Q ${controlX} ${controlY} ${endX} ${baseY}`}
//                 fill="none"
//                 stroke="#ea580c"
//                 strokeWidth="3"
//               />

//               <circle
//                 cx={sunX}
//                 cy={sunY}
//                 r="16"
//                 fill="#f97316"
//                 fillOpacity="0.18"
//               />
//               <circle
//                 cx={sunX}
//                 cy={sunY}
//                 r="7"
//                 fill="#ea580c"
//                 stroke="#ffffff"
//                 strokeWidth="2"
//               />

//               <text
//                 x="140"
//                 y={baseY + 24}
//                 fontSize="12"
//                 fontWeight="700"
//                 fill="#64748b"
//                 textAnchor="middle"
//               >
//                 E
//               </text>
//               <text
//                 x="300"
//                 y={baseY + 24}
//                 fontSize="12"
//                 fontWeight="700"
//                 fill="#0f172a"
//                 textAnchor="middle"
//               >
//                 S
//               </text>
//               <text
//                 x="460"
//                 y={baseY + 24}
//                 fontSize="12"
//                 fontWeight="700"
//                 fill="#64748b"
//                 textAnchor="middle"
//               >
//                 W
//               </text>
//             </svg>

//             <div className="mx-auto mt-2 max-w-md px-4">
//               <input
//                 type="range"
//                 min={0}
//                 max={100}
//                 value={Math.round(sliderRatio * 100)}
//                 onChange={(e) => setSliderRatio(Number(e.target.value) / 100)}
//                 className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-orange-200 accent-[#ea580c]"
//               />
//             </div>

//             <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 text-xs sm:grid-cols-4">
//               <div>
//                 <span className="block text-[10px] font-bold text-gray-400 uppercase">
//                   {iT.timeLabel}
//                 </span>
//                 <strong
//                   dir="ltr"
//                   className="mt-0.5 block font-mono text-sm font-black text-[#0a1122]"
//                 >
//                   {sunMetrics.selectedTimeStr}
//                 </strong>
//               </div>
//               <div>
//                 <span className="block text-[10px] font-bold text-gray-400 uppercase">
//                   {iT.heightLabel}
//                 </span>
//                 <strong
//                   dir="ltr"
//                   className="mt-0.5 block font-mono text-sm font-black text-[#0a1122]"
//                 >
//                   {sunMetrics.selectedHeightDeg}°
//                 </strong>
//               </div>
//               <div>
//                 <span className="block text-[10px] font-bold text-gray-400 uppercase">
//                   {iT.directionLabel}
//                 </span>
//                 <strong className="mt-0.5 block text-sm font-black text-[#0a1122]">
//                   {sunMetrics.dirLabel}
//                 </strong>
//               </div>
//               <div className="hidden sm:block">
//                 <span className="block text-[10px] font-bold text-gray-400 uppercase">
//                   {iT.daylightLabel}
//                 </span>
//                 <strong
//                   dir="ltr"
//                   className="mt-0.5 block text-sm font-black text-[#007a5a]"
//                 >
//                   {sunMetrics.daylightStr}
//                 </strong>
//               </div>
//             </div>

//             <div className="mt-3 grid grid-cols-3 gap-3 border-t border-gray-100 pt-3 text-xs sm:grid-cols-4">
//               <div>
//                 <span className="block text-[10px] font-bold text-gray-400 uppercase">
//                   {iT.sunriseLabel}
//                 </span>
//                 <strong
//                   dir="ltr"
//                   className="mt-0.5 block font-mono text-xs font-extrabold text-gray-700"
//                 >
//                   {sunMetrics.sunriseStr}
//                 </strong>
//               </div>
//               <div>
//                 <span className="block text-[10px] font-bold text-gray-400 uppercase">
//                   {iT.solarNoonLabel}
//                 </span>
//                 <strong
//                   dir="ltr"
//                   className="mt-0.5 block font-mono text-xs font-extrabold text-gray-700"
//                 >
//                   {sunMetrics.noonStr} · {sunMetrics.maxDeg}°
//                 </strong>
//               </div>
//               <div>
//                 <span className="block text-[10px] font-bold text-gray-400 uppercase">
//                   {iT.sunsetLabel}
//                 </span>
//                 <strong
//                   dir="ltr"
//                   className="mt-0.5 block font-mono text-xs font-extrabold text-gray-700"
//                 >
//                   {sunMetrics.sunsetStr}
//                 </strong>
//               </div>
//               <div className="sm:hidden">
//                 <span className="block text-[10px] font-bold text-gray-400 uppercase">
//                   {iT.daylightLabel}
//                 </span>
//                 <strong
//                   dir="ltr"
//                   className="mt-0.5 block text-xs font-extrabold text-[#007a5a]"
//                 >
//                   {sunMetrics.daylightStr}
//                 </strong>
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </section>
//   )
// }