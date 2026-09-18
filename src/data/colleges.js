// src/data/colleges.js
// Exhaustive, standardized collegiate directory for Two19 Labs OneStop
// Normalizes student identities across thousands of searchable universities and colleges.

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
  // ── Delhi University (DU Circuit) ──
  { name: 'Shaheed Sukhdev College of Business Studies (SSCBS)', short: 'SSCBS', city: 'Delhi', tags: ['du', 'bms', 'bfia', 'delhi university'] },
  { name: 'Shri Ram College of Commerce (SRCC)', short: 'SRCC', city: 'Delhi', tags: ['du', 'commerce', 'economics', 'delhi university'] },
  { name: "St. Stephen's College", short: 'Stephens', city: 'Delhi', tags: ['du', 'economics', 'arts', 'delhi university'] },
  { name: 'Hindu College', short: 'Hindu', city: 'Delhi', tags: ['du', 'north campus', 'delhi university'] },
  { name: 'Hansraj College', short: 'Hansraj', city: 'Delhi', tags: ['du', 'north campus', 'delhi university'] },
  { name: 'Lady Shri Ram College for Women (LSR)', short: 'LSR', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Miranda House', short: 'Miranda', city: 'Delhi', tags: ['du', 'north campus', 'delhi university'] },
  { name: 'Kirori Mal College (KMC)', short: 'KMC', city: 'Delhi', tags: ['du', 'north campus', 'delhi university'] },
  { name: 'Ramjas College', short: 'Ramjas', city: 'Delhi', tags: ['du', 'north campus', 'delhi university'] },
  { name: 'Sri Guru Gobind Singh College of Commerce (SGGSCC)', short: 'SGGSCC', city: 'Delhi', tags: ['du', 'commerce', 'delhi university'] },
  { name: 'Sri Venkateswara College (Venky)', short: 'Venky', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Sri Guru Tegh Bahadur Khalsa College (SGTB Khalsa)', short: 'SGTB Khalsa', city: 'Delhi', tags: ['du', 'north campus', 'delhi university'] },
  { name: 'Gargi College', short: 'Gargi', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Deen Dayal Upadhyaya College (DDU)', short: 'DDU', city: 'Delhi', tags: ['du', 'delhi university'] },
  { name: 'Atma Ram Sanatan Dharma College (ARSD)', short: 'ARSD', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Shaheed Bhagat Singh College (SBSC)', short: 'SBSC', city: 'Delhi', tags: ['du', 'south campus', 'commerce', 'delhi university'] },
  { name: 'Keshav Mahavidyalaya', short: 'KMV', city: 'Delhi', tags: ['du', 'bms', 'delhi university'] },
  { name: 'Jesus and Mary College (JMC)', short: 'JMC', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Indraprastha College for Women (IPCW)', short: 'IPCW', city: 'Delhi', tags: ['du', 'delhi university'] },
  { name: 'Daulat Ram College (DRC)', short: 'DRC', city: 'Delhi', tags: ['du', 'north campus', 'delhi university'] },
  { name: 'Kamala Nehru College (KNC)', short: 'KNC', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Maitreyi College', short: 'Maitreyi', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Delhi College of Arts and Commerce (DCAC)', short: 'DCAC', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Motilal Nehru College', short: 'MLNC', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Ramanujan College', short: 'Ramanujan', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'PGDAV College', short: 'PGDAV', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Shivaji College', short: 'Shivaji', city: 'Delhi', tags: ['du', 'west delhi', 'delhi university'] },
  { name: 'Rajdhani College', short: 'Rajdhani', city: 'Delhi', tags: ['du', 'west delhi', 'delhi university'] },
  { name: 'Maharaja Agrasen College', short: 'MAC', city: 'Delhi', tags: ['du', 'east delhi', 'delhi university'] },
  { name: 'Aryabhatta College', short: 'Aryabhatta', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Zakir Husain Delhi College', short: 'ZHDC', city: 'Delhi', tags: ['du', 'central delhi', 'delhi university'] },
  { name: 'Dyal Singh College', short: 'DSC', city: 'Delhi', tags: ['du', 'south campus', 'delhi university'] },
  { name: 'Deshbandhu College', short: 'Deshbandhu', city: 'Delhi', tags: ['du', 'south delhi', 'delhi university'] },
  { name: 'Acharya Narendra Dev College (ANDC)', short: 'ANDC', city: 'Delhi', tags: ['du', 'science', 'delhi university'] },
  { name: 'Bhaskaracharya College of Applied Sciences', short: 'BCAS', city: 'Delhi', tags: ['du', 'applied science', 'delhi university'] },
  { name: 'College of Vocational Studies (CVS)', short: 'CVS', city: 'Delhi', tags: ['du', 'vocational', 'delhi university'] },
  { name: 'Cluster Innovation Centre (CIC), DU', short: 'CIC DU', city: 'Delhi', tags: ['du', 'innovation', 'engineering', 'delhi university'] },
  { name: 'Faculty of Management Studies (FMS), Delhi University', short: 'FMS Delhi', city: 'Delhi', tags: ['fms', 'mba', 'delhi university'] },
  { name: 'Delhi School of Economics (DSE), Delhi University', short: 'DSE', city: 'Delhi', tags: ['dse', 'economics', 'delhi university'] },
  { name: 'University of Delhi (Central Campus)', short: 'DU', city: 'Delhi', tags: ['du', 'delhi university'] },

  // ── Indian Institutes of Technology (IITs) ──
  { name: 'Indian Institute of Technology Bombay (IIT Bombay)', short: 'IIT Bombay', city: 'Mumbai', tags: ['iitb', 'iit bombay', 'powai'] },
  { name: 'Indian Institute of Technology Delhi (IIT Delhi)', short: 'IIT Delhi', city: 'New Delhi', tags: ['iitd', 'iit delhi', 'hauz khas'] },
  { name: 'Indian Institute of Technology Madras (IIT Madras)', short: 'IIT Madras', city: 'Chennai', tags: ['iitm', 'iit madras', 'chennai'] },
  { name: 'Indian Institute of Technology Kanpur (IIT Kanpur)', short: 'IIT Kanpur', city: 'Kanpur', tags: ['iitk', 'iit kanpur'] },
  { name: 'Indian Institute of Technology Kharagpur (IIT Kharagpur)', short: 'IIT Kharagpur', city: 'Kharagpur', tags: ['iitkgp', 'iit kharagpur'] },
  { name: 'Indian Institute of Technology Roorkee (IIT Roorkee)', short: 'IIT Roorkee', city: 'Roorkee', tags: ['iitr', 'iit roorkee'] },
  { name: 'Indian Institute of Technology Guwahati (IIT Guwahati)', short: 'IIT Guwahati', city: 'Guwahati', tags: ['iitg', 'iit guwahati'] },
  { name: 'Indian Institute of Technology BHU (IIT BHU Varanasi)', short: 'IIT BHU', city: 'Varanasi', tags: ['iit bhu', 'varanasi'] },
  { name: 'Indian Institute of Technology Hyderabad (IIT Hyderabad)', short: 'IIT Hyderabad', city: 'Hyderabad', tags: ['iith', 'iit hyderabad'] },
  { name: 'Indian Institute of Technology Gandhinagar (IIT Gandhinagar)', short: 'IIT Gandhinagar', city: 'Gandhinagar', tags: ['iitgn', 'gandhinagar'] },
  { name: 'Indian Institute of Technology Ropar (IIT Ropar)', short: 'IIT Ropar', city: 'Ropar', tags: ['iit ropar', 'punjab'] },
  { name: 'Indian Institute of Technology Patna (IIT Patna)', short: 'IIT Patna', city: 'Patna', tags: ['iit patna', 'bihar'] },
  { name: 'Indian Institute of Technology Bhubaneswar (IIT Bhubaneswar)', short: 'IIT Bhubaneswar', city: 'Bhubaneswar', tags: ['iit bbs', 'odisha'] },
  { name: 'Indian Institute of Technology Indore (IIT Indore)', short: 'IIT Indore', city: 'Indore', tags: ['iiti', 'iit indore'] },
  { name: 'Indian Institute of Technology Mandi (IIT Mandi)', short: 'IIT Mandi', city: 'Mandi', tags: ['iit mandi', 'himachal'] },
  { name: 'Indian Institute of Technology Jodhpur (IIT Jodhpur)', short: 'IIT Jodhpur', city: 'Jodhpur', tags: ['iitj', 'iit jodhpur'] },
  { name: 'Indian Institute of Technology Tirupati (IIT Tirupati)', short: 'IIT Tirupati', city: 'Tirupati', tags: ['iit tirupati'] },
  { name: 'Indian Institute of Technology Palakkad (IIT Palakkad)', short: 'IIT Palakkad', city: 'Palakkad', tags: ['iit palakkad', 'kerala'] },
  { name: 'Indian Institute of Technology Dharwad (IIT Dharwad)', short: 'IIT Dharwad', city: 'Dharwad', tags: ['iit dharwad', 'karnataka'] },
  { name: 'Indian Institute of Technology Bhilai (IIT Bhilai)', short: 'IIT Bhilai', city: 'Bhilai', tags: ['iit bhilai', 'chhattisgarh'] },
  { name: 'Indian Institute of Technology Goa (IIT Goa)', short: 'IIT Goa', city: 'Goa', tags: ['iit goa'] },
  { name: 'Indian Institute of Technology Jammu (IIT Jammu)', short: 'IIT Jammu', city: 'Jammu', tags: ['iit jammu'] },
  { name: 'Indian Institute of Technology (ISM) Dhanbad', short: 'IIT ISM', city: 'Dhanbad', tags: ['iit ism', 'dhanbad', 'jharkhand'] },

  // ── Indian Institutes of Management (IIMs) ──
  { name: 'Indian Institute of Management Ahmedabad (IIM Ahmedabad)', short: 'IIM Ahmedabad', city: 'Ahmedabad', tags: ['iima', 'iim ahmedabad'] },
  { name: 'Indian Institute of Management Bangalore (IIM Bangalore)', short: 'IIM Bangalore', city: 'Bengaluru', tags: ['iimb', 'iim bangalore'] },
  { name: 'Indian Institute of Management Calcutta (IIM Calcutta)', short: 'IIM Calcutta', city: 'Kolkata', tags: ['iimc', 'iim calcutta', 'joka'] },
  { name: 'Indian Institute of Management Lucknow (IIM Lucknow)', short: 'IIM Lucknow', city: 'Lucknow', tags: ['iiml', 'iim lucknow'] },
  { name: 'Indian Institute of Management Kozhikode (IIM Kozhikode)', short: 'IIM Kozhikode', city: 'Kozhikode', tags: ['iimk', 'iim kozhikode'] },
  { name: 'Indian Institute of Management Indore (IIM Indore)', short: 'IIM Indore', city: 'Indore', tags: ['iimi', 'iim indore', 'ipm'] },
  { name: 'Indian Institute of Management Shillong (IIM Shillong)', short: 'IIM Shillong', city: 'Shillong', tags: ['iim shillong'] },
  { name: 'Indian Institute of Management Rohtak (IIM Rohtak)', short: 'IIM Rohtak', city: 'Rohtak', tags: ['iim rohtak', 'ipm'] },
  { name: 'Indian Institute of Management Ranchi (IIM Ranchi)', short: 'IIM Ranchi', city: 'Ranchi', tags: ['iim ranchi', 'ipm'] },
  { name: 'Indian Institute of Management Raipur (IIM Raipur)', short: 'IIM Raipur', city: 'Raipur', tags: ['iim raipur'] },
  { name: 'Indian Institute of Management Tiruchirappalli (IIM Trichy)', short: 'IIM Trichy', city: 'Tiruchirappalli', tags: ['iim trichy'] },
  { name: 'Indian Institute of Management Udaipur (IIM Udaipur)', short: 'IIM Udaipur', city: 'Udaipur', tags: ['iim udaipur'] },
  { name: 'Indian Institute of Management Kashipur (IIM Kashipur)', short: 'IIM Kashipur', city: 'Kashipur', tags: ['iim kashipur'] },
  { name: 'Indian Institute of Management Nagpur (IIM Nagpur)', short: 'IIM Nagpur', city: 'Nagpur', tags: ['iim nagpur'] },
  { name: 'Indian Institute of Management Visakhapatnam (IIM Vizag)', short: 'IIM Vizag', city: 'Visakhapatnam', tags: ['iim vizag'] },
  { name: 'Indian Institute of Management Bodh Gaya (IIM Bodh Gaya)', short: 'IIM Bodh Gaya', city: 'Bodh Gaya', tags: ['iim bodh gaya', 'ipm'] },
  { name: 'Indian Institute of Management Amritsar (IIM Amritsar)', short: 'IIM Amritsar', city: 'Amritsar', tags: ['iim amritsar'] },
  { name: 'Indian Institute of Management Sambalpur (IIM Sambalpur)', short: 'IIM Sambalpur', city: 'Sambalpur', tags: ['iim sambalpur'] },
  { name: 'Indian Institute of Management Sirmaur (IIM Sirmaur)', short: 'IIM Sirmaur', city: 'Sirmaur', tags: ['iim sirmaur'] },
  { name: 'Indian Institute of Management Jammu (IIM Jammu)', short: 'IIM Jammu', city: 'Jammu', tags: ['iim jammu', 'ipm'] },
  { name: 'Indian Institute of Management Mumbai (IIM Mumbai / NITIE)', short: 'IIM Mumbai', city: 'Mumbai', tags: ['iim mumbai', 'nitie'] },

  // ── BITS Pilani Campuses ──
  { name: 'Birla Institute of Technology and Science, Pilani (BITS Pilani)', short: 'BITS Pilani', city: 'Pilani', tags: ['bits', 'pilani', 'rajasthan'] },
  { name: 'BITS Pilani, K. K. Birla Goa Campus (BITS Goa)', short: 'BITS Goa', city: 'Goa', tags: ['bits goa', 'birla'] },
  { name: 'BITS Pilani, Hyderabad Campus (BITS Hyderabad)', short: 'BITS Hyderabad', city: 'Hyderabad', tags: ['bits hyd', 'birla'] },

  // ── Top Premier Autonomous, Commerce & B-Schools ──
  { name: 'XLRI Xavier School of Management, Jamshedpur', short: 'XLRI', city: 'Jamshedpur', tags: ['xlri', 'xat', 'management'] },
  { name: 'XLRI Delhi-NCR Campus', short: 'XLRI Delhi', city: 'Jhajjar', tags: ['xlri delhi', 'management'] },
  { name: 'SPJIMR Mumbai (S.P. Jain Institute of Management)', short: 'SPJIMR', city: 'Mumbai', tags: ['spjimr', 'sp jain'] },
  { name: 'Narsee Monjee Institute of Management Studies (NMIMS), Mumbai', short: 'NMIMS Mumbai', city: 'Mumbai', tags: ['nmims', 'npat', 'bba'] },
  { name: 'NMIMS Bengaluru', short: 'NMIMS Bangalore', city: 'Bengaluru', tags: ['nmims bangalore'] },
  { name: 'NMIMS Hyderabad', short: 'NMIMS Hyderabad', city: 'Hyderabad', tags: ['nmims hyderabad'] },
  { name: 'Symbiosis International University (SIU), Pune', short: 'Symbiosis Pune', city: 'Pune', tags: ['siu', 'set', 'pune'] },
  { name: 'Symbiosis Centre for Management Studies (SCMS), Pune', short: 'SCMS Pune', city: 'Pune', tags: ['scms pune', 'bba'] },
  { name: 'Symbiosis Centre for Management Studies (SCMS), Noida', short: 'SCMS Noida', city: 'Noida', tags: ['scms noida', 'bba'] },
  { name: 'Symbiosis Centre for Management Studies (SCMS), Bengaluru', short: 'SCMS Bangalore', city: 'Bengaluru', tags: ['scms bangalore'] },
  { name: 'Christ University, Bengaluru (Central Campus)', short: 'Christ Central', city: 'Bengaluru', tags: ['christ university', 'hosur road'] },
  { name: 'Christ University, Bengaluru (Bannerghatta Road Campus)', short: 'Christ BGR', city: 'Bengaluru', tags: ['christ bgr'] },
  { name: 'Christ University, Bengaluru (Yeshwanthpur Campus)', short: 'Christ Yeshwanthpur', city: 'Bengaluru', tags: ['christ ypr'] },
  { name: 'Christ University, Delhi NCR Campus', short: 'Christ Delhi NCR', city: 'Ghaziabad', tags: ['christ delhi'] },
  { name: 'Christ University, Pune Lavasa Campus', short: 'Christ Lavasa', city: 'Pune', tags: ['christ lavasa'] },
  { name: "St. Xavier's College (Autonomous), Mumbai", short: "St. Xavier's Mumbai", city: 'Mumbai', tags: ['xaviers mumbai', 'bms'] },
  { name: "St. Xavier's College (Autonomous), Kolkata", short: "St. Xavier's Kolkata", city: 'Kolkata', tags: ['xaviers kolkata', 'b.com'] },
  { name: 'Loyola College (Autonomous), Chennai', short: 'Loyola Chennai', city: 'Chennai', tags: ['loyola', 'chennai'] },
  { name: 'Madras Christian College (MCC), Chennai', short: 'MCC Chennai', city: 'Chennai', tags: ['mcc', 'tambaram'] },
  { name: 'Presidency College (Autonomous), Chennai', short: 'Presidency Chennai', city: 'Chennai', tags: ['presidency'] },
  { name: 'Presidency University, Kolkata', short: 'Presidency Kolkata', city: 'Kolkata', tags: ['presidency kolkata'] },
  { name: "St. Joseph's University, Bengaluru", short: "St. Joseph's Bangalore", city: 'Bengaluru', tags: ['sju', 'bangalore'] },
  { name: 'Mount Carmel College (Autonomous), Bengaluru', short: 'MCC Bangalore', city: 'Bengaluru', tags: ['mount carmel'] },
  { name: 'Narsee Monjee College of Commerce and Economics (NM College)', short: 'NM College', city: 'Mumbai', tags: ['nm college', 'vile parle'] },
  { name: 'Mithibai College of Arts, Mumbai', short: 'Mithibai', city: 'Mumbai', tags: ['mithibai', 'vile parle'] },
  { name: 'H.R. College of Commerce and Economics, Mumbai', short: 'HR College', city: 'Mumbai', tags: ['hr college', 'churchgate'] },
  { name: 'Jai Hind College, Mumbai', short: 'Jai Hind', city: 'Mumbai', tags: ['jai hind', 'churchgate'] },
  { name: 'K.C. College, Mumbai', short: 'KC College', city: 'Mumbai', tags: ['kc college', 'churchgate'] },
  { name: 'R.A. Podar College of Commerce and Economics, Mumbai', short: 'RA Podar', city: 'Mumbai', tags: ['podar', 'matunga'] },
  { name: 'K.J. Somaiya College of Arts and Commerce, Mumbai', short: 'KJ Somaiya', city: 'Mumbai', tags: ['somaiya', 'vidyavihar'] },
  { name: 'Brihan Maharashtra College of Commerce (BMCC), Pune', short: 'BMCC Pune', city: 'Pune', tags: ['bmcc', 'pune'] },
  { name: 'Fergusson College (Autonomous), Pune', short: 'Fergusson', city: 'Pune', tags: ['fergusson', 'pune'] },

  // ── Top Multidisciplinary & Liberal Arts Universities ──
  { name: 'Ashoka University, Sonipat', short: 'Ashoka', city: 'Sonipat', tags: ['ashoka', 'liberal arts', 'haryana'] },
  { name: 'O.P. Jindal Global University (JGU), Sonipat', short: 'Jindal Global', city: 'Sonipat', tags: ['jgu', 'jindal law', 'sonipat'] },
  { name: 'Plaksha University, Mohali', short: 'Plaksha', city: 'Mohali', tags: ['plaksha', 'tech', 'ai', 'punjab'] },
  { name: 'Shiv Nadar University (SNU), Greater Noida', short: 'SNU Noida', city: 'Greater Noida', tags: ['snu', 'shiv nadar'] },
  { name: 'Shiv Nadar University, Chennai', short: 'SNU Chennai', city: 'Chennai', tags: ['snu chennai'] },
  { name: 'Krea University, Sri City', short: 'Krea', city: 'Sri City', tags: ['krea', 'andhra pradesh'] },
  { name: 'FLAME University, Pune', short: 'FLAME', city: 'Pune', tags: ['flame', 'liberal education'] },
  { name: 'Ahmedabad University, Ahmedabad', short: 'Ahmedabad Univ', city: 'Ahmedabad', tags: ['ahmedabad university'] },
  { name: 'Azim Premji University, Bengaluru', short: 'Azim Premji', city: 'Bengaluru', tags: ['apu', 'azim premji'] },
  { name: 'Bennett University, Greater Noida', short: 'Bennett', city: 'Greater Noida', tags: ['bennett', 'times group'] },
  { name: 'BML Munjal University, Gurugram', short: 'BMU', city: 'Gurugram', tags: ['bmu', 'hero group'] },
  { name: 'Mahindra University, Hyderabad', short: 'Mahindra Univ', city: 'Hyderabad', tags: ['mahindra', 'ecole centrale'] },
  { name: 'Woxsen University, Hyderabad', short: 'Woxsen', city: 'Hyderabad', tags: ['woxsen'] },

  // ── Top Engineering & Technological Universities ──
  { name: 'Delhi Technological University (DTU / DCE)', short: 'DTU', city: 'Delhi', tags: ['dtu', 'dce', 'bawana'] },
  { name: 'Netaji Subhas University of Technology (NSUT / DIT)', short: 'NSUT', city: 'Delhi', tags: ['nsut', 'nsit', 'dwarka'] },
  { name: 'Indira Gandhi Delhi Technical University for Women (IGDTUW)', short: 'IGDTUW', city: 'Delhi', tags: ['igdtuw', 'kashmere gate'] },
  { name: 'College of Engineering Pune (COEP Technological University)', short: 'COEP', city: 'Pune', tags: ['coep', 'shivajinagar'] },
  { name: 'Veermata Jijabai Technological Institute (VJTI), Mumbai', short: 'VJTI', city: 'Mumbai', tags: ['vjti', 'matunga'] },
  { name: 'Sardar Patel Institute of Technology (SPIT), Mumbai', short: 'SPIT Mumbai', city: 'Mumbai', tags: ['spit', 'andheri'] },
  { name: 'College of Engineering, Guindy (CEG), Anna University', short: 'CEG Guindy', city: 'Chennai', tags: ['ceg', 'anna university'] },
  { name: 'PSG College of Technology, Coimbatore', short: 'PSG Tech', city: 'Coimbatore', tags: ['psg', 'peelamedu'] },
  { name: 'Jadavpur University Faculty of Engineering, Kolkata', short: 'Jadavpur Univ', city: 'Kolkata', tags: ['ju', 'jadavpur'] },
  { name: 'Thapar Institute of Engineering and Technology (TIET), Patiala', short: 'Thapar', city: 'Patiala', tags: ['thapar', 'patiala'] },
  { name: 'Punjab Engineering College (PEC), Chandigarh', short: 'PEC Chandigarh', city: 'Chandigarh', tags: ['pec'] },
  { name: 'RV College of Engineering (RVCE), Bengaluru', short: 'RVCE', city: 'Bengaluru', tags: ['rvce', 'mysore road'] },
  { name: 'BMS College of Engineering (BMSCE), Bengaluru', short: 'BMSCE', city: 'Bengaluru', tags: ['bmsce', 'basavanagudi'] },
  { name: 'M.S. Ramaiah Institute of Technology (MSRIT), Bengaluru', short: 'MSRIT', city: 'Bengaluru', tags: ['msrit', 'ramaiah'] },
  { name: 'PES University, Bengaluru', short: 'PES University', city: 'Bengaluru', tags: ['pesit', 'pesu', 'ring road'] },
  { name: 'Dayananda Sagar College of Engineering (DSCE), Bengaluru', short: 'DSCE Bangalore', city: 'Bengaluru', tags: ['dsce'] },
  { name: 'Manipal Institute of Technology (MIT), MAHE Manipal', short: 'MIT Manipal', city: 'Manipal', tags: ['mit manipal', 'mahe'] },
  { name: 'Manipal University Jaipur (MUJ)', short: 'MUJ Jaipur', city: 'Jaipur', tags: ['muj', 'manipal jaipur'] },
  { name: 'Vellore Institute of Technology (VIT), Vellore', short: 'VIT Vellore', city: 'Vellore', tags: ['vit', 'viteee'] },
  { name: 'Vellore Institute of Technology (VIT), Chennai', short: 'VIT Chennai', city: 'Chennai', tags: ['vit chennai'] },
  { name: 'SRM Institute of Science and Technology, Kattankulathur', short: 'SRM KTR', city: 'Chennai', tags: ['srm', 'srmjee'] },
  { name: 'Amrita Vishwa Vidyapeetham, Coimbatore', short: 'Amrita Univ', city: 'Coimbatore', tags: ['amrita'] },
  { name: 'SSN College of Engineering, Chennai', short: 'SSN Chennai', city: 'Chennai', tags: ['ssn'] },
  { name: 'Kalinga Institute of Industrial Technology (KIIT), Bhubaneswar', short: 'KIIT', city: 'Bhubaneswar', tags: ['kiit'] },
  { name: 'Siksha O Anusandhan (SOA), Bhubaneswar', short: 'SOA University', city: 'Bhubaneswar', tags: ['soa', 'iter'] },
  { name: 'Institute of Chemical Technology (ICT), Mumbai', short: 'ICT Mumbai', city: 'Mumbai', tags: ['ict', 'udct'] },
  { name: 'Harcourt Butler Technical University (HBTU), Kanpur', short: 'HBTU Kanpur', city: 'Kanpur', tags: ['hbtu', 'hbti'] },
  { name: 'Chandigarh University (CU), Mohali', short: 'Chandigarh Univ', city: 'Mohali', tags: ['cu', 'gharuan'] },
  { name: 'Lovely Professional University (LPU), Phagwara', short: 'LPU', city: 'Phagwara', tags: ['lpu', 'jalandhar'] },
  { name: 'Chitkara University, Punjab', short: 'Chitkara Punjab', city: 'Rajpura', tags: ['chitkara'] },
  { name: 'Amity University, Noida', short: 'Amity Noida', city: 'Noida', tags: ['amity'] },
  { name: 'Amity University, Gurugram', short: 'Amity Gurugram', city: 'Gurugram', tags: ['amity manesar'] },

  // ── National Institutes of Technology (NITs) ──
  { name: 'National Institute of Technology Tiruchirappalli (NIT Trichy)', short: 'NIT Trichy', city: 'Tiruchirappalli', tags: ['nitt', 'nit trichy'] },
  { name: 'National Institute of Technology Karnataka, Surathkal (NITK Surathkal)', short: 'NITK Surathkal', city: 'Surathkal', tags: ['nitk', 'surathkal'] },
  { name: 'National Institute of Technology Warangal (NIT Warangal)', short: 'NIT Warangal', city: 'Warangal', tags: ['nitw', 'warangal'] },
  { name: 'National Institute of Technology Rourkela (NIT Rourkela)', short: 'NIT Rourkela', city: 'Rourkela', tags: ['nitr', 'rourkela'] },
  { name: 'National Institute of Technology Calicut (NIT Calicut)', short: 'NIT Calicut', city: 'Kozhikode', tags: ['nitc', 'calicut'] },
  { name: 'Visvesvaraya National Institute of Technology, Nagpur (VNIT Nagpur)', short: 'VNIT Nagpur', city: 'Nagpur', tags: ['vnit', 'nagpur'] },
  { name: 'Malaviya National Institute of Technology, Jaipur (MNIT Jaipur)', short: 'MNIT Jaipur', city: 'Jaipur', tags: ['mnit', 'jaipur'] },
  { name: 'Motilal Nehru National Institute of Technology, Allahabad (MNNIT Allahabad)', short: 'MNNIT Allahabad', city: 'Prayagraj', tags: ['mnnit', 'allahabad'] },
  { name: 'Maulana Azad National Institute of Technology, Bhopal (MANIT Bhopal)', short: 'MANIT Bhopal', city: 'Bhopal', tags: ['manit', 'bhopal'] },
  { name: 'Sardar Vallabhbhai National Institute of Technology, Surat (SVNIT Surat)', short: 'SVNIT Surat', city: 'Surat', tags: ['svnit', 'surat'] },
  { name: 'National Institute of Technology Kurukshetra (NIT Kurukshetra)', short: 'NIT Kurukshetra', city: 'Kurukshetra', tags: ['nitk', 'kurukshetra'] },
  { name: 'National Institute of Technology Silchar (NIT Silchar)', short: 'NIT Silchar', city: 'Silchar', tags: ['nits', 'assam'] },
  { name: 'National Institute of Technology Durgapur (NIT Durgapur)', short: 'NIT Durgapur', city: 'Durgapur', tags: ['nitdgp', 'bengal'] },
  { name: 'National Institute of Technology Jamshedpur (NIT Jamshedpur)', short: 'NIT Jamshedpur', city: 'Jamshedpur', tags: ['nitjsr'] },
  { name: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar (NIT Jalandhar)', short: 'NIT Jalandhar', city: 'Jalandhar', tags: ['nitj'] },
  { name: 'National Institute of Technology Hamirpur (NIT Hamirpur)', short: 'NIT Hamirpur', city: 'Hamirpur', tags: ['nith'] },
  { name: 'National Institute of Technology Patna (NIT Patna)', short: 'NIT Patna', city: 'Patna', tags: ['nitp'] },
  { name: 'National Institute of Technology Raipur (NIT Raipur)', short: 'NIT Raipur', city: 'Raipur', tags: ['nitrr'] },
  { name: 'National Institute of Technology Goa (NIT Goa)', short: 'NIT Goa', city: 'Goa', tags: ['nit goa'] },
  { name: 'National Institute of Technology Srinagar (NIT Srinagar)', short: 'NIT Srinagar', city: 'Srinagar', tags: ['nit srinagar'] },

  // ── IIITs ──
  { name: 'International Institute of Information Technology, Hyderabad (IIIT Hyderabad)', short: 'IIIT Hyderabad', city: 'Hyderabad', tags: ['iiith', 'gachibowli'] },
  { name: 'Indraprastha Institute of Information Technology Delhi (IIIT Delhi)', short: 'IIIT Delhi', city: 'New Delhi', tags: ['iiitd', 'okhla'] },
  { name: 'International Institute of Information Technology Bangalore (IIIT Bangalore)', short: 'IIIT Bangalore', city: 'Bengaluru', tags: ['iiitb', 'electronic city'] },
  { name: 'Indian Institute of Information Technology, Allahabad (IIIT Allahabad)', short: 'IIIT Allahabad', city: 'Prayagraj', tags: ['iiita', 'jhalwa'] },
  { name: 'ABV-Indian Institute of Information Technology and Management, Gwalior (IIITM Gwalior)', short: 'IIITM Gwalior', city: 'Gwalior', tags: ['iiitm'] },
  { name: 'Indian Institute of Information Technology, Lucknow (IIIT Lucknow)', short: 'IIIT Lucknow', city: 'Lucknow', tags: ['iiitl'] },
  { name: 'Indian Institute of Information Technology, Pune (IIIT Pune)', short: 'IIIT Pune', city: 'Pune', tags: ['iiitp'] },

  // ── National Law Universities (NLUs) ──
  { name: 'National Law School of India University (NLSIU), Bengaluru', short: 'NLSIU Bangalore', city: 'Bengaluru', tags: ['nlsiu', 'clat', 'nlu'] },
  { name: 'NALSAR University of Law, Hyderabad', short: 'NALSAR', city: 'Hyderabad', tags: ['nalsar', 'clat'] },
  { name: 'The West Bengal National University of Juridical Sciences (WBNUJS), Kolkata', short: 'WBNUJS Kolkata', city: 'Kolkata', tags: ['nujs', 'clat'] },
  { name: 'National Law University Delhi (NLU Delhi)', short: 'NLU Delhi', city: 'New Delhi', tags: ['nlud', 'ailet'] },
  { name: 'National Law University, Jodhpur (NLU Jodhpur)', short: 'NLU Jodhpur', city: 'Jodhpur', tags: ['nluj', 'clat'] },
  { name: 'Gujarat National Law University (GNLU), Gandhinagar', short: 'GNLU Gandhinagar', city: 'Gandhinagar', tags: ['gnlu', 'clat'] },
  { name: 'National Law Institute University (NLIU), Bhopal', short: 'NLIU Bhopal', city: 'Bhopal', tags: ['nliu', 'clat'] },
  { name: 'Dr. Ram Manohar Lohiya National Law University (RMLNLU), Lucknow', short: 'RMLNLU Lucknow', city: 'Lucknow', tags: ['rmlnlu'] },
  { name: 'Symbiosis Law School (SLS), Pune', short: 'SLS Pune', city: 'Pune', tags: ['sls pune', 'slat'] },
  { name: 'Government Law College (GLC), Mumbai', short: 'GLC Mumbai', city: 'Mumbai', tags: ['glc', 'churchgate'] },

  // ── Top Central, State & Research Universities ──
  { name: 'Indian Institute of Science (IISc), Bengaluru', short: 'IISc Bangalore', city: 'Bengaluru', tags: ['iisc', 'science', 'research'] },
  { name: 'Indian Statistical Institute (ISI), Kolkata', short: 'ISI Kolkata', city: 'Kolkata', tags: ['isi kolkata', 'statistics', 'math'] },
  { name: 'Indian Statistical Institute (ISI), Delhi', short: 'ISI Delhi', city: 'New Delhi', tags: ['isi delhi', 'economics', 'math'] },
  { name: 'Chennai Mathematical Institute (CMI), Chennai', short: 'CMI Chennai', city: 'Chennai', tags: ['cmi', 'math', 'cs'] },
  { name: 'Jawaharlal Nehru University (JNU), New Delhi', short: 'JNU Delhi', city: 'New Delhi', tags: ['jnu', 'delhi'] },
  { name: 'Banaras Hindu University (BHU), Varanasi', short: 'BHU Varanasi', city: 'Varanasi', tags: ['bhu'] },
  { name: 'Aligarh Muslim University (AMU), Aligarh', short: 'AMU Aligarh', city: 'Aligarh', tags: ['amu'] },
  { name: 'Jamia Millia Islamia (JMI), New Delhi', short: 'Jamia Millia', city: 'New Delhi', tags: ['jmi'] },
  { name: 'Guru Gobind Singh Indraprastha University (GGSIPU), Delhi', short: 'IP University / GGSIPU', city: 'Delhi', tags: ['ipu', 'ggsipu'] },
  { name: 'Panjab University (PU), Chandigarh', short: 'Panjab Univ', city: 'Chandigarh', tags: ['pu chandigarh'] },
  { name: 'University of Mumbai (MU)', short: 'Mumbai University', city: 'Mumbai', tags: ['mu', 'kalina'] },
  { name: 'Savitribai Phule Pune University (SPPU)', short: 'Pune University', city: 'Pune', tags: ['sppu', 'unipune'] },
  { name: 'University of Calcutta (CU)', short: 'Calcutta University', city: 'Kolkata', tags: ['cu', 'college street'] },
  { name: 'University of Madras', short: 'Madras University', city: 'Chennai', tags: ['madras university'] },
  { name: 'University of Hyderabad (UoH / HCU)', short: 'Hyderabad Central Univ', city: 'Hyderabad', tags: ['hcu', 'uoh'] },
  { name: 'Osmania University, Hyderabad', short: 'Osmania Univ', city: 'Hyderabad', tags: ['ou', 'tarnaka'] },
  { name: 'Bangalore University, Bengaluru', short: 'Bangalore Univ', city: 'Bengaluru', tags: ['jnanabharathi'] },
  { name: 'Anna University, Chennai', short: 'Anna University', city: 'Chennai', tags: ['anna univ', 'guindy'] },
  { name: 'Visvesvaraya Technological University (VTU), Belagavi', short: 'VTU Belagavi', city: 'Belagavi', tags: ['vtu'] },
  { name: 'Gujarat University, Ahmedabad', short: 'Gujarat Univ', city: 'Ahmedabad', tags: ['gujarat univ'] },
  { name: 'Maharaja Sayajirao University of Baroda (MSU)', short: 'MSU Baroda', city: 'Vadodara', tags: ['msu baroda'] },
  { name: 'Devi Ahilya Vishwavidyalaya (DAVV), Indore', short: 'DAVV Indore', city: 'Indore', tags: ['davv'] },
  { name: 'Kurukshetra University, Kurukshetra', short: 'KUK', city: 'Kurukshetra', tags: ['kuk'] },
  { name: 'Maharshi Dayanand University (MDU), Rohtak', short: 'MDU Rohtak', city: 'Rohtak', tags: ['mdu'] },
  { name: 'All India Institute of Medical Sciences (AIIMS), New Delhi', short: 'AIIMS New Delhi', city: 'New Delhi', tags: ['aiims', 'ansari nagar'] },
  { name: 'Christian Medical College (CMC), Vellore', short: 'CMC Vellore', city: 'Vellore', tags: ['cmc'] },
  { name: 'JIPMER Puducherry', short: 'JIPMER', city: 'Puducherry', tags: ['jipmer'] },
];

/**
 * Searches the colleges database for query matches.
 * Uses smart sub-string, acronym, city, and tag matches.
 * Caps at limit results for blazing-fast response times.
 */
export function searchColleges(query = '', limit = 15) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return COLLEGES_DATABASE.slice(0, limit);
  }

  const queryParts = trimmed.split(/\s+/).filter(Boolean);

  const scored = [];

  for (const item of COLLEGES_DATABASE) {
    const nameLower = item.name.toLowerCase();
    const shortLower = item.short.toLowerCase();
    const cityLower = item.city.toLowerCase();
    const tagsCombined = (item.tags || []).join(' ').toLowerCase();

    let score = 0;

    // Direct acronym match (e.g. "SSCBS", "SRCC", "IITD", "DU")
    if (shortLower === trimmed) {
      score += 100;
    } else if (shortLower.startsWith(trimmed)) {
      score += 50;
    } else if (shortLower.includes(trimmed)) {
      score += 30;
    }

    // Direct name start match
    if (nameLower.startsWith(trimmed)) {
      score += 60;
    } else if (nameLower.includes(trimmed)) {
      score += 25;
    }

    // Word-by-word matches
    let allPartsMatch = true;
    for (const part of queryParts) {
      const inName = nameLower.includes(part);
      const inShort = shortLower.includes(part);
      const inCity = cityLower.includes(part);
      const inTags = tagsCombined.includes(part);

      if (inName || inShort || inCity || inTags) {
        score += inName ? 10 : (inShort ? 12 : 5);
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
