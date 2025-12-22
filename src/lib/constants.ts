export const PRESET_COLORS = [
    { name: 'Green', class: 'bg-green-100 text-green-700 border-green-200', hex: '#22C55E' },
    { name: 'Blue', class: 'bg-blue-100 text-blue-700 border-blue-200', hex: '#3B82F6' },
    { name: 'Purple', class: 'bg-purple-100 text-purple-700 border-purple-200', hex: '#A855F7' },
    { name: 'Pink', class: 'bg-pink-100 text-pink-700 border-pink-200', hex: '#EC4899' },
    { name: 'Red', class: 'bg-red-100 text-red-700 border-red-200', hex: '#EF4444' },
    { name: 'Yellow', class: 'bg-yellow-100 text-yellow-700 border-yellow-200', hex: '#EAB308' },
    { name: 'Orange', class: 'bg-orange-100 text-orange-700 border-orange-200', hex: '#F97316' },
    { name: 'Cyan', class: 'bg-cyan-100 text-cyan-700 border-cyan-200', hex: '#06B6D4' },
    { name: 'Gray', class: 'bg-gray-100 text-gray-700 border-gray-200', hex: '#64748B' },
]

export function getHexFromClass(className: string | null) {
    if (!className) return '#94A3B8' // Default gray
    const preset = PRESET_COLORS.find(c => c.class === className)
    return preset ? preset.hex : '#94A3B8'
}
