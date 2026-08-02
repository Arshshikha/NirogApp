export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  category: 'Allopathy' | 'Ayurveda' | 'Homeopathy';
  rating: number;
  reviewsCount: number;
  experience: number;
  location: string;
  distance: string;
  fee: number;
  availability: string[];
  avatar: string;
}

export interface Provider {
  id: string;
  name: string;
  type: 'Hospital' | 'Lab' | 'Pharmacy';
  rating: number;
  location: string;
  distance: string;
  services: string[];
  avatar: string;
}

export interface HubItem {
  id: string;
  title: string;
  type: 'Blog' | 'Article' | 'Special Case' | 'Course';
  author: string;
  authorTitle: string;
  duration?: string;
  content: string;
  likes: number;
  comments: number;
  videoUrl?: string;
  thumbnail?: string;
  authorId?: string;
}

export interface Booking {
  id: string;
  doctorName?: string;
  providerName?: string;
  type: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rejected';
  fee: number;
}

// ─── Course + Module Data ────────────────────────────────────────────────────

export interface CourseLesson {
  title: string;
  body: string;
}

export interface CourseKeyTerm {
  term: string;
  definition: string;
}

export interface CourseModule {
  id: string;
  number: number;
  title: string;
  duration: string;
  isPremium: boolean;
  objectives: string[];
  lessons: CourseLesson[];
  summary: string;
  keyTerms: CourseKeyTerm[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorTitle: string;
  description: string;
  thumbnail: string;
  totalModules: number;
  totalDuration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price?: number;
  modules: CourseModule[];
}

export const mockCourses: Course[] = [
  {
    id: 'c1',
    title: 'Basic First Aid & Emergency Response',
    instructor: 'Dr. Vikram Malhotra',
    instructorTitle: 'Senior Pediatrician & Emergency Care Specialist',
    description: 'A comprehensive starter course covering standard first aid, CPR, choking relief, wound dressing, and burn management. Ideal for medical students and caregivers.',
    thumbnail: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600',
    totalModules: 4,
    totalDuration: '9 hours',
    level: 'Beginner',
    price: 499,
    modules: [
      {
        id: 'c1m1',
        number: 1,
        title: 'General Anatomy & Physiology',
        duration: '1.5 hours',
        isPremium: false,
        objectives: [
          'Understand the major organ systems of the human body',
          'Identify the role of each system in maintaining homeostasis',
          'Describe basic anatomical terminology (proximal, distal, etc.)',
          'Explain how physiological processes respond to injury',
        ],
        lessons: [
          {
            title: 'Introduction to Anatomy vs. Physiology',
            body: 'Anatomy is the study of the structure of the body, while physiology focuses on how those structures function. Together, they form the foundation of all medical practice.\n\nThe human body is organized at multiple levels: cells form tissues, tissues form organs, organs form systems, and systems form the organism. Each level depends on the others for proper function.',
          },
          {
            title: 'The Cardiovascular System',
            body: 'The cardiovascular system consists of the heart, blood vessels (arteries, veins, capillaries), and blood. The heart acts as a dual pump — the right side pumps deoxygenated blood to the lungs, and the left side pumps oxygenated blood to the rest of the body.\n\nBlood pressure is measured in mmHg with two components: systolic (during contraction) and diastolic (during relaxation). Normal adult range is 90–120 / 60–80 mmHg.',
          },
          {
            title: 'The Respiratory System',
            body: 'The respiratory system brings oxygen into the body and expels carbon dioxide. Air enters through the nose/mouth, travels through the trachea, and reaches the alveoli in the lungs where gas exchange occurs.\n\nIn emergencies, ensuring an open airway is the first priority — Airway, Breathing, Circulation (ABC). An obstructed airway can render a victim unconscious within minutes due to lack of oxygen.',
          },
        ],
        summary: 'A solid understanding of anatomy and physiology is the cornerstone of emergency care. Knowing where structures are and how they function allows first responders to prioritize interventions correctly — from maintaining airway patency to managing circulatory failure.',
        keyTerms: [
          { term: 'Homeostasis', definition: "The body's ability to maintain stable internal conditions despite external changes." },
          { term: 'Systolic Pressure', definition: 'The top number in a blood pressure reading — pressure when the heart contracts.' },
          { term: 'Alveoli', definition: 'Tiny air sacs in the lungs where gas exchange (O2/CO2) occurs.' },
          { term: 'Tachycardia', definition: 'A heart rate above 100 beats per minute, often a sign of stress or shock.' },
        ],
      },
      {
        id: 'c1m2',
        number: 2,
        title: 'Immunological Systems & Cellular Response',
        duration: '2 hours',
        isPremium: false,
        objectives: [
          'Differentiate between innate and adaptive immunity',
          'Describe the roles of lymphocytes, macrophages, and antibodies',
          'Explain the inflammatory response and its clinical significance',
          'Understand how vaccines stimulate immune memory',
        ],
        lessons: [
          {
            title: 'Innate vs. Adaptive Immunity',
            body: 'The immune system is divided into two main arms:\n\nInnate Immunity is the first line of defense — fast, non-specific, and includes physical barriers (skin, mucosa), phagocytes (neutrophils, macrophages), and inflammatory mediators. It responds within minutes to hours.\n\nAdaptive Immunity is slower (days to weeks) but highly specific. It involves T lymphocytes (cell-mediated) and B lymphocytes (antibody-mediated). Crucially, it forms memory — allowing faster, stronger responses upon re-exposure to the same pathogen.',
          },
          {
            title: 'The Inflammatory Response',
            body: "When tissue is damaged or infected, chemical signals (cytokines, histamine) trigger inflammation. Cardinal signs are: Redness, Heat, Swelling, Pain, and Loss of function.\n\nWhile acute inflammation is protective and promotes healing, chronic inflammation is linked to conditions such as rheumatoid arthritis, atherosclerosis, and inflammatory bowel disease.",
          },
          {
            title: 'Vaccines & Immune Memory',
            body: 'Vaccines work by introducing an antigen (weakened/killed pathogen or a protein fragment) to the immune system without causing disease. The adaptive immune system responds by producing memory B and T cells.\n\nOn future exposure to the real pathogen, these memory cells mount a rapid, high-magnitude response, often eliminating the pathogen before symptoms develop.',
          },
        ],
        summary: 'The immune system is the body\'s defense network. Innate immunity provides immediate non-specific protection, while adaptive immunity provides targeted, memory-based defense. Understanding immune mechanisms is essential for diagnosing inflammatory conditions and advising on vaccination.',
        keyTerms: [
          { term: 'Antigen', definition: 'Any molecule that triggers an immune response, typically a foreign protein.' },
          { term: 'Antibody', definition: 'A Y-shaped protein produced by B cells that binds specifically to an antigen.' },
          { term: 'Cytokine', definition: 'Signaling protein that regulates the immune response — includes interleukins and TNF.' },
          { term: 'Memory Cell', definition: 'Long-lived B or T cells that persist after infection and enable rapid re-response.' },
        ],
      },
      {
        id: 'c1m3',
        number: 3,
        title: 'Pathological Case Formulations (Clinical)',
        duration: '3 hours',
        isPremium: true,
        objectives: [
          'Construct a structured problem list from a clinical history',
          'Apply differential diagnosis reasoning to common presentations',
          'Integrate investigation results with clinical findings',
          'Formulate a management plan using evidence-based guidelines',
        ],
        lessons: [
          {
            title: 'Structured Clinical Reasoning',
            body: 'Clinical reasoning follows a structured path: Chief Complaint → History of Present Illness → Past Medical History → Examination Findings → Investigations → Assessment → Plan (SOAP format).\n\nA strong problem list is the anchor of clinical formulation. Each problem should be listed at its highest level of diagnostic certainty — e.g., use "chest pain" rather than "possible MI" unless confirmed by ECG and troponin.',
          },
          {
            title: 'Differential Diagnosis Framework',
            body: 'A differential diagnosis is a ranked list of possible diagnoses that explain the patient\'s presentation. Use the mnemonic VITAMIN C-DE: Vascular, Infectious, Traumatic, Autoimmune, Metabolic, Idiopathic, Neoplastic, Congenital-Degenerative, Environmental.\n\nPrioritize life-threatening causes first (e.g., in chest pain: MI, PE, tension pneumothorax, aortic dissection) before less critical ones.',
          },
        ],
        summary: 'Clinical case formulation is the core skill that separates a diagnostician from a symptom-matcher. Structured reasoning, broad differentials, and evidence-based plans form the triumvirate of excellent clinical practice.',
        keyTerms: [
          { term: 'SOAP', definition: 'Subjective, Objective, Assessment, Plan — a structured clinical documentation format.' },
          { term: 'Differential Diagnosis', definition: "A ranked list of conditions that could explain a patient's presentation." },
          { term: 'Troponin', definition: 'A cardiac biomarker — elevated levels indicate myocardial damage (heart attack).' },
        ],
      },
      {
        id: 'c1m4',
        number: 4,
        title: 'Advanced Pediatric Diagnosis Strategies',
        duration: '2.5 hours',
        isPremium: true,
        objectives: [
          'Adapt clinical assessment techniques for infants and children',
          'Recognize age-specific normal vital sign ranges',
          'Identify red flags in pediatric presentations requiring urgent referral',
          'Understand pediatric drug dosing principles (weight-based)',
        ],
        lessons: [
          {
            title: 'Pediatric History Taking',
            body: 'Taking a history from a pediatric patient differs significantly from adults. For infants and young children, history is obtained from caregivers. Key areas include: birth history, developmental milestones, vaccination status, feeding history, and family history.\n\nUsing a child-friendly approach reduces anxiety. Tools like the FLACC scale (Face, Legs, Activity, Cry, Consolability) help assess pain in non-verbal children.',
          },
          {
            title: 'Pediatric Vital Signs & Red Flags',
            body: 'Normal ranges differ significantly with age. A heart rate of 140 bpm is normal in a neonate but tachycardic in a 10-year-old. Respiratory rates are higher in infants (30–60/min vs. 12–20/min in adults).\n\nRed flags requiring immediate attention: stridor, central cyanosis, altered consciousness (AVPU scale), prolonged capillary refill (>2 sec), and poor peripheral perfusion.',
          },
        ],
        summary: "Pediatric diagnosis demands age-calibrated thinking. Children are not small adults — their physiology, communication, and drug metabolism differ fundamentally. Mastering these nuances is essential for safe pediatric care.",
        keyTerms: [
          { term: 'FLACC Scale', definition: 'Pain assessment tool for non-verbal patients: Face, Legs, Activity, Cry, Consolability.' },
          { term: 'Stridor', definition: 'A high-pitched breathing sound indicating upper airway obstruction — a pediatric emergency.' },
          { term: 'AVPU', definition: 'Consciousness scale: Alert, Voice, Pain, Unresponsive — used in rapid assessment.' },
          { term: 'Capillary Refill', definition: 'Time for skin color to return after pressing — >2 seconds suggests poor circulation.' },
        ],
      },
    ],
  },
  {
    id: 'c2',
    title: 'Human Anatomy: Systems & Structure',
    instructor: 'Dr. Meera Krishnan',
    instructorTitle: 'Associate Professor of Anatomy, AIIMS Delhi',
    description: 'An in-depth exploration of human body systems with clinical correlations. Covers musculoskeletal, nervous, and visceral anatomy with imaging references.',
    thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600',
    totalModules: 3,
    totalDuration: '6 hours',
    level: 'Intermediate',
    price: 799,
    modules: [
      {
        id: 'c2m1',
        number: 1,
        title: 'Musculoskeletal System Overview',
        duration: '2 hours',
        isPremium: false,
        objectives: [
          'Identify major bones and their clinical significance',
          'Explain joint types and their range of motion',
          'Describe muscle contraction physiology (sliding filament theory)',
          'Correlate fracture types with clinical presentations',
        ],
        lessons: [
          {
            title: 'Skeletal Framework & Clinical Correlation',
            body: 'The human skeleton consists of 206 bones organized into the axial skeleton (skull, vertebral column, ribs) and the appendicular skeleton (limbs, shoulder, pelvis). Bones serve as structural support, protect organs, produce blood cells (hematopoiesis in red marrow), and act as mineral reservoirs (calcium, phosphate).\n\nClinically, bone density is measured via DEXA scan. Osteoporosis (T-score < –2.5) significantly increases fracture risk, particularly in postmenopausal women.',
          },
          {
            title: 'Muscle Physiology: Sliding Filament Theory',
            body: 'Skeletal muscle contraction is explained by the sliding filament theory: actin (thin) filaments slide over myosin (thick) filaments, shortening the sarcomere.\n\nContraction is triggered by an action potential → acetylcholine released at the neuromuscular junction → depolarization of the muscle membrane → calcium release from sarcoplasmic reticulum → myosin cross-bridge cycling → contraction.',
          },
        ],
        summary: 'The musculoskeletal system provides locomotion, structural support, and protection. Clinical correlations span fracture management, osteoporosis screening, and neuromuscular disorders such as myasthenia gravis.',
        keyTerms: [
          { term: 'Sarcomere', definition: 'The basic contractile unit of a muscle fiber, between two Z-lines.' },
          { term: 'Osteoporosis', definition: 'Reduced bone density (T-score < –2.5) increasing fracture risk.' },
          { term: 'Hematopoiesis', definition: 'Production of blood cells in red bone marrow.' },
          { term: 'Colles Fracture', definition: 'Distal radius fracture with dorsal displacement — typical wrist fracture in osteoporosis.' },
        ],
      },
      {
        id: 'c2m2',
        number: 2,
        title: 'Central & Peripheral Nervous System',
        duration: '2.5 hours',
        isPremium: false,
        objectives: [
          'Map the lobes of the brain and their functional areas',
          'Trace a sensory and motor pathway from periphery to cortex',
          'Understand the cranial nerves and their clinical testing',
          'Explain upper vs. lower motor neuron lesion signs',
        ],
        lessons: [
          {
            title: 'Brain Lobes & Functional Areas',
            body: 'The cerebral cortex is divided into four lobes:\n\nFrontal Lobe — voluntary motor control (precentral gyrus), executive function, Broca\'s area (speech production)\n\nParietal Lobe — somatosensory processing (postcentral gyrus), spatial awareness\n\nTemporal Lobe — auditory processing, Wernicke\'s area (speech comprehension), memory (hippocampus)\n\nOccipital Lobe — visual processing (primary visual cortex)\n\nClinically, stroke affecting the left MCA territory commonly causes contralateral hemiplegia and aphasia.',
          },
          {
            title: 'Upper vs. Lower Motor Neuron Lesions',
            body: 'Distinguishing UMN from LMN lesions is a core clinical skill:\n\nUMN Lesion (above the anterior horn): Spasticity, hyperreflexia, upgoing plantar (Babinski sign), no muscle wasting, weakness.\n\nLMN Lesion (anterior horn, nerve root, peripheral nerve): Flaccidity, hyporeflexia/areflexia, downgoing plantar, muscle wasting (atrophy), fasciculations.\n\nExample: Spinal cord injury (UMN) vs. Guillain-Barré syndrome (LMN pattern).',
          },
        ],
        summary: 'Neurological anatomy directly translates to clinical localization — identifying which lobe, pathway, or nerve is affected based on the pattern of deficits. The UMN vs. LMN distinction is one of the most tested concepts in clinical examinations.',
        keyTerms: [
          { term: 'Babinski Sign', definition: 'Extension of the big toe on plantar stimulation — indicates UMN lesion in adults.' },
          { term: "Broca's Area", definition: 'Left frontal lobe region responsible for speech production; damage causes expressive aphasia.' },
          { term: 'Fasciculation', definition: 'Involuntary muscle twitching visible under the skin — characteristic of LMN lesions.' },
          { term: 'Dermatome', definition: 'Area of skin innervated by a single spinal nerve root — used to localize spinal lesions.' },
        ],
      },
      {
        id: 'c2m3',
        number: 3,
        title: 'Visceral Anatomy & Imaging Correlations',
        duration: '1.5 hours',
        isPremium: true,
        objectives: [
          'Identify abdominal organ positions and peritoneal relationships',
          'Correlate visceral anatomy with abdominal X-ray and CT findings',
          'Understand referred pain pathways',
          'Describe thoracic visceral anatomy (heart, lungs, great vessels)',
        ],
        lessons: [
          {
            title: 'Abdominal Compartments & Organ Positions',
            body: 'The abdomen is divided into 9 regions. Key organ positions:\n\nLiver — right hypochondrium, extending to epigastrium\nSpleen — left hypochondrium (NOT palpable normally; if palpable, it is enlarged)\nStomach — epigastrium\nAppendix — McBurney\'s point (RIF), though 30% have variable position\n\nRetroperitoneal organs (kidneys, pancreas, duodenum 2nd-4th parts, ascending/descending colon) do not move freely and are accessed posteriorly in surgery.',
          },
        ],
        summary: 'Visceral anatomy knowledge enables accurate clinical examination, investigation interpretation, and surgical planning. Referred pain pathways explain why cardiac ischemia causes jaw/arm pain and diaphragm irritation causes shoulder tip pain.',
        keyTerms: [
          { term: "McBurney's Point", definition: '1/3 of the way from ASIS to umbilicus — maximal tenderness point in appendicitis.' },
          { term: 'Retroperitoneal', definition: 'Behind the peritoneum — organs here include kidneys, pancreas, and aorta.' },
          { term: 'Referred Pain', definition: 'Pain felt at a location distant from its source due to shared nerve pathways.' },
        ],
      },
    ],
  },
];

export const mockDoctors: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Arpan Sharma',
    specialty: 'Cardiologist',
    category: 'Allopathy',
    rating: 4.9,
    reviewsCount: 120,
    experience: 12,
    location: 'Sector 62, Noida',
    distance: '1.2 km',
    fee: 500,
    availability: ['10:00 AM', '12:00 PM', '04:00 PM'],
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200',
  },
  {
    id: 'd2',
    name: 'Dr. Priya Nair',
    specialty: 'General Physician',
    category: 'Allopathy',
    rating: 4.8,
    reviewsCount: 80,
    experience: 8,
    location: 'Indirapuram, Ghaziabad',
    distance: '2.5 km',
    fee: 300,
    availability: ['09:00 AM', '11:30 AM', '03:00 PM', '05:30 PM'],
    avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=200',
  },
  {
    id: 'd3',
    name: 'Dr. Rajesh Kumar',
    specialty: 'Ayurvedic Expert',
    category: 'Ayurveda',
    rating: 4.7,
    reviewsCount: 95,
    experience: 15,
    location: 'Sector 15, Noida',
    distance: '3.0 km',
    fee: 400,
    availability: ['11:00 AM', '01:00 PM', '05:00 PM'],
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200',
  },
  {
    id: 'd4',
    name: 'Dr. Amit Patel',
    specialty: 'General Surgeon',
    category: 'Allopathy',
    rating: 4.9,
    reviewsCount: 110,
    experience: 10,
    location: 'Indirapuram, Ghaziabad',
    distance: '1.8 km',
    fee: 600,
    availability: ['10:30 AM', '02:30 PM', '04:30 PM'],
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200',
  },
  {
    id: 'd5',
    name: 'Dr. Sunita Rao',
    specialty: 'Gynecologist',
    category: 'Allopathy',
    rating: 4.6,
    reviewsCount: 75,
    experience: 7,
    location: 'Sector 62, Noida',
    distance: '2.0 km',
    fee: 500,
    availability: ['09:30 AM', '12:30 PM', '03:30 PM'],
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200',
  }
];

