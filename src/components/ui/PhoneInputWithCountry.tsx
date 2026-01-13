'use client'

import React, { useState, useEffect } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PhoneInputWithCountryProps {
    value?: string
    onChange: (value: string) => void
    className?: string
    placeholder?: string
}

const COUNTRY_CODES = [
    { code: '972', label: 'Israel', flag: '🇮🇱' },
    { code: '93', label: 'Afghanistan', flag: '🇦🇫' },
    { code: '355', label: 'Albania', flag: '🇦🇱' },
    { code: '213', label: 'Algeria', flag: '🇩🇿' },
    { code: '1684', label: 'American Samoa', flag: '🇦🇸' },
    { code: '376', label: 'Andorra', flag: '🇦🇩' },
    { code: '244', label: 'Angola', flag: '🇦🇴' },
    { code: '1264', label: 'Anguilla', flag: '🇦🇮' },
    { code: '1268', label: 'Antigua and Barbuda', flag: '🇦🇬' },
    { code: '54', label: 'Argentina', flag: '🇦🇷' },
    { code: '374', label: 'Armenia', flag: '🇦🇲' },
    { code: '297', label: 'Aruba', flag: '🇦🇼' },
    { code: '61', label: 'Australia', flag: '🇦🇺' },
    { code: '43', label: 'Austria', flag: '🇦🇹' },
    { code: '994', label: 'Azerbaijan', flag: '🇦🇿' },
    { code: '1242', label: 'Bahamas', flag: '🇧🇸' },
    { code: '973', label: 'Bahrain', flag: '🇧🇭' },
    { code: '880', label: 'Bangladesh', flag: '🇧🇩' },
    { code: '1246', label: 'Barbados', flag: '🇧🇧' },
    { code: '375', label: 'Belarus', flag: '🇧🇾' },
    { code: '32', label: 'Belgium', flag: '🇧🇪' },
    { code: '501', label: 'Belize', flag: '🇧🇿' },
    { code: '229', label: 'Benin', flag: '🇧🇯' },
    { code: '1441', label: 'Bermuda', flag: '🇧🇲' },
    { code: '975', label: 'Bhutan', flag: '🇧🇹' },
    { code: '591', label: 'Bolivia', flag: '🇧🇴' },
    { code: '387', label: 'Bosnia and Herzegovina', flag: '🇧🇦' },
    { code: '267', label: 'Botswana', flag: '🇧🇼' },
    { code: '55', label: 'Brazil', flag: '🇧🇷' },
    { code: '1284', label: 'British Virgin Islands', flag: '🇻🇬' },
    { code: '673', label: 'Brunei', flag: '🇧🇳' },
    { code: '359', label: 'Bulgaria', flag: '🇧🇬' },
    { code: '226', label: 'Burkina Faso', flag: '🇧🇫' },
    { code: '257', label: 'Burundi', flag: '🇧🇮' },
    { code: '855', label: 'Cambodia', flag: '🇰🇭' },
    { code: '237', label: 'Cameroon', flag: '🇨🇲' },
    { code: '1', label: 'Canada', flag: '🇨🇦' },
    { code: '238', label: 'Cape Verde', flag: '🇨🇻' },
    { code: '1345', label: 'Cayman Islands', flag: '🇰🇾' },
    { code: '236', label: 'Central African Republic', flag: '🇨🇫' },
    { code: '235', label: 'Chad', flag: '🇹🇩' },
    { code: '56', label: 'Chile', flag: '🇨🇱' },
    { code: '86', label: 'China', flag: '🇨🇳' },
    { code: '57', label: 'Colombia', flag: '🇨🇴' },
    { code: '269', label: 'Comoros', flag: '🇰🇲' },
    { code: '243', label: 'Congo (DRC)', flag: '🇨🇩' },
    { code: '242', label: 'Congo (Republic)', flag: '🇨🇬' },
    { code: '682', label: 'Cook Islands', flag: '🇨🇰' },
    { code: '506', label: 'Costa Rica', flag: '🇨🇷' },
    { code: '225', label: 'Ivory Coast', flag: '🇨🇮' },
    { code: '385', label: 'Croatia', flag: '🇭🇷' },
    { code: '53', label: 'Cuba', flag: '🇨🇺' },
    { code: '357', label: 'Cyprus', flag: '🇨🇾' },
    { code: '420', label: 'Czech Republic', flag: '🇨🇿' },
    { code: '45', label: 'Denmark', flag: '🇩🇰' },
    { code: '253', label: 'Djibouti', flag: '🇩🇯' },
    { code: '1767', label: 'Dominica', flag: '🇩🇲' },
    { code: '1809', label: 'Dominican Republic', flag: '🇩🇴' },
    { code: '670', label: 'Timor-Leste', flag: '🇹🇱' },
    { code: '593', label: 'Ecuador', flag: '🇪🇨' },
    { code: '20', label: 'Egypt', flag: '🇪🇬' },
    { code: '503', label: 'El Salvador', flag: '🇸🇻' },
    { code: '240', label: 'Equatorial Guinea', flag: '🇬🇶' },
    { code: '291', label: 'Eritrea', flag: '🇪🇷' },
    { code: '372', label: 'Estonia', flag: '🇪🇪' },
    { code: '251', label: 'Ethiopia', flag: '🇪🇹' },
    { code: '500', label: 'Falkland Islands', flag: '🇫🇰' },
    { code: '298', label: 'Faroe Islands', flag: '🇫🇴' },
    { code: '679', label: 'Fiji', flag: '🇫🇯' },
    { code: '358', label: 'Finland', flag: '🇫🇮' },
    { code: '33', label: 'France', flag: '🇫🇷' },
    { code: '594', label: 'French Guiana', flag: '🇬🇫' },
    { code: '689', label: 'French Polynesia', flag: '🇵🇫' },
    { code: '241', label: 'Gabon', flag: '🇬🇦' },
    { code: '220', label: 'Gambia', flag: '🇬🇲' },
    { code: '995', label: 'Georgia', flag: '🇬🇪' },
    { code: '49', label: 'Germany', flag: '🇩🇪' },
    { code: '233', label: 'Ghana', flag: '🇬🇭' },
    { code: '350', label: 'Gibraltar', flag: '🇬🇮' },
    { code: '30', label: 'Greece', flag: '🇬🇷' },
    { code: '299', label: 'Greenland', flag: '🇬🇱' },
    { code: '1473', label: 'Grenada', flag: '🇬🇩' },
    { code: '590', label: 'Guadeloupe', flag: '🇬🇵' },
    { code: '1671', label: 'Guam', flag: '🇬🇺' },
    { code: '502', label: 'Guatemala', flag: '🇬🇹' },
    { code: '224', label: 'Guinea', flag: '🇬🇳' },
    { code: '245', label: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: '592', label: 'Guyana', flag: '🇬🇾' },
    { code: '509', label: 'Haiti', flag: '🇭🇹' },
    { code: '504', label: 'Honduras', flag: '🇭🇳' },
    { code: '852', label: 'Hong Kong', flag: '🇭🇰' },
    { code: '36', label: 'Hungary', flag: '🇭🇺' },
    { code: '354', label: 'Iceland', flag: '🇮🇸' },
    { code: '91', label: 'India', flag: '🇮🇳' },
    { code: '62', label: 'Indonesia', flag: '🇮🇩' },
    { code: '98', label: 'Iran', flag: '🇮🇷' },
    { code: '964', label: 'Iraq', flag: '🇮🇶' },
    { code: '353', label: 'Ireland', flag: '🇮🇪' },
    { code: '39', label: 'Italy', flag: '🇮🇹' },
    { code: '1876', label: 'Jamaica', flag: '🇯🇲' },
    { code: '81', label: 'Japan', flag: '🇯🇵' },
    { code: '962', label: 'Jordan', flag: '🇯🇴' },
    { code: '7', label: 'Kazakhstan', flag: '🇰🇿' },
    { code: '254', label: 'Kenya', flag: '🇰🇪' },
    { code: '686', label: 'Kiribati', flag: '🇰🇮' },
    { code: '383', label: 'Kosovo', flag: '🇽🇰' },
    { code: '965', label: 'Kuwait', flag: '🇰🇼' },
    { code: '996', label: 'Kyrgyzstan', flag: '🇰🇬' },
    { code: '856', label: 'Laos', flag: '🇱🇦' },
    { code: '371', label: 'Latvia', flag: '🇱🇻' },
    { code: '961', label: 'Lebanon', flag: '🇱🇧' },
    { code: '266', label: 'Lesotho', flag: '🇱🇸' },
    { code: '231', label: 'Liberia', flag: '🇱🇷' },
    { code: '218', label: 'Libya', flag: '🇱🇾' },
    { code: '423', label: 'Liechtenstein', flag: '🇱🇮' },
    { code: '370', label: 'Lithuania', flag: '🇱🇹' },
    { code: '352', label: 'Luxembourg', flag: '🇱🇺' },
    { code: '853', label: 'Macau', flag: '🇲🇴' },
    { code: '389', label: 'Macedonia', flag: '🇲🇰' },
    { code: '261', label: 'Madagascar', flag: '🇲🇬' },
    { code: '265', label: 'Malawi', flag: '🇲🇼' },
    { code: '60', label: 'Malaysia', flag: '🇲🇾' },
    { code: '960', label: 'Maldives', flag: '🇲🇻' },
    { code: '223', label: 'Mali', flag: '🇲🇱' },
    { code: '356', label: 'Malta', flag: '🇲🇹' },
    { code: '692', label: 'Marshall Islands', flag: '🇲🇭' },
    { code: '596', label: 'Martinique', flag: '🇲🇶' },
    { code: '222', label: 'Mauritania', flag: '🇲🇷' },
    { code: '230', label: 'Mauritius', flag: '🇲🇺' },
    { code: '262', label: 'Mayotte', flag: '🇾🇹' },
    { code: '52', label: 'Mexico', flag: '🇲🇽' },
    { code: '691', label: 'Micronesia', flag: '🇫🇲' },
    { code: '373', label: 'Moldova', flag: '🇲🇩' },
    { code: '377', label: 'Monaco', flag: '🇲🇨' },
    { code: '976', label: 'Mongolia', flag: '🇲🇳' },
    { code: '382', label: 'Montenegro', flag: '🇲🇪' },
    { code: '1664', label: 'Montserrat', flag: '🇲🇸' },
    { code: '212', label: 'Morocco', flag: '🇲🇦' },
    { code: '258', label: 'Mozambique', flag: '🇲🇿' },
    { code: '95', label: 'Myanmar', flag: '🇲🇲' },
    { code: '264', label: 'Namibia', flag: '🇳🇦' },
    { code: '674', label: 'Nauru', flag: '🇳🇷' },
    { code: '977', label: 'Nepal', flag: '🇳🇵' },
    { code: '31', label: 'Netherlands', flag: '🇳🇱' },
    { code: '599', label: 'Netherlands Antilles', flag: '🇦🇳' },
    { code: '687', label: 'New Caledonia', flag: '🇳🇨' },
    { code: '64', label: 'New Zealand', flag: '🇳🇿' },
    { code: '505', label: 'Nicaragua', flag: '🇳🇮' },
    { code: '227', label: 'Niger', flag: '🇳🇪' },
    { code: '234', label: 'Nigeria', flag: '🇳🇬' },
    { code: '683', label: 'Niue', flag: '🇳🇺' },
    { code: '850', label: 'North Korea', flag: '🇰🇵' },
    { code: '1670', label: 'Northern Mariana Islands', flag: '🇲🇵' },
    { code: '47', label: 'Norway', flag: '🇳🇴' },
    { code: '968', label: 'Oman', flag: '🇴🇲' },
    { code: '92', label: 'Pakistan', flag: '🇵🇰' },
    { code: '680', label: 'Palau', flag: '🇵🇼' },
    { code: '970', label: 'Palestine', flag: '🇵🇸' },
    { code: '507', label: 'Panama', flag: '🇵🇦' },
    { code: '675', label: 'Papua New Guinea', flag: '🇵🇬' },
    { code: '595', label: 'Paraguay', flag: '🇵🇾' },
    { code: '51', label: 'Peru', flag: '🇵🇪' },
    { code: '63', label: 'Philippines', flag: '🇵🇭' },
    { code: '48', label: 'Poland', flag: '🇵🇱' },
    { code: '351', label: 'Portugal', flag: '🇵🇹' },
    { code: '1787', label: 'Puerto Rico', flag: '🇵🇷' },
    { code: '974', label: 'Qatar', flag: '🇶🇦' },
    { code: '262', label: 'Reunion', flag: '🇷🇪' },
    { code: '40', label: 'Romania', flag: '🇷🇴' },
    { code: '7', label: 'Russia', flag: '🇷🇺' },
    { code: '250', label: 'Rwanda', flag: '🇷🇼' },
    { code: '290', label: 'Saint Helena', flag: '🇸🇭' },
    { code: '1869', label: 'Saint Kitts and Nevis', flag: '🇰🇳' },
    { code: '1758', label: 'Saint Lucia', flag: '🇱🇨' },
    { code: '508', label: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
    { code: '1784', label: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
    { code: '685', label: 'Samoa', flag: '🇼🇸' },
    { code: '378', label: 'San Marino', flag: '🇸🇲' },
    { code: '239', label: 'Sao Tome and Principe', flag: '🇸🇹' },
    { code: '966', label: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '221', label: 'Senegal', flag: '🇸🇳' },
    { code: '381', label: 'Serbia', flag: '🇷🇸' },
    { code: '248', label: 'Seychelles', flag: '🇸🇨' },
    { code: '232', label: 'Sierra Leone', flag: '🇸🇱' },
    { code: '65', label: 'Singapore', flag: '🇸🇬' },
    { code: '421', label: 'Slovakia', flag: '🇸🇰' },
    { code: '386', label: 'Slovenia', flag: '🇸🇮' },
    { code: '677', label: 'Solomon Islands', flag: '🇸🇧' },
    { code: '252', label: 'Somalia', flag: '🇸🇴' },
    { code: '27', label: 'South Africa', flag: '🇿🇦' },
    { code: '82', label: 'South Korea', flag: '🇰🇷' },
    { code: '211', label: 'South Sudan', flag: '🇸🇸' },
    { code: '34', label: 'Spain', flag: '🇪🇸' },
    { code: '94', label: 'Sri Lanka', flag: '🇱🇰' },
    { code: '249', label: 'Sudan', flag: '🇸🇩' },
    { code: '597', label: 'Suriname', flag: '🇸🇷' },
    { code: '268', label: 'Swaziland', flag: '🇸🇿' },
    { code: '46', label: 'Sweden', flag: '🇸🇪' },
    { code: '41', label: 'Switzerland', flag: '🇨🇭' },
    { code: '963', label: 'Syria', flag: '🇸🇾' },
    { code: '886', label: 'Taiwan', flag: '🇹🇼' },
    { code: '992', label: 'Tajikistan', flag: '🇹🇯' },
    { code: '255', label: 'Tanzania', flag: '🇹🇿' },
    { code: '66', label: 'Thailand', flag: '🇹🇭' },
    { code: '228', label: 'Togo', flag: '🇹🇬' },
    { code: '690', label: 'Tokelau', flag: '🇹🇰' },
    { code: '676', label: 'Tonga', flag: '🇹🇴' },
    { code: '1868', label: 'Trinidad and Tobago', flag: '🇹🇹' },
    { code: '216', label: 'Tunisia', flag: '🇹🇳' },
    { code: '90', label: 'Turkey', flag: '🇹🇷' },
    { code: '993', label: 'Turkmenistan', flag: '🇹🇲' },
    { code: '1649', label: 'Turks and Caicos Islands', flag: '🇹🇨' },
    { code: '688', label: 'Tuvalu', flag: '🇹🇻' },
    { code: '256', label: 'Uganda', flag: '🇺🇬' },
    { code: '380', label: 'Ukraine', flag: '🇺🇦' },
    { code: '971', label: 'United Arab Emirates', flag: '🇦🇪' },
    { code: '44', label: 'United Kingdom', flag: '🇬🇧' },
    { code: '1', label: 'United States', flag: '🇺🇸' },
    { code: '598', label: 'Uruguay', flag: '🇺🇾' },
    { code: '998', label: 'Uzbekistan', flag: '🇺🇿' },
    { code: '678', label: 'Vanuatu', flag: '🇻🇺' },
    { code: '39', label: 'Vatican', flag: '🇻🇦' },
    { code: '58', label: 'Venezuela', flag: '🇻🇪' },
    { code: '84', label: 'Vietnam', flag: '🇻🇳' },
    { code: '681', label: 'Wallis and Futuna', flag: '🇼🇫' },
    { code: '967', label: 'Yemen', flag: '🇾🇪' },
    { code: '260', label: 'Zambia', flag: '🇿🇲' },
    { code: '263', label: 'Zimbabwe', flag: '🇿🇼' },
]

export function PhoneInputWithCountry({ value = '', onChange, className, placeholder }: PhoneInputWithCountryProps) {
    const [countryCode, setCountryCode] = useState('972')
    const [localNumber, setLocalNumber] = useState('')
    const lastEmittedValue = React.useRef(value)

    // Sync only if value changes externally (not from our own typing)
    useEffect(() => {
        if (value === lastEmittedValue.current) return

        if (!value) {
            setLocalNumber('')
            setCountryCode('972') // Default back to IL
            return
        }

        // Try to match existing country code
        const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
        // Check for +Prefix or just Prefix
        const found = sortedCodes.find(c => value.startsWith('+' + c.code)) || sortedCodes.find(c => value.startsWith(c.code))

        if (found) {
            setCountryCode(found.code)
            const prefix = value.startsWith('+') ? '+' + found.code : found.code
            // IMPORTANT: trim() prevents accumulating spaces
            setLocalNumber(value.substring(prefix.length).trim())
        } else {
            setLocalNumber(value)
        }
    }, [value])

    const handleCountryChange = (code: string) => {
        setCountryCode(code)
        const newValue = `+${code} ${localNumber}`
        lastEmittedValue.current = newValue
        onChange(newValue)
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^\d\s\-()]/g, '')
        setLocalNumber(val)

        // Clean format: +Code Local
        const newValue = `+${countryCode} ${val}`
        lastEmittedValue.current = newValue
        onChange(newValue)
    }

    return (
        <div className={cn("flex items-center gap-2", className)} dir="ltr">
            <Select value={countryCode} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-[100px] flex-shrink-0">
                    <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent dir="ltr">
                    {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                            <span className="mr-2">{c.flag}</span>
                            <span>+{c.code}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                type="tel"
                value={localNumber}
                onChange={handleNumberChange}
                placeholder={placeholder || "050..."}
                className="flex-1 text-left direction-ltr"
                dir="ltr"
            />
        </div>
    )
}
