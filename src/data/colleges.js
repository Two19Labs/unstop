// src/data/colleges.js
// Exhaustive, standardized collegiate directory for Two19 Labs OneStop
// Normalizes student identities across all major universities and colleges in India.

export const YEAR_OPTIONS = [
  'UG 1st Year',
  'UG 2nd Year',
  'UG 3rd Year',
  'UG 4th Year',
  'PG 1st Year',
  'PG 2nd Year',
];

export function normalizeYear(val) {
  if (!val) return 'UG 2nd Year';
  if (val.includes('UG') || val.includes('PG')) return val;
  if (val.includes('1st')) return 'UG 1st Year';
  if (val.includes('2nd')) return 'UG 2nd Year';
  if (val.includes('3rd')) return 'UG 3rd Year';
  if (val.includes('4th')) return 'UG 4th Year';
  if (val.toLowerCase().includes('postgraduate') || val.toLowerCase().includes('master') || val.includes('5th')) return 'PG 1st Year';
  return 'UG 2nd Year';
}

export const COLLEGES_DATABASE = [
  {
    "name": "Shaheed Sukhdev College of Business Studies (SSCBS)",
    "short": "SSCBS",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "bms",
      "bfia",
      "delhi university",
      "rohini"
    ]
  },
  {
    "name": "Shri Ram College of Commerce (SRCC)",
    "short": "SRCC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "commerce",
      "economics",
      "delhi university",
      "north campus"
    ]
  },
  {
    "name": "St. Stephen's College",
    "short": "Stephens",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "economics",
      "arts",
      "delhi university",
      "north campus"
    ]
  },
  {
    "name": "Hindu College",
    "short": "Hindu",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "north campus",
      "delhi university"
    ]
  },
  {
    "name": "Hansraj College",
    "short": "Hansraj",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "north campus",
      "delhi university"
    ]
  },
  {
    "name": "Lady Shri Ram College for Women (LSR)",
    "short": "LSR",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "lajpat nagar"
    ]
  },
  {
    "name": "Miranda House",
    "short": "Miranda",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "north campus",
      "delhi university"
    ]
  },
  {
    "name": "Kirori Mal College (KMC)",
    "short": "KMC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "north campus",
      "delhi university"
    ]
  },
  {
    "name": "Ramjas College",
    "short": "Ramjas",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "north campus",
      "delhi university"
    ]
  },
  {
    "name": "Sri Guru Gobind Singh College of Commerce (SGGSCC)",
    "short": "SGGSCC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "commerce",
      "delhi university",
      "pitampura"
    ]
  },
  {
    "name": "Sri Venkateswara College (Venky)",
    "short": "Venky",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "dhaula kuan"
    ]
  },
  {
    "name": "Sri Guru Tegh Bahadur Khalsa College (SGTB Khalsa)",
    "short": "SGTB Khalsa",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "north campus",
      "delhi university"
    ]
  },
  {
    "name": "Gargi College",
    "short": "Gargi",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university"
    ]
  },
  {
    "name": "Deen Dayal Upadhyaya College (DDU)",
    "short": "DDU",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "delhi university",
      "dwarka"
    ]
  },
  {
    "name": "Atma Ram Sanatan Dharma College (ARSD)",
    "short": "ARSD",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university"
    ]
  },
  {
    "name": "Shaheed Bhagat Singh College (SBSC)",
    "short": "SBSC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "commerce",
      "delhi university",
      "sheikh sarai"
    ]
  },
  {
    "name": "Keshav Mahavidyalaya",
    "short": "KMV",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "bms",
      "delhi university",
      "rani bagh"
    ]
  },
  {
    "name": "Jesus and Mary College (JMC)",
    "short": "JMC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "chanakyapuri"
    ]
  },
  {
    "name": "Indraprastha College for Women (IPCW)",
    "short": "IPCW",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "delhi university",
      "civil lines"
    ]
  },
  {
    "name": "Daulat Ram College (DRC)",
    "short": "DRC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "north campus",
      "delhi university"
    ]
  },
  {
    "name": "Kamala Nehru College (KNC)",
    "short": "KNC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "august kranti marg"
    ]
  },
  {
    "name": "Maitreyi College",
    "short": "Maitreyi",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "chanakyapuri"
    ]
  },
  {
    "name": "Delhi College of Arts and Commerce (DCAC)",
    "short": "DCAC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "netaji nagar"
    ]
  },
  {
    "name": "Motilal Nehru College",
    "short": "MLNC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "benito juarez marg"
    ]
  },
  {
    "name": "Ramanujan College",
    "short": "Ramanujan",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "kalkaji"
    ]
  },
  {
    "name": "PGDAV College",
    "short": "PGDAV",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "nehru nagar"
    ]
  },
  {
    "name": "Shivaji College",
    "short": "Shivaji",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "west delhi",
      "delhi university",
      "raja garden"
    ]
  },
  {
    "name": "Rajdhani College",
    "short": "Rajdhani",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "west delhi",
      "delhi university",
      "raja garden"
    ]
  },
  {
    "name": "Maharaja Agrasen College",
    "short": "MAC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "east delhi",
      "delhi university",
      "vasundhara enclave"
    ]
  },
  {
    "name": "Aryabhatta College",
    "short": "Aryabhatta",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university"
    ]
  },
  {
    "name": "Zakir Husain Delhi College",
    "short": "ZHDC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "central delhi",
      "delhi university",
      "jawaharlal nehru marg"
    ]
  },
  {
    "name": "Dyal Singh College",
    "short": "DSC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university",
      "lodhi road"
    ]
  },
  {
    "name": "Deshbandhu College",
    "short": "Deshbandhu",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south delhi",
      "delhi university",
      "kalkaji"
    ]
  },
  {
    "name": "Acharya Narendra Dev College (ANDC)",
    "short": "ANDC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "science",
      "delhi university",
      "govindpuri"
    ]
  },
  {
    "name": "Bhaskaracharya College of Applied Sciences",
    "short": "BCAS",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "applied science",
      "delhi university",
      "dwarka"
    ]
  },
  {
    "name": "College of Vocational Studies (CVS)",
    "short": "CVS",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "vocational",
      "delhi university",
      "sheikh sarai"
    ]
  },
  {
    "name": "Cluster Innovation Centre (CIC), DU",
    "short": "CIC DU",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "innovation",
      "engineering",
      "delhi university"
    ]
  },
  {
    "name": "Faculty of Management Studies (FMS), Delhi University",
    "short": "FMS Delhi",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "fms",
      "mba",
      "delhi university"
    ]
  },
  {
    "name": "Delhi School of Economics (DSE), Delhi University",
    "short": "DSE",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "dse",
      "economics",
      "delhi university"
    ]
  },
  {
    "name": "Shaheed Rajguru College of Applied Sciences for Women",
    "short": "SRCASW",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "vasundhara enclave",
      "delhi university"
    ]
  },
  {
    "name": "Shyam Lal College",
    "short": "SLC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "shahdara",
      "delhi university"
    ]
  },
  {
    "name": "Kalindi College",
    "short": "Kalindi",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "patel nagar",
      "delhi university"
    ]
  },
  {
    "name": "Vivekananda College",
    "short": "Vivekananda",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "vivek vihar",
      "delhi university"
    ]
  },
  {
    "name": "Swami Shraddhanand College",
    "short": "SSN DU",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "alipur",
      "delhi university"
    ]
  },
  {
    "name": "Satyawati College",
    "short": "Satyawati",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "ashok vihar",
      "delhi university"
    ]
  },
  {
    "name": "Ram Lal Anand College (RLA)",
    "short": "RLA",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "south campus",
      "delhi university"
    ]
  },
  {
    "name": "Sri Aurobindo College",
    "short": "Aurobindo",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "malviya nagar",
      "delhi university"
    ]
  },
  {
    "name": "Mata Sundri College for Women",
    "short": "Mata Sundri",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "mandi house",
      "delhi university"
    ]
  },
  {
    "name": "Janki Devi Memorial College (JDMC)",
    "short": "JDMC",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "karol bagh",
      "delhi university"
    ]
  },
  {
    "name": "Bharati College",
    "short": "Bharati DU",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "janakpuri",
      "delhi university"
    ]
  },
  {
    "name": "Lakshmibai College",
    "short": "Lakshmibai",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "ashok vihar",
      "delhi university"
    ]
  },
  {
    "name": "University of Delhi (Central Campus)",
    "short": "DU",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du",
      "delhi university"
    ]
  },
  {
    "name": "Indian Institute of Technology Bombay (IIT Bombay)",
    "short": "IIT Bombay",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "iitb",
      "iit bombay",
      "powai"
    ]
  },
  {
    "name": "Indian Institute of Technology Delhi (IIT Delhi)",
    "short": "IIT Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "iitd",
      "iit delhi",
      "hauz khas"
    ]
  },
  {
    "name": "Indian Institute of Technology Madras (IIT Madras)",
    "short": "IIT Madras",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "iitm",
      "iit madras",
      "chennai",
      "adyar"
    ]
  },
  {
    "name": "Indian Institute of Technology Kanpur (IIT Kanpur)",
    "short": "IIT Kanpur",
    "city": "Kanpur",
    "state": "Uttar Pradesh",
    "tags": [
      "iitk",
      "iit kanpur",
      "kalyanpur"
    ]
  },
  {
    "name": "Indian Institute of Technology Kharagpur (IIT Kharagpur)",
    "short": "IIT Kharagpur",
    "city": "Kharagpur",
    "state": "West Bengal",
    "tags": [
      "iitkgp",
      "iit kharagpur"
    ]
  },
  {
    "name": "Indian Institute of Technology Roorkee (IIT Roorkee)",
    "short": "IIT Roorkee",
    "city": "Roorkee",
    "state": "Uttarakhand",
    "tags": [
      "iitr",
      "iit roorkee"
    ]
  },
  {
    "name": "Indian Institute of Technology Guwahati (IIT Guwahati)",
    "short": "IIT Guwahati",
    "city": "Guwahati",
    "state": "Assam",
    "tags": [
      "iitg",
      "iit guwahati",
      "north guwahati"
    ]
  },
  {
    "name": "Indian Institute of Technology BHU (IIT BHU Varanasi)",
    "short": "IIT BHU",
    "city": "Varanasi",
    "state": "Uttar Pradesh",
    "tags": [
      "iit bhu",
      "varanasi",
      "it bhu"
    ]
  },
  {
    "name": "Indian Institute of Technology Hyderabad (IIT Hyderabad)",
    "short": "IIT Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "iith",
      "iit hyderabad",
      "kandi",
      "sangareddy"
    ]
  },
  {
    "name": "Indian Institute of Technology Gandhinagar (IIT Gandhinagar)",
    "short": "IIT Gandhinagar",
    "city": "Gandhinagar",
    "state": "Gujarat",
    "tags": [
      "iitgn",
      "iit gandhinagar",
      "palaj"
    ]
  },
  {
    "name": "Indian Institute of Technology Ropar (IIT Ropar)",
    "short": "IIT Ropar",
    "city": "Ropar",
    "state": "Punjab",
    "tags": [
      "iit ropar",
      "iitrpr",
      "punjab"
    ]
  },
  {
    "name": "Indian Institute of Technology Patna (IIT Patna)",
    "short": "IIT Patna",
    "city": "Patna",
    "state": "Bihar",
    "tags": [
      "iit patna",
      "iitp",
      "bihta"
    ]
  },
  {
    "name": "Indian Institute of Technology Bhubaneswar (IIT Bhubaneswar)",
    "short": "IIT Bhubaneswar",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "tags": [
      "iit bbs",
      "iit bbsr",
      "argul"
    ]
  },
  {
    "name": "Indian Institute of Technology Indore (IIT Indore)",
    "short": "IIT Indore",
    "city": "Indore",
    "state": "Madhya Pradesh",
    "tags": [
      "iiti",
      "iit indore",
      "simrol"
    ]
  },
  {
    "name": "Indian Institute of Technology Mandi (IIT Mandi)",
    "short": "IIT Mandi",
    "city": "Mandi",
    "state": "Himachal Pradesh",
    "tags": [
      "iit mandi",
      "kamand",
      "himachal"
    ]
  },
  {
    "name": "Indian Institute of Technology Jodhpur (IIT Jodhpur)",
    "short": "IIT Jodhpur",
    "city": "Jodhpur",
    "state": "Rajasthan",
    "tags": [
      "iitj",
      "iit jodhpur",
      "karwar"
    ]
  },
  {
    "name": "Indian Institute of Technology Tirupati (IIT Tirupati)",
    "short": "IIT Tirupati",
    "city": "Tirupati",
    "state": "Andhra Pradesh",
    "tags": [
      "iit tirupati",
      "iitt",
      "yerpedu"
    ]
  },
  {
    "name": "Indian Institute of Technology Palakkad (IIT Palakkad)",
    "short": "IIT Palakkad",
    "city": "Palakkad",
    "state": "Kerala",
    "tags": [
      "iit palakkad",
      "iitpkd",
      "kerala"
    ]
  },
  {
    "name": "Indian Institute of Technology Dharwad (IIT Dharwad)",
    "short": "IIT Dharwad",
    "city": "Dharwad",
    "state": "Karnataka",
    "tags": [
      "iit dharwad",
      "iitdh",
      "karnataka"
    ]
  },
  {
    "name": "Indian Institute of Technology Bhilai (IIT Bhilai)",
    "short": "IIT Bhilai",
    "city": "Bhilai",
    "state": "Chhattisgarh",
    "tags": [
      "iit bhilai",
      "chhattisgarh"
    ]
  },
  {
    "name": "Indian Institute of Technology Goa (IIT Goa)",
    "short": "IIT Goa",
    "city": "Goa",
    "state": "Goa",
    "tags": [
      "iit goa",
      "farmagudi"
    ]
  },
  {
    "name": "Indian Institute of Technology Jammu (IIT Jammu)",
    "short": "IIT Jammu",
    "city": "Jammu",
    "state": "Jammu and Kashmir",
    "tags": [
      "iit jammu",
      "jagti"
    ]
  },
  {
    "name": "Indian Institute of Technology (ISM) Dhanbad",
    "short": "IIT ISM",
    "city": "Dhanbad",
    "state": "Jharkhand",
    "tags": [
      "iit ism",
      "dhanbad",
      "ism dhanbad",
      "jharkhand"
    ]
  },
  {
    "name": "Indian Institute of Management Ahmedabad (IIM Ahmedabad)",
    "short": "IIM Ahmedabad",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "tags": [
      "iima",
      "iim ahmedabad",
      "vastrapur"
    ]
  },
  {
    "name": "Indian Institute of Management Bangalore (IIM Bangalore)",
    "short": "IIM Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "iimb",
      "iim bangalore",
      "bannerghatta"
    ]
  },
  {
    "name": "Indian Institute of Management Calcutta (IIM Calcutta)",
    "short": "IIM Calcutta",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "iimc",
      "iim calcutta",
      "joka"
    ]
  },
  {
    "name": "Indian Institute of Management Lucknow (IIM Lucknow)",
    "short": "IIM Lucknow",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "tags": [
      "iiml",
      "iim lucknow",
      "prabandh nagar"
    ]
  },
  {
    "name": "Indian Institute of Management Kozhikode (IIM Kozhikode)",
    "short": "IIM Kozhikode",
    "city": "Kozhikode",
    "state": "Kerala",
    "tags": [
      "iimk",
      "iim kozhikode",
      "kunnamangalam"
    ]
  },
  {
    "name": "Indian Institute of Management Indore (IIM Indore)",
    "short": "IIM Indore",
    "city": "Indore",
    "state": "Madhya Pradesh",
    "tags": [
      "iimi",
      "iim indore",
      "ipm",
      "prabandh shikhar"
    ]
  },
  {
    "name": "Indian Institute of Management Shillong (IIM Shillong)",
    "short": "IIM Shillong",
    "city": "Shillong",
    "state": "Meghalaya",
    "tags": [
      "iim shillong",
      "umsawli"
    ]
  },
  {
    "name": "Indian Institute of Management Rohtak (IIM Rohtak)",
    "short": "IIM Rohtak",
    "city": "Rohtak",
    "state": "Haryana",
    "tags": [
      "iim rohtak",
      "ipm",
      "sunaria"
    ]
  },
  {
    "name": "Indian Institute of Management Ranchi (IIM Ranchi)",
    "short": "IIM Ranchi",
    "city": "Ranchi",
    "state": "Jharkhand",
    "tags": [
      "iim ranchi",
      "ipm"
    ]
  },
  {
    "name": "Indian Institute of Management Raipur (IIM Raipur)",
    "short": "IIM Raipur",
    "city": "Raipur",
    "state": "Chhattisgarh",
    "tags": [
      "iim raipur",
      "atal nagar",
      "nawa raipur"
    ]
  },
  {
    "name": "Indian Institute of Management Tiruchirappalli (IIM Trichy)",
    "short": "IIM Trichy",
    "city": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "tags": [
      "iim trichy",
      "thuvakudi"
    ]
  },
  {
    "name": "Indian Institute of Management Udaipur (IIM Udaipur)",
    "short": "IIM Udaipur",
    "city": "Udaipur",
    "state": "Rajasthan",
    "tags": [
      "iim udaipur",
      "balicha"
    ]
  },
  {
    "name": "Indian Institute of Management Kashipur (IIM Kashipur)",
    "short": "IIM Kashipur",
    "city": "Kashipur",
    "state": "Uttarakhand",
    "tags": [
      "iim kashipur"
    ]
  },
  {
    "name": "Indian Institute of Management Nagpur (IIM Nagpur)",
    "short": "IIM Nagpur",
    "city": "Nagpur",
    "state": "Maharashtra",
    "tags": [
      "iim nagpur",
      "mihan"
    ]
  },
  {
    "name": "Indian Institute of Management Visakhapatnam (IIM Vizag)",
    "short": "IIM Vizag",
    "city": "Visakhapatnam",
    "state": "Andhra Pradesh",
    "tags": [
      "iim vizag",
      "gambheeram"
    ]
  },
  {
    "name": "Indian Institute of Management Bodh Gaya (IIM Bodh Gaya)",
    "short": "IIM Bodh Gaya",
    "city": "Bodh Gaya",
    "state": "Bihar",
    "tags": [
      "iim bodh gaya",
      "ipm"
    ]
  },
  {
    "name": "Indian Institute of Management Amritsar (IIM Amritsar)",
    "short": "IIM Amritsar",
    "city": "Amritsar",
    "state": "Punjab",
    "tags": [
      "iim amritsar",
      "manawala"
    ]
  },
  {
    "name": "Indian Institute of Management Sambalpur (IIM Sambalpur)",
    "short": "IIM Sambalpur",
    "city": "Sambalpur",
    "state": "Odisha",
    "tags": [
      "iim sambalpur",
      "basantpur"
    ]
  },
  {
    "name": "Indian Institute of Management Sirmaur (IIM Sirmaur)",
    "short": "IIM Sirmaur",
    "city": "Sirmaur",
    "state": "Himachal Pradesh",
    "tags": [
      "iim sirmaur",
      "paonta sahib"
    ]
  },
  {
    "name": "Indian Institute of Management Jammu (IIM Jammu)",
    "short": "IIM Jammu",
    "city": "Jammu",
    "state": "Jammu and Kashmir",
    "tags": [
      "iim jammu",
      "ipm",
      "jagti"
    ]
  },
  {
    "name": "Indian Institute of Management Mumbai (IIM Mumbai / NITIE)",
    "short": "IIM Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "iim mumbai",
      "nitie",
      "vihar lake",
      "powai"
    ]
  },
  {
    "name": "National Institute of Technology Tiruchirappalli (NIT Trichy)",
    "short": "NIT Trichy",
    "city": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "tags": [
      "nitt",
      "nit trichy",
      "thuvakudi"
    ]
  },
  {
    "name": "National Institute of Technology Karnataka, Surathkal (NITK Surathkal)",
    "short": "NITK Surathkal",
    "city": "Surathkal",
    "state": "Karnataka",
    "tags": [
      "nitk",
      "surathkal",
      "mangalore"
    ]
  },
  {
    "name": "National Institute of Technology Warangal (NIT Warangal)",
    "short": "NIT Warangal",
    "city": "Warangal",
    "state": "Telangana",
    "tags": [
      "nitw",
      "warangal",
      "kazipet"
    ]
  },
  {
    "name": "National Institute of Technology Rourkela (NIT Rourkela)",
    "short": "NIT Rourkela",
    "city": "Rourkela",
    "state": "Odisha",
    "tags": [
      "nitr",
      "nit rourkela"
    ]
  },
  {
    "name": "National Institute of Technology Calicut (NIT Calicut)",
    "short": "NIT Calicut",
    "city": "Kozhikode",
    "state": "Kerala",
    "tags": [
      "nitc",
      "calicut",
      "chathamangalam"
    ]
  },
  {
    "name": "Visvesvaraya National Institute of Technology, Nagpur (VNIT Nagpur)",
    "short": "VNIT Nagpur",
    "city": "Nagpur",
    "state": "Maharashtra",
    "tags": [
      "vnit",
      "nagpur"
    ]
  },
  {
    "name": "Malaviya National Institute of Technology, Jaipur (MNIT Jaipur)",
    "short": "MNIT Jaipur",
    "city": "Jaipur",
    "state": "Rajasthan",
    "tags": [
      "mnit",
      "jaipur",
      "malaviya"
    ]
  },
  {
    "name": "Motilal Nehru National Institute of Technology, Allahabad (MNNIT Allahabad)",
    "short": "MNNIT Allahabad",
    "city": "Prayagraj",
    "state": "Uttar Pradesh",
    "tags": [
      "mnnit",
      "allahabad",
      "teliyarganj"
    ]
  },
  {
    "name": "Maulana Azad National Institute of Technology, Bhopal (MANIT Bhopal)",
    "short": "MANIT Bhopal",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "tags": [
      "manit",
      "bhopal"
    ]
  },
  {
    "name": "Sardar Vallabhbhai National Institute of Technology, Surat (SVNIT Surat)",
    "short": "SVNIT Surat",
    "city": "Surat",
    "state": "Gujarat",
    "tags": [
      "svnit",
      "surat",
      "ichchhanath"
    ]
  },
  {
    "name": "National Institute of Technology Kurukshetra (NIT Kurukshetra)",
    "short": "NIT Kurukshetra",
    "city": "Kurukshetra",
    "state": "Haryana",
    "tags": [
      "nitk",
      "kurukshetra"
    ]
  },
  {
    "name": "National Institute of Technology Silchar (NIT Silchar)",
    "short": "NIT Silchar",
    "city": "Silchar",
    "state": "Assam",
    "tags": [
      "nits",
      "silchar",
      "assam"
    ]
  },
  {
    "name": "National Institute of Technology Durgapur (NIT Durgapur)",
    "short": "NIT Durgapur",
    "city": "Durgapur",
    "state": "West Bengal",
    "tags": [
      "nitdgp",
      "durgapur",
      "bengal"
    ]
  },
  {
    "name": "National Institute of Technology Jamshedpur (NIT Jamshedpur)",
    "short": "NIT Jamshedpur",
    "city": "Jamshedpur",
    "state": "Jharkhand",
    "tags": [
      "nitjsr",
      "adityapur"
    ]
  },
  {
    "name": "Dr. B R Ambedkar National Institute of Technology, Jalandhar (NIT Jalandhar)",
    "short": "NIT Jalandhar",
    "city": "Jalandhar",
    "state": "Punjab",
    "tags": [
      "nitj",
      "jalandhar"
    ]
  },
  {
    "name": "National Institute of Technology Hamirpur (NIT Hamirpur)",
    "short": "NIT Hamirpur",
    "city": "Hamirpur",
    "state": "Himachal Pradesh",
    "tags": [
      "nith",
      "anu"
    ]
  },
  {
    "name": "National Institute of Technology Patna (NIT Patna)",
    "short": "NIT Patna",
    "city": "Patna",
    "state": "Bihar",
    "tags": [
      "nitp",
      "ashok rajpath"
    ]
  },
  {
    "name": "National Institute of Technology Raipur (NIT Raipur)",
    "short": "NIT Raipur",
    "city": "Raipur",
    "state": "Chhattisgarh",
    "tags": [
      "nitrr",
      "ge road"
    ]
  },
  {
    "name": "National Institute of Technology Goa (NIT Goa)",
    "short": "NIT Goa",
    "city": "Goa",
    "state": "Goa",
    "tags": [
      "nit goa",
      "cuncolim"
    ]
  },
  {
    "name": "National Institute of Technology Srinagar (NIT Srinagar)",
    "short": "NIT Srinagar",
    "city": "Srinagar",
    "state": "Jammu and Kashmir",
    "tags": [
      "nit srinagar",
      "hazratbal"
    ]
  },
  {
    "name": "National Institute of Technology Meghalaya (NIT Meghalaya)",
    "short": "NIT Meghalaya",
    "city": "Shillong",
    "state": "Meghalaya",
    "tags": [
      "nit meghalaya",
      "sohra",
      "cherrapunjee"
    ]
  },
  {
    "name": "National Institute of Technology Agartala (NIT Agartala)",
    "short": "NIT Agartala",
    "city": "Agartala",
    "state": "Tripura",
    "tags": [
      "nita",
      "tripura",
      "jirania"
    ]
  },
  {
    "name": "National Institute of Technology Puducherry (NIT Puducherry)",
    "short": "NITPY",
    "city": "Karaikal",
    "state": "Puducherry",
    "tags": [
      "nit py",
      "karaikal"
    ]
  },
  {
    "name": "National Institute of Technology Arunachal Pradesh (NIT Arunachal)",
    "short": "NIT Arunachal",
    "city": "Yupia",
    "state": "Arunachal Pradesh",
    "tags": [
      "nit ap",
      "jote"
    ]
  },
  {
    "name": "National Institute of Technology Manipur (NIT Manipur)",
    "short": "NIT Manipur",
    "city": "Imphal",
    "state": "Manipur",
    "tags": [
      "nit manipur",
      "langol"
    ]
  },
  {
    "name": "National Institute of Technology Mizoram (NIT Mizoram)",
    "short": "NIT Mizoram",
    "city": "Aizawl",
    "state": "Mizoram",
    "tags": [
      "nit mizoram",
      "chaltlang"
    ]
  },
  {
    "name": "National Institute of Technology Nagaland (NIT Nagaland)",
    "short": "NIT Nagaland",
    "city": "Dimapur",
    "state": "Nagaland",
    "tags": [
      "nit nagaland",
      "chumukedima"
    ]
  },
  {
    "name": "National Institute of Technology Sikkim (NIT Sikkim)",
    "short": "NIT Sikkim",
    "city": "Ravangla",
    "state": "Sikkim",
    "tags": [
      "nit sikkim"
    ]
  },
  {
    "name": "National Institute of Technology Uttarakhand (NIT Uttarakhand)",
    "short": "NITUK",
    "city": "Srinagar Garhwal",
    "state": "Uttarakhand",
    "tags": [
      "nit uk",
      "sumari"
    ]
  },
  {
    "name": "National Institute of Technology Andhra Pradesh (NIT Andhra)",
    "short": "NIT Andhra",
    "city": "Tadepalligudem",
    "state": "Andhra Pradesh",
    "tags": [
      "nit ap",
      "tadepalligudem"
    ]
  },
  {
    "name": "Indian Institute of Engineering Science and Technology, Shibpur (IIEST Shibpur)",
    "short": "IIEST Shibpur",
    "city": "Howrah",
    "state": "West Bengal",
    "tags": [
      "iiest",
      "shibpur",
      "bec",
      "howrah",
      "kolkata"
    ]
  },
  {
    "name": "International Institute of Information Technology, Hyderabad (IIIT Hyderabad)",
    "short": "IIIT Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "iiith",
      "gachibowli"
    ]
  },
  {
    "name": "Indraprastha Institute of Information Technology Delhi (IIIT Delhi)",
    "short": "IIIT Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "iiitd",
      "okhla"
    ]
  },
  {
    "name": "International Institute of Information Technology Bangalore (IIIT Bangalore)",
    "short": "IIIT Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "iiitb",
      "electronic city"
    ]
  },
  {
    "name": "Indian Institute of Information Technology, Allahabad (IIIT Allahabad)",
    "short": "IIIT Allahabad",
    "city": "Prayagraj",
    "state": "Uttar Pradesh",
    "tags": [
      "iiita",
      "jhalwa"
    ]
  },
  {
    "name": "ABV-Indian Institute of Information Technology and Management, Gwalior (IIITM Gwalior)",
    "short": "IIITM Gwalior",
    "city": "Gwalior",
    "state": "Madhya Pradesh",
    "tags": [
      "iiitm",
      "morena link road"
    ]
  },
  {
    "name": "Indian Institute of Information Technology, Lucknow (IIIT Lucknow)",
    "short": "IIIT Lucknow",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "tags": [
      "iiitl",
      "chak ganjaria"
    ]
  },
  {
    "name": "Indian Institute of Information Technology, Pune (IIIT Pune)",
    "short": "IIIT Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "iiitp",
      "ambegaon"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Sri City, Chittoor (IIIT Sri City)",
    "short": "IIIT Sri City",
    "city": "Sri City",
    "state": "Andhra Pradesh",
    "tags": [
      "iiits",
      "chittoor"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Guwahati (IIIT Guwahati)",
    "short": "IIIT Guwahati",
    "city": "Guwahati",
    "state": "Assam",
    "tags": [
      "iiitg",
      "bongora"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Vadodara (IIIT Vadodara)",
    "short": "IIIT Vadodara",
    "city": "Gandhinagar",
    "state": "Gujarat",
    "tags": [
      "iiitv"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Kota (IIIT Kota)",
    "short": "IIIT Kota",
    "city": "Kota",
    "state": "Rajasthan",
    "tags": [
      "iiit kota",
      "ranpur"
    ]
  },
  {
    "name": "Indian Institute of Information Technology, Design and Manufacturing Jabalpur (IIITDM Jabalpur)",
    "short": "IIITDM Jabalpur",
    "city": "Jabalpur",
    "state": "Madhya Pradesh",
    "tags": [
      "iiitdmj",
      "dumna"
    ]
  },
  {
    "name": "Indian Institute of Information Technology, Design and Manufacturing Kancheepuram (IIITDM Kancheepuram)",
    "short": "IIITDM Kancheepuram",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "iiitdmk",
      "vandalur"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Tiruchirappalli (IIIT Trichy)",
    "short": "IIIT Trichy",
    "city": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "tags": [
      "iiitt",
      "sethurapatti"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Sonepat (IIIT Sonepat)",
    "short": "IIIT Sonepat",
    "city": "Sonipat",
    "state": "Haryana",
    "tags": [
      "iiit sonepat",
      "kilohrad"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Una (IIIT Una)",
    "short": "IIIT Una",
    "city": "Una",
    "state": "Himachal Pradesh",
    "tags": [
      "iiitu",
      "saloh"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Surat (IIIT Surat)",
    "short": "IIIT Surat",
    "city": "Surat",
    "state": "Gujarat",
    "tags": [
      "iiit surat",
      "kamrej"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Bhopal (IIIT Bhopal)",
    "short": "IIIT Bhopal",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "tags": [
      "iiit bhopal"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Bhagalpur (IIIT Bhagalpur)",
    "short": "IIIT Bhagalpur",
    "city": "Bhagalpur",
    "state": "Bihar",
    "tags": [
      "iiit bhagalpur",
      "sabour"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Nagpur (IIIT Nagpur)",
    "short": "IIIT Nagpur",
    "city": "Nagpur",
    "state": "Maharashtra",
    "tags": [
      "iiitn",
      "butibori"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Ranchi (IIIT Ranchi)",
    "short": "IIIT Ranchi",
    "city": "Ranchi",
    "state": "Jharkhand",
    "tags": [
      "iiit ranchi",
      "namkum"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Kottayam (IIIT Kottayam)",
    "short": "IIIT Kottayam",
    "city": "Kottayam",
    "state": "Kerala",
    "tags": [
      "iiitk",
      "valavoor",
      "pala"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Dharwad (IIIT Dharwad)",
    "short": "IIIT Dharwad",
    "city": "Dharwad",
    "state": "Karnataka",
    "tags": [
      "iiit dharwad",
      "sattur"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Kalyani (IIIT Kalyani)",
    "short": "IIIT Kalyani",
    "city": "Kalyani",
    "state": "West Bengal",
    "tags": [
      "iiit kalyani"
    ]
  },
  {
    "name": "Indian Institute of Information Technology Agartala (IIIT Agartala)",
    "short": "IIIT Agartala",
    "city": "Agartala",
    "state": "Tripura",
    "tags": [
      "iiit agartala"
    ]
  },
  {
    "name": "Birla Institute of Technology and Science, Pilani (BITS Pilani)",
    "short": "BITS Pilani",
    "city": "Pilani",
    "state": "Rajasthan",
    "tags": [
      "bits",
      "pilani",
      "vidya vihar"
    ]
  },
  {
    "name": "BITS Pilani, K. K. Birla Goa Campus (BITS Goa)",
    "short": "BITS Goa",
    "city": "Goa",
    "state": "Goa",
    "tags": [
      "bits goa",
      "birla",
      "zuarinagar"
    ]
  },
  {
    "name": "BITS Pilani, Hyderabad Campus (BITS Hyderabad)",
    "short": "BITS Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "bits hyd",
      "birla",
      "shamirpet"
    ]
  },
  {
    "name": "National Law School of India University (NLSIU), Bengaluru",
    "short": "NLSIU Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "nlsiu",
      "clat",
      "nlu",
      "nagasandra"
    ]
  },
  {
    "name": "NALSAR University of Law, Hyderabad",
    "short": "NALSAR",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "nalsar",
      "clat",
      "shamirpet"
    ]
  },
  {
    "name": "The West Bengal National University of Juridical Sciences (WBNUJS), Kolkata",
    "short": "WBNUJS Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "nujs",
      "clat",
      "salt lake"
    ]
  },
  {
    "name": "National Law University Delhi (NLU Delhi)",
    "short": "NLU Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "nlud",
      "ailet",
      "dwarka"
    ]
  },
  {
    "name": "National Law University, Jodhpur (NLU Jodhpur)",
    "short": "NLU Jodhpur",
    "city": "Jodhpur",
    "state": "Rajasthan",
    "tags": [
      "nluj",
      "clat",
      "mandore"
    ]
  },
  {
    "name": "Gujarat National Law University (GNLU), Gandhinagar",
    "short": "GNLU Gandhinagar",
    "city": "Gandhinagar",
    "state": "Gujarat",
    "tags": [
      "gnlu",
      "clat",
      "koba"
    ]
  },
  {
    "name": "National Law Institute University (NLIU), Bhopal",
    "short": "NLIU Bhopal",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "tags": [
      "nliu",
      "clat",
      "kerwa"
    ]
  },
  {
    "name": "Dr. Ram Manohar Lohiya National Law University (RMLNLU), Lucknow",
    "short": "RMLNLU Lucknow",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "tags": [
      "rmlnlu",
      "aashiana"
    ]
  },
  {
    "name": "Rajiv Gandhi National University of Law (RGNUL), Patiala",
    "short": "RGNUL Patiala",
    "city": "Patiala",
    "state": "Punjab",
    "tags": [
      "rgnul",
      "sidhpur"
    ]
  },
  {
    "name": "Chanakya National Law University (CNLU), Patna",
    "short": "CNLU Patna",
    "city": "Patna",
    "state": "Bihar",
    "tags": [
      "cnlu",
      "mithapur"
    ]
  },
  {
    "name": "National University of Advanced Legal Studies (NUALS), Kochi",
    "short": "NUALS Kochi",
    "city": "Kochi",
    "state": "Kerala",
    "tags": [
      "nuals",
      "kalamassery"
    ]
  },
  {
    "name": "National Law University Odisha (NLUO), Cuttack",
    "short": "NLUO Cuttack",
    "city": "Cuttack",
    "state": "Odisha",
    "tags": [
      "nluo",
      "naraj"
    ]
  },
  {
    "name": "National University of Study and Research in Law (NUSRL), Ranchi",
    "short": "NUSRL Ranchi",
    "city": "Ranchi",
    "state": "Jharkhand",
    "tags": [
      "nusrl"
    ]
  },
  {
    "name": "Damodaram Sanjivayya National Law University (DSNLU), Visakhapatnam",
    "short": "DSNLU Vizag",
    "city": "Visakhapatnam",
    "state": "Andhra Pradesh",
    "tags": [
      "dsnlu",
      "sabbavaram"
    ]
  },
  {
    "name": "Tamil Nadu National Law University (TNNLU), Tiruchirappalli",
    "short": "TNNLU Trichy",
    "city": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "tags": [
      "tnnlu"
    ]
  },
  {
    "name": "Maharashtra National Law University Mumbai (MNLU Mumbai)",
    "short": "MNLU Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "mnlu mumbai",
      "powai"
    ]
  },
  {
    "name": "Maharashtra National Law University, Nagpur (MNLU Nagpur)",
    "short": "MNLU Nagpur",
    "city": "Nagpur",
    "state": "Maharashtra",
    "tags": [
      "mnlu nagpur"
    ]
  },
  {
    "name": "Maharashtra National Law University, Aurangabad (MNLU Aurangabad)",
    "short": "MNLU Aurangabad",
    "city": "Chhatrapati Sambhajinagar",
    "state": "Maharashtra",
    "tags": [
      "mnlu aurangabad"
    ]
  },
  {
    "name": "Himachal Pradesh National Law University (HPNLU), Shimla",
    "short": "HPNLU Shimla",
    "city": "Shimla",
    "state": "Himachal Pradesh",
    "tags": [
      "hpnlu",
      "ghandal"
    ]
  },
  {
    "name": "Dharmashastra National Law University (DNLU), Jabalpur",
    "short": "DNLU Jabalpur",
    "city": "Jabalpur",
    "state": "Madhya Pradesh",
    "tags": [
      "dnlu"
    ]
  },
  {
    "name": "Dr. B.R. Ambedkar National Law University (DBRANLU), Sonipat",
    "short": "DBRANLU Sonipat",
    "city": "Sonipat",
    "state": "Haryana",
    "tags": [
      "dbranlu"
    ]
  },
  {
    "name": "Symbiosis Law School (SLS), Pune",
    "short": "SLS Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "sls pune",
      "slat",
      "viman nagar"
    ]
  },
  {
    "name": "Symbiosis Law School (SLS), Noida",
    "short": "SLS Noida",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "sls noida"
    ]
  },
  {
    "name": "Symbiosis Law School (SLS), Hyderabad",
    "short": "SLS Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "sls hyd"
    ]
  },
  {
    "name": "Government Law College (GLC), Mumbai",
    "short": "GLC Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "glc",
      "churchgate"
    ]
  },
  {
    "name": "ILS Law College, Pune",
    "short": "ILS Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "ils",
      "law college road"
    ]
  },
  {
    "name": "Jindal Global Law School (JGLS), Sonipat",
    "short": "JGLS",
    "city": "Sonipat",
    "state": "Haryana",
    "tags": [
      "jgls",
      "op jindal"
    ]
  },
  {
    "name": "Faculty of Law, University of Delhi",
    "short": "Faculty of Law DU",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "du law",
      "clc",
      "lc1",
      "lc2"
    ]
  },
  {
    "name": "All India Institute of Medical Sciences (AIIMS), New Delhi",
    "short": "AIIMS New Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "aiims",
      "ansari nagar",
      "mbbs"
    ]
  },
  {
    "name": "AIIMS Jodhpur",
    "short": "AIIMS Jodhpur",
    "city": "Jodhpur",
    "state": "Rajasthan",
    "tags": [
      "aiims jodhpur",
      "basni"
    ]
  },
  {
    "name": "AIIMS Rishikesh",
    "short": "AIIMS Rishikesh",
    "city": "Rishikesh",
    "state": "Uttarakhand",
    "tags": [
      "aiims rishikesh",
      "virbhadra"
    ]
  },
  {
    "name": "AIIMS Bhopal",
    "short": "AIIMS Bhopal",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "tags": [
      "aiims bhopal",
      "saket nagar"
    ]
  },
  {
    "name": "AIIMS Bhubaneswar",
    "short": "AIIMS Bhubaneswar",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "tags": [
      "aiims bbsr",
      "sijua"
    ]
  },
  {
    "name": "AIIMS Raipur",
    "short": "AIIMS Raipur",
    "city": "Raipur",
    "state": "Chhattisgarh",
    "tags": [
      "aiims raipur",
      "tatibandh"
    ]
  },
  {
    "name": "AIIMS Patna",
    "short": "AIIMS Patna",
    "city": "Patna",
    "state": "Bihar",
    "tags": [
      "aiims patna",
      "phulwarisharif"
    ]
  },
  {
    "name": "AIIMS Nagpur",
    "short": "AIIMS Nagpur",
    "city": "Nagpur",
    "state": "Maharashtra",
    "tags": [
      "aiims nagpur",
      "mihan"
    ]
  },
  {
    "name": "AIIMS Kalyani",
    "short": "AIIMS Kalyani",
    "city": "Kalyani",
    "state": "West Bengal",
    "tags": [
      "aiims kalyani"
    ]
  },
  {
    "name": "AIIMS Mangalagiri",
    "short": "AIIMS Mangalagiri",
    "city": "Mangalagiri",
    "state": "Andhra Pradesh",
    "tags": [
      "aiims mangalagiri",
      "guntur",
      "vijayawada"
    ]
  },
  {
    "name": "AIIMS Gorakhpur",
    "short": "AIIMS Gorakhpur",
    "city": "Gorakhpur",
    "state": "Uttar Pradesh",
    "tags": [
      "aiims gorakhpur"
    ]
  },
  {
    "name": "AIIMS Bibinagar",
    "short": "AIIMS Bibinagar",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "aiims bibinagar",
      "yadadri"
    ]
  },
  {
    "name": "AIIMS Bathinda",
    "short": "AIIMS Bathinda",
    "city": "Bathinda",
    "state": "Punjab",
    "tags": [
      "aiims bathinda"
    ]
  },
  {
    "name": "AIIMS Deoghar",
    "short": "AIIMS Deoghar",
    "city": "Deoghar",
    "state": "Jharkhand",
    "tags": [
      "aiims deoghar"
    ]
  },
  {
    "name": "AIIMS Bilaspur",
    "short": "AIIMS Bilaspur",
    "city": "Bilaspur",
    "state": "Himachal Pradesh",
    "tags": [
      "aiims bilaspur",
      "kothipura"
    ]
  },
  {
    "name": "AIIMS Rajkot",
    "short": "AIIMS Rajkot",
    "city": "Rajkot",
    "state": "Gujarat",
    "tags": [
      "aiims rajkot",
      "khandheri"
    ]
  },
  {
    "name": "AIIMS Jammu",
    "short": "AIIMS Jammu",
    "city": "Jammu",
    "state": "Jammu and Kashmir",
    "tags": [
      "aiims jammu",
      "vijaypur"
    ]
  },
  {
    "name": "AIIMS Guwahati",
    "short": "AIIMS Guwahati",
    "city": "Guwahati",
    "state": "Assam",
    "tags": [
      "aiims guwahati",
      "changsari"
    ]
  },
  {
    "name": "Christian Medical College (CMC), Vellore",
    "short": "CMC Vellore",
    "city": "Vellore",
    "state": "Tamil Nadu",
    "tags": [
      "cmc",
      "ida scudder"
    ]
  },
  {
    "name": "Jawaharlal Institute of Postgraduate Medical Education and Research (JIPMER)",
    "short": "JIPMER",
    "city": "Puducherry",
    "state": "Puducherry",
    "tags": [
      "jipmer",
      "dhanvantari nagar"
    ]
  },
  {
    "name": "Postgraduate Institute of Medical Education and Research (PGIMER)",
    "short": "PGIMER Chandigarh",
    "city": "Chandigarh",
    "state": "Chandigarh",
    "tags": [
      "pgi",
      "pgimer"
    ]
  },
  {
    "name": "King George's Medical University (KGMU), Lucknow",
    "short": "KGMU Lucknow",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "tags": [
      "kgmu",
      "chowk"
    ]
  },
  {
    "name": "Kasturba Medical College (KMC), Manipal",
    "short": "KMC Manipal",
    "city": "Manipal",
    "state": "Karnataka",
    "tags": [
      "kmc manipal",
      "mahe"
    ]
  },
  {
    "name": "Kasturba Medical College (KMC), Mangalore",
    "short": "KMC Mangalore",
    "city": "Mangalore",
    "state": "Karnataka",
    "tags": [
      "kmc mangalore",
      "mahe"
    ]
  },
  {
    "name": "St. John's Medical College, Bengaluru",
    "short": "St. John's Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "st johns",
      "koramangala"
    ]
  },
  {
    "name": "Maulana Azad Medical College (MAMC), New Delhi",
    "short": "MAMC Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "mamc",
      "bahadur shah zafar marg"
    ]
  },
  {
    "name": "Lady Hardinge Medical College (LHMC), New Delhi",
    "short": "LHMC Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "lhmc",
      "connaught place"
    ]
  },
  {
    "name": "Vardhman Mahavir Medical College & Safdarjung Hospital (VMMC)",
    "short": "VMMC Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "vmmc",
      "safdarjung"
    ]
  },
  {
    "name": "Institute of Medical Sciences, BHU (IMS BHU)",
    "short": "IMS BHU",
    "city": "Varanasi",
    "state": "Uttar Pradesh",
    "tags": [
      "ims bhu",
      "banaras"
    ]
  },
  {
    "name": "Grant Medical College & Sir J.J. Group of Hospitals, Mumbai",
    "short": "Grant Medical Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "gmc mumbai",
      "jj hospital",
      "byculla"
    ]
  },
  {
    "name": "Seth G.S. Medical College & KEM Hospital, Mumbai",
    "short": "KEM Hospital Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "kem",
      "seth gs",
      "parel"
    ]
  },
  {
    "name": "Madras Medical College (MMC), Chennai",
    "short": "MMC Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "mmc chennai",
      "park town"
    ]
  },
  {
    "name": "Stanley Medical College, Chennai",
    "short": "Stanley Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "stanley",
      "royapuram"
    ]
  },
  {
    "name": "Bangalore Medical College and Research Institute (BMCRI)",
    "short": "BMCRI Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "bmcri",
      "fort"
    ]
  },
  {
    "name": "Armed Forces Medical College (AFMC), Pune",
    "short": "AFMC Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "afmc",
      "wanowrie"
    ]
  },
  {
    "name": "Medical College Kolkata (Calcutta Medical College)",
    "short": "CMC Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "medical college kolkata",
      "college street"
    ]
  },
  {
    "name": "XLRI Xavier School of Management, Jamshedpur",
    "short": "XLRI Jamshedpur",
    "city": "Jamshedpur",
    "state": "Jharkhand",
    "tags": [
      "xlri",
      "xat",
      "circuit house"
    ]
  },
  {
    "name": "XLRI Delhi-NCR Campus",
    "short": "XLRI Delhi",
    "city": "Jhajjar",
    "state": "Haryana",
    "tags": [
      "xlri delhi",
      "management",
      "aurangpur"
    ]
  },
  {
    "name": "SPJIMR Mumbai (S.P. Jain Institute of Management and Research)",
    "short": "SPJIMR",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "spjimr",
      "sp jain",
      "andheri west",
      "bhavans"
    ]
  },
  {
    "name": "Management Development Institute (MDI), Gurgaon",
    "short": "MDI Gurgaon",
    "city": "Gurugram",
    "state": "Haryana",
    "tags": [
      "mdi",
      "mehrauli road",
      "mba"
    ]
  },
  {
    "name": "Symbiosis Institute of Business Management (SIBM), Pune",
    "short": "SIBM Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "sibm",
      "lavale",
      "snap"
    ]
  },
  {
    "name": "Symbiosis Centre for Management and Human Resource Development (SCMHRD)",
    "short": "SCMHRD Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "scmhrd",
      "hinjewadi"
    ]
  },
  {
    "name": "Narsee Monjee Institute of Management Studies (NMIMS), Mumbai",
    "short": "NMIMS Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "nmims",
      "npat",
      "nmat",
      "vile parle"
    ]
  },
  {
    "name": "NMIMS Bengaluru",
    "short": "NMIMS Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "nmims bangalore",
      "bannerghatta"
    ]
  },
  {
    "name": "NMIMS Hyderabad",
    "short": "NMIMS Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "nmims hyderabad",
      "jadcherla"
    ]
  },
  {
    "name": "NMIMS Navi Mumbai",
    "short": "NMIMS Navi Mumbai",
    "city": "Navi Mumbai",
    "state": "Maharashtra",
    "tags": [
      "nmims navi mumbai",
      "kharghar"
    ]
  },
  {
    "name": "NMIMS Indore",
    "short": "NMIMS Indore",
    "city": "Indore",
    "state": "Madhya Pradesh",
    "tags": [
      "nmims indore",
      "super corridor"
    ]
  },
  {
    "name": "Symbiosis International University (SIU), Pune",
    "short": "Symbiosis Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "siu",
      "set",
      "pune",
      "senapati bapat"
    ]
  },
  {
    "name": "Symbiosis Centre for Management Studies (SCMS), Pune",
    "short": "SCMS Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "scms pune",
      "bba",
      "viman nagar"
    ]
  },
  {
    "name": "Symbiosis Centre for Management Studies (SCMS), Noida",
    "short": "SCMS Noida",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "scms noida",
      "bba",
      "sector 62"
    ]
  },
  {
    "name": "Symbiosis Centre for Management Studies (SCMS), Bengaluru",
    "short": "SCMS Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "scms bangalore",
      "electronic city"
    ]
  },
  {
    "name": "Institute of Management Technology (IMT), Ghaziabad",
    "short": "IMT Ghaziabad",
    "city": "Ghaziabad",
    "state": "Uttar Pradesh",
    "tags": [
      "imt",
      "raj nagar"
    ]
  },
  {
    "name": "International Management Institute (IMI), New Delhi",
    "short": "IMI Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "imi",
      "qutab institutional area"
    ]
  },
  {
    "name": "FORE School of Management, New Delhi",
    "short": "FORE Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "fore",
      "qutab institutional area"
    ]
  },
  {
    "name": "T. A. Pai Management Institute (TAPMI), Manipal",
    "short": "TAPMI",
    "city": "Manipal",
    "state": "Karnataka",
    "tags": [
      "tapmi",
      "mahe"
    ]
  },
  {
    "name": "Great Lakes Institute of Management, Chennai",
    "short": "Great Lakes Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "great lakes",
      "ecr"
    ]
  },
  {
    "name": "Great Lakes Institute of Management, Gurgaon",
    "short": "Great Lakes Gurgaon",
    "city": "Gurugram",
    "state": "Haryana",
    "tags": [
      "great lakes gurgaon"
    ]
  },
  {
    "name": "Goa Institute of Management (GIM), Goa",
    "short": "GIM Goa",
    "city": "Sanquelim",
    "state": "Goa",
    "tags": [
      "gim goa",
      "pomburpa"
    ]
  },
  {
    "name": "K.J. Somaiya Institute of Management (SIMSR), Mumbai",
    "short": "SIMSR Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "simsr",
      "somaiya",
      "vidyavihar"
    ]
  },
  {
    "name": "Prin. L.N. Welingkar Institute of Management Development & Research (WeSchool), Mumbai",
    "short": "Welingkar Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "welingkar",
      "weschool",
      "matunga"
    ]
  },
  {
    "name": "Welingkar Institute of Management (WeSchool), Bengaluru",
    "short": "Welingkar Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "welingkar bangalore",
      "electronic city"
    ]
  },
  {
    "name": "Jamnalal Bajaj Institute of Management Studies (JBIMS), Mumbai",
    "short": "JBIMS",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "jbims",
      "ceoctr",
      "churchgate"
    ]
  },
  {
    "name": "Syamaprasad Institute of Management Studies and Research (SIMSREE), Mumbai",
    "short": "SIMSREE",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "simsree",
      "churchgate"
    ]
  },
  {
    "name": "University Business School (UBS), Panjab University, Chandigarh",
    "short": "UBS Chandigarh",
    "city": "Chandigarh",
    "state": "Chandigarh",
    "tags": [
      "ubs",
      "pu chandigarh"
    ]
  },
  {
    "name": "Birla Institute of Management Technology (BIMTECH), Greater Noida",
    "short": "BIMTECH",
    "city": "Greater Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "bimtech",
      "knowledge park"
    ]
  },
  {
    "name": "Loyola Institute of Business Administration (LIBA), Chennai",
    "short": "LIBA Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "liba",
      "nungambakkam"
    ]
  },
  {
    "name": "XIM University (Xavier Institute of Management), Bhubaneswar",
    "short": "XIMB",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "tags": [
      "ximb",
      "xavier"
    ]
  },
  {
    "name": "Institute of Rural Management Anand (IRMA)",
    "short": "IRMA Anand",
    "city": "Anand",
    "state": "Gujarat",
    "tags": [
      "irma"
    ]
  },
  {
    "name": "Mudra Institute of Communications, Ahmedabad (MICA)",
    "short": "MICA",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "tags": [
      "mica",
      "shela",
      "marketing"
    ]
  },
  {
    "name": "Indian Institute of Foreign Trade (IIFT), New Delhi",
    "short": "IIFT Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "iift",
      "qutab institutional area"
    ]
  },
  {
    "name": "Indian Institute of Foreign Trade (IIFT), Kolkata",
    "short": "IIFT Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "iift kolkata",
      "madurdaha"
    ]
  },
  {
    "name": "Department of Management Studies (DMS), IIT Delhi",
    "short": "DMS IIT Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "dms iitd"
    ]
  },
  {
    "name": "Shailesh J. Mehta School of Management (SJMSOM), IIT Bombay",
    "short": "SJMSOM IIT Bombay",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "sjmsom",
      "iit bombay mba"
    ]
  },
  {
    "name": "Vinod Gupta School of Management (VGSoM), IIT Kharagpur",
    "short": "VGSoM IIT Kharagpur",
    "city": "Kharagpur",
    "state": "West Bengal",
    "tags": [
      "vgsom",
      "iit kgp mba"
    ]
  },
  {
    "name": "Department of Management Studies (DoMS), IIT Madras",
    "short": "DoMS IIT Madras",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "doms iitm"
    ]
  },
  {
    "name": "Industrial & Management Engineering (IME), IIT Kanpur",
    "short": "IME IIT Kanpur",
    "city": "Kanpur",
    "state": "Uttar Pradesh",
    "tags": [
      "ime iitk"
    ]
  },
  {
    "name": "Ashoka University, Sonipat",
    "short": "Ashoka",
    "city": "Sonipat",
    "state": "Haryana",
    "tags": [
      "ashoka",
      "liberal arts",
      "rajiv gandhi education city"
    ]
  },
  {
    "name": "O.P. Jindal Global University (JGU), Sonipat",
    "short": "Jindal Global",
    "city": "Sonipat",
    "state": "Haryana",
    "tags": [
      "jgu",
      "jindal law",
      "sonipat"
    ]
  },
  {
    "name": "Plaksha University, Mohali",
    "short": "Plaksha",
    "city": "Mohali",
    "state": "Punjab",
    "tags": [
      "plaksha",
      "tech",
      "ai",
      "punjab",
      "it city"
    ]
  },
  {
    "name": "Shiv Nadar University (SNU), Greater Noida",
    "short": "SNU Noida",
    "city": "Greater Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "snu",
      "shiv nadar",
      "dadri"
    ]
  },
  {
    "name": "Shiv Nadar University, Chennai",
    "short": "SNU Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "snu chennai",
      "kalavakkam"
    ]
  },
  {
    "name": "Krea University, Sri City",
    "short": "Krea",
    "city": "Sri City",
    "state": "Andhra Pradesh",
    "tags": [
      "krea",
      "interwoven learning"
    ]
  },
  {
    "name": "FLAME University, Pune",
    "short": "FLAME",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "flame",
      "liberal education",
      "lavale"
    ]
  },
  {
    "name": "Ahmedabad University, Ahmedabad",
    "short": "Ahmedabad Univ",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "tags": [
      "ahmedabad university",
      "navrangpura"
    ]
  },
  {
    "name": "Azim Premji University, Bengaluru",
    "short": "Azim Premji",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "apu",
      "azim premji",
      "sarjapur"
    ]
  },
  {
    "name": "Bennett University, Greater Noida",
    "short": "Bennett",
    "city": "Greater Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "bennett",
      "times group",
      "techzone"
    ]
  },
  {
    "name": "BML Munjal University, Gurugram",
    "short": "BMU",
    "city": "Gurugram",
    "state": "Haryana",
    "tags": [
      "bmu",
      "hero group",
      "sidhrawali"
    ]
  },
  {
    "name": "Mahindra University, Hyderabad",
    "short": "Mahindra Univ",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "mahindra",
      "ecole centrale",
      "bahadurpally"
    ]
  },
  {
    "name": "Woxsen University, Hyderabad",
    "short": "Woxsen",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "woxsen",
      "kamkole",
      "sadasivpet"
    ]
  },
  {
    "name": "Rishihood University, Sonipat",
    "short": "Rishihood",
    "city": "Sonipat",
    "state": "Haryana",
    "tags": [
      "rishihood"
    ]
  },
  {
    "name": "Vidyashilp University, Bengaluru",
    "short": "Vidyashilp",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "vidyashilp",
      "yelahanka"
    ]
  },
  {
    "name": "Atria University, Bengaluru",
    "short": "Atria Univ",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "atria university",
      "hebbal"
    ]
  },
  {
    "name": "Sai University, Chennai",
    "short": "Sai Univ",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "sai university",
      "omr"
    ]
  },
  {
    "name": "Delhi Technological University (DTU / DCE)",
    "short": "DTU",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "dtu",
      "dce",
      "bawana",
      "rohini"
    ]
  },
  {
    "name": "Netaji Subhas University of Technology (NSUT / DIT)",
    "short": "NSUT",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "nsut",
      "nsit",
      "dwarka"
    ]
  },
  {
    "name": "Indira Gandhi Delhi Technical University for Women (IGDTUW)",
    "short": "IGDTUW",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "igdtuw",
      "kashmere gate"
    ]
  },
  {
    "name": "Maharaja Agrasen Institute of Technology (MAIT)",
    "short": "MAIT Delhi",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "mait",
      "ipu",
      "rohini"
    ]
  },
  {
    "name": "Maharaja Surajmal Institute of Technology (MSIT)",
    "short": "MSIT Delhi",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "msit",
      "ipu",
      "janakpuri"
    ]
  },
  {
    "name": "Bharati Vidyapeeth's College of Engineering (BVCOE), New Delhi",
    "short": "BVCOE Delhi",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "bvcoe",
      "paschim vihar"
    ]
  },
  {
    "name": "Bhagwan Parshuram Institute of Technology (BPIT)",
    "short": "BPIT Delhi",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "bpit",
      "rohini"
    ]
  },
  {
    "name": "University School of Information, Communication and Technology (USICT), GGSIPU",
    "short": "USICT",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "usict",
      "ggsipu",
      "dwarka"
    ]
  },
  {
    "name": "Jaypee Institute of Information Technology (JIIT), Noida",
    "short": "JIIT Noida",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "jiit",
      "sector 62",
      "sector 128",
      "jaypee"
    ]
  },
  {
    "name": "Galgotias University, Greater Noida",
    "short": "Galgotias Univ",
    "city": "Greater Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "galgotias"
    ]
  },
  {
    "name": "Sharda University, Greater Noida",
    "short": "Sharda Univ",
    "city": "Greater Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "sharda"
    ]
  },
  {
    "name": "Amity University, Noida",
    "short": "Amity Noida",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "amity",
      "sector 125"
    ]
  },
  {
    "name": "Amity University, Gurugram",
    "short": "Amity Gurugram",
    "city": "Gurugram",
    "state": "Haryana",
    "tags": [
      "amity manesar",
      "panchgaon"
    ]
  },
  {
    "name": "JSS Academy of Technical Education (JSSATE), Noida",
    "short": "JSS Noida",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "jss",
      "sector 62"
    ]
  },
  {
    "name": "Ajay Kumar Garg Engineering College (AKGEC), Ghaziabad",
    "short": "AKGEC",
    "city": "Ghaziabad",
    "state": "Uttar Pradesh",
    "tags": [
      "akgec"
    ]
  },
  {
    "name": "KIET Group of Institutions, Ghaziabad",
    "short": "KIET Ghaziabad",
    "city": "Ghaziabad",
    "state": "Uttar Pradesh",
    "tags": [
      "kiet",
      "muradnagar"
    ]
  },
  {
    "name": "ABES Engineering College, Ghaziabad",
    "short": "ABES",
    "city": "Ghaziabad",
    "state": "Uttar Pradesh",
    "tags": [
      "abes"
    ]
  },
  {
    "name": "GL Bajaj Institute of Technology and Management, Greater Noida",
    "short": "GL Bajaj",
    "city": "Greater Noida",
    "state": "Uttar Pradesh",
    "tags": [
      "gl bajaj",
      "knowledge park"
    ]
  },
  {
    "name": "J.C. Bose University of Science and Technology, YMCA, Faridabad",
    "short": "YMCA Faridabad",
    "city": "Faridabad",
    "state": "Haryana",
    "tags": [
      "ymca"
    ]
  },
  {
    "name": "The NorthCap University (NCU), Gurugram",
    "short": "NCU Gurugram",
    "city": "Gurugram",
    "state": "Haryana",
    "tags": [
      "ncu",
      "itmu"
    ]
  },
  {
    "name": "College of Engineering Pune (COEP Technological University)",
    "short": "COEP",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "coep",
      "shivajinagar"
    ]
  },
  {
    "name": "Veermata Jijabai Technological Institute (VJTI), Mumbai",
    "short": "VJTI",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "vjti",
      "matunga"
    ]
  },
  {
    "name": "Sardar Patel Institute of Technology (SPIT), Mumbai",
    "short": "SPIT Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "spit",
      "andheri west",
      "bhavans"
    ]
  },
  {
    "name": "Dwarkadas J. Sanghvi College of Engineering (DJSCE / DJ Sanghvi)",
    "short": "DJ Sanghvi",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "djsce",
      "dj sanghvi",
      "vile parle"
    ]
  },
  {
    "name": "Pune Institute of Computer Technology (PICT), Pune",
    "short": "PICT Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "pict",
      "dhankawadi"
    ]
  },
  {
    "name": "MIT World Peace University (MIT-WPU), Pune",
    "short": "MIT-WPU",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "mit pune",
      "kothrud"
    ]
  },
  {
    "name": "Vishwakarma Institute of Technology (VIT), Pune",
    "short": "VIT Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "vit pune",
      "bibwewadi"
    ]
  },
  {
    "name": "MKSSS's Cummins College of Engineering for Women, Pune",
    "short": "Cummins Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "cummins",
      "karvenagar"
    ]
  },
  {
    "name": "Walchand College of Engineering, Sangli",
    "short": "Walchand Sangli",
    "city": "Sangli",
    "state": "Maharashtra",
    "tags": [
      "walchand",
      "vishrambag"
    ]
  },
  {
    "name": "Government College of Engineering, Karad",
    "short": "GCE Karad",
    "city": "Karad",
    "state": "Maharashtra",
    "tags": [
      "gce karad"
    ]
  },
  {
    "name": "Government College of Engineering, Aurangabad",
    "short": "GECA",
    "city": "Chhatrapati Sambhajinagar",
    "state": "Maharashtra",
    "tags": [
      "geca",
      "aurangabad"
    ]
  },
  {
    "name": "Sardar Patel College of Engineering (SPCE), Mumbai",
    "short": "SPCE Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "spce",
      "andheri"
    ]
  },
  {
    "name": "Fr. Conceicao Rodrigues College of Engineering (CRCE), Bandra",
    "short": "CRCE Bandra",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "crce",
      "fr agnel",
      "bandra"
    ]
  },
  {
    "name": "Thadomal Shahani Engineering College (TSEC), Bandra",
    "short": "TSEC Bandra",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "tsec",
      "bandra west"
    ]
  },
  {
    "name": "K.J. Somaiya College of Engineering (KJSCE), Mumbai",
    "short": "KJSCE Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "kjsce",
      "vidyavihar"
    ]
  },
  {
    "name": "Vidyalankar Institute of Technology (VIT), Mumbai",
    "short": "VIT Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "vit wadala",
      "vidyalankar"
    ]
  },
  {
    "name": "Ramrao Adik Institute of Technology (RAIT), Navi Mumbai",
    "short": "RAIT Navi Mumbai",
    "city": "Navi Mumbai",
    "state": "Maharashtra",
    "tags": [
      "rait",
      "dypatil",
      "nerul"
    ]
  },
  {
    "name": "Pimpri Chinchwad College of Engineering (PCCOE), Pune",
    "short": "PCCOE Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "pccoe",
      "nigdi",
      "akurdi"
    ]
  },
  {
    "name": "Army Institute of Technology (AIT), Pune",
    "short": "AIT Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "ait pune",
      "dighi"
    ]
  },
  {
    "name": "Institute of Chemical Technology (ICT), Mumbai",
    "short": "ICT Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "ict",
      "udct",
      "matunga"
    ]
  },
  {
    "name": "RV College of Engineering (RVCE), Bengaluru",
    "short": "RVCE",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "rvce",
      "mysore road"
    ]
  },
  {
    "name": "BMS College of Engineering (BMSCE), Bengaluru",
    "short": "BMSCE",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "bmsce",
      "basavanagudi"
    ]
  },
  {
    "name": "M.S. Ramaiah Institute of Technology (MSRIT), Bengaluru",
    "short": "MSRIT",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "msrit",
      "ramaiah",
      "mathikere"
    ]
  },
  {
    "name": "PES University, Bengaluru (Ring Road Campus)",
    "short": "PES RR Campus",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "pesit",
      "pesu",
      "ring road",
      "banashankari"
    ]
  },
  {
    "name": "PES University, Bengaluru (Electronic City Campus)",
    "short": "PES EC Campus",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "pes ec",
      "hosur road"
    ]
  },
  {
    "name": "Dayananda Sagar College of Engineering (DSCE), Bengaluru",
    "short": "DSCE Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "dsce",
      "kumaraswamy layout"
    ]
  },
  {
    "name": "Bangalore Institute of Technology (BIT), Bengaluru",
    "short": "BIT Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "bit bangalore",
      "vv puram"
    ]
  },
  {
    "name": "University Visvesvaraya College of Engineering (UVCE), Bengaluru",
    "short": "UVCE Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "uvce",
      "kr circle"
    ]
  },
  {
    "name": "BMS Institute of Technology and Management (BMSIT)",
    "short": "BMSIT Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "bmsit",
      "yelahanka"
    ]
  },
  {
    "name": "Siddaganga Institute of Technology (SIT), Tumakuru",
    "short": "SIT Tumkur",
    "city": "Tumakuru",
    "state": "Karnataka",
    "tags": [
      "sit tumkur"
    ]
  },
  {
    "name": "The National Institute of Engineering (NIE), Mysuru",
    "short": "NIE Mysore",
    "city": "Mysuru",
    "state": "Karnataka",
    "tags": [
      "nie mysore"
    ]
  },
  {
    "name": "Sri Jayachamarajendra College of Engineering (SJCE / JSS STU)",
    "short": "SJCE Mysore",
    "city": "Mysuru",
    "state": "Karnataka",
    "tags": [
      "sjce",
      "jss stu"
    ]
  },
  {
    "name": "KLE Technological University (BVBCET), Hubballi",
    "short": "KLE Tech Hubli",
    "city": "Hubballi",
    "state": "Karnataka",
    "tags": [
      "kle tech",
      "bvb hubli"
    ]
  },
  {
    "name": "NMAM Institute of Technology (NMAMIT), Nitte",
    "short": "NMAMIT Nitte",
    "city": "Nitte",
    "state": "Karnataka",
    "tags": [
      "nitte",
      "karkala"
    ]
  },
  {
    "name": "Manipal Institute of Technology (MIT), MAHE Manipal",
    "short": "MIT Manipal",
    "city": "Manipal",
    "state": "Karnataka",
    "tags": [
      "mit manipal",
      "mahe"
    ]
  },
  {
    "name": "New Horizon College of Engineering (NHCE), Bengaluru",
    "short": "New Horizon",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "nhce",
      "marathahalli",
      "bellandur"
    ]
  },
  {
    "name": "CMR Institute of Technology (CMRIT), Bengaluru",
    "short": "CMRIT Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "cmrit",
      "kundalahalli",
      "whitefield"
    ]
  },
  {
    "name": "RNS Institute of Technology (RNSIT), Bengaluru",
    "short": "RNSIT Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "rnsit",
      "channasandra"
    ]
  },
  {
    "name": "Sir M. Visvesvaraya Institute of Technology (Sir MVIT)",
    "short": "Sir MVIT",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "mvit",
      "yelahanaka"
    ]
  },
  {
    "name": "College of Engineering, Guindy (CEG), Anna University",
    "short": "CEG Guindy",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "ceg",
      "anna university",
      "guindy"
    ]
  },
  {
    "name": "Madras Institute of Technology (MIT), Anna University",
    "short": "MIT Chromepet",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "mit chromepet",
      "anna university"
    ]
  },
  {
    "name": "Alagappa Chettiar College of Technology (ACTech), Anna University",
    "short": "ACTech Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "actech",
      "guindy"
    ]
  },
  {
    "name": "PSG College of Technology, Coimbatore",
    "short": "PSG Tech",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "tags": [
      "psg",
      "peelamedu"
    ]
  },
  {
    "name": "Coimbatore Institute of Technology (CIT), Coimbatore",
    "short": "CIT Coimbatore",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "tags": [
      "cit coimbatore",
      "civil aerodrome"
    ]
  },
  {
    "name": "Thiagarajar College of Engineering (TCE), Madurai",
    "short": "TCE Madurai",
    "city": "Madurai",
    "state": "Tamil Nadu",
    "tags": [
      "tce",
      "thiruparankundram"
    ]
  },
  {
    "name": "SSN College of Engineering, Chennai",
    "short": "SSN Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "ssn",
      "kalavakkam",
      "omr"
    ]
  },
  {
    "name": "Kumaraguru College of Technology (KCT), Coimbatore",
    "short": "KCT Coimbatore",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "tags": [
      "kct",
      "saravanampatti"
    ]
  },
  {
    "name": "Government College of Technology (GCT), Coimbatore",
    "short": "GCT Coimbatore",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "tags": [
      "gct coimbatore",
      "thadagam road"
    ]
  },
  {
    "name": "Sri Krishna College of Engineering and Technology (SKCET)",
    "short": "SKCET Coimbatore",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "tags": [
      "skcet",
      "kuniamuthur"
    ]
  },
  {
    "name": "SASTRA Deemed to be University, Thanjavur",
    "short": "SASTRA Univ",
    "city": "Thanjavur",
    "state": "Tamil Nadu",
    "tags": [
      "sastra",
      "tirumalaisamudram"
    ]
  },
  {
    "name": "Vellore Institute of Technology (VIT), Vellore",
    "short": "VIT Vellore",
    "city": "Vellore",
    "state": "Tamil Nadu",
    "tags": [
      "vit",
      "viteee",
      "katpadi"
    ]
  },
  {
    "name": "Vellore Institute of Technology (VIT), Chennai",
    "short": "VIT Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "vit chennai",
      "vandalur-kelambakkam"
    ]
  },
  {
    "name": "VIT-AP University, Amaravati",
    "short": "VIT-AP",
    "city": "Amaravati",
    "state": "Andhra Pradesh",
    "tags": [
      "vit ap",
      "inavolu"
    ]
  },
  {
    "name": "VIT Bhopal University",
    "short": "VIT Bhopal",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "tags": [
      "vit bhopal",
      "ashta",
      "sehore"
    ]
  },
  {
    "name": "SRM Institute of Science and Technology, Kattankulathur",
    "short": "SRM KTR",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "srm",
      "srmjee",
      "ktr"
    ]
  },
  {
    "name": "SRM Institute of Science and Technology, Ramapuram",
    "short": "SRM Ramapuram",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "srm ramapuram"
    ]
  },
  {
    "name": "SRM Institute of Science and Technology, Vadapalani",
    "short": "SRM Vadapalani",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "srm vadapalani"
    ]
  },
  {
    "name": "SRM University, Delhi-NCR, Sonepat",
    "short": "SRM Sonepat",
    "city": "Sonipat",
    "state": "Haryana",
    "tags": [
      "srm delhi ncr"
    ]
  },
  {
    "name": "SRM University, AP, Amaravati",
    "short": "SRM AP",
    "city": "Amaravati",
    "state": "Andhra Pradesh",
    "tags": [
      "srm ap",
      "neerukonda"
    ]
  },
  {
    "name": "Amrita Vishwa Vidyapeetham, Coimbatore (Ettimadai)",
    "short": "Amrita Coimbatore",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "tags": [
      "amrita",
      "ettimadai"
    ]
  },
  {
    "name": "Amrita Vishwa Vidyapeetham, Bengaluru Campus",
    "short": "Amrita Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "amrita bangalore",
      "kasavanahalli"
    ]
  },
  {
    "name": "Amrita Vishwa Vidyapeetham, Amritapuri Campus",
    "short": "Amrita Kollam",
    "city": "Kollam",
    "state": "Kerala",
    "tags": [
      "amrita amritapuri",
      "clappana"
    ]
  },
  {
    "name": "Amrita Vishwa Vidyapeetham, Chennai Campus",
    "short": "Amrita Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "amrita chennai",
      "vengal"
    ]
  },
  {
    "name": "Sathyabama Institute of Science and Technology, Chennai",
    "short": "Sathyabama",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "sathyabama",
      "jeppiaar",
      "sholinganallur"
    ]
  },
  {
    "name": "Hindustan Institute of Technology and Science (HITS), Chennai",
    "short": "Hindustan Univ",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "hits",
      "padur",
      "omr"
    ]
  },
  {
    "name": "Rajalakshmi Engineering College (REC), Chennai",
    "short": "REC Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "rec chennai",
      "thandalam"
    ]
  },
  {
    "name": "St. Joseph's College of Engineering, Chennai",
    "short": "St. Joseph's Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "st josephs engineering",
      "omr"
    ]
  },
  {
    "name": "Sri Venkateswara College of Engineering (SVCE), Sriperumbudur",
    "short": "SVCE Chennai",
    "city": "Sriperumbudur",
    "state": "Tamil Nadu",
    "tags": [
      "svce",
      "pennalur"
    ]
  },
  {
    "name": "Bannari Amman Institute of Technology (BIT), Sathyamangalam",
    "short": "BIT Sathy",
    "city": "Erode",
    "state": "Tamil Nadu",
    "tags": [
      "bannari amman",
      "sathyamangalam"
    ]
  },
  {
    "name": "Kongu Engineering College, Perundurai",
    "short": "Kongu Engg",
    "city": "Erode",
    "state": "Tamil Nadu",
    "tags": [
      "kongu",
      "perundurai"
    ]
  },
  {
    "name": "Jadavpur University Faculty of Engineering, Kolkata",
    "short": "Jadavpur Univ",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "ju",
      "jadavpur",
      "salt lake campus"
    ]
  },
  {
    "name": "Heritage Institute of Technology (HIT), Kolkata",
    "short": "Heritage Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "heritage",
      "anandapur",
      "hitk"
    ]
  },
  {
    "name": "Techno Main Salt Lake, Kolkata",
    "short": "Techno Main",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "tmsl",
      "techno india",
      "sector v"
    ]
  },
  {
    "name": "Institute of Engineering and Management (IEM), Kolkata",
    "short": "IEM Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "iem",
      "salt lake",
      "sector v"
    ]
  },
  {
    "name": "Kalyani Government Engineering College (KGEC)",
    "short": "KGEC Kalyani",
    "city": "Kalyani",
    "state": "West Bengal",
    "tags": [
      "kgec",
      "nadia"
    ]
  },
  {
    "name": "Jalpaiguri Government Engineering College (JGEC)",
    "short": "JGEC Jalpaiguri",
    "city": "Jalpaiguri",
    "state": "West Bengal",
    "tags": [
      "jgec"
    ]
  },
  {
    "name": "Haldia Institute of Technology (HIT)",
    "short": "HIT Haldia",
    "city": "Haldia",
    "state": "West Bengal",
    "tags": [
      "hit haldia",
      "midnapore"
    ]
  },
  {
    "name": "Netaji Subhash Engineering College (NSEC), Kolkata",
    "short": "NSEC Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "nsec",
      "garia"
    ]
  },
  {
    "name": "Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad",
    "short": "CBIT Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "cbit",
      "gandipet"
    ]
  },
  {
    "name": "Vasavi College of Engineering, Hyderabad",
    "short": "Vasavi Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "vasavi",
      "ibrahimbagh"
    ]
  },
  {
    "name": "VNR Vignana Jyothi Institute of Engineering and Technology (VNR VJIET)",
    "short": "VNR VJIET",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "vnr",
      "bachupally",
      "vjiet"
    ]
  },
  {
    "name": "CVR College of Engineering, Hyderabad",
    "short": "CVR Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "cvr",
      "ibrahimpatnam",
      "vastunagar"
    ]
  },
  {
    "name": "Gokaraju Rangaraju Institute of Engineering and Technology (GRIET)",
    "short": "GRIET Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "griet",
      "bachupally"
    ]
  },
  {
    "name": "BVRIT Hyderabad College of Engineering for Women",
    "short": "BVRIT Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "bvrit",
      "narsapur",
      "bachupally"
    ]
  },
  {
    "name": "University College of Engineering, Osmania University (UCEOU)",
    "short": "OU Engineering",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "ouce",
      "tarnaka"
    ]
  },
  {
    "name": "JNTUH University College of Engineering Science & Technology, Hyderabad",
    "short": "JNTUH Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "jntuh",
      "kukatpally"
    ]
  },
  {
    "name": "Andhra University College of Engineering (AUCE), Visakhapatnam",
    "short": "AUCE Vizag",
    "city": "Visakhapatnam",
    "state": "Andhra Pradesh",
    "tags": [
      "auce",
      "waltair"
    ]
  },
  {
    "name": "Gayatri Vidya Parishad College of Engineering (GVPCE)",
    "short": "GVP Vizag",
    "city": "Visakhapatnam",
    "state": "Andhra Pradesh",
    "tags": [
      "gvpce",
      "madhurawada"
    ]
  },
  {
    "name": "Velagapudi Ramakrishna Siddhartha Engineering College (VRSEC)",
    "short": "VRSEC Vijayawada",
    "city": "Vijayawada",
    "state": "Andhra Pradesh",
    "tags": [
      "vrsec",
      "kanuru"
    ]
  },
  {
    "name": "RVR & JC College of Engineering, Guntur",
    "short": "RVR & JC Guntur",
    "city": "Guntur",
    "state": "Andhra Pradesh",
    "tags": [
      "rvrjc",
      "chowdavaram"
    ]
  },
  {
    "name": "JNTUK University College of Engineering Kakinada",
    "short": "JNTU Kakinada",
    "city": "Kakinada",
    "state": "Andhra Pradesh",
    "tags": [
      "jntuk"
    ]
  },
  {
    "name": "JNTUA College of Engineering Anantapur",
    "short": "JNTU Anantapur",
    "city": "Anantapur",
    "state": "Andhra Pradesh",
    "tags": [
      "jntua"
    ]
  },
  {
    "name": "SVU College of Engineering (SVUCE), Tirupati",
    "short": "SVUCE Tirupati",
    "city": "Tirupati",
    "state": "Andhra Pradesh",
    "tags": [
      "svuce",
      "alipiri"
    ]
  },
  {
    "name": "Koneru Lakshmaiah Education Foundation (KL University), Vijayawada",
    "short": "KL University",
    "city": "Vaddeswaram",
    "state": "Andhra Pradesh",
    "tags": [
      "klu",
      "guntur"
    ]
  },
  {
    "name": "Vignan's Foundation for Science, Technology and Research (VFSTR), Guntur",
    "short": "Vignan Univ",
    "city": "Guntur",
    "state": "Andhra Pradesh",
    "tags": [
      "vignan",
      "vadlamudi"
    ]
  },
  {
    "name": "Dhirubhai Ambani Institute of Information and Communication Technology (DA-IICT)",
    "short": "DA-IICT",
    "city": "Gandhinagar",
    "state": "Gujarat",
    "tags": [
      "daiict",
      "da-iict",
      "infocity"
    ]
  },
  {
    "name": "Nirma University (Institute of Technology), Ahmedabad",
    "short": "Nirma University",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "tags": [
      "nirma",
      "sarkhej gandhinagar highway"
    ]
  },
  {
    "name": "Pandit Deendayal Energy University (PDEU / PDPU), Gandhinagar",
    "short": "PDEU Gandhinagar",
    "city": "Gandhinagar",
    "state": "Gujarat",
    "tags": [
      "pdeu",
      "pdpu",
      "raysan"
    ]
  },
  {
    "name": "Dharmsinh Desai University (DDU), Nadiad",
    "short": "DDU Nadiad",
    "city": "Nadiad",
    "state": "Gujarat",
    "tags": [
      "ddu nadiad",
      "kheda"
    ]
  },
  {
    "name": "L.D. College of Engineering (LDCE), Ahmedabad",
    "short": "LDCE Ahmedabad",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "tags": [
      "ldce",
      "navrangpura"
    ]
  },
  {
    "name": "Birla Vishvakarma Mahavidyalaya (BVM), Vallabh Vidyanagar",
    "short": "BVM Anand",
    "city": "Anand",
    "state": "Gujarat",
    "tags": [
      "bvm",
      "vidyanagar"
    ]
  },
  {
    "name": "The LNM Institute of Information Technology (LNMIIT), Jaipur",
    "short": "LNMIIT",
    "city": "Jaipur",
    "state": "Rajasthan",
    "tags": [
      "lnmiit",
      "jamdoli"
    ]
  },
  {
    "name": "Manipal University Jaipur (MUJ)",
    "short": "MUJ Jaipur",
    "city": "Jaipur",
    "state": "Rajasthan",
    "tags": [
      "muj",
      "dehmi kalan"
    ]
  },
  {
    "name": "MBM University, Jodhpur",
    "short": "MBM Jodhpur",
    "city": "Jodhpur",
    "state": "Rajasthan",
    "tags": [
      "mbm engineering",
      "ratanada"
    ]
  },
  {
    "name": "College of Technology and Engineering (CTAE), Udaipur",
    "short": "CTAE Udaipur",
    "city": "Udaipur",
    "state": "Rajasthan",
    "tags": [
      "ctae"
    ]
  },
  {
    "name": "Rajasthan Technical University (RTU), Kota",
    "short": "RTU Kota",
    "city": "Kota",
    "state": "Rajasthan",
    "tags": [
      "rtu",
      "rawatbhata road"
    ]
  },
  {
    "name": "Banasthali Vidyapith, Rajasthan",
    "short": "Banasthali",
    "city": "Banasthali",
    "state": "Rajasthan",
    "tags": [
      "banasthali",
      "tonk",
      "women"
    ]
  },
  {
    "name": "Thapar Institute of Engineering and Technology (TIET), Patiala",
    "short": "Thapar",
    "city": "Patiala",
    "state": "Punjab",
    "tags": [
      "thapar",
      "patiala",
      "bhadson road"
    ]
  },
  {
    "name": "Punjab Engineering College (PEC), Chandigarh",
    "short": "PEC Chandigarh",
    "city": "Chandigarh",
    "state": "Chandigarh",
    "tags": [
      "pec",
      "sector 12"
    ]
  },
  {
    "name": "Guru Nanak Dev Engineering College (GNDEC), Ludhiana",
    "short": "GNDEC Ludhiana",
    "city": "Ludhiana",
    "state": "Punjab",
    "tags": [
      "gndec",
      "gill park"
    ]
  },
  {
    "name": "Chandigarh University (CU), Mohali",
    "short": "Chandigarh Univ",
    "city": "Mohali",
    "state": "Punjab",
    "tags": [
      "cu",
      "gharuan"
    ]
  },
  {
    "name": "Chitkara University, Punjab",
    "short": "Chitkara Punjab",
    "city": "Rajpura",
    "state": "Punjab",
    "tags": [
      "chitkara",
      "jansla"
    ]
  },
  {
    "name": "Chitkara University, Himachal Pradesh",
    "short": "Chitkara HP",
    "city": "Solan",
    "state": "Himachal Pradesh",
    "tags": [
      "chitkara hp",
      "baddi",
      "barotiwala"
    ]
  },
  {
    "name": "Lovely Professional University (LPU), Phagwara",
    "short": "LPU",
    "city": "Phagwara",
    "state": "Punjab",
    "tags": [
      "lpu",
      "jalandhar"
    ]
  },
  {
    "name": "Chandigarh College of Engineering and Technology (CCET)",
    "short": "CCET Chandigarh",
    "city": "Chandigarh",
    "state": "Chandigarh",
    "tags": [
      "ccet",
      "sector 26"
    ]
  },
  {
    "name": "Harcourt Butler Technical University (HBTU), Kanpur",
    "short": "HBTU Kanpur",
    "city": "Kanpur",
    "state": "Uttar Pradesh",
    "tags": [
      "hbtu",
      "hbti",
      "nawabganj"
    ]
  },
  {
    "name": "Madan Mohan Malaviya University of Technology (MMMUT), Gorakhpur",
    "short": "MMMUT Gorakhpur",
    "city": "Gorakhpur",
    "state": "Uttar Pradesh",
    "tags": [
      "mmmut"
    ]
  },
  {
    "name": "Institute of Engineering and Technology (IET), Lucknow",
    "short": "IET Lucknow",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "tags": [
      "iet lucknow",
      "sitapur road"
    ]
  },
  {
    "name": "Kamla Nehru Institute of Technology (KNIT), Sultanpur",
    "short": "KNIT Sultanpur",
    "city": "Sultanpur",
    "state": "Uttar Pradesh",
    "tags": [
      "knit"
    ]
  },
  {
    "name": "Bundelkhand Institute of Engineering & Technology (BIET), Jhansi",
    "short": "BIET Jhansi",
    "city": "Jhansi",
    "state": "Uttar Pradesh",
    "tags": [
      "biet"
    ]
  },
  {
    "name": "Graphic Era (Deemed to be University), Dehradun",
    "short": "Graphic Era",
    "city": "Dehradun",
    "state": "Uttarakhand",
    "tags": [
      "graphic era",
      "clement town"
    ]
  },
  {
    "name": "University of Petroleum and Energy Studies (UPES), Dehradun",
    "short": "UPES Dehradun",
    "city": "Dehradun",
    "state": "Uttarakhand",
    "tags": [
      "upes",
      "bidholi",
      "kandoli"
    ]
  },
  {
    "name": "DIT University, Dehradun",
    "short": "DIT Dehradun",
    "city": "Dehradun",
    "state": "Uttarakhand",
    "tags": [
      "dit dehradun",
      "makkawala"
    ]
  },
  {
    "name": "Govind Ballabh Pant Institute of Engineering & Technology (GBPIET)",
    "short": "GBPIET Pauri",
    "city": "Pauri Garhwal",
    "state": "Uttarakhand",
    "tags": [
      "gbpiet",
      "ghurdauri"
    ]
  },
  {
    "name": "College of Engineering, Trivandrum (CET)",
    "short": "CET Trivandrum",
    "city": "Thiruvananthapuram",
    "state": "Kerala",
    "tags": [
      "cet trivandrum",
      "sreekaryam"
    ]
  },
  {
    "name": "Government Engineering College (GEC), Thrissur",
    "short": "GEC Thrissur",
    "city": "Thrissur",
    "state": "Kerala",
    "tags": [
      "gec thrissur",
      "ramavarmapuram"
    ]
  },
  {
    "name": "TKM College of Engineering, Kollam",
    "short": "TKM Kollam",
    "city": "Kollam",
    "state": "Kerala",
    "tags": [
      "tkm",
      "karicode"
    ]
  },
  {
    "name": "Govt. Model Engineering College (MEC), Kochi",
    "short": "MEC Kochi",
    "city": "Kochi",
    "state": "Kerala",
    "tags": [
      "mec kochi",
      "thrikkakara"
    ]
  },
  {
    "name": "Government Engineering College, Barton Hill",
    "short": "GEC Barton Hill",
    "city": "Thiruvananthapuram",
    "state": "Kerala",
    "tags": [
      "barton hill"
    ]
  },
  {
    "name": "SCMS School of Engineering and Technology (SSET), Kochi",
    "short": "SCMS Engg",
    "city": "Kochi",
    "state": "Kerala",
    "tags": [
      "scms engineering",
      "karukutty"
    ]
  },
  {
    "name": "Rajagiri School of Engineering & Technology (RSET), Kochi",
    "short": "RSET Kochi",
    "city": "Kochi",
    "state": "Kerala",
    "tags": [
      "rset",
      "kakkand"
    ]
  },
  {
    "name": "Mar Athanasius College of Engineering (MACE), Kothamangalam",
    "short": "MACE",
    "city": "Kothamangalam",
    "state": "Kerala",
    "tags": [
      "mace"
    ]
  },
  {
    "name": "Federal Institute of Science And Technology (FISAT), Angamaly",
    "short": "FISAT",
    "city": "Angamaly",
    "state": "Kerala",
    "tags": [
      "fisat",
      "mookkannoor"
    ]
  },
  {
    "name": "Birla Institute of Technology, Mesra (BIT Mesra)",
    "short": "BIT Mesra",
    "city": "Ranchi",
    "state": "Jharkhand",
    "tags": [
      "bit mesra",
      "ranchi"
    ]
  },
  {
    "name": "Birla Institute of Technology Sindri (BIT Sindri)",
    "short": "BIT Sindri",
    "city": "Dhanbad",
    "state": "Jharkhand",
    "tags": [
      "bit sindri"
    ]
  },
  {
    "name": "Kalinga Institute of Industrial Technology (KIIT), Bhubaneswar",
    "short": "KIIT",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "tags": [
      "kiit",
      "patia"
    ]
  },
  {
    "name": "Siksha 'O' Anusandhan (SOA / ITER), Bhubaneswar",
    "short": "SOA University",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "tags": [
      "soa",
      "iter",
      "khandagiri"
    ]
  },
  {
    "name": "Silicon University, Bhubaneswar",
    "short": "Silicon Univ",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "tags": [
      "silicon",
      "silicon tech",
      "patia"
    ]
  },
  {
    "name": "C. V. Raman Global University (CVRGU), Bhubaneswar",
    "short": "CV Raman Univ",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "tags": [
      "cv raman",
      "mahura"
    ]
  },
  {
    "name": "National Institute of Science and Technology (NIST), Berhampur",
    "short": "NIST Berhampur",
    "city": "Berhampur",
    "state": "Odisha",
    "tags": [
      "nist"
    ]
  },
  {
    "name": "Shri Govindram Seksaria Institute of Technology and Science (SGSITS)",
    "short": "SGSITS Indore",
    "city": "Indore",
    "state": "Madhya Pradesh",
    "tags": [
      "sgsits",
      "vallabh nagar"
    ]
  },
  {
    "name": "Institute of Engineering & Technology, DAVV (IET-DAVV), Indore",
    "short": "IET DAVV",
    "city": "Indore",
    "state": "Madhya Pradesh",
    "tags": [
      "iet davv",
      "khandwa road"
    ]
  },
  {
    "name": "Jabalpur Engineering College (JEC), Jabalpur",
    "short": "JEC Jabalpur",
    "city": "Jabalpur",
    "state": "Madhya Pradesh",
    "tags": [
      "jec jabalpur",
      "gokalpur"
    ]
  },
  {
    "name": "Madhav Institute of Technology & Science (MITS), Gwalior",
    "short": "MITS Gwalior",
    "city": "Gwalior",
    "state": "Madhya Pradesh",
    "tags": [
      "mits gwalior",
      "gole ka mandir"
    ]
  },
  {
    "name": "St. Xavier's College (Autonomous), Mumbai",
    "short": "St. Xavier's Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "xaviers mumbai",
      "bms",
      "dhobi talao",
      "fort"
    ]
  },
  {
    "name": "Narsee Monjee College of Commerce and Economics (NM College)",
    "short": "NM College",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "nm college",
      "vile parle west"
    ]
  },
  {
    "name": "Mithibai College of Arts, Mumbai",
    "short": "Mithibai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "mithibai",
      "vile parle west",
      "svkm"
    ]
  },
  {
    "name": "H.R. College of Commerce and Economics, Mumbai",
    "short": "HR College",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "hr college",
      "churchgate",
      "hsnc"
    ]
  },
  {
    "name": "K.C. College (Kishinchand Chellaram College), Mumbai",
    "short": "KC College",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "kc college",
      "churchgate",
      "dinshaw vacha"
    ]
  },
  {
    "name": "Jai Hind College (Autonomous), Mumbai",
    "short": "Jai Hind",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "jai hind",
      "churchgate"
    ]
  },
  {
    "name": "R.A. Podar College of Commerce and Economics, Mumbai",
    "short": "RA Podar",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "podar",
      "matunga",
      "ln road"
    ]
  },
  {
    "name": "K.J. Somaiya College of Arts and Commerce, Mumbai",
    "short": "KJ Somaiya Arts",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "somaiya",
      "vidyavihar"
    ]
  },
  {
    "name": "Ramnarain Ruia Autonomous College, Mumbai",
    "short": "Ruia College",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "ruia",
      "matunga"
    ]
  },
  {
    "name": "D.G. Ruparel College of Arts, Science and Commerce, Mumbai",
    "short": "Ruparel College",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "ruparel",
      "matunga west"
    ]
  },
  {
    "name": "Sophia College for Women, Mumbai",
    "short": "Sophia College",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "sophia",
      "breach candy",
      "bhulabhai desai"
    ]
  },
  {
    "name": "Wilson College, Mumbai",
    "short": "Wilson College",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "wilson",
      "chowpatty",
      "girgaon"
    ]
  },
  {
    "name": "SIES College of Arts, Science & Commerce, Sion West",
    "short": "SIES College",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "sies",
      "sion west"
    ]
  },
  {
    "name": "Fergusson College (Autonomous), Pune",
    "short": "Fergusson",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "fergusson",
      "fc road",
      "deccan gymkhana"
    ]
  },
  {
    "name": "Brihan Maharashtra College of Commerce (BMCC), Pune",
    "short": "BMCC Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "bmcc",
      "shivajinagar",
      "fergusson college road"
    ]
  },
  {
    "name": "Symbiosis College of Arts & Commerce (Autonomous), Pune",
    "short": "Symbiosis Arts Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "scac",
      "senapati bapat road"
    ]
  },
  {
    "name": "Sir Parashurambhau College (SP College), Pune",
    "short": "SP College Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "sp college",
      "tilak road",
      "sadashiv peth"
    ]
  },
  {
    "name": "Nowrosjee Wadia College, Pune",
    "short": "Wadia College",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "wadia",
      "bund garden"
    ]
  },
  {
    "name": "Modern College of Arts, Science and Commerce, Shivajinagar",
    "short": "Modern College Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "modern college",
      "shivajinagar"
    ]
  },
  {
    "name": "Christ University, Bengaluru (Central Campus)",
    "short": "Christ Central",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "christ university",
      "hosur road",
      "dairy circle"
    ]
  },
  {
    "name": "Christ University, Bengaluru (Bannerghatta Road Campus)",
    "short": "Christ BGR",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "christ bgr",
      "hulimavu"
    ]
  },
  {
    "name": "Christ University, Bengaluru (Yeshwanthpur Campus)",
    "short": "Christ Yeshwanthpur",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "christ ypr",
      "nagasandra"
    ]
  },
  {
    "name": "Christ University, Bengaluru (Kengeri Campus)",
    "short": "Christ Kengeri",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "christ kengeri",
      "mysore road"
    ]
  },
  {
    "name": "Christ University, Delhi NCR Campus",
    "short": "Christ Delhi NCR",
    "city": "Ghaziabad",
    "state": "Uttar Pradesh",
    "tags": [
      "christ delhi",
      "mariam nagar"
    ]
  },
  {
    "name": "Christ University, Pune Lavasa Campus",
    "short": "Christ Lavasa",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "christ lavasa",
      "dasve"
    ]
  },
  {
    "name": "St. Joseph's University, Bengaluru",
    "short": "St. Joseph's Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "sju",
      "langford road",
      "shanti nagar"
    ]
  },
  {
    "name": "Mount Carmel College (Autonomous), Bengaluru",
    "short": "MCC Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "mount carmel",
      "vasanth nagar"
    ]
  },
  {
    "name": "Jyoti Nivas College (Autonomous), Bengaluru",
    "short": "Jyoti Nivas",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "jnc",
      "koramangala"
    ]
  },
  {
    "name": "Kristu Jayanti College (Autonomous), Bengaluru",
    "short": "Kristu Jayanti",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "kjc",
      "kothanur",
      "hennur"
    ]
  },
  {
    "name": "MES College of Arts, Commerce and Science, Malleshwaram",
    "short": "MES Malleshwaram",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "mes",
      "malleshwaram"
    ]
  },
  {
    "name": "The National College, Basavanagudi, Bengaluru",
    "short": "National College Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "national college",
      "basavanagudi"
    ]
  },
  {
    "name": "Jain University, Bengaluru",
    "short": "Jain University",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "jain",
      "jgi",
      "vv puram",
      "jayanagar"
    ]
  },
  {
    "name": "Loyola College (Autonomous), Chennai",
    "short": "Loyola Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "loyola",
      "nungambakkam",
      "sterling road"
    ]
  },
  {
    "name": "Madras Christian College (MCC), Chennai",
    "short": "MCC Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "mcc",
      "tambaram",
      "east tambaram"
    ]
  },
  {
    "name": "Presidency College (Autonomous), Chennai",
    "short": "Presidency Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "presidency",
      "kamarajar salai",
      "triplicane"
    ]
  },
  {
    "name": "Stella Maris College (Autonomous), Chennai",
    "short": "Stella Maris",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "stella maris",
      "cathedral road"
    ]
  },
  {
    "name": "Women's Christian College (WCC), Chennai",
    "short": "WCC Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "wcc",
      "college road",
      "nungambakkam"
    ]
  },
  {
    "name": "Ethiraj College for Women (Autonomous), Chennai",
    "short": "Ethiraj Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "ethiraj",
      "egmore"
    ]
  },
  {
    "name": "DG Vaishnav College (Dwaraka Doss Goverdhan Doss), Chennai",
    "short": "DG Vaishnav",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "dgvc",
      "arumbakkam"
    ]
  },
  {
    "name": "Ramakrishna Mission Vivekananda College, Chennai",
    "short": "Vivekananda Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "rkm vivekananda",
      "mylapore"
    ]
  },
  {
    "name": "St. Xavier's College (Autonomous), Kolkata",
    "short": "St. Xavier's Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "xaviers kolkata",
      "park street",
      "raghabpur"
    ]
  },
  {
    "name": "Presidency University, Kolkata",
    "short": "Presidency Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "presidency kolkata",
      "college street"
    ]
  },
  {
    "name": "Scottish Church College, Kolkata",
    "short": "Scottish Church",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "scottish church",
      "hedua",
      "bidhan sarani"
    ]
  },
  {
    "name": "Goenka College of Commerce and Business Administration, Kolkata",
    "short": "Goenka College",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "goenka",
      "bb ganguly street",
      "bowbazar"
    ]
  },
  {
    "name": "Bethune College, Kolkata",
    "short": "Bethune College",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "bethune",
      "bidhan sarani"
    ]
  },
  {
    "name": "Asutosh College, Kolkata",
    "short": "Asutosh College",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "asutosh",
      "hazra",
      "bhowanipore"
    ]
  },
  {
    "name": "Maulana Azad College, Kolkata",
    "short": "Maulana Azad Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "maulana azad",
      "rafi ahmed kidwai road"
    ]
  },
  {
    "name": "Lady Brabourne College, Kolkata",
    "short": "Lady Brabourne",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "lbc",
      "suhrawardy avenue",
      "beniapukur"
    ]
  },
  {
    "name": "Loreto College, Kolkata",
    "short": "Loreto Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "loreto",
      "middleton row"
    ]
  },
  {
    "name": "Shri Shikshayatan College, Kolkata",
    "short": "Shri Shikshayatan",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "shikshayatan",
      "lord sinha road"
    ]
  },
  {
    "name": "St. Francis College for Women, Begumpet, Hyderabad",
    "short": "St. Francis Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "st francis",
      "begumpet"
    ]
  },
  {
    "name": "Nizam College, Basheerbagh, Hyderabad",
    "short": "Nizam College",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "nizam",
      "basheerbagh",
      "osmania"
    ]
  },
  {
    "name": "Bhavan's Vivekananda College, Secunderabad",
    "short": "Bhavans Secunderabad",
    "city": "Secunderabad",
    "state": "Telangana",
    "tags": [
      "bhavans",
      "sainikpuri"
    ]
  },
  {
    "name": "Loyola Academy Degree & PG College, Secunderabad",
    "short": "Loyola Secunderabad",
    "city": "Secunderabad",
    "state": "Telangana",
    "tags": [
      "loyola academy",
      "alwal"
    ]
  },
  {
    "name": "Badruka College of Commerce and Arts, Hyderabad",
    "short": "Badruka College",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "badruka",
      "kachiguda"
    ]
  },
  {
    "name": "DAV College, Sector 10, Chandigarh",
    "short": "DAV Chandigarh",
    "city": "Chandigarh",
    "state": "Chandigarh",
    "tags": [
      "dav chandigarh",
      "sector 10"
    ]
  },
  {
    "name": "Mehr Chand Mahajan DAV College for Women (MCM DAV), Chandigarh",
    "short": "MCM DAV Chandigarh",
    "city": "Chandigarh",
    "state": "Chandigarh",
    "tags": [
      "mcm dav",
      "sector 36"
    ]
  },
  {
    "name": "Goswami Ganesh Dutta Sanatan Dharma College (GGDSD), Chandigarh",
    "short": "SD College Chandigarh",
    "city": "Chandigarh",
    "state": "Chandigarh",
    "tags": [
      "ggdsd",
      "sd college",
      "sector 32"
    ]
  },
  {
    "name": "St. Aloysius College (Autonomous), Mangaluru",
    "short": "St. Aloysius Mangalore",
    "city": "Mangaluru",
    "state": "Karnataka",
    "tags": [
      "aloysius",
      "kodialbail"
    ]
  },
  {
    "name": "Sacred Heart College (Autonomous), Thevara, Kochi",
    "short": "Sacred Heart Kochi",
    "city": "Kochi",
    "state": "Kerala",
    "tags": [
      "sacred heart",
      "thevara"
    ]
  },
  {
    "name": "St. Teresa's College (Autonomous), Ernakulam",
    "short": "St. Teresas Kochi",
    "city": "Kochi",
    "state": "Kerala",
    "tags": [
      "st teresas",
      "park avenue"
    ]
  },
  {
    "name": "St. Thomas College (Autonomous), Thrissur",
    "short": "St. Thomas Thrissur",
    "city": "Thrissur",
    "state": "Kerala",
    "tags": [
      "st thomas",
      "palace road"
    ]
  },
  {
    "name": "University Maharani College, Jaipur",
    "short": "Maharani College",
    "city": "Jaipur",
    "state": "Rajasthan",
    "tags": [
      "maharani college",
      "ram singh road"
    ]
  },
  {
    "name": "St. Xavier's College, Jaipur",
    "short": "St. Xavier's Jaipur",
    "city": "Jaipur",
    "state": "Rajasthan",
    "tags": [
      "xaviers jaipur",
      "nevad"
    ]
  },
  {
    "name": "The Bhopal School of Social Sciences (BSSS), Bhopal",
    "short": "BSSS Bhopal",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "tags": [
      "bsss",
      "habibganj"
    ]
  },
  {
    "name": "National Post Graduate College, Lucknow",
    "short": "National PG Lucknow",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "tags": [
      "npgc",
      "rana pratap marg"
    ]
  },
  {
    "name": "St. Xavier's College, Ranchi",
    "short": "St. Xavier's Ranchi",
    "city": "Ranchi",
    "state": "Jharkhand",
    "tags": [
      "xaviers ranchi",
      "purulia road"
    ]
  },
  {
    "name": "Patna Women's College (Autonomous), Patna",
    "short": "Patna Womens College",
    "city": "Patna",
    "state": "Bihar",
    "tags": [
      "pwc patna",
      "bailey road"
    ]
  },
  {
    "name": "Indian Institute of Science (IISc), Bengaluru",
    "short": "IISc Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "iisc",
      "science",
      "research",
      "malleswaram"
    ]
  },
  {
    "name": "Indian Statistical Institute (ISI), Kolkata",
    "short": "ISI Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "isi kolkata",
      "statistics",
      "math",
      "baranagar"
    ]
  },
  {
    "name": "Indian Statistical Institute (ISI), Delhi",
    "short": "ISI Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "isi delhi",
      "economics",
      "math",
      "katwaria sarai"
    ]
  },
  {
    "name": "Indian Statistical Institute (ISI), Bangalore",
    "short": "ISI Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "isi bangalore",
      "rv vidyaniketan"
    ]
  },
  {
    "name": "Chennai Mathematical Institute (CMI), Chennai",
    "short": "CMI Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "cmi",
      "math",
      "cs",
      "sipcot",
      "siruseri"
    ]
  },
  {
    "name": "Tata Institute of Fundamental Research (TIFR), Mumbai",
    "short": "TIFR Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "tifr",
      "colaba"
    ]
  },
  {
    "name": "Indian Institute of Science Education and Research Pune (IISER Pune)",
    "short": "IISER Pune",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "iiser pune",
      "pashan"
    ]
  },
  {
    "name": "Indian Institute of Science Education and Research Kolkata (IISER Kolkata)",
    "short": "IISER Kolkata",
    "city": "Kalyani",
    "state": "West Bengal",
    "tags": [
      "iiser kolkata",
      "mohanpur"
    ]
  },
  {
    "name": "Indian Institute of Science Education and Research Mohali (IISER Mohali)",
    "short": "IISER Mohali",
    "city": "Mohali",
    "state": "Punjab",
    "tags": [
      "iiser mohali",
      "manauli"
    ]
  },
  {
    "name": "Indian Institute of Science Education and Research Bhopal (IISER Bhopal)",
    "short": "IISER Bhopal",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "tags": [
      "iiser bhopal",
      "bhauri"
    ]
  },
  {
    "name": "Indian Institute of Science Education and Research Thiruvananthapuram (IISER TVM)",
    "short": "IISER TVM",
    "city": "Thiruvananthapuram",
    "state": "Kerala",
    "tags": [
      "iiser tvm",
      "vithura"
    ]
  },
  {
    "name": "Indian Institute of Science Education and Research Tirupati (IISER Tirupati)",
    "short": "IISER Tirupati",
    "city": "Tirupati",
    "state": "Andhra Pradesh",
    "tags": [
      "iiser tirupati",
      "mangalam"
    ]
  },
  {
    "name": "Indian Institute of Science Education and Research Berhampur (IISER Berhampur)",
    "short": "IISER Berhampur",
    "city": "Berhampur",
    "state": "Odisha",
    "tags": [
      "iiser berhampur",
      "laudigaon"
    ]
  },
  {
    "name": "National Institute of Science Education and Research (NISER), Bhubaneswar",
    "short": "NISER Bhubaneswar",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "tags": [
      "niser",
      "jatni"
    ]
  },
  {
    "name": "National Institute of Design (NID), Ahmedabad",
    "short": "NID Ahmedabad",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "tags": [
      "nid",
      "paldi",
      "design"
    ]
  },
  {
    "name": "National Institute of Design (NID), Gandhinagar",
    "short": "NID Gandhinagar",
    "city": "Gandhinagar",
    "state": "Gujarat",
    "tags": [
      "nid gandhinagar"
    ]
  },
  {
    "name": "National Institute of Design (NID), Bengaluru",
    "short": "NID Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "nid bangalore",
      "yeshwantpur"
    ]
  },
  {
    "name": "National Institute of Design (NID), Kurukshetra",
    "short": "NID Haryana",
    "city": "Kurukshetra",
    "state": "Haryana",
    "tags": [
      "nid kurukshetra",
      "umri"
    ]
  },
  {
    "name": "National Institute of Design (NID), Vijayawada",
    "short": "NID Andhra",
    "city": "Vijayawada",
    "state": "Andhra Pradesh",
    "tags": [
      "nid vijayawada",
      "amaravati"
    ]
  },
  {
    "name": "National Institute of Design (NID), Madhya Pradesh",
    "short": "NID Bhopal",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "tags": [
      "nid bhopal",
      "acharhpura"
    ]
  },
  {
    "name": "National Institute of Design (NID), Assam",
    "short": "NID Assam",
    "city": "Jorhat",
    "state": "Assam",
    "tags": [
      "nid assam",
      "tocklai"
    ]
  },
  {
    "name": "National Institute of Fashion Technology (NIFT), New Delhi",
    "short": "NIFT Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "nift",
      "hauz khas",
      "fashion"
    ]
  },
  {
    "name": "National Institute of Fashion Technology (NIFT), Mumbai",
    "short": "NIFT Mumbai",
    "city": "Navi Mumbai",
    "state": "Maharashtra",
    "tags": [
      "nift mumbai",
      "kharghar"
    ]
  },
  {
    "name": "National Institute of Fashion Technology (NIFT), Bengaluru",
    "short": "NIFT Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "nift bangalore",
      "hsr layout"
    ]
  },
  {
    "name": "National Institute of Fashion Technology (NIFT), Chennai",
    "short": "NIFT Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "nift chennai",
      "taramani"
    ]
  },
  {
    "name": "National Institute of Fashion Technology (NIFT), Kolkata",
    "short": "NIFT Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "nift kolkata",
      "salt lake"
    ]
  },
  {
    "name": "National Institute of Fashion Technology (NIFT), Hyderabad",
    "short": "NIFT Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "nift hyderabad",
      "madhapur",
      "hitech city"
    ]
  },
  {
    "name": "National Institute of Fashion Technology (NIFT), Gandhinagar",
    "short": "NIFT Gandhinagar",
    "city": "Gandhinagar",
    "state": "Gujarat",
    "tags": [
      "nift gandhinagar",
      "infocity"
    ]
  },
  {
    "name": "National Institute of Fashion Technology (NIFT), Patna",
    "short": "NIFT Patna",
    "city": "Patna",
    "state": "Bihar",
    "tags": [
      "nift patna",
      "mithapur"
    ]
  },
  {
    "name": "CEPT University, Ahmedabad",
    "short": "CEPT Ahmedabad",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "tags": [
      "cept",
      "architecture",
      "kasturbhai lalbhai"
    ]
  },
  {
    "name": "Srishti Manipal Institute of Art, Design and Technology, Bengaluru",
    "short": "Srishti Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "srishti",
      "yelahanka"
    ]
  },
  {
    "name": "Institute of Hotel Management, Catering & Nutrition (IHM), Pusa, New Delhi",
    "short": "IHM Pusa",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "ihm pusa",
      "pusa institute"
    ]
  },
  {
    "name": "Institute of Hotel Management (IHM), Mumbai",
    "short": "IHM Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "ihm mumbai",
      "dadar"
    ]
  },
  {
    "name": "Institute of Hotel Management (IHM), Bengaluru",
    "short": "IHM Bangalore",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "ihm bangalore",
      "sjp campus"
    ]
  },
  {
    "name": "Institute of Hotel Management (IHM), Chennai",
    "short": "IHM Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "ihm chennai",
      "taramani"
    ]
  },
  {
    "name": "Institute of Hotel Management (IHM), Kolkata",
    "short": "IHM Kolkata",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "ihm kolkata",
      "taratala"
    ]
  },
  {
    "name": "Institute of Hotel Management (IHM), Hyderabad",
    "short": "IHM Hyderabad",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "ihm hyderabad",
      "vidyanagar"
    ]
  },
  {
    "name": "Welcomgroup Graduate School of Hotel Administration (WGSHA), Manipal",
    "short": "WGSHA Manipal",
    "city": "Manipal",
    "state": "Karnataka",
    "tags": [
      "wgsha",
      "mahe"
    ]
  },
  {
    "name": "Jawaharlal Nehru University (JNU), New Delhi",
    "short": "JNU Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "jnu",
      "new mehrauli road"
    ]
  },
  {
    "name": "Jamia Millia Islamia (JMI), New Delhi",
    "short": "Jamia Millia",
    "city": "New Delhi",
    "state": "Delhi",
    "tags": [
      "jmi",
      "jamia nagar",
      "okhla"
    ]
  },
  {
    "name": "Banaras Hindu University (BHU), Varanasi",
    "short": "BHU Varanasi",
    "city": "Varanasi",
    "state": "Uttar Pradesh",
    "tags": [
      "bhu",
      "lanka"
    ]
  },
  {
    "name": "Aligarh Muslim University (AMU), Aligarh",
    "short": "AMU Aligarh",
    "city": "Aligarh",
    "state": "Uttar Pradesh",
    "tags": [
      "amu"
    ]
  },
  {
    "name": "University of Allahabad, Prayagraj",
    "short": "Allahabad University",
    "city": "Prayagraj",
    "state": "Uttar Pradesh",
    "tags": [
      "au",
      "katra"
    ]
  },
  {
    "name": "Visva-Bharati University, Santiniketan",
    "short": "Visva-Bharati",
    "city": "Santiniketan",
    "state": "West Bengal",
    "tags": [
      "visva bharati",
      "bolpur",
      "rabindranath tagore"
    ]
  },
  {
    "name": "Tezpur University, Assam",
    "short": "Tezpur University",
    "city": "Tezpur",
    "state": "Assam",
    "tags": [
      "tezpur",
      "napaam"
    ]
  },
  {
    "name": "North-Eastern Hill University (NEHU), Shillong",
    "short": "NEHU Shillong",
    "city": "Shillong",
    "state": "Meghalaya",
    "tags": [
      "nehu",
      "mawkynroh-umshing"
    ]
  },
  {
    "name": "Pondicherry University, Puducherry",
    "short": "Pondicherry Univ",
    "city": "Puducherry",
    "state": "Puducherry",
    "tags": [
      "pondi uni",
      "kalapet"
    ]
  },
  {
    "name": "University of Hyderabad (UoH / HCU)",
    "short": "Hyderabad Central Univ",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "hcu",
      "uoh",
      "gachibowli"
    ]
  },
  {
    "name": "Central University of Punjab, Bathinda",
    "short": "CUPB Bathinda",
    "city": "Bathinda",
    "state": "Punjab",
    "tags": [
      "cupb",
      "ghudda"
    ]
  },
  {
    "name": "Central University of Rajasthan, Kishangarh",
    "short": "CURAJ",
    "city": "Ajmer",
    "state": "Rajasthan",
    "tags": [
      "curaj",
      "bandarsindri"
    ]
  },
  {
    "name": "Central University of Kerala, Kasaragod",
    "short": "CU Kerala",
    "city": "Kasaragod",
    "state": "Kerala",
    "tags": [
      "cuk",
      "periye"
    ]
  },
  {
    "name": "Central University of Karnataka, Kalaburagi",
    "short": "CU Karnataka",
    "city": "Kalaburagi",
    "state": "Karnataka",
    "tags": [
      "cuk",
      "kadaganchi"
    ]
  },
  {
    "name": "Guru Gobind Singh Indraprastha University (GGSIPU), Delhi",
    "short": "IP University / GGSIPU",
    "city": "Delhi",
    "state": "Delhi",
    "tags": [
      "ipu",
      "ggsipu",
      "dwarka"
    ]
  },
  {
    "name": "Panjab University (PU), Chandigarh",
    "short": "Panjab Univ",
    "city": "Chandigarh",
    "state": "Chandigarh",
    "tags": [
      "pu chandigarh",
      "sector 14"
    ]
  },
  {
    "name": "Guru Nanak Dev University (GNDU), Amritsar",
    "short": "GNDU Amritsar",
    "city": "Amritsar",
    "state": "Punjab",
    "tags": [
      "gndu"
    ]
  },
  {
    "name": "Punjabi University, Patiala",
    "short": "Punjabi Univ Patiala",
    "city": "Patiala",
    "state": "Punjab",
    "tags": [
      "punjabi university"
    ]
  },
  {
    "name": "Kurukshetra University (KUK), Kurukshetra",
    "short": "KUK",
    "city": "Kurukshetra",
    "state": "Haryana",
    "tags": [
      "kuk"
    ]
  },
  {
    "name": "Maharshi Dayanand University (MDU), Rohtak",
    "short": "MDU Rohtak",
    "city": "Rohtak",
    "state": "Haryana",
    "tags": [
      "mdu"
    ]
  },
  {
    "name": "University of Jammu",
    "short": "Jammu University",
    "city": "Jammu",
    "state": "Jammu and Kashmir",
    "tags": [
      "ju jammu",
      "baba saheb ambedkar road"
    ]
  },
  {
    "name": "University of Kashmir, Srinagar",
    "short": "Kashmir University",
    "city": "Srinagar",
    "state": "Jammu and Kashmir",
    "tags": [
      "ku srinagar",
      "hazratbal"
    ]
  },
  {
    "name": "University of Mumbai (MU)",
    "short": "Mumbai University",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "mu",
      "kalina",
      "fort"
    ]
  },
  {
    "name": "Savitribai Phule Pune University (SPPU)",
    "short": "Pune University",
    "city": "Pune",
    "state": "Maharashtra",
    "tags": [
      "sppu",
      "unipune",
      "ganeshkhind"
    ]
  },
  {
    "name": "Rashtrasant Tukadoji Maharaj Nagpur University (RTMNU)",
    "short": "Nagpur University",
    "city": "Nagpur",
    "state": "Maharashtra",
    "tags": [
      "rtmnu"
    ]
  },
  {
    "name": "Dr. Babasaheb Ambedkar Marathwada University (BAMU)",
    "short": "BAMU Aurangabad",
    "city": "Chhatrapati Sambhajinagar",
    "state": "Maharashtra",
    "tags": [
      "bamu"
    ]
  },
  {
    "name": "Shivaji University, Kolhapur",
    "short": "Shivaji Univ Kolhapur",
    "city": "Kolhapur",
    "state": "Maharashtra",
    "tags": [
      "suk",
      "vidyanagar"
    ]
  },
  {
    "name": "SNDT Women's University, Mumbai",
    "short": "SNDT Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "tags": [
      "sndt",
      "churchgate",
      "juhu"
    ]
  },
  {
    "name": "Bangalore University, Bengaluru",
    "short": "Bangalore Univ",
    "city": "Bengaluru",
    "state": "Karnataka",
    "tags": [
      "jnanabharathi"
    ]
  },
  {
    "name": "Visvesvaraya Technological University (VTU), Belagavi",
    "short": "VTU Belagavi",
    "city": "Belagavi",
    "state": "Karnataka",
    "tags": [
      "vtu",
      "machhe"
    ]
  },
  {
    "name": "University of Mysore, Mysuru",
    "short": "Mysore University",
    "city": "Mysuru",
    "state": "Karnataka",
    "tags": [
      "manasagangotri"
    ]
  },
  {
    "name": "Karnatak University, Dharwad",
    "short": "KUD Dharwad",
    "city": "Dharwad",
    "state": "Karnataka",
    "tags": [
      "kud",
      "pavate nagar"
    ]
  },
  {
    "name": "Mangalore University, Mangaluru",
    "short": "Mangalore Univ",
    "city": "Mangaluru",
    "state": "Karnataka",
    "tags": [
      "mangala gangotri",
      "konaje"
    ]
  },
  {
    "name": "Anna University, Chennai",
    "short": "Anna University",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "anna univ",
      "guindy",
      "sardar patel road"
    ]
  },
  {
    "name": "University of Madras, Chennai",
    "short": "Madras University",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "tags": [
      "madras university",
      "chepauk",
      "marina"
    ]
  },
  {
    "name": "Madurai Kamaraj University (MKU), Madurai",
    "short": "MKU Madurai",
    "city": "Madurai",
    "state": "Tamil Nadu",
    "tags": [
      "mku",
      "palkalai nagar"
    ]
  },
  {
    "name": "Bharathiar University, Coimbatore",
    "short": "Bharathiar Univ",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "tags": [
      "bharathiar",
      "maruthamalai road"
    ]
  },
  {
    "name": "Bharathidasan University, Tiruchirappalli",
    "short": "Bharathidasan Univ",
    "city": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "tags": [
      "bdu",
      "palkalaiperur"
    ]
  },
  {
    "name": "University of Calcutta (CU), Kolkata",
    "short": "Calcutta University",
    "city": "Kolkata",
    "state": "West Bengal",
    "tags": [
      "cu",
      "college street",
      "rajabazar",
      "ballygunge"
    ]
  },
  {
    "name": "University of Kalyani, Nadia",
    "short": "Kalyani Univ",
    "city": "Kalyani",
    "state": "West Bengal",
    "tags": [
      "kalyani university"
    ]
  },
  {
    "name": "The University of Burdwan, Purba Bardhaman",
    "short": "Burdwan Univ",
    "city": "Bardhaman",
    "state": "West Bengal",
    "tags": [
      "burdwan university",
      "rajbati"
    ]
  },
  {
    "name": "University of North Bengal (NBU), Siliguri",
    "short": "North Bengal Univ",
    "city": "Siliguri",
    "state": "West Bengal",
    "tags": [
      "nbu",
      "raja rammohunpur"
    ]
  },
  {
    "name": "Osmania University, Hyderabad",
    "short": "Osmania Univ",
    "city": "Hyderabad",
    "state": "Telangana",
    "tags": [
      "ou",
      "tarnaka",
      "amberpet"
    ]
  },
  {
    "name": "Kakatiya University, Warangal",
    "short": "Kakatiya Univ",
    "city": "Warangal",
    "state": "Telangana",
    "tags": [
      "ku warangal",
      "vidyaranyapuri"
    ]
  },
  {
    "name": "Andhra University, Visakhapatnam",
    "short": "Andhra University",
    "city": "Visakhapatnam",
    "state": "Andhra Pradesh",
    "tags": [
      "au vizag",
      "waltair junction"
    ]
  },
  {
    "name": "Sri Venkateswara University (SVU), Tirupati",
    "short": "SVU Tirupati",
    "city": "Tirupati",
    "state": "Andhra Pradesh",
    "tags": [
      "svu"
    ]
  },
  {
    "name": "Acharya Nagarjuna University (ANU), Guntur",
    "short": "Nagarjuna Univ",
    "city": "Guntur",
    "state": "Andhra Pradesh",
    "tags": [
      "anu guntur",
      "nagarjuna nagar"
    ]
  },
  {
    "name": "Patna University, Patna",
    "short": "Patna University",
    "city": "Patna",
    "state": "Bihar",
    "tags": [
      "pu patna",
      "ashok rajpath"
    ]
  },
  {
    "name": "Utkal University, Bhubaneswar",
    "short": "Utkal University",
    "city": "Bhubaneswar",
    "state": "Odisha",
    "tags": [
      "utkal",
      "vani vihar"
    ]
  },
  {
    "name": "Ravenshaw University, Cuttack",
    "short": "Ravenshaw Univ",
    "city": "Cuttack",
    "state": "Odisha",
    "tags": [
      "ravenshaw",
      "college square"
    ]
  },
  {
    "name": "Sambalpur University, Sambalpur",
    "short": "Sambalpur Univ",
    "city": "Sambalpur",
    "state": "Odisha",
    "tags": [
      "jyoti vihar",
      "burla"
    ]
  },
  {
    "name": "University of Rajasthan, Jaipur",
    "short": "Rajasthan University",
    "city": "Jaipur",
    "state": "Rajasthan",
    "tags": [
      "uniraj",
      "jln marg"
    ]
  },
  {
    "name": "Mohanlal Sukhadia University (MLSU), Udaipur",
    "short": "MLSU Udaipur",
    "city": "Udaipur",
    "state": "Rajasthan",
    "tags": [
      "mlsu"
    ]
  },
  {
    "name": "Jai Narain Vyas University (JNVU), Jodhpur",
    "short": "JNVU Jodhpur",
    "city": "Jodhpur",
    "state": "Rajasthan",
    "tags": [
      "jnvu"
    ]
  },
  {
    "name": "Devi Ahilya Vishwavidyalaya (DAVV), Indore",
    "short": "DAVV Indore",
    "city": "Indore",
    "state": "Madhya Pradesh",
    "tags": [
      "davv",
      "nalanda campus",
      "rnt marg"
    ]
  },
  {
    "name": "Barkatullah University (BU), Bhopal",
    "short": "Barkatullah Univ",
    "city": "Bhopal",
    "state": "Madhya Pradesh",
    "tags": [
      "bu bhopal",
      "hoshangabad road"
    ]
  },
  {
    "name": "Jiwaji University, Gwalior",
    "short": "Jiwaji Univ",
    "city": "Gwalior",
    "state": "Madhya Pradesh",
    "tags": [
      "jiwaji"
    ]
  },
  {
    "name": "Gauhati University, Guwahati",
    "short": "Gauhati University",
    "city": "Guwahati",
    "state": "Assam",
    "tags": [
      "gu",
      "jalukbari"
    ]
  },
  {
    "name": "Dibrugarh University, Dibrugarh",
    "short": "Dibrugarh Univ",
    "city": "Dibrugarh",
    "state": "Assam",
    "tags": [
      "dibrugarh"
    ]
  },
  {
    "name": "Cotton University, Guwahati",
    "short": "Cotton University",
    "city": "Guwahati",
    "state": "Assam",
    "tags": [
      "cotton college",
      "panbazar"
    ]
  },
  {
    "name": "University of Lucknow, Lucknow",
    "short": "Lucknow University",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "tags": [
      "lu",
      "badshah bagh"
    ]
  },
  {
    "name": "Chhatrapati Shahu Ji Maharaj University (CSJMU), Kanpur",
    "short": "Kanpur University",
    "city": "Kanpur",
    "state": "Uttar Pradesh",
    "tags": [
      "csjmu",
      "kalyanpur"
    ]
  },
  {
    "name": "Deen Dayal Upadhyaya Gorakhpur University (DDUGU)",
    "short": "Gorakhpur Univ",
    "city": "Gorakhpur",
    "state": "Uttar Pradesh",
    "tags": [
      "ddugu"
    ]
  },
  {
    "name": "Dr. A.P.J. Abdul Kalam Technical University (AKTU / UPTU)",
    "short": "AKTU Lucknow",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "tags": [
      "aktu",
      "uptu",
      "jankipuram"
    ]
  },
  {
    "name": "Chaudhary Charan Singh University (CCSU), Meerut",
    "short": "CCS University",
    "city": "Meerut",
    "state": "Uttar Pradesh",
    "tags": [
      "ccsu"
    ]
  },
  {
    "name": "Gujarat University, Ahmedabad",
    "short": "Gujarat Univ",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "tags": [
      "gujarat university",
      "navrangpura"
    ]
  },
  {
    "name": "Maharaja Sayajirao University of Baroda (MSU)",
    "short": "MSU Baroda",
    "city": "Vadodara",
    "state": "Gujarat",
    "tags": [
      "msu baroda",
      "fatehgunj"
    ]
  }
];