export const mockProviders: Provider[] = [
  {
    id: 'p1',
    name: 'Apollo Diagnostics Lab',
    type: 'Lab',
    rating: 4.8,
    location: 'Sector 62, Noida',
    distance: '1.5 km',
    services: ['Blood Test', 'Urine Test', 'X-Ray', 'ECG'],
    avatar: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=200',
  },
  {
    id: 'p2',
    name: 'Max Super Speciality Hospital',
    type: 'Hospital',
    rating: 4.9,
    location: 'Vaishali, Ghaziabad',
    distance: '4.2 km',
    services: ['Emergency', 'ICU', 'Cardiology', 'OPD'],
    avatar: 'https://images.unsplash.com/photo-1586773860418-d3b31966cfde?w=200',
  },
  {
    id: 'p3',
    name: 'Fortis Hospital',
    type: 'Hospital',
    rating: 4.8,
    location: 'Sector 62, Noida',
    distance: '0.8 km',
    services: ['Emergency', 'OPD', 'Neurology', 'Diagnostics'],
    avatar: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200',
  },
  {
    id: 'p4',
    name: 'SRL Labs',
    type: 'Lab',
    rating: 4.6,
    location: 'Indirapuram, Ghaziabad',
    distance: '3.1 km',
    services: ['Blood Test', 'Pathology', 'MRI', 'CT Scan'],
    avatar: 'https://images.unsplash.com/photo-1579154204601-01588f351167?w=200',
  },
  {
    id: 'p5',
    name: 'City Pharmacy',
    type: 'Pharmacy',
    rating: 4.5,
    location: 'Sector 62, Noida',
    distance: '0.5 km',
    services: ['Home Delivery', '24/7 Service', 'Medicines'],
    avatar: 'https://images.unsplash.com/photo-1607619056574-7b8d304a2723?w=200',
  }
];

