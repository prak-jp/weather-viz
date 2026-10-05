// High-precision geographic coordinates for major Nepal river channels and monitoring stations
export const NEPAL_RIVER_PATHS = [
  {
    id: "bagmati-valley",
    name: "Bagmati River (बागमती नदी)",
    basin: "Bagmati",
    region: "Kathmandu Valley to Rautahat",
    stationLat: 27.67,
    stationLon: 85.32,
    coordinates: [
      [27.815, 85.395], // Bagdwar / Shivapuri source
      [27.785, 85.415], // Mulkharka
      [27.765, 85.424], // Sundarijal
      [27.738, 85.405], // Gokarna forest
      [27.728, 85.385], // Gokarneshwor
      [27.712, 85.362], // Pashupatinath / Guhyeshwari
      [27.698, 85.352], // Sinamangal / Airport edge
      [27.688, 85.335], // Shankhamul / Minbhawan
      [27.692, 85.318], // Thapathali Bridge
      [27.685, 85.305], // Teku Dovan (confluence with Bishnumati)
      [27.658, 85.292], // Chobhar Gorge / Jalbinayak
      [27.632, 85.295], // Taudahe
      [27.608, 85.275], // Pharping / Katuwal Daha
      [27.525, 85.320], // Sisneri / Makwanpur hills
      [27.420, 85.375], // Daman foothills
      [27.320, 85.450], // Rai Gaon / Kokhajor Sangam
      [27.180, 85.470], // Bagmati barrage upstream
      [27.080, 85.485], // Karmaiya (East-West Highway bridge)
      [26.880, 85.430], // Rautahat / Sarlahi plains
      [26.740, 85.350], // Gaur / Indo-Nepal border
    ],
  },
  {
    id: "saptakoshi",
    name: "Sapta Koshi River (सप्तकोशी नदी)",
    basin: "Koshi",
    region: "Chatara to Koshi Barrage",
    stationLat: 26.53,
    stationLon: 87.03,
    coordinates: [
      [26.915, 87.165], // Triveni Sangam (Sun Koshi, Arun, Tamor confluence)
      [26.860, 87.160], // Barahakshetra Temple
      [26.820, 87.155], // Koka confluence
      [26.705, 87.145], // Chatara Gauge Station
      [26.650, 87.100], // Mahendranagar (Sunsari)
      [26.615, 87.050], // Prakashpur
      [26.565, 86.985], // Koshi Tappu Wildlife Reserve
      [26.520, 86.925], // Koshi Barrage (East-West Highway)
      [26.430, 86.910], // Indo-Nepal border
    ],
  },
  {
    id: "sunkoshi",
    name: "Sun Koshi River (सुनकोशी नदी)",
    basin: "Koshi",
    region: "Bhotekoshi to Triveni",
    stationLat: 27.64,
    stationLon: 85.71,
    coordinates: [
      [27.950, 85.950], // Kodari / Tatopani border
      [27.870, 85.920], // Bahrabise upper
      [27.795, 85.890], // Bahrabise Bazar
      [27.730, 85.830], // Sukute Beach
      [27.705, 85.780], // Balephi confluence
      [27.640, 85.710], // Dolalghat (Indrawati confluence)
      [27.560, 85.750], // Lubhughat
      [27.520, 85.810], // Dumja (BP Highway)
      [27.410, 85.910], // Nepalthok
      [27.340, 86.030], // Khurkot Bridge
      [27.280, 86.320], // Harkapur (confluence with Dudhkoshi)
      [27.220, 86.520], // Rasuwaghat
      [27.180, 86.650], // Okhaldhunga hills
      [27.020, 86.950], // Kuruleghat
      [26.915, 87.165], // Triveni Sangam
    ],
  },
  {
    id: "arun",
    name: "Arun River (अरुण नदी)",
    basin: "Koshi",
    region: "Sankhuwasabha to Triveni",
    stationLat: 27.15,
    stationLon: 87.25,
    coordinates: [
      [27.860, 87.420], // Kimathanka border
      [27.770, 87.390], // Chepuwa
      [27.720, 87.360], // Hedangna
      [27.550, 87.290], // Num / Arun-III Dam site
      [27.420, 87.230], // Khandbari lower
      [27.320, 87.185], // Tumlingtar Airport valley
      [27.220, 87.240], // Manakamana (Tumlingtar south)
      [27.140, 87.280], // Leguwaghat Bridge
      [27.040, 87.210], // Ranighat
      [26.915, 87.165], // Triveni confluence
    ],
  },
  {
    id: "tamor",
    name: "Tamor River (तमोर नदी)",
    basin: "Koshi",
    region: "Taplejung to Triveni",
    stationLat: 26.91,
    stationLon: 87.35,
    coordinates: [
      [27.680, 87.780], // Olangchung Gola
      [27.560, 87.740], // Lelep
      [27.480, 87.710], // Taplethok
      [27.350, 87.670], // Mitlung / Fungling valley
      [27.260, 87.610], // Dobhan (Panchthar confluence)
      [27.180, 87.550], // Majhitar Bridge
      [27.050, 87.420], // Simle
      [26.930, 87.330], // Mulghat (Dhankuta)
      [26.915, 87.165], // Triveni confluence
    ],
  },
  {
    id: "narayani",
    name: "Narayani River (नारायणी नदी)",
    basin: "Gandaki",
    region: "Devghat to Gandak Barrage",
    stationLat: 27.70,
    stationLon: 84.43,
    coordinates: [
      [27.722, 84.425], // Devghat confluence (Kali Gandaki + Trishuli)
      [27.698, 84.428], // Narayanghat / Bharatpur Pulchowk
      [27.685, 84.380], // Gaidakot lower bend
      [27.650, 84.320], // Pithuwa / Shivaghat
      [27.585, 84.225], // Meghauli (Chitwan National Park)
      [27.525, 84.080], // Amaltari (Nawalpur)
      [27.470, 84.010], // Daunne foothills
      [27.445, 83.920], // Tribeni Sangam
      [27.433, 83.885], // Gandak Barrage (Indo-Nepal border)
    ],
  },
  {
    id: "kali-gandaki",
    name: "Kali Gandaki River (काली गण्डकी नदी)",
    basin: "Gandaki",
    region: "Mustang to Devghat",
    stationLat: 27.93,
    stationLon: 83.65,
    coordinates: [
      [28.835, 83.782], // Kagbeni
      [28.785, 83.738], // Jomsom
      [28.752, 83.685], // Marpha
      [28.705, 83.645], // Tukuche
      [28.650, 83.620], // Larjung
      [28.600, 83.645], // Ghasa gorge
      [28.540, 83.650], // Dana / Rupse Chhahara
      [28.495, 83.655], // Tatopani Hot Springs
      [28.345, 83.568], // Beni (confluence with Myagdi Khola)
      [28.225, 83.680], // Baglung / Kushma suspension bridge
      [28.180, 83.660], // Modibeni
      [28.080, 83.610], // Setibeni
      [28.010, 83.580], // Mirmi (Kali Gandaki Hydropower)
      [27.890, 83.435], // Ridi (Ruru Kshetra)
      [27.885, 83.620], // Ramdi (Siddhartha Highway bridge)
      [27.865, 83.900], // Rampur (Palpa)
      [27.755, 84.220], // Keladighat
      [27.722, 84.425], // Devghat confluence
    ],
  },
  {
    id: "trishuli",
    name: "Trishuli River (त्रिशूली नदी)",
    basin: "Gandaki",
    region: "Rasuwa to Devghat",
    stationLat: 27.90,
    stationLon: 85.15,
    coordinates: [
      [28.275, 85.378], // Rasuwagadhi border
      [28.240, 85.370], // Timure
      [28.156, 85.334], // Syaphrubesi
      [28.065, 85.230], // Mailung / Dhunche lower
      [27.978, 85.182], // Betrawati
      [27.915, 85.124], // Bidur / Trishuli Bazar
      [27.865, 85.090], // Battar / Devighat
      [27.818, 85.045], // Galchi
      [27.805, 84.970], // Baireni
      [27.810, 84.835], // Malekhu
      [27.820, 84.750], // Benighat
      [27.872, 84.590], // Kurintar / Manakamana Cable Car
      [27.858, 84.555], // Mugling (confluence with Marsyangdi)
      [27.790, 84.485], // Gaighat
      [27.722, 84.425], // Devghat confluence
    ],
  },
  {
    id: "marsyangdi",
    name: "Marsyangdi River (मर्स्याङ्दी नदी)",
    basin: "Gandaki",
    region: "Manang to Mugling",
    stationLat: 27.97,
    stationLon: 84.42,
    coordinates: [
      [28.660, 84.020], // Manang Valley
      [28.550, 84.320], // Chame (Manang HQ)
      [28.450, 84.380], // Tal village
      [28.350, 84.410], // Jagat / Dharapani
      [28.230, 84.375], // Besisahar (Lamjung)
      [28.160, 84.400], // Bhoteodar
      [28.080, 84.390], // Paudi / Bimalnagar
      [27.975, 84.420], // Dumre (Prithvi Highway)
      [27.910, 84.510], // Abu Khaireni
      [27.858, 84.555], // Mugling confluence
    ],
  },
  {
    id: "seti-gandaki",
    name: "Seti Gandaki River (सेती गण्डकी नदी)",
    basin: "Gandaki",
    region: "Pokhara Valley to Devghat",
    stationLat: 28.18,
    stationLon: 84.00,
    coordinates: [
      [28.580, 83.950], // Annapurna Sanctuary gorge
      [28.450, 83.960], // Ghachowk
      [28.360, 83.970], // Yamdi / Mardi confluence
      [28.245, 83.985], // Bagar / KI Singh Bridge
      [28.218, 83.990], // Pokhara Gorge / Ramghat
      [28.170, 84.010], // Chhorepatan lower
      [28.120, 84.050], // Gagangaunda
      [28.050, 84.180], // Khairenitar
      [27.970, 84.280], // Damauli (confluence with Madi River)
      [27.830, 84.450], // Gaighat / Trishuli confluence
    ],
  },
  {
    id: "karnali",
    name: "Karnali River (कर्णाली नदी)",
    basin: "Karnali",
    region: "Hilsa to Chisapani & Bardiya",
    stationLat: 28.64,
    stationLon: 81.28,
    coordinates: [
      [30.155, 81.685], // Hilsa border
      [30.050, 81.720], // Muchu
      [29.965, 81.825], // Simikot lower valley
      [29.650, 81.750], // Humla Karnali Gorge
      [29.350, 81.680], // Kolti / Bajura border
      [29.180, 81.620], // Raskot / Kalikot
      [29.140, 81.610], // Manma
      [28.920, 81.480], // Dailekh / Achham border
      [28.850, 81.420], // Rakam Karnali
      [28.750, 81.350], // Asaraghat
      [28.640, 81.280], // Chisapani (Single Tower Cable-Stayed Bridge)
      [28.520, 81.210], // Kothiaghat
      [28.380, 81.140], // Geruwa branch / Rajapur
      [28.250, 81.100], // Indo-Nepal border
    ],
  },
  {
    id: "bheri",
    name: "Bheri River (भेरी नदी)",
    basin: "Karnali",
    region: "Dolpa to Surkhet",
    stationLat: 28.60,
    stationLon: 81.62,
    coordinates: [
      [28.980, 82.900], // Dunai (Dolpa HQ)
      [28.910, 82.720], // Tripurakot
      [28.850, 82.550], // Musikot / Rukum West lower
      [28.700, 82.200], // Jajarkot
      [28.580, 81.850], // Sallibazar
      [28.450, 81.700], // Birendranagar / Chhinchu
      [28.520, 81.480], // Ghatgaon
      [28.640, 81.280], // Karnali confluence above Chisapani
    ],
  },
  {
    id: "babai",
    name: "Babai River (बबई नदी)",
    basin: "Karnali",
    region: "Dang to Bardiya",
    stationLat: 28.35,
    stationLon: 81.68,
    coordinates: [
      [28.050, 82.450], // Dang Inner Terai
      [28.120, 82.150], // Tulsipur lower
      [28.250, 81.850], // Chepang Bridge (East-West Highway)
      [28.350, 81.550], // Bardiya National Park
      [28.300, 81.380], // Gulariya
      [28.180, 81.250], // Indo-Nepal border
    ],
  },
  {
    id: "west-rapti",
    name: "West Rapti River (पश्चिम राप्ती नदी)",
    basin: "Rapti",
    region: "Pyuthan to Banke",
    stationLat: 27.98,
    stationLon: 82.50,
    coordinates: [
      [28.180, 82.900], // Pyuthan hills
      [28.050, 82.820], // Bhalubang (Rapti Bridge)
      [27.920, 82.550], // Deukhuri Valley (Dang)
      [27.980, 82.150], // Kusum (Banke gauge)
      [27.950, 81.850], // Agaiya (Sikta Irrigation Barrage)
      [27.850, 81.680], // Kamdi / Banke
      [27.700, 81.580], // Holiya / Indo-Nepal border
    ],
  },
  {
    id: "mahakali",
    name: "Mahakali River (महाकाली नदी)",
    basin: "Mahakali",
    region: "Darchula to Mahendranagar",
    stationLat: 28.97,
    stationLon: 80.18,
    coordinates: [
      [29.980, 80.620], // Kalapani / Lipulekh
      [29.840, 80.530], // Darchula Khalanga
      [29.580, 80.450], // Gokuleshwor
      [29.450, 80.350], // Jhulaghat (Baitadi)
      [29.250, 80.250], // Jogbudha / Dadeldhura
      [29.080, 80.180], // Parshuram
      [28.980, 80.120], // Tanakpur / Mahendranagar
      [28.820, 80.080], // Dodhara-Chandani border
    ],
  },
  {
    id: "east-rapti",
    name: "East Rapti River (पूर्वी राप्ती नदी)",
    basin: "Narayani",
    region: "Hetauda to Chitwan Sauraha",
    stationLat: 27.57,
    stationLon: 84.50,
    coordinates: [
      [27.430, 85.040], // Hetauda (Makwanpur)
      [27.480, 84.800], // Manahari
      [27.550, 84.620], // Lothar
      [27.580, 84.500], // Sauraha / Chitwan National Park
      [27.570, 84.280], // Narayani confluence at Meghauli
    ],
  },
  {
    id: "kankai",
    name: "Kankai River (कन्काई नदी)",
    basin: "Koshi",
    region: "Ilam to Jhapa",
    stationLat: 26.62,
    stationLon: 87.90,
    coordinates: [
      [27.100, 87.980], // Deumai / Ilam hills
      [26.850, 87.930], // Mainachuli
      [26.650, 87.900], // Kotihoma / Kankai Bridge (Surunga)
      [26.480, 87.870], // Jhapa south plains
      [26.350, 87.850], // Border
    ],
  },
  {
    id: "mechi",
    name: "Mechi River (मेची नदी)",
    basin: "Koshi",
    region: "Eastern Border Kakarbhitta",
    stationLat: 26.65,
    stationLon: 88.12,
    coordinates: [
      [26.980, 88.160], // Pashupatinagar / Ilam
      [26.780, 88.140], // Bahundangi
      [26.650, 88.120], // Kakarbhitta / Mechi Bridge
      [26.540, 88.100], // Bhadrapur
      [26.380, 88.080], // Southern border
    ],
  },
  {
    id: "kamala",
    name: "Kamala River (कमला नदी)",
    basin: "Kamala",
    region: "Sindhuli to Siraha",
    stationLat: 26.78,
    stationLon: 86.05,
    coordinates: [
      [27.200, 85.950], // Sindhuli hills
      [27.050, 86.080], // Kamala Barrage / Chisan
      [26.780, 86.050], // Siraha / Dhanusha border
      [26.580, 86.020], // Border
    ],
  },
];
