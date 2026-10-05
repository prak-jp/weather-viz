// Accurate geo-coordinates for major Nepal river channels
export const NEPAL_RIVER_PATHS = [
  {
    id: "bagmati-valley",
    name: "Bagmati River",
    basin: "Bagmati",
    region: "Kathmandu Valley & Terai",
    coordinates: [
      [27.815, 85.395], // Shivapuri source
      [27.765, 85.422], // Sundarijal
      [27.732, 85.390], // Gokarna
      [27.712, 85.362], // Pashupatinath
      [27.695, 85.328], // Thapathali
      [27.682, 85.305], // Teku Dovan
      [27.658, 85.292], // Chobhar Gorge
      [27.562, 85.302], // Katuwal Daha
      [27.420, 85.375], // Makwanpur hills
      [27.235, 85.438], // Raigaon
      [27.050, 85.480], // Karmaiya (Sarlahi bridge)
      [26.850, 85.410], // Rautahat plains
      [26.680, 85.320], // Nepal-India border
    ],
  },
  {
    id: "saptakoshi",
    name: "Sapta Koshi River",
    basin: "Koshi",
    region: "Chatara & Terai",
    coordinates: [
      [26.915, 87.165], // Triveni confluence (Arun, Sun Koshi, Tamor)
      [26.820, 87.155], // Barahakshetra
      [26.705, 87.145], // Chatara
      [26.615, 87.050], // Prakashpur
      [26.565, 86.985], // Koshi Tappu
      [26.520, 86.925], // Koshi Barrage
      [26.430, 86.910], // South border
    ],
  },
  {
    id: "sunkoshi",
    name: "Sun Koshi River",
    basin: "Koshi",
    region: "Mid-Hills",
    coordinates: [
      [27.950, 85.950], // Kodari / Bhotekoshi
      [27.795, 85.890], // Barhabise
      [27.705, 85.780], // Balephi
      [27.640, 85.710], // Dolalghat
      [27.520, 85.810], // Dumja
      [27.410, 85.910], // Nepalthok
      [27.340, 86.030], // Khurkot
      [27.280, 86.320], // Harkapur
      [27.180, 86.650], // Okhaldhunga hills
      [27.020, 86.950], // Kuruleghat
      [26.915, 87.165], // Confluence at Triveni
    ],
  },
  {
    id: "arun",
    name: "Arun River",
    basin: "Koshi",
    region: "Sankhuwasabha",
    coordinates: [
      [27.860, 87.420], // Kimathanka border
      [27.720, 87.360], // Hedangna
      [27.550, 87.290], // Num
      [27.420, 87.230], // Khandbari lower
      [27.320, 87.185], // Tumlingtar
      [27.140, 87.280], // Leguwaghat
      [26.915, 87.165], // Triveni confluence
    ],
  },
  {
    id: "tamor",
    name: "Tamor River",
    basin: "Koshi",
    region: "Taplejung & Eastern Hills",
    coordinates: [
      [27.680, 87.780], // Olangchung Gola
      [27.480, 87.710], // Taplethok
      [27.350, 87.670], // Mitlung / Taplejung
      [27.180, 87.550], // Dobhan / Panchthar
      [26.930, 87.330], // Mulghat (Dhankuta)
      [26.915, 87.165], // Triveni confluence
    ],
  },
  {
    id: "narayani",
    name: "Narayani River",
    basin: "Gandaki",
    region: "Chitwan & Nawalparasi",
    coordinates: [
      [27.722, 84.425], // Devghat confluence (Kali Gandaki + Trishuli)
      [27.698, 84.430], // Narayanghat
      [27.650, 84.350], // Gaidakot lower
      [27.580, 84.220], // Meghauli
      [27.530, 84.080], // Amaltari / Nawalpur
      [27.460, 83.970], // Tribeni Sangam
      [27.425, 83.910], // Gandak Barrage
    ],
  },
  {
    id: "kali-gandaki",
    name: "Kali Gandaki River",
    basin: "Gandaki",
    region: "Mustang to Devghat",
    coordinates: [
      [28.810, 83.730], // Kagbeni / Jomsom
      [28.680, 83.650], // Marpha
      [28.560, 83.610], // Ghasa gorge
      [28.490, 83.650], // Tatopani
      [28.340, 83.560], // Beni
      [28.220, 83.680], // Kushma / Baglung
      [28.080, 83.620], // Modibeni
      [27.930, 83.650], // Ramdi (Palpa)
      [27.850, 83.850], // Ridi / Rampur
      [27.750, 84.200], // Keladighat
      [27.722, 84.425], // Devghat confluence
    ],
  },
  {
    id: "trishuli",
    name: "Trishuli River",
    basin: "Gandaki",
    region: "Rasuwa to Devghat",
    coordinates: [
      [28.280, 85.380], // Rasuwagadhi border
      [28.150, 85.335], // Syaphrubesi
      [28.050, 85.240], // Dhunche lower
      [27.980, 85.170], // Betrawati
      [27.915, 85.120], // Trishuli Bazar
      [27.830, 85.060], // Galchi
      [27.805, 84.850], // Malekhu
      [27.780, 84.680], // Kurintar
      [27.860, 84.550], // Mugling confluence with Marsyangdi
      [27.722, 84.425], // Devghat confluence
    ],
  },
  {
    id: "marsyangdi",
    name: "Marsyangdi River",
    basin: "Gandaki",
    region: "Manang & Lamjung",
    coordinates: [
      [28.660, 84.020], // Manang Valley
      [28.550, 84.320], // Chame
      [28.450, 84.380], // Tal
      [28.350, 84.410], // Jagat / Dharapani
      [28.230, 84.375], // Besisahar
      [28.090, 84.390], // Paudi / Bimalnagar
      [27.975, 84.420], // Dumre
      [27.860, 84.550], // Mugling confluence
    ],
  },
  {
    id: "seti-gandaki",
    name: "Seti Gandaki River",
    basin: "Gandaki",
    region: "Pokhara Valley",
    coordinates: [
      [28.580, 83.950], // Annapurna gorge
      [28.360, 83.970], // Yamdi / Pokhara north
      [28.218, 83.990], // Pokhara deep gorge / Ramghat
      [28.120, 84.050], // Gagangaunda
      [28.050, 84.180], // Khairenitar
      [27.970, 84.280], // Damauli confluence
      [27.830, 84.450], // Gaighat / Trishuli confluence
    ],
  },
  {
    id: "karnali",
    name: "Karnali River",
    basin: "Karnali",
    region: "Western Nepal & Chisapani",
    coordinates: [
      [30.150, 81.680], // Hilsa border
      [29.970, 81.820], // Simikot
      [29.650, 81.750], // Humla gorge
      [29.350, 81.680], // Bajura border
      [29.180, 81.620], // Kalikot
      [28.920, 81.480], // Dailekh / Achham border
      [28.750, 81.350], // Asaraghat
      [28.640, 81.280], // Chisapani gorge
      [28.520, 81.210], // Kothiaghat
      [28.380, 81.140], // Tikapur / Geruwa branch
      [28.250, 81.100], // Nepal-India border
    ],
  },
  {
    id: "bheri",
    name: "Bheri River",
    basin: "Karnali",
    region: "Dolpa to Surkhet",
    coordinates: [
      [28.980, 82.900], // Dunai (Dolpa)
      [28.850, 82.550], // Rukum West
      [28.700, 82.200], // Jajarkot
      [28.580, 81.850], // Sallibazar
      [28.450, 81.700], // Birendranagar / Chhinchu
      [28.520, 81.480], // Ghatgaon
      [28.640, 81.280], // Karnali confluence above Chisapani
    ],
  },
  {
    id: "babai",
    name: "Babai River",
    basin: "Karnali",
    region: "Dang to Bardiya",
    coordinates: [
      [28.050, 82.450], // Dang Inner Terai
      [28.120, 82.150], // Tulsipur lower
      [28.250, 81.850], // Chepang bridge
      [28.350, 81.550], // Bardiya National Park
      [28.300, 81.380], // Gulariya
      [28.180, 81.250], // Indo-Nepal border
    ],
  },
  {
    id: "west-rapti",
    name: "West Rapti River",
    basin: "Rapti",
    region: "Pyuthan to Banke",
    coordinates: [
      [28.180, 82.900], // Pyuthan hills
      [28.050, 82.820], // Bhalubang
      [27.920, 82.550], // Deukhuri Valley
      [27.980, 82.150], // Kusum
      [27.950, 81.850], // Agaiya (Sikta Barrage)
      [27.850, 81.680], // Kamdi / Banke
      [27.700, 81.580], // Holiya border
    ],
  },
  {
    id: "mahakali",
    name: "Mahakali River",
    basin: "Mahakali",
    region: "Western Border",
    coordinates: [
      [29.980, 80.620], // Kalapani
      [29.840, 80.530], // Darchula
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
    name: "East Rapti River",
    basin: "Narayani",
    region: "Hetauda to Chitwan",
    coordinates: [
      [27.430, 85.040], // Hetauda
      [27.480, 84.800], // Manahari
      [27.550, 84.620], // Lothar
      [27.580, 84.500], // Sauraha / Chitwan National Park
      [27.570, 84.280], // Narayani confluence
    ],
  },
  {
    id: "kankai",
    name: "Kankai River",
    basin: "Koshi",
    region: "Ilam & Jhapa",
    coordinates: [
      [27.100, 87.980], // Deumai / Ilam
      [26.850, 87.930], // Mainachuli
      [26.650, 87.900], // Kotihoma / Kankai Bridge
      [26.480, 87.870], // Jhapa south plains
      [26.350, 87.850], // Border
    ],
  },
  {
    id: "mechi",
    name: "Mechi River",
    basin: "Koshi",
    region: "Eastern Border",
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
    name: "Kamala River",
    basin: "Kamala",
    region: "Sindhuli & Siraha",
    coordinates: [
      [27.200, 85.950], // Sindhuli hills
      [27.050, 86.080], // Kamala Barrage / Chisan
      [26.780, 86.050], // Siraha / Dhanusha border
      [26.580, 86.020], // Border
    ],
  },
];