export const mockHubItems: HubItem[] = [
  {
    id: 'h1',
    title: '5 Secrets to Maintain a Healthy Heart',
    type: 'Blog',
    author: 'Dr. Arpan Sharma',
    authorTitle: 'Cardiologist',
    likes: 142,
    comments: 23,
    content: 'Maintaining heart health requires a balance of proper diet, regular cardiovascular exercise, stress management, and routine checkups. In this blog post, we discuss the role of omega-3 fatty acids, sodium limits, and daily walking routines.',
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300',
  },
  {
    id: 'h2',
    title: 'Understanding Ayurvedic Doshas',
    type: 'Blog',
    author: 'Dr. Rajesh Kumar',
    authorTitle: 'Ayurvedic Expert',
    likes: 98,
    comments: 12,
    content: 'Ayurveda classifies human body and temperament into three basic doshas: Vata, Pitta, and Kapha. Balancing these doshas through customized diets and herbs is the foundation of Ayurvedic wellness.',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300',
  },
  {
    id: 'h3',
    title: 'Chronic Eczema Barrier Repair Case Study',
    type: 'Special Case',
    author: 'Dr. Sneha Patil',
    authorTitle: 'Dermatologist',
    duration: '2:15',
    content: 'In this video case study, we review a patient presenting with chronic adult eczema. We explore the implementation of a barrier-repair regimen, the targeted use of topical calcineurin inhibitors, and environmental trigger identification to achieve clearance in 4 weeks.',
    likes: 312,
    comments: 54,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300',
  },
  {
    id: 'h4',
    title: 'Basic First Aid and Emergency Response',
    type: 'Course',
    author: 'Dr. Vikram Malhotra',
    authorTitle: 'Pediatrician',
    duration: '8 Modules',
    content: 'A comprehensive starter course covering standard first aid techniques, CPR instructions, choking relief for infants and adults, wound dressing, and management of minor burns. Ideal for medical students and caregivers.',
    likes: 420,
    comments: 98,
    thumbnail: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300',
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    doctorName: 'Dr. Arpan Sharma',
    type: 'Online Video',
    date: '2026-05-28',
    time: '10:00 AM',
    status: 'Confirmed',
    fee: 500,
  },
  {
    id: 'b2',
    doctorName: 'Dr. Priya Nair',
    type: 'Offline Clinic Visit',
    date: '2026-05-29',
    time: '03:00 PM',
    status: 'Pending',
    fee: 300,
  },
  {
    id: 'b3',
    providerName: 'Apollo Diagnostics Lab',
    type: 'Lab Test (Blood Sample)',
    date: '2026-05-30',
    time: '09:00 AM',
    status: 'Confirmed',
    fee: 450,
  }
];