/**
 * Searches the colleges database for query matches.
 * Uses smart substring, acronym, city, state, and tag scoring.
 * Caps at limit results for blazing-fast response times.
 */
export function searchColleges(query = '', limit = 16) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return COLLEGES_DATABASE.slice(0, limit);
  }

  const queryParts = trimmed.split(/\s+/).filter(Boolean);
  const scored = [];

  for (const item of COLLEGES_DATABASE) {
    const nameLower = item.name.toLowerCase();
    const shortLower = (item.short || '').toLowerCase();
    const cityLower = (item.city || '').toLowerCase();
    const stateLower = (item.state || '').toLowerCase();
    const tagsCombined = (item.tags || []).join(' ').toLowerCase();

    let score = 0;

    // Direct exact acronym match (e.g. "SSCBS", "SRCC", "IITD", "BITS", "COEP", "IIMA")
    if (shortLower === trimmed) {
      score += 150;
    } else if (shortLower.startsWith(trimmed)) {
      score += 70;
    } else if (shortLower.includes(trimmed)) {
      score += 35;
    }

    // Direct name starts with query
    if (nameLower.startsWith(trimmed)) {
      score += 80;
    } else if (nameLower.includes(trimmed)) {
      score += 30;
    }

    // City or State exact match
    if (cityLower === trimmed || stateLower === trimmed) {
      score += 40;
    }

    // Word-by-word matches
    let allPartsMatch = true;
    for (const part of queryParts) {
      const inName = nameLower.includes(part);
      const inShort = shortLower.includes(part);
      const inCity = cityLower.includes(part);
      const inState = stateLower.includes(part);
      const inTags = tagsCombined.includes(part);

      if (inName || inShort || inCity || inState || inTags) {
        score += inShort ? 15 : (inName ? 10 : 6);
      } else {
        allPartsMatch = false;
        break;
      }
    }

    if (allPartsMatch || score > 0) {
      scored.push({ item, score });
    }
  }

  // Sort by highest relevance score first
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
