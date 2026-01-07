// Admin emails from environment variables
const FALLBACK_ADMINS = ['leonpiatti@tuta.com'];
export const ADMIN_EMAILS = [...(process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean), ...FALLBACK_ADMINS];

export const PRESET_COLORS = [
    { name: 'Green', class: 'bg-green-500 text-white border-green-600', hex: '#22C55E' },
    { name: 'Blue', class: 'bg-blue-500 text-white border-blue-600', hex: '#3B82F6' },
    { name: 'Purple', class: 'bg-purple-500 text-white border-purple-600', hex: '#A855F7' },
    { name: 'Pink', class: 'bg-pink-500 text-white border-pink-600', hex: '#EC4899' },
    { name: 'Red', class: 'bg-red-500 text-white border-red-600', hex: '#EF4444' },
    { name: 'Yellow', class: 'bg-yellow-500 text-white border-yellow-600', hex: '#EAB308' },
    { name: 'Orange', class: 'bg-orange-500 text-white border-orange-600', hex: '#F97316' },
    { name: 'Cyan', class: 'bg-cyan-500 text-white border-cyan-600', hex: '#06B6D4' },
    { name: 'Gray', class: 'bg-gray-500 text-white border-gray-600', hex: '#64748B' },
]

export function getHexFromClass(className: string | null) {
    if (!className) return '#94A3B8' // Default gray

    // 1. Try exact match
    const preset = PRESET_COLORS.find(c => c.class === className)
    if (preset) return preset.hex

    // 2. Try parsing the color name from the class string (e.g. "bg-green-500")
    for (const p of PRESET_COLORS) {
        if (className.includes(p.name.toLowerCase())) return p.hex
    }

    return '#94A3B8'
}
