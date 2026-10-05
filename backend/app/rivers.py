NEPAL_RIVERS = [
    {"id": "mechi", "name": "Mechi", "basin": "Koshi", "region": "Eastern border", "latitude": 26.65, "longitude": 88.12},
    {"id": "kankai", "name": "Kankai", "basin": "Koshi", "region": "Jhapa", "latitude": 26.62, "longitude": 87.90},
    {"id": "tamor", "name": "Tamor", "basin": "Koshi", "region": "Eastern hills", "latitude": 26.91, "longitude": 87.35},
    {"id": "arun", "name": "Arun", "basin": "Koshi", "region": "Sankhuwasabha", "latitude": 27.15, "longitude": 87.25},
    {"id": "sunkoshi", "name": "Sun Koshi", "basin": "Koshi", "region": "Dolalghat / mid-hills", "latitude": 27.64, "longitude": 85.71},
    {"id": "saptakoshi", "name": "Sapta Koshi", "basin": "Koshi", "region": "Chatara / Koshi barrage", "latitude": 26.53, "longitude": 87.03},
    {"id": "kamala", "name": "Kamala", "basin": "Kamala", "region": "Inner Terai / Siraha", "latitude": 26.78, "longitude": 86.05},
    {"id": "bagmati-valley", "name": "Bagmati (Kathmandu)", "basin": "Bagmati", "region": "Kathmandu Valley", "latitude": 27.67, "longitude": 85.32},
    {"id": "bagmati-terai", "name": "Bagmati (Terai)", "basin": "Bagmati", "region": "Sarlahi / Rautahat", "latitude": 26.95, "longitude": 85.40},
    {"id": "east-rapti", "name": "East Rapti", "basin": "Narayani", "region": "Chitwan", "latitude": 27.57, "longitude": 84.50},
    {"id": "narayani", "name": "Narayani (Gandaki)", "basin": "Gandaki", "region": "Narayanghat", "latitude": 27.70, "longitude": 84.43},
    {"id": "kali-gandaki", "name": "Kali Gandaki", "basin": "Gandaki", "region": "Ramdi / lower Kali", "latitude": 27.93, "longitude": 83.65},
    {"id": "marsyangdi", "name": "Marsyangdi", "basin": "Gandaki", "region": "Dumre / lower Marsyangdi", "latitude": 27.97, "longitude": 84.42},
    {"id": "trishuli", "name": "Trishuli", "basin": "Gandaki", "region": "Galchi / Betrawati", "latitude": 27.90, "longitude": 85.15},
    {"id": "seti-gandaki", "name": "Seti (Gandaki)", "basin": "Gandaki", "region": "Pokhara / lower Seti", "latitude": 28.18, "longitude": 84.00},
    {"id": "west-rapti", "name": "West Rapti", "basin": "Rapti", "region": "Dang / Deukhuri", "latitude": 27.98, "longitude": 82.50},
    {"id": "babai", "name": "Babai", "basin": "Karnali", "region": "Bardiya", "latitude": 28.35, "longitude": 81.68},
    {"id": "bheri", "name": "Bheri", "basin": "Karnali", "region": "Surkhet / lower Bheri", "latitude": 28.60, "longitude": 81.62},
    {"id": "karnali", "name": "Karnali", "basin": "Karnali", "region": "Chisapani", "latitude": 28.64, "longitude": 81.28},
    {"id": "mahakali", "name": "Mahakali", "basin": "Mahakali", "region": "Kanchanpur / western border", "latitude": 28.97, "longitude": 80.18},
]


def is_nepal(lat: float, lon: float) -> bool:
    return 26.3 <= lat <= 30.55 and 80.0 <= lon <= 88.35
