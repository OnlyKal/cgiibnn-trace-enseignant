import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, SERVER_URL } from '../config';
import AuthService from '../services/AuthService';
import '../styles/ProfessorRegistrationForm.css';
import { FaUser, FaGraduationCap, FaFileAlt, FaCheckCircle, FaEye, FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';
import LoadingModal from './LoadingModal';
import UserInfo from './UserInfo';
import ProfileSidebar from './ProfileSidebar';
import Select from 'react-select';
import { COUNTRIES } from '../data/countries';

// Configuration du système de brouillon
const DRAFT_KEY = 'localstorageDraft';
const DRAFT_SAVE_DELAY = 1000; // 1 seconde de debounce

const isPrivateEtablissement = (value) => value === 'Privé' || value === 'Établissement Privé';

const formatGradeActuel = (grade) => {
  const gradeLabels = {
    PE: 'Professeur Émérite',
    PO: 'Professeur Ordinaire',
    P: 'Professeur',
    PA: 'Professeur Associé',
    DT: 'Docteur à thèse',
  };

  return gradeLabels[grade] || grade;
};

const isAssistantRecherche = (category = '') => {
  const normalized = String(category).trim().toLowerCase();
  return normalized === 'recherche' || normalized === 'assistant de recherche';
};

const shouldShowThirdCycleInfo = (data = {}) => (
  !data.diplome_master_dea_ds &&
  Boolean(data.etablissement_inscription_3cycle || data.decision_inscription || data.date_inscription || data.statut_apprenant)
);

const getUniversityType = (university) => university?.type_etablissement || university?.type_etablissment || '';

const isManualTypeEtablissementAllowed = (universiteAttache) => universiteAttache === 'AUTRES';

const buildUniversityOption = (uni) => {
  return {
    value: uni.code,
    label: uni.name,
  };
};

// Catégories d'assistant
const CATEGORIE_ASSISTANT_CHOICES = [
  { value: 'Academique', label: 'Assistant Académique' },
  { value: 'Recherche', label: 'Assistant de Recherche' },
];

const UNIVERSITIES = [
  {
    "code": "ABA-KIN",
    "name": "ACADEMIE DES BEAUX - ARTS DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "UML",
    "name": "UNIVERSITE DE MOYEN  LUALABA",
    "type_etablissment": "Public"
  },
  {
    "code": "UPEL-WEMBO-NYAMA",
    "name": "UNIVERSITE PATRICE EMERY LUMUMBA DE WEMBO-NYAMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ERPUIFTT",
    "name": "ECOLE REG. POST. UNIV. INT. FOR. T. TROP.",
    "type_etablissment": "Public"
  },
  {
    "code": "IFAF-MWEKA",
    "name": "INSTITUT FACULTAIRE - MWEKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-GOMA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "UPC",
    "name": "UNIVERSITE PROTESTANTE AU CONGO ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-MATADI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE   DE MATADI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-ILEBO",
    "name": "INSTITUT SUPERIEUR DE COMMERCE   DÂ’ILEBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-LUBUMBASHI",
    "name": "INSTITUT SUPÉRIEUR DE COMMERCE DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  DE TSHIKAPA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-BUKAVU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-TSHIBASHI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE TSHIBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-MBANDAKA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MBANDAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-MWESO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES MWESO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-MONDONGO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE MONDONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-MUKONGO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES MUKONGO À TSHILENGE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-KAMPONDE",
    "name": "INSTITUT SUPÉRIEUR D’ÉTUDES AGRONOMIQUES KAMPONDE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISES-LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES ETUDES SOCIALES DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BUKAVU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-ILEBO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DÂ’ILEBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MBUJI-MAYI",
    "name": "INSTUTIT SUPERIEUR PEDAGOGIQUE DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-MAHAGI",
    "name": "INSTITUT SUPERIEUR DE COMMRECE DE MAHAGI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-RUTSHURU",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - RUTSHURU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-WEMBO NYAMA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - WEMBO NYAMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MBANDAKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE MBANDAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MWENEDITU",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - MWENEDITU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KANANGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE   DE KANANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISS-LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES STATISTIQUES DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "IST-GOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-BUKAVU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-ILEBO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'ILEBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KANANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KANANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KIN",
    "name": "Institut Supérieur des Techniques Médicales de Kinshasa ",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICAL DE TSHIKAJI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-MBANDAKA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MBANDAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-GOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-MATADI",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE MATADI",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-BUTEMBO",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-KINDU",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-KISANGANI",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE KISANGANI",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-LUEBO",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE LUEBO",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-MBUJI-MAYI",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "IFA-YANGAMBI",
    "name": "INSTITUT FACULTAIRE DES SCIENCES AGRONOMIQUES DE YANGAMBI",
    "type_etablissment": "Public"
  },
  {
    "code": "INA-KIN",
    "name": "INSTITUT NATIONAL DES ARTS DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KANIAMA KASESE",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE  DE KANIAMA KASESE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAU-KIN",
    "name": "INSTITUT SUPERIEUR D'ARCHITECTURE ET D'URBANISME DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "INBTP-KIN",
    "name": "INSTITUT NATIONAL DU BATIMENT ET DES TRAVAUX PUBLICS DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNISIC",
    "name": "UNIVERSITE DES SCIENCES DE L'INFORMATION ET DE LA COMMUNICATION",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPE-MBA",
    "name": "INSTITUT SUPÉRIEUR DE PÈCHE - MBANDAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAM-KIN",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "HEC-KIN",
    "name": "HAUTE ECOLE  DE  COMMERCE  DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LUEBO",
    "name": "INSTITUT SUPERIEUR PEDAGOGQUE DE LUEBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KAMWESHA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE  KAMWESHA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KITANGWA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KITANGWA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-KIN",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-TSHUMBI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE   DE   TSHUMBI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAGE-ATEN",
    "name": "INSTITUT SUPÉRIEUR AGRO-FORESTIE ET DE GESTION DE L’ENVIRONNEMENT - ATEN",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAGE-KAHUZI BIEGA",
    "name": "INSTITUT SUPERIEUR D'AGRO-FORESTERIE ET DE GESTION DE DEVELOPPEMENT DURABLE KAHUZI-BIEGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAM-BUKAVU",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAM-KISANTU",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KISANTU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAM-LUBERO",
    "name": "INSTITUT SUPERIEURS DES ARTS ET METIERS DE LUBERO Ã€ BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAM-TSHUMBE",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE TSHUMBE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAM-KIDIMA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KIDIMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAVC-MINEMBWE",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRO VETERINAIRE ET CONSERVATION DE LA NATURE - MINEMBWE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-BANDUNDU",
    "name": "INSTITUT SUPERIEUR DE COMMERCE    DE BANDUNDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-ARIWARA",
    "name": "INSTITUT SUPÉRIEUR DE COMMERCE - ARIWARA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-BENI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  BENI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-BOENDE",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  DE BOENDE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-BUKAVU",
    "name": "INSTITUT SUPERIEUR DE COMMERCE   DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-BULUNGU",
    "name": "INSTITUT  SUPERIEUR DE COMMERCE DE  BULUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-BUTEMBO",
    "name": "INSTITUT  SUPERIEUR   DE  COMMERCE   DE  BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-IDIOFA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DÂ’IDIOFA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-ISIRO",
    "name": "INSTITUT  SUPERIEUR DE COMMERCE D'ISIRO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-KINDU",
    "name": "INSTITUT SUPERIEUR DE COMMERCE    DE  KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-KISANGANI",
    "name": "INSTITUT  SUPERIEUR DE COMMERCE DE KISANGANI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-KIWANJA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  DE KIWANJA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-LODJA",
    "name": "INSTITUT SUPERIEUR DE  COMMERCE DE   LODJA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-UVIRA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE   D’UVIRA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISCA-BUTEMBO",
    "name": "INSTITUT SUPERIEUR DE CHIMIES APPLIQUEES DE BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KINDU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-MBEO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MBEO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-AMADI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL- AMADI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-BENI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BENI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-BOSONDJO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL - BOSONDJO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-DEKESE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE DEKESE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-DEMBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE DEMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-FIZI ",
    "name": "INSTITUT SUPERIEURDE DE DEVELOPPEMENT-RURAL DE FIZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KABAMBARE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KABAMBARE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KAHEMBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KAHEMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KIBOMBO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KIBOMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KIMVULA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KIMVULA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KINZAU-MVUETE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KINZAU-MVUETE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KITENDA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KITENDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KITSOMBIRO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KITSOMBIRO Ã€ LUBERO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-LUBAO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUBAO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-LUIZA",
    "name": "INSTITUT SUPÉRIEUR DE DÉVELOPPEMENT RURAL - LUIZA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-LUOZI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUOZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-MAPANGU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MAPANGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-MISAY",
    "name": "INSTITUT SUPÉRIEUR DE DÉVELOPPEMENT RURAL - MISAY",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-MOBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MOBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-MOSAMBO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MOSAMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-SHABUNDA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE SHABUNDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-TSHIBALA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE TSHIBALA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-UVIRA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL D'UVIRA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-WALIKALE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE WALIKALE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-YAUMA",
    "name": "INSTITUT SUPÉRIEUR DE DÉVELOPPEMENT RURAL - YAUMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-KENGE",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KENGE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-KIYAKA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KIYAKA GUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-BENGAMISA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE BENGAMISA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-BOKONZI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE BOKONZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-KASEYA KONGOLO",
    "name": "INSTITUT SUPÉRIEUR D’ÉTUDE AGRONOMIQUES - KASEYA KONGOLO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-KIMBAO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KIMBAO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-LABA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONIMIES LABA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-LOEKA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE LOEKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-LOMELA",
    "name": "INSTITUT SUPÉRIEUR D’ÉTUDE AGRONOMIQUES - LOMELA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-MANGAYI",
    "name": "INSTITUT SUPÉRIEUR D’ÉTUDE AGRONOMIQUES - MANGAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-MUSHWESHWE",
    "name": "INSTITUT SUPÉRIEUR D’ÉTUDE AGRONOMIQUES - MUSHWESHWE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-MVUAZI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE MVUAZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-YATOLEMA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE YATOLEMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-ZOMFI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE ZOMFI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-TSHELA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE TSHELA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-ARU",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRE D'ARU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-MANIEMA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE MANIEMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-LUKASHIYI",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRO-VETERINAIRES DE LUKASHIYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-SANDOA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE SANDOA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-WALUNGU",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE WALUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAVF-BUTEMBO",
    "name": "INSTITUT SUPÉRIEUR D’ÉTUDE AGRONOMIQUES  VÉTÉRINAIRES ET FORESTIES - BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAVF-KISHARU",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES, VETERINAIRES ET FORESTIERES DE KISHARU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISES-KANANGA",
    "name": "INSTITUT SUPERIEUR DES ETUDES SOCIALES DE KANANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISIB-BASANKUSU",
    "name": "INSTITUT SUPERIEUR INDUSTRIEL DES BOIS DE BASANKUSU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISNP-MOANDA",
    "name": "INSTITUT SUPÉRIEUR  DE NAVIGATION ET DE PÊCHE - MOANDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-IDIOFA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DÂ’IDIOFA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KIKWIT",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIKWIT",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LUBUMBASHI ",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP- MASHALA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - MASHALA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-GOMBE",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE  DE  LA GOMBE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-ARU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DÂ’ARU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BAGATA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BAGATA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BANDUNDU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BANDUNDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BARAKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE BARAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BILONDA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - BILONDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BOENDE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOENDE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-WEMBO-NYAMA",
    "name": "INSTUTIT SUPERIEUR PEDAGOGIQUE DE WEMBO-NYAMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BOMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BONDO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BONDO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BONGIMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE BONGIMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BUDJALA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BUDJALA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BULUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BULUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BUMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BUMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BUNIA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BUNIA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BUSINGA",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE DE BUSINGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BUTA",
    "name": "INSTITUT SUPERIEUR PEDAOGIQUE DE BUTA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-DIBAYA-LUBWE",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - DIBAYA-LUBWE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-DULA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE DULA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-EOLO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DÂ’EOLO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-FESHI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE FESHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-GEMENA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE GEMENA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-GOMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-GUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE GUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-IDJWI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DÂ’IDJWI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-ISANGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIUE DÂ’ISANGI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-ISIRO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DÂ’ISIRO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-JOMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE JOMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KABAMBARE",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE DE KABAMBARE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KABINDA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KABINDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KABONGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KABONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KABULUNDA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - KABULUNDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KAHEMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KAHEMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KALEHE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KALEHE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KALIMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KALIMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KALOMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KALOMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KAMINA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KAMINA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KAMITUNGA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - KAMITUNGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KAMUESHA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - KAMUESHA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KANIAMA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - KANIAMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KARAWA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KARAWA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KASONGO",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE DE KASONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KASONGO LUNDA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - KASONGO LUNDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KENGE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KENGE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KIBOMBO",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE DE KIBOMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KICHANGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE  KICHANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KINDU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KINYATSI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KINYATSI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KIRI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIRI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KISANGANI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KISANGANI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KITOY",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KITOY",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KOLE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE KOLE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KOLWEZI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KOLWEZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KONGOLO",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE DE KONGOLO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LISALA",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE DE LISALA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP LUBEFU",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - LUBEFU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LUBUTU",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - LUBUTU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LUIZA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE LUIZA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LULINGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE LULINGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LUOZI",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - LUOZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MACHUMBI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE  MACHUMBI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MANONO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MANONO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MASIMANIMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MASIMANIMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MATADI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MATADI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MATANDA",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE DE MATANDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MILEMBWE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MILEMBWE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MILUNDU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MILUNDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MOLEGBE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE MOLEGBE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MONGAMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  MONGAMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MONKOTO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MONKOTO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MUKEDI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE MUKEDI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MUSUMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MUSUMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MWEKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE   DE MWEKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-NGUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE NGUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-NIOKI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE NIOKI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-NYIRAGONGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE NYIRAGONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-NYUNZU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE NYUNZU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-OICHA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DÂ’OICHA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-PANZI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE PANZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-PAY-KONGILA",
    "name": "INSITUT SUPERIEUR PEDAGOGIQUE DE PAY-KONGILA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-PELENDE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE PELENDE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-POPOKABAKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE POPOKABAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-SUD BANGA",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE DU SUD-BANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-TSHOFA",
    "name": "INSTITUT SUERIEUR  PEDAGOGIQUE DE TSHOFA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-UBUNDU",
    "name": "INSTITUT  SUPERIEUR PEDAGOGIQUE DÂ’UBUNDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-UPOTO",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - UPOTO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-UVIRA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - UVIRA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-WALIKALE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE WALIKALE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-WALUNGU",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - WALUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-WATSHA",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE - WATSHA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-YAKOMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE YAKOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-YAMBULA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE YAMBULA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-INONGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D’INONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KANGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KANGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MBANZA-NGUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE MBANZAÂ–NGUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "UFAK",
    "name": "UNIVERSITE FRANCO-AMERICAINE AU KONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-BUKAVU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-BUMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE BUMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-ILEBO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE D'ILEBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-MUHANGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE MUHANGI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-RUTSHURU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE RUTSHURU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-LIKASI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE LIKASI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE   DE TSHIKAPA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISS-MANIEMA",
    "name": "INSTITUT SUPERIEUR DES STATISTIQUES DE MANIEMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISIC",
    "name": "Institut Supérieur d'Informatique CHAMINADE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISS-KIN",
    "name": "INSTITUT SUPERIEUR DES STATISTIQUES DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-NDOLO",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES APPLIQUÉES - NDOLO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-BUKAVU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-DOMIONGO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE DOMIONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-EBONDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES D'EBONDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-GOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-KASANGULU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE KASANGULU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-KINDU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-LUKULA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE LUKULA A BOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-MBUJI MAYI",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES APPLIQUÉES - MBUJI MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-NDOLUMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE NDOLUMA A LUBERO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-KOLWEZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE KOLWEZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTD-KALEHE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE DEVELOPPEMENT DE KALEHE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTD-MULUNGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES ET DE DEVELOPPEMENT DE MULUNGU A KABARE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BANDUNDU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BANDUNDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-IDIOFA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'IDIOFA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KASONGO LUNDA",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - KASONGO LUNDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KIKWIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIKWIT",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BARAKA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BARAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BASOKO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BASOKO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BENI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BENI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BULUNGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BULUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BUMBA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BUMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BUNIA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BUNIA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BUTEMBO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-DEMBA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE DEMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-DIMBELENGE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE DIMBELENGE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-FESHI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE FESHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-GEMENA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE GEMENA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-GUNGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE GUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-IPAMU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES D'IPAMU MEDICALES D'IPAMU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-ISIRO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'ISIRO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KABARE",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - KABARE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KABINDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KABINDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KAKENGE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAKENGE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KALENDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KALENDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KALIMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KALIMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KAMINA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAMINA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KANYAMULANDE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KANYAMULANDE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KASONGO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KASONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KIBOMBO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIBOMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KIDIMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIDIMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KIMPESE",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - KIMPESE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM KINDU",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KISANGANI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KISANGANI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KOLE",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES MÉDICALES KOLE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KOLWEZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - KOLWEZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-LODJA",
    "name": "INSTITUT SUPERIRUR DES TECHNIQUES MEDICALES LODJA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-LUBAO",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - LUBAO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-LUBI",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - LUBI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-LUBUMBASHI",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-LUEBO",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - LUEBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-LUIZA",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - LUIZA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-MANONO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - MANONO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-MARIE",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - MARIE REINE DE LA PAIX",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-MASISI",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - MASISI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-MOANZA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DES MOANZA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-MUSUMBA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MUSUMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-NDEKESHA",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - NDEKESHA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-NYANGEZI",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - NYANGEZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-PUNIA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE PUNIA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-RUTSHURU",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - RUTSHURU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-SHABUNDA",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - SHABUNDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-TSHIMBULU",
    "name": "IINSTITUT SUPERIEUR DE TECHNIQUE MEDICAL",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-TSHUMBE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE TSHUMBE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-UBANGI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE UBANGI A GBADOLITE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-UVIRA",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - UVIRA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-WALIKALE",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - WALIKALE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-WAMBA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE WAMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-WEMBONYAMA",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - WEMBONYAMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-YAKOMA",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - YAKOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-YANGAMBI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE YANGAMBI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-ZONGO",
    "name": "INSTITUT SUPERIEUR DES MEDICALES (ISTM)ZONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-BOSOBE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BOSOBE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KISANTU",
    "name": "INSTITUT SUPÉRIEUR  DE TECHNIQUE MÉDICALE - KISANTU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-TSHELA",
    "name": "INSTITUT SUPÉRIEUR  DES TECHNIQUES MÉDICALES - TSHELA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISLG DE GOMA",
    "name": "INSTITUT SUPERIEUR DE LOGISTIQUE ET DE GESTION",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISABAS",
    "name": "INSTITUT SUPERIEUR D'ADMINISTRATION, BANQUES ET ASSURANCES",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIKIN",
    "name": "UNIVERSITE DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIKIVU",
    "name": "UNIVERSITE DU KIVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNILU",
    "name": "UNIVERSITE DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIBAND",
    "name": "UNIVERSITE  DE  BANDUNDU",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIBU",
    "name": "UNIVERSITE DE BUNIA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIGBA",
    "name": "UNIVERSITE DE  GBADOLITE",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIGOM",
    "name": "UNIVERSITE DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIKA",
    "name": "UNIVERSITE DE KABINDA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIKAL",
    "name": "UNIVERSITE  DE KALEMIE",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIKAM",
    "name": "UNIVERSITE DE KAMINA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIKAN",
    "name": "UNIVERSITE DE KANANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIKIK",
    "name": "UNIVERSITÉ DE   KIKWIT",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIKI",
    "name": "UNIVERSITE  DE KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "INTERKIN",
    "name": "INSTITUT INTERUNIVERSITAIRE DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIKIS",
    "name": "UNIVERSITE DE KISANGANI",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIKOL",
    "name": "UNIVERSITE DE KOLWEZI",
    "type_etablissment": "Public"
  },
  {
    "code": "UNILIK",
    "name": "UNIVERSITE DE LIKASI",
    "type_etablissment": "Public"
  },
  {
    "code": "UNILIS",
    "name": "UNIVERSITE  DE LISALA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNILOD",
    "name": "UNIVERSITE DE LODJA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISSCG",
    "name": "INSTITUT SUPERIEUR DES SCIENCES COMMERCIALES DE GBADOLITE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIMBA",
    "name": "UNIVERSITE DE MBANDAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIMWD",
    "name": "UNIVERSITE DE  MWENE–DITU",
    "type_etablissment": "Public"
  },
  {
    "code": "USTC-LODJA",
    "name": "UNIVERSITE DES SCIENCES  ET DE   TECHNOLOGIES DE  LODJA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISMB",
    "name": "INSTITUT SUPERIEUR DE MINES DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIC-LWIRO",
    "name": "UNIVERSITE  DU  CINQUANTENAIRE DE LWIRO",
    "type_etablissment": "Public"
  },
  {
    "code": "UKV",
    "name": "UNIVERSITE  PRESIDENT JOSEPH KASA- VUBU",
    "type_etablissment": "Public"
  },
  {
    "code": "ERT",
    "name": "ECOLE REFORMEE DE THEOLOGIE DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNILO",
    "name": "UNIVERSITE  NOTRE  DAME DE LOMAMI",
    "type_etablissment": "Public"
  },
  {
    "code": "UNITSHU",
    "name": "UNIVERSITE NOTRE DAME  DE TSHUMBE",
    "type_etablissment": "Public"
  },
  {
    "code": "UKA",
    "name": "UNIVERSITE NOTRE DAME DU KASAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "UOB",
    "name": "UNIVERSITE   OFFICIELLE  DE   BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "UOM",
    "name": "UNIVERSITE OFFICIELLE DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "UOR-BUTEMBO",
    "name": "UNIVERSITE   OFFICIELLE   DE  RUWENZORI   A    BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "UOY",
    "name": "UNIVERSITE OFFICIELLE YABAONDO",
    "type_etablissment": "Public"
  },
  {
    "code": "IUK",
    "name": "INSTITUT UNIVERSITAIRE DE KASONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPN",
    "name": "UNIVERSITE  PEDAGOGIQUE  NATIONALE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISMK",
    "name": "INSTITUT SUPERIEUR DE MANAGEMENT DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSM-SALAMABILA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES MEDICALES DE SALAMABILA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIGE",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DES ENTREPRISES DU KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "USKK",
    "name": "UNIVERSITE SIMON KIMBANGU DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UMKI",
    "name": "UNIVERSITE MODERNE DE KINKOLE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCK",
    "name": "UNIVERSITE CARTESIENNE DE KINKOLE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMEF",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES FIVAL",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAM",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUEES ET DE MANAGEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISLC",
    "name": "INSTITUT SUPERIEUR DE LEADERSHIP ET DE CROISSANCE DE L'EGLISE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-KKT",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE KIKWIT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAMK",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KIKWIT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTA-KIKWIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUEES DE KIKWIT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISNBK",
    "name": "INSTITUT SUPERIEUR NORMAL BANA TEE DE KIKWIT",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIMA",
    "name": "UNIVERSITE DE MAI-NDOMBE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-BOKORO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BOKORO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISBB",
    "name": "INSTITUT SUPERIEUR BAPTISTE DE BOLOBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D'OSHWE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPY",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE YUMBI",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUKL",
    "name": "INSTITUT UNIVERSITAIRE DE KASONGO-LUNDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULIMAT",
    "name": "UNIVERSITE LIBRE DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNILIB",
    "name": "UNIVERSITE LIBRE DE BOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTPG",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DU PETROLE ET DU GAZ DE MOANDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAML",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE LUOZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISETC",
    "name": "INSTITUT SUPERIEUR D'ETUDES TECHNIQUES ET COMMERCIALES DE MOANDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSIM",
    "name": "INSTITUT SUPERIEUR DES SCIENCES INFIRMIERES DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPL",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE LUOZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UOCT",
    "name": "UNIVERSITE OUEST CONGO DE TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UT",
    "name": "UNIVERSITE DE TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-T",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPTI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE TECHNIQUE D'ILEBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "CULC",
    "name": "COLLEGE UNIVERSITAIRE LIBRE AU CONGO À KANANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISETML",
    "name": "INSTITUT SUPERIEUR D'ENSEIGNEMENT TECHNIQUE MEDICAL",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUM",
    "name": "INSTITUT UNIVERSITAIRE MORAVE DE MWENE-DITU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDRL",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUBAO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTHEMBU",
    "name": "INSTITUT SUPERIEUR DE THÃ‰OLOGIE EVANGÃ‰LIQUE DE MBUJI-MAYI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSTA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES ET TECHNIQUES APPLIQUÃ‰ES DE MBUJI-MAYI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ITIC",
    "name": "INSTITUT TECHNOLOGIQUE INTERNATIONAL DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEA",
    "name": "INSTITUT SUPÉRIEUR D'ÉTUDES AGRONOMIQUES",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEMA DE BUTEMBO",
    "name": "UNIVERSITE EVANGÃ‰LIQUE DE LA MISSION EN AFRIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIP-RDC",
    "name": "UNIVERSITE DE LA PAIX DE LA REPUBLIQUE DÃ‰MOCRATIQUE DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIC-GOMA",
    "name": "UNIVERSITE DU CEPROMAD DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFAD.G",
    "name": "INSTITUT DE FORMATION DES AGENTS DE CADRE DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPEH",
    "name": "INSTITUT SUPÉRIEUR DE PÈCHE ET D'HYDROLOGIE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAGO",
    "name": "INSTITUT SUPÉRIEUR ALPHA DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISMG",
    "name": "INSTITUT SUPÉRIEUR DE MANAGEMENT DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP.B",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE MASEREKA À BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPG",
    "name": "INSTITUT SUPÉRIEUR DE LA PAIX DE GOMA (EX-UNIVERSITÉ COPTE ORTHODOXE)",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAD",
    "name": "INSTITUT SUPÉRIEUR DES ARTS ET DE DÉVELOPPEMENT DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISL.G",
    "name": "INSTITUT SUPÉRIEUR DU LAC DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD.G",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES DE DÉVELOPPEMENT DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSA.G",
    "name": "INSTITUT SUPÉRIEUR DES SCIENCES APPLIQUÉES DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIAGO",
    "name": "INSTITUT SUPÉRIEUR D'INFORMATIQUE APPLIQUÉE ET DE GESTION DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ABA-L'SHI",
    "name": "ACADEMIE DES BEAUX - ARTS DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ECRI L'SHI",
    "name": "ECOLE DE CRIMINOLOGIE DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "EM-UOB",
    "name": "ECOLE DE MINES DE L'UNIVERSITE OFFICIELLE DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ESHR-KINDU",
    "name": " ECOLE SUPERIEUR D'HOTELERIE ET TOURISME  DE KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAM-GOMA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAM-KAMINA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KAMINA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAM-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-NYANGEZI",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE NYANGENZI",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-GOMA",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-L'shi",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP-RUTSHURU",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE RUTSHURU",
    "type_etablissment": "Public"
  },
  {
    "code": "INA-L'SHI",
    "name": "INSTITUT NATIONAL DES ARTS DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAGE-GUNGU",
    "name": "INSTITUT SUPERIEUR D'AGRO-FORESTERIE ET DE GESTION DE DEVELOPPEMENT  DURABLE D'ATEN",
    "type_etablissment": "Public"
  },
  {
    "code": "ESHR-UNIKIS",
    "name": "ECOLE SUPERIEURE D'HOTELERIE ET TOURISME DE L'UNIKIS",
    "type_etablissment": "Public"
  },
  {
    "code": "ESII-L'SHI",
    "name": "ECOLE SUPERIEURE DES INGENIEURS INDUSTRIELS DE UNILU",
    "type_etablissment": "Public"
  },
  {
    "code": "ESNP-KINDU",
    "name": "ECOLE SUPERIEURE DE NAVIGATION ET DE PECHE DE KINDU À UNIKI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISCNET-GOMA",
    "name": "INSTITUT SUPERIEUR DE CONSERVATION DE LA NATURE, ENVIRONNEMENT ET DU TOURISME DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISCNET-RUMANGABO",
    "name": "INSTITUT SUPERIEUR DE CONSERVATION DE LA NATURE, ENVIRONNEMENT ET DU TOURISME DE RUMANGABO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-AMADI/ISIRO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL D'AMADI D'ISIRO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-BAMBO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BAMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-BINZA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BINZA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-BOSONDJO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BOSONDJO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-BUSANZA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BUSANZA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-FIZI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE FIZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-GOMA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-IMBELA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL D'IMBELA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-ISIRO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL D'AMADI A ISIRO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KABALO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KABALO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KAMIJI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KAMIJI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KANYABAYONGA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KANYABAYONGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KIYAKA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KIYAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KONGOLO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KONGOLO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-LODJA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LODJA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-LUEBO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUEBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-MASISI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MASISI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-PINGA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE PINGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-SEMEDUA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE SEMEDUA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-TSHILENGE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE TSHILENGE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-TSHIMBULU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE TSHIMBULU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-YAHUMA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE YAHUMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-OMEDJADI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES D'OMENDJADI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-PUNIA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE PUNIA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-BASOKO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE BASOKO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-KASEYA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KASEYA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-LOMEKA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE LOMELA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-MAHAGI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE MAHAGI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-MANGAI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE MANGAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-SOLA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE SOLA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-UNTU",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KAMPONDE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-YANGAMBI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE YANGAMBI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-KASONGO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KASONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAEF-MWESO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES, EAUX ET FORET DE MWESO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV Ã€ KIBATI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRO-VETERINAIRES DE KIBATI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-MUSHWESHWE",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES MUSHWESHWE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-BUTEMBO",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES, VETERINAIRE ET FORESTIERES DE BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-KAPANGA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES, VETERINAIRES DE KAPANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEAV-KINDU",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRO-VETERINAIRES DE KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-LIKASI",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONO-VETERINAIRES DE LIKASI ",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-MALAVUDI",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE MALAVUDI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAVF-KIRUMBA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES, VETERINAIRES ET FORESTIERES DE KIRUMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAVF-NYIRAGONGO",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES, VETERINAIRES ET FORESTIERES DE NYIRAGONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISES-KAMINA",
    "name": "INSTITUT SUPERIEUR DES ETUDES SOCIALES DE KAMINA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISNPÃª-MOANDA",
    "name": "INSTITUT SUPERIEUR DE NAVIGATION ET DE PECHE DE MOANDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISNP-GOMA",
    "name": "INSTITUT SUPERIEUR DE NAVIGATION ET DE PECHE DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISNP-KILWA",
    "name": "INSTITUT SUPERIEUR DE NAVIGATION ET DE PECHE DE KILWA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISNP-KISANGANI",
    "name": "INSTITUT SUPERIEUR DE NAVIGATION ET DE PECHE DE KISANGANI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPE-KABONGO",
    "name": "INSTITUT SUPERIEUR DE PECHE DE KABONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPE-NORD-KIVU",
    "name": "INSTITUT SUPERIEUR DE PECHE DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-GOMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-KABINDA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE KABINDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-KALAMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE KALAMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-LOMELA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE LOMELA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-LUBUBULA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE LUBUBULA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-MASISI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE MASISI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-MWEKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE MWEKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT-NGUYA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE NGUYA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-BENI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE BENI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-GBADOLITE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE GBADOLITE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-GOMBE-MATADI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE GOMBE-MATADI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-RUTSHURU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE RUTSHURU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTAD-MASAMUNA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES DE MASAMUNA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTD-IBEMBO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES ET DE DEVELOPPEMENT D'IBEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-LUBUTU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LUBUTU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-NYANGENZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE NYANGENZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-WALUNGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE WALUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-MRP-KENGE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES MARIE REINE DE LA PAIX Ã€ KENGE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-ARU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'ARU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-BISHUSHA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BISHUSHA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BONGANDANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BONGANDANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-FETSHI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE FETSHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-ISANGI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'ISANGI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KABAMBARE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KABAMBARE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KALEMIE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KALEMIE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KAMANA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAMANA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KAMIJI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAMIJI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KANGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE TSHELA A KANGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KANYABAYONGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KANYABAYONGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KARAWA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KARAWA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KASONGO-LUNDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KASONGO-LUNDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KAZIBA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAZIBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KICHANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KICHANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNP BUKAVU",
    "name": "UNIVERSITÃ‰ DE LA NOUVELLE PÃ‚QUES DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEAGL",
    "name": "UNIVERSITÃ‰ DE L'EXCELLENCE POUR L'AFRIQUE DES GRANDS LACS",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNILUS",
    "name": "UNIVERSITE DE LUSAMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA-LODJA",
    "name": "INNSTITUT SUPERIEUR  D'ETUDES AGRONOMIQUES DE LODJA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-WEMBO NYAMBO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  DE WEMBO-NYAMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA- WEMBO NYAMA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES DE WEMBO NYAMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD-LUSAMBO",
    "name": "ISTD DE LUSAMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-LUBEFU",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUES MEDICALES DE LUBEFU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-LUSAMBO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE LUSAMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KINDU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTD-SANKURU",
    "name": " INSTITUT SUPERIEUR TECHNIQUE ET DEVELOPPEMENT DU SANKURU",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST-SANKURU",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE SANKURU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNILO-SANKURU",
    "name": " UNIVERSITE LOGOS DEI DU CONGO DE SANKURU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCE-SANKURU",
    "name": "UNIVERSITE DU CEPROMAD DE SANKURU ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISS-KINDU",
    "name": "INSTITUT SUPERIEUR DE STATISTIQUES DE KINDU",
    "type_etablissment": "Public"
  },
  {
    "code": "UPA-SANKURU",
    "name": "UNIVERSITE PANAFRICAINE DU SANKURU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCK-KATAKOKOMBE",
    "name": "UNIVERSITE COMMUNAUTAIRE KIMBANGUISTE DE KATAKOKOMBE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTA -KALIMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUEES DE KALIMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ULDK-SANKURU",
    "name": "UNIVERSITE LAURENT DESIRE KABILA DE SANKURU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UM-KINDU",
    "name": "UNIVERSITE METHODISTE DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-LODJA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE LODJA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPM-MANIEMA",
    "name": "UNIVERSITE PROTESTANTE DU MANIEMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGM-MANIEMA",
    "name": "UNIVERSITE GEOSCIENCE DU MANIEMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIMAP",
    "name": "UNIVERSITE MAPON",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSM DE KINDU",
    "name": "INSTITUT SUPERIEUR DES SCIENCES MEDICALES DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-LUBUTU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUBUTU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-LAKUNDA",
    "name": "INSTITUT SUPERIUR DE DEVELOPPEMENT RURAL DE LAKUNDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-KINDU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE  DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEME-KINDU",
    "name": "INSTISTUT SUPERIEUR D'ETUDES MEDICALES D'EXCELLENCE DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-KINDU",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD-KINDU",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUE ET DEVELOPPEMENT DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAU-KINDU",
    "name": "INSTITUT SUPERIEUR D'ARCHITECTURE  ET URBANISME DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "IIFT DE KINDU",
    "name": "INSTITUT INTERNATIONALDE FORMATION THEOGIQUE DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFMG-MANIEMA-NAMOYA",
    "name": "INSTITUT FACULTAIRE DES MINES ET GEOLOGIES DU MANIEMA  NAMOYA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UND",
    "name": "UNIVERSITE NATIONALE DE LA DECENTRALISATION ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULGK",
    "name": "UNIVERSITE LIBRE DU GRAND KIVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEST",
    "name": "UNIVERSITAIRE DES ETUDES SCIENTIFIQUES ET TECHNOLOGIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGCNDK",
    "name": "UNIVERSITE DE GESTION, CONSERVATION DE LA NATURE ET DU DEVELOPPEMENT DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPK",
    "name": "UNIVERSITE PROTESTANTE DE KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-KAILO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE KAILO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-TENGETENGE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE TENGETENGE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KASANGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE KASANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-SAMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE SAMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIDJU",
    "name": "UNIVERSITE de DJUMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LUBAO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE LUBAO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BOKORO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOKORO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BAHINA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE BAHINA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LUSANGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE LUSANGI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KIPUKU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIPUKU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KAILO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL KAILO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KINGUNGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KINGUNGI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-SALA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES SALA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTAM-KIKWIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES, ARTS ET METIERS DE KIKWIT",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-LUMBI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LUMBI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-MISAYI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MISAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-B.A NSIENGWOM",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE B.A NSIENGWOM",
    "type_etablissment": "Public"
  },
  {
    "code": "IST-IDIOFA",
    "name": "INSTITUT  SUPERIEUR  THEOLOGIQUE D'IDIOFA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-VANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE VANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCAC-KKT",
    "name": "UNIVERSITE CHRETIENNE D'AFRIQUE DE KIKWIT CENTRALE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSS-CR/KKT",
    "name": "INSTITUT SUPERIEUR DES SCIENCES DE SANTE DE LA CROIX-ROUGE Ã  KIKWIT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSS-KINDU",
    "name": "INSTITUT SUPERIEUR DES SCIENCES DE SANTÃ‰-KINDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPAG",
    "name": "INSTITUT SUPERIEUR DE PROGRAMMATION DES AFFAIRES ET DE GESTION",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFAC",
    "name": "INSTITUT FACULTAIRE D'ANIMATION  ET DE COMMUNICATION",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-ZABA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE ZABA",
    "type_etablissment": "Privé"
  },
  {
    "code": "IBTP/KIKWIT",
    "name": "INSTITUT SUPERIEUR DES BATIMENTS ET TRAVAUX  PUBLICS DE KIKWIT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-NIOKI",
    "name": "INSTITUT  SUPERIEUR DE COMMERCE DE  NIOKI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KKC",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  KASONGO-KABAMBARE CENTRE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISSM-KKC",
    "name": "INSTITUT SUPERIEUR DES SCIENCES MEDICALES DE KINDU-KABAMBARE CENTRE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-BAGATA",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUES MEDICALES DE BAGATA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-KASONGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE KASONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "IST/VAN GEERT",
    "name": "INSTITUT SUPERIEUR TECHNIQUE VAN GEEERT DE YASA-BONGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTKM / MASI-MANIMBA",
    "name": "ISTKM / MASI-MANIMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAD / KINDUNDU",
    "name": "ISTAD / KINDUNDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISABG / ATEN",
    "name": "ISAGB / ATEN",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-IDIOFA",
    "name": "INSTITUT SUPERIEUR D'ARTS ET METIERS D'IDIOFA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-MPO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MPO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIPAK",
    "name": "UNIVERSITE DE PANDA KWANGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIBAK Ã  BAgala",
    "name": "UNIVERSITE BAPTISTE DE KIKONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD-UPUTO LISALA",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE ET DEVELOPPEMENT COMMUNAUTAIRE UPUTO DE LISALA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTA-IDIOFA",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUES APPLIQUEES D'IDIOFA",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFAC / KIKWIT",
    "name": "IFAC / KIKWIT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPTA-BULUNGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES ET PEDAGOGIQUE APPLIQUEES - BULUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KINGANDU",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUESS MEDICALES DE KINGANDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-BOSOSO",
    "name": "INSTITUT  SUPERIEUR DES TECHNIQUES MEDICALES DE BOSOSO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-NIOKI",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUES MEDICALES DE NIOKI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTA / BANDUNDU",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUES APPLIQUEES DE BANDUNDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-KUTU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KUTU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KWAMOUTH",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KWAMOUTH",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNI-C / NIOKI",
    "name": "UNIVERSITE DU CEPROMAD / NIOKI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNI-C / BANDUNDU",
    "name": "UNIVERSITE de CEPROMAD BANDUNDU Ville",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-BANDUNDU",
    "name": "INSTITUT SUPERIEUR  D'ARTS ET METIERS DE BANDUNDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSS / INONGO",
    "name": "ISSS / INONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-LISALA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - LISALA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULB",
    "name": "UNIVERSITE LIBRE DE BUMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMN",
    "name": "INSTITUT SUPERIEUR TECHNIQUE Mgr NKINGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-MULAVUDI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICAL DE  MULAVUDI",
    "type_etablissment": "Public"
  },
  {
    "code": "USJ",
    "name": "UNIVERSITE SAINT JOSEPH  DE KAMUTANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UDDC",
    "name": "UNIVERSITE DE DEVELOPPEMENTS DURABLE DU CONGO ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-BUKASA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS  DE BUKASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-KANANGA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE KANANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAK-KANANGA",
    "name": "UNIVERSITE ADVENTISTE DE KANANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USK-KANANGA",
    "name": "UNIVERSITE SIMON KIMBANGU DE KANANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-MIKALAYI",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUE MEDICAL DE MIKALAYI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULK-TSHIMBULU",
    "name": "UNIVERSITE LULUABOURG DE TSHIMBULU",
    "type_etablissment": "Privé"
  },
  {
    "code": "USL-KANANGA",
    "name": "UNIVERSITE SAINT LAURENT DE KANANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM/CR-TSHIMBULU",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUE MEDICALES DE CROIX-ROUGE DE TSHIMBULU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISSAK-TSHIMBULU",
    "name": "INSTITUT SUPERIEUR DES SCIENCES APPLIQUEES KIMBANGUISTE DE TSHIMBULU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-BOSO-DUA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOSO-DUA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-PIMU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE PIMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTDC-UPOTO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE DEVELOPPEMENT DU CONGO DE UPOTO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-BUMBA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE BUMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-UMANGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE UMANGI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-BUMBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BUMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAD",
    "name": "ISAD LISALA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCG-BUMBA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET DE GESTION DE BUMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIMO",
    "name": "UNIVERSITE DE LA MONGALA UNIMO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISFC",
    "name": "INSTITUT SUPERIEUR DE FORMATION COMMERCIALE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UTML",
    "name": "UNIVERSITE TECHNOLOGIQUE MARCEL LIHAU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UIDB",
    "name": "UNIVERSITE ISLAMIQUE DE BUMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "CEPROMAD",
    "name": "UNIVERSITE DU CEPROMAD DE LISALA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-BINGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BINGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP BANDA YOWA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BANDA YOWA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP MONDONGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MONDONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-KIMBANGUISTE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIMBANGUISTE A LISALA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-MONGALA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE MONGALA DE BUMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-MONGALA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES MONGALA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM BOSONDJO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES BONSONDJO A BOSONDJO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE ET DEVELOPPEMENT DE KAMANA ",
    "type_etablissment": "Public"
  },
  {
    "code": "ISCTK",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET DES TECHNIQUES DE KABINDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-TSHIOFA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE TSHIOFA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM LUBAO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LUBAO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP KAMANA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KAMANA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP MPEGEI",
    "name": "INSTITUT SUPERIEUR PEDAGOGOIQUE DE MPEGEI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV KINSENGWA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRE DE KINSENGWA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM DE TSHIOFA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES TSHIOFA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIV",
    "name": "UNIVERSITE LAURENT DESIRE KABILA DE LUBAO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTIA-K",
    "name": "INSTITUT SUPERIEUR TECHNIQUE D'INFORMATIQUE APPLIQUE DE KABINDA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC DE KABINDA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE KABINDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC LOMAMI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE LOMAMI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISETM DE NGANDAJIKA",
    "name": "INSTITUT SUPERIEUR D'ENSEIGNEMENT TECHNIQUES MEDICALES NGADAJIKA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ITIA DE KABINDA",
    "name": "INSTITUT TECHNIQUES INFORMATIOQUES APPLIQUEES DE KABINDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDAD DE KAMIJI",
    "name": "INSTITUT SUPERIEUR DES AFFAIRES ET DE DEVELOPPEMENT DE KAMIJI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP LUPUTA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE LUPUTA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-WIKONGE",
    "name": "INSTITUT SUPERIEUR TECNIQUES MEDICALES  WIKONG",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR LUPUTA",
    "name": "INSTITUT SUPERIEUR DEVELOPPEMENT RURAL DE LUPUTA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIV DE NGANDAJIKA",
    "name": "UNIVERSITE DE NGANDAJIKA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSM DE NGANDAJIKA",
    "name": "INSTITUT SUPERIEUR DE SCIENCES MEDICALE DE NGADAJIKA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR DE COMMENCE DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-TSHILENGE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE TSHILENGE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-MIABI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MIABI",
    "type_etablissment": "Public"
  },
  {
    "code": "UNITSHI",
    "name": "UNIVERSITE DE TSHILENGE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPCC",
    "name": "UNIVERSITE PROTESTANTE AU COEUR DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-LUABO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUABO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-KANTSHI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE KANTSHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMCR",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LA CROIX ROUGE DE MBUJI-MAYI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-M",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE MBUJI-MAYI (PRIVE)",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISMD",
    "name": "INSTITUT SUPERIEUR DE MANAGEMENT ET DE DEVELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTCI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES COMMERCIALES ET INFIRMIERES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAU MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR D'ARCHITECTURE  ET URBANISME DE MBUJI-MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTIA MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR TECHNIQUE D'INFORMATIQUE APPLIQUE DE MBUJI-MAYI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KENGE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES KENGE II",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-KINDI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE -KINDI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-MISELE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE MISELE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-PONT KWANGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE PONT KWANGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSCD",
    "name": "INSTITUT SUPERIEUR DES SCIENCES COMMERCIALES DE DINGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDCR",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT COMMUNAUTAIRE ET RURAL",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-MULUNDU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MULUNDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISKTM",
    "name": "ISKTM DE KENGE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-KENGE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KENGE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULIKO",
    "name": "UNIVERSITE LIBRE DE KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UMKOL",
    "name": "UNIVERSITE  METHODISTE DE KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UTBU",
    "name": "UNIVERSITE TECHNOLOGIQUE DE BUNKEYA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPKOL",
    "name": "UNIVERSITE PEDAGOGIQUE DE KOLWEZI",
    "type_etablissment": "Public"
  },
  {
    "code": "USKK",
    "name": "UNIVERSITE SIMON KIMBANGU DE KINSHASA A KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCKK",
    "name": "UNIVERSITE DU CEPROMAD DE KINSHASA A KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UACCK",
    "name": "UNIVERSITE AFRICAINE COMMUNAUTAIRE DU CONGO A KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUCK",
    "name": "INSTITUT UNIVERSITAIRE DU CONGO A KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ITCK",
    "name": "INSTITUT TECHNIQUE COMMERCIAL DE KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTCK",
    "name": "INSTITUT SUPERIEUR TECHNIQUE ET DE COMMUNICATION A KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ESIL",
    "name": "ECOLE SUPERIEURE D'INFORMATIQUE DU LUALABA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBD",
    "name": "UNIVERSITE BIOSADEC DE DILOLO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNOK",
    "name": "UNIVERSITE DES NOUVELLES OPPORTUNITES DE KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIMA",
    "name": "UNIVERSITE DE MANONO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-ANKORO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'ABKORO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISHP-KALEMIE",
    "name": "INSTITUT SUPERIEUR D'HYDROLOGIE ET PECHE DE KALEMIE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-KALEMIE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL - KALEMIE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KONGOLO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - KONGOLO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-KATEA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE - KATEA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTEMA",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE EVANGELIQUE DE MANONO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UMM",
    "name": "UNIVERSITE METHODISTE DE MUSIUMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULACK",
    "name": "UNIVERSITE LIBRE DE L'AFRIQUE CENTRALE DE KALEMIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPL-KALEMIE",
    "name": "UNIVERSITE PATRICE EMERY LUMUMBA - KALEMIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-MOBA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE - MOBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSIK",
    "name": "INSTITUT SUPERIEUR DE SCIENCES INFIRMIERES DE KALEMIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSCR",
    "name": "INSTITUT SUPERIEUR  DES SCIENCES DE SANTE DE CROIX-ROUGE DE KALEMIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UILCK",
    "name": "UNIVERSITE INDEPENDANTE ET LIBRE DU CONGO-KALEMIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UT",
    "name": "UNIVERSITE DE TANGANYIKA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJK",
    "name": "UNIVERSITE SAINT JOSEPH DE KALEMIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUC",
    "name": "INSTITUT UNIVERSITAIRE DU CONGO/KALEMIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUC-MOBA",
    "name": "INSTITUT UNIVERSITAIRE DU CONGO-MOBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-YAHUMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE YAHUMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BAFWASENDE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE - BAFWASENDE",
    "type_etablissment": "Public"
  },
  {
    "code": "EPA-UNIKIS",
    "name": "ECOLE DE PECHE ET D'AQUACULTURE DE L'UNIKIS",
    "type_etablissment": "Public"
  },
  {
    "code": "FUB",
    "name": "FACULTE UNIVERSITAIRE  DE BAMBELOTA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISIG-KIS",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTDC",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE ET DE DEVELOPPEMENT COMMUNAUTAIRE DE YAKUSU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCK",
    "name": "UNIVERSITE CATHOLIQUE DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULKIS",
    "name": "UNIVERSITE LIBRE DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCE-KISANGANI",
    "name": "UNIVERSITE DE CEPROMAD DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-KISANGANI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "USA-KIS",
    "name": "UNIVERSITE DES SCIENCES APPLIQUEES DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-MILLENAIRE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - MILLINAIRE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-CEPROMAD",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  CEPROMAD-KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-YANGAMBI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE - YANGAMBI",
    "type_etablissment": "Public"
  },
  {
    "code": "UBK",
    "name": "UNIVERSITE BUTRAD DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCW",
    "name": "UNIVERSITE DES CHUTES DE WAGANIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCAS",
    "name": "INSTITUT SUPERIEUR DES CADRES DE SANTE DE YANGAMBI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ESCF",
    "name": "ECOLE SUPERIEUR DE COMMERCE ET DE FINANCE",
    "type_etablissment": "Public"
  },
  {
    "code": "UNAPIS",
    "name": "UNIVERSITE NATIONALE DE PETROLE, INFORMATIQUE ET STATISTIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "USK-KIS",
    "name": "UNIVERSITE SIMON KIMBANGU DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UMJW-KIS",
    "name": "UNIVERSITE METHODISTE JOHN WISLEY",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-AMADI POKO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL AMADI A POKO",
    "type_etablissment": "Public"
  },
  {
    "code": "UBU-BUTA",
    "name": "UNIVERSITE DE BAS-UELE DE BUTA",
    "type_etablissment": "Privé"
  },
  {
    "code": "IBTP-BUTA",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE BUTA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-BUTA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BUTA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPCN",
    "name": "UNIVERSITE PROTESTANTE DU CONGO-NORD",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-BUTA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE BUTA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-DINGILA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE DINGILA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UK",
    "name": "UNIVERSITE DE KABONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UMKK",
    "name": "UNIVERSITE METHODISTE DE KABONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSS-KAMINA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES DE SANTE DE KAMINA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-BUKAMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BUKAMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-KABONDO-DIANDA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KABONDO-DIANA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KIKONDJA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIKONDJA",
    "type_etablissment": "Privé"
  },
  {
    "code": "FATHEKA",
    "name": "FACULTETHEOLOGIQUE DE KAMINA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMMM",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES METHODISTE DE MALEMBA NKULU",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFAV",
    "name": "IFAV",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDP-KABONGO",
    "name": "INSTITUT SUPERIEUR DE PECHE DE KABONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "EPAU",
    "name": "ECOLE DE PECHE ET D'AQUACULTURE DE L'UNILU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM/KAMUESHA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAMUESHA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM/BULAPE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES BULAPE",
    "type_etablissment": "Public"
  },
  {
    "code": "UKAM",
    "name": "UNIVERSITE KAM Ã  TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULK-O",
    "name": "UNIVERSITÃ‰ LIBRE DE KASAI-OUEST Ã  TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/KABAMBAIE",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE DE  KABAMBAIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR D'ARTS ET MÉTIERS DE DE TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNI-KAM",
    "name": "UNIVERSITEZ DE KAMONIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR/LUKIBU",
    "name": "INSTITUT SUPERIEUR DE DÃ‰VELOPPEMENT RURAL DE LUKIBU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-LUKIBU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES LUKIBU  ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KAMONIA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES KAMONIA  ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-NYANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES NYANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE ET TECHNIQUE DE TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSM-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES MÃ‰DICALES DE TSHIKAPA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEA-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR D’ÉTUDES AGRONOMIQUES DE TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-BUNIA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  DE BUNIA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MAHAGI",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE DE  MAHAGI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MAMBASA",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE DE MAMBASA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIV-MB",
    "name": "UNIVERSITÃ‰ MONT-BLEU",
    "type_etablissment": "Privé"
  },
  {
    "code": "USA",
    "name": "UNIVERSITE SALAMA DE ARU",
    "type_etablissment": "Privé"
  },
  {
    "code": "USB",
    "name": "UNIVERSITE SAINT-PIERRE DE BUNIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "U C A ",
    "name": "UNIVERSITE DU CEPROMAD ARU",
    "type_etablissment": "Privé"
  },
  {
    "code": "GSSCB",
    "name": "GRAND SÉMINAIRE DE SAINT CYPRIEN DE BUNIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-MAHAGI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MAHAGI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAS-MAHAGI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES D'ANIMATION SOCIALE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT/RETHY DE ITURI",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE ET  TECHNIQUE  RETHY DE ITURI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT IGB WOKOLO",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE ET TECHNIQUE IGB WOKOLO ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP CECA-20",
    "name": "INSTITUT SUPERIEUR DE PÃ‰DAGOGIE  CECA-20",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-GETY",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE GETY",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-BIAKATO",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE   BIAKATO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSIGE-BUNIA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES INFORMATIQUES ET DE GESTION",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSR",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES JOSEPH MUKASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "IBTP-BUNIA",
    "name": "INSTITUT SUPERIEUR DES BÃ‚TIMENTS ET TRAVAUX PUBLIQUES-BUNIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-BUNIA",
    "name": "INSTITUT SUPERIEUR DE DÃ‰VELOPPEMENT RURAL DE BUNIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEPI",
    "name": "UNIVERSITÃ‰ Ã‰VANGÃ‰LIQUE POUR LE PROGRÃˆS EN NITURI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEA",
    "name": "UNIVERSITÃ‰ Ã‰VANGÃ‰LIQUE DE ARU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-KOMANDA",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE DE KOMANDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-NIANIA",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE DE NIANIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDD-BUNIA",
    "name": "INSTITUT SUPERIEUR DE DÃ‰VELOPPEMENT DURABLE DE BUNIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-ARIWARA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES D'ARIWXARA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAD NIANIA",
    "name": "INSTITUT SUPERIEUR ADMINISTRATION ET DÉVELOPPEMENT DE NIANIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ESP/KIN",
    "name": "ECOLE DE SANTE PUBLIQUE DE KINSHASA",
    "type_etablissment": "Public"
  },
  {
    "code": "INTS",
    "name": "INSTITUT NATIONAL DU TRAVAIL SOCIAL",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP KITSHANGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KITSHANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP MASEREKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MASEREKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM MASISI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MASISI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM",
    "name": "INSTITUT SUPOERIEUR DES TECHNIQUES MEDICALES DE RUTSHURU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM  WALIKALE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE  WALIKALE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTOU GOMA",
    "name": "INSTITUT SUPERIEUR DE TOURISME DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISSR-D",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES ET DE DÃ‰VELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM DE KAYNA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAYNA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTMM",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ET MANAGEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIP",
    "name": "UNIVERSITÉ DU PLATEAU ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULPA",
    "name": "UNIVERSITÉ LIBRE PROTESTANTE D'AFRIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAPT DE KYAVINYONG",
    "name": "INSTITUT SUPERIEUR TECHNIQUE D'AQUACULTURE.DE PECHE ET DE TOURISME DE KYAVINYONGE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTY",
    "name": "INSTITUT  SUPERIEUR  TECHNIQUE DE NGALIEMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEAVF BUTEMBO",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VERIRINAIRES FORESTIERES DE BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "AFRAC",
    "name": "AFRICAN  RESEARCH AND  ACTION INSTITUT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPG",
    "name": "INSTITUT SUPERIEUR DE PECHE DE GOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "IST-K",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "CAFES",
    "name": "CENTRE AFRICAIN DE FORMATION DES EDUCATEURS SOCIAUX",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCG-BUTEMBO",
    "name": "UNIVERSITE CATHOLIQUE DE GRABEN DE BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ERNI",
    "name": "ECOLE REGIONALE  DE LA NAVIGATION INTERIEUR",
    "type_etablissment": "Privé"
  },
  {
    "code": "ESMK",
    "name": "ECOLE SUPERIEUR DE MANAGEMENT DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCNDK DE KASUGHO",
    "name": "UNIVERSITE DE CONSERVATION DE LA NATURE ET DE DEVELOPPEMENT DE KASUGHO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ENACTI-KIN",
    "name": "ECOLE NATIONALE DE CADASTRE ET TITRES IMMOBILIERS DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFADC",
    "name": "INSTITUT FACULTAIRE DES ASSEMBLÉES DE DIEU AU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAC ",
    "name": "UNIVERSITE DE L'ASSOMPTION DU CONGO( UAC EX-INSTITUT SUPERIEUR EMMANUEL D'ALZON DE BUTEMBO )",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPMM",
    "name": "UNIVERSITE PIC MARGERITA DE MWENDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM/ FRANCO AMERICA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES FRANCO AMERICAIN ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM DON PETIT PETIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES DON PETIT PETIT",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCBC-BENI",
    "name": "UNIVERSITE CHRETIENNE BILINGUE DU CONGO UCBC",
    "type_etablissment": "Privé"
  },
  {
    "code": "UDMAZ",
    "name": "UNIVERSITÃ‰ DE MAZENOD",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULPGL DE BUTEMBO",
    "name": "UNIVERSITE LIBRE DES PAYS DES GRANDS LACS DE BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPM",
    "name": "UNIVERSITÃ‰ PROFESSEUR MUTUMBI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPM",
    "name": "UNIVERSITE PROFESSEUR MUTUMBI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCS DE GOMA",
    "name": "UNIVERSITE CATHOLIQUE LA SAPIENTIA UCS DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTE",
    "name": "INSTITUT SUPERIEUR DE THÉOLOGIE ÉVANGÉLIQUE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTN",
    "name": "INSTITUT SUPERIEUR DE THÃ‰OLOGIE DE NGALIEMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UHTGL DE GOMA",
    "name": "UNIVERSITE DES HAUTES TECHNOLOGIES DES GRABDS LACS A GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDAL",
    "name": "INSTITUT SUPERIEUR DES DOUANES ACCISES ET LOGISTIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UTAB DE BUTUNGERA",
    "name": "UNIVERSITE TECHNOLOGIQUE AFRICAINE DE BUTUNGERA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBC",
    "name": "UNIVERSITE BELGO CONGOLAISE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAC DE BENI",
    "name": "UNIVERSITE DE L'AVENIR DU CONGO DE BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "PUK-E",
    "name": "UNIVERSITÃ‰ PROGRÃˆS DE KINSHASA-EST",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEB DE BENI",
    "name": "UNIVERSITE EVANGELIQUE DE BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UACO",
    "name": "UNIVERSITÃ‰ ADVENTISTE DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPA",
    "name": "UNIVERSITE PROTESTANTE EN AFRIQUE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAAK DE GOMA",
    "name": "UNIVERSITE ANGLICANE APPOLO KIVEBULAYA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAD",
    "name": "UNIVERSITÃ‰ AFRICAINE DE DÃ‰VELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAACB BENI",
    "name": "UNIVERSITE ANGLICANE EN AFRIQUE A BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCDV",
    "name": "UNIVERSITE CHRETIENNE DE VIRUNGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USD",
    "name": "UNIVERSITE SAINT DOMINIQUE DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBADG",
    "name": "UNIVERSITE BILINGUE ANGLICANE DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBADG",
    "name": "UNIVERSITE BILINGUE ANGLICANE DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIGL DE RUTSHURU",
    "name": "UNIVERSITE DES GRANDS LACS DE RUTSHURU DE KIWANJA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSEC",
    "name": "INSTITUT SUPERIEUR D'ETUDES  ECONOMIQUES, JURIDIQUES ET COOPÉRATIVES ",
    "type_etablissment": "Privé"
  },
  {
    "code": "CEPROMAD DE BENI",
    "name": "UNIVERSITE DU CEPROMAD DE BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-FI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET DES FINANCES",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIC BUTEMBO",
    "name": "UNIVERSITE ISLAMIQUE  DU CONGO A BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULD DE BUTEMBO",
    "name": "UNIVERSITE LIBRE DU DEVELOPPEMENT DE BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBC",
    "name": "UNIVERSITE BAPTISTE AU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIDEC MUHANGI",
    "name": "UNIVERSITE DE DEVELOPPEMENT AU CONGO MUHANGI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ESGC",
    "name": "ECOLE SUPERIEUR DE GÉNIE CIVIL DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UTC",
    "name": "UNIVERSITÉ TECHNOLOGIQUE DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNISTECH",
    "name": "UNIVERSITÃ‰  INTERNATIONALE DES SCIENCES DE LA TECHNOLOGIE DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR DE RUTSHURU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE RUTSHURU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR NYIRAGONGO",
    "name": "INSTITUT SUPERIEUR TECHNIQUE ET DEVELOPPEMENT RURAL",
    "type_etablissment": "Privé"
  },
  {
    "code": "U R",
    "name": "UNIVERSITÃ‰ RICHFIELD S.A.",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIECO",
    "name": "UNIVERSITÃ‰ DES EGLISES INDÃ‰PENDANTE DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM/MAMPALA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES DE MAMPALA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISESOD DE GOMA",
    "name": "INSTITUT SUPERIEUR D'ENVIRONNEMENT SOLIDAIRE ET DEVELOPPEMENT DURABLE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCM",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET DE MANAGEMENT DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISGDE",
    "name": "INSTITUT SUPERIEUR DE GESTION ET DE DÃ‰VELOPPEMENT ENDOGÃˆNE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISETM VIRUNGA",
    "name": "INSTITUT SUPERIEUR D'ENSEIGNEMENT TECHNIQUE MEDICALES",
    "type_etablissment": "Privé"
  },
  {
    "code": "INUK",
    "name": "INSTITUT UNIVERSITAIRE DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSCD",
    "name": "INSTITUT SUPERIEUR DES SCIENCES COMMERCIALES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT DE L'ASSOMPTION ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISHAT",
    "name": "INSTITUT SUPERIEUR HOSTELLERIE, ACCUEIL ET TOURISME",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAL",
    "name": "INSTITUT SUPERIEUR TECHNIQUE ADVENTISTE DE LUKANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISOO",
    "name": "INSTITUT SUPERIEUR D'OPHTALMOLOGIE ET D'OPTIQUE DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSS CR GOMA",
    "name": "INSTITUT SUPERIEUR DE SCIENCES DE LA SANTE DE LA BCROIX ROUGE DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCC",
    "name": "UNIVERSITÃ‰ CARTÃ‰SIENNE AU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM DE LUKANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISFC",
    "name": "INSTITUT SUPERIEUR DE LA FAMILLE ET DES COUPLES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTFK",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DU FLEUVE DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP DE KIBIRIZI",
    "name": "INSTRITUT SUPERIEUR PEDAGOGIQUE DE KIBIRIZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ESFL",
    "name": "ECOLE SUPERIEUR DE FORMATION DES LEADERS",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-KIBIRIZI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIRBIRIZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES ET DE DÉVELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSPH DE BUTEMBO",
    "name": "INSTITUT SUPERIEUR DFE SANTE PUBLIQUE HORIZON DE BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISBTM BUTEMBO",
    "name": "INSTITUT SUPERIEUR BAPTISTE DE THEOLOGIE ET DE MISSIOLOGIE A BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFTD",
    "name": "INSTITUT FACULTAIRE DE THÉOLOGIE ET DE DÉVELOPPEMENT DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDEKY",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT ET D''ENTREPRENBARIAT DE KYAVIRUMU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAD BENI",
    "name": "INSTITUT SUPERIEURE DES TECHNIQUES  APPLIQUEES ET DEVELOPPEMENT DE BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTK-KIN",
    "name": "INSTITUT SUPERIEUR TECHNOLOGIQUE DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTDK",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE DEVELOPPEMENT DE KASINDI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSTDD DE MBAU",
    "name": "INSTITUT SUPERIEUR DES SCIENCES TECHNIQUES ET DEVELOPPEMENT DURABLE DE MBAU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSIC",
    "name": "INSTITUT SUPERIEUR DES SCIENCES INFIRMIÃˆRES ET COMMUNAUTAIRE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTGD KASINDI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE GESTION ET DEVELOPPEZMENT DE KASINDI",
    "type_etablissment": "Privé"
  },
  {
    "code": "EHELET",
    "name": "ECOLE DE HAUTES ETUDES EN LEADERSHIP ETHIQUE ET TRANSFORMATION",
    "type_etablissment": "Privé"
  },
  {
    "code": "ECRI-BUTEMBO",
    "name": "ECOLE DE CRIMINOLIE AU SEIN  DE L'UCG BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULDK DE KITSHUKU",
    "name": "UNIVERSITE LIBRE DE DEVELOPPEMENT DE KITSHUKU A BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UFACG DE GOMA",
    "name": "UNIVERSITE DE LA FORETS D'AFRIQUE CENTRALE DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPKI GOMA",
    "name": "UNIVERSITE POLYVENTE DU KIVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAS GOMA",
    "name": "UNIVERSITE DE L'AFRIQUE SUBSAHARIENNE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBIG GOMA",
    "name": "UNIVERSITE BILINGUE INTERNATIONALE DE GOMA UBIG",
    "type_etablissment": "Privé"
  },
  {
    "code": "UC DE OICHA",
    "name": "UNIVERSITE DU CEPROMAD DE OICHA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPG-GOMA",
    "name": "Universite progressiste de Goma campus de MUBI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UB",
    "name": "UFRAGL BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPW",
    "name": "UNIVERSITE DE PAIX DE WALIKALE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCW",
    "name": "UNIVERSITE DU CEPROMAD DE WALIKALE",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJGCR",
    "name": "UNIVERSITE SAINT JOSEPH DE GOMA CAMPUS DE MASISI CENTRE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UASN",
    "name": "UNIVERSITE D'AFRIQUE SUBSAHARIENNE A NIABIONDO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGK",
    "name": "UPROGL GOMA A KITSHNGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGM",
    "name": "UPROGL GOMA A MWESO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGMC",
    "name": "UHTGL GOMA A MASISI CENTRE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGK",
    "name": "UHTGL GOMA A KITSHANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGS",
    "name": "UHTGL GOMA A SAKE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGK",
    "name": "ULKI DE GOMA A KITSHANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCKK",
    "name": "UNIVERSITE COMMUNAUTAIRE DU KIVU NA KIWANJA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UB",
    "name": "UEMA BIAKATO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGCK",
    "name": "UHTL/GL CAMPUS DE KAYNA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UFAC",
    "name": "UNIVERSITE DE FORET EN AFRIQUE CENTRE DE WALIKALE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAD",
    "name": "INSTITUT SUPERIEUR D'Administration et de developpement/ISAD",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIDGEK",
    "name": "Institut Superieur d'Administration et de Developpement et de gestion de l'Environnement /ISIDE de KIWANJA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR NYAKARIBA",
    "name": "INSTITUT SUPERIEUR DE DÃ‰VELOPPEMENT RURAL DE NYAKARIBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAGO",
    "name": "INSTITUT SUPERIEUR ALPHA DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTDM",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE DÃ‰VELOPPEMENT  ET DE MANAGEMENT DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST-M ",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES ET DE MANAGEMENT  DE KIVU Ã  GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISBTP BENI",
    "name": "INSTITUT SUPERIEUR DES BÃ‚TIMENTS ET TRAVAUX PUBLICS DE BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/MBANDAKA",
    "name": "INSTITUT SUPERIEUR DE PECHE DE MBANDAKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM/BASANKUSU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BASANKUSU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM/ PIMO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  DE PIMO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISIETEM",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE, D'ENSEIGNEMENT ET DES TECHNIQUES MÃ‰DICALES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM NYIRAGONGO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES NYIRAGONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM/EQUATEUR",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS/ EQUATEUR",
    "type_etablissment": "Public"
  },
  {
    "code": "UPE/MBANDAKA",
    "name": "UNIVERSITE PROTESTANTE DE L'EQUATEUR",
    "type_etablissment": "Privé"
  },
  {
    "code": "GSJB/ BAMANYA",
    "name": "GRAND SEMINAIRE SAINT JEAN BAPTISTE DE BAMANYA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISED",
    "name": "INSTITUT SUPERIEUR D'ENSEIGNEMENT ET DE DÉVELOPPEMENT DE BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIF/ LUKOLELA",
    "name": "UNIVERSITE DU FLEUVE DE LUKOLELA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/BANDASHA",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE DE BANDASHA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM KASINDI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES  KASINDI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM/ MAKANZA ",
    "name": "INSTITUT SUPERIEUR DES TECHNQUES MEDICALES DE MAKANZA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/MAKANZA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MAKANZA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST/ BASANKUSU",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE BASANKUSU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ITIC/ MBANDAKA",
    "name": "INSTITUT TECHNOLOGIQUE INTERNATIONAL DU CONGO DE MBANDAKA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPKI",
    "name": "ISPKI KASINDI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-BENI",
    "name": "INSTITUT SUPERIEUR DES ARTS ET MÃ‰TIERS DE BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFSSC",
    "name": "INSTITUT FACULTAIRE DE SCIENCE DE SANTE  CARDINAL ETSOU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ASAF BENI",
    "name": "ASAF BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/ BASANKUSU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BASANKUSU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPTGL",
    "name": "ISPTGL OICHA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCAF",
    "name": "ISCAF BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSCR/ MBANDAKA",
    "name": "INSTITUT SUPERIEUR SCIENCE DE SANTE DE LA CROIX ROUGE DE MBANDAKA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTCB",
    "name": "ISTCB BENI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/ BOLOMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOLOMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTC",
    "name": "ISTC KYAVINYONGE",
    "type_etablissment": "Privé"
  },
  {
    "code": "SIST",
    "name": "SHAEL INSTITUT DES SCIENCES ET DE TECHNOLOGIE DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP KABAYA",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE DE KABAYA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD GOMA MASISI",
    "name": "INSTITUT SUPERIEUR DES  TECHNIQUES DE DÃ‰VELOPPEMENT DE GOMA  A MASISI CENTRE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIV/UELE",
    "name": "UNIVERSITE DE L'UELE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAVF",
    "name": "ISEAVF  KASHURU A KITSHANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT KATSHANGA",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE ET TECHNIQUE DE KATSHANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "CU/WAMBA",
    "name": "CENTRE UNIVERSITAIRE DE WAMBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP BAMBO",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE DE BAMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCG",
    "name": "INSTITUT SUPERIEUR DE COMMUNICATION ET DE GESTION",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAV-G",
    "name": "INSTITUT SUPERIEUR DE L'AUDIOVISUEL DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIDR/ MAKORO",
    "name": "INSTITUT SUPERIEUR DES DEVELOPPEMENT RURAL DE MAKORO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISCA-G",
    "name": "INSTITUT SUPERIEUR DE CHIMIE APPLIQUÃ‰E DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/KAMANGO",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE DE KAMANGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/ FA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE FARADJE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP BUTEMBO",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE DE BUTEMBO",
    "type_etablissment": "Public"
  },
  {
    "code": "UPROGEL",
    "name": "UNIVERSITÃ‰ PROGRESSISTE DES GRANDS LACS",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISM-GL",
    "name": "INSTITUT SUPERIEUR DE MANAGEMENT DES GRANDS LACS ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-GL",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES  DES GRANDS LACS  DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPALE/ TADU",
    "name": "INSTITUT SUPERIEUR  PRINCE AMANI DES SCIENCES DE LA LOGISTIQUE ET ENTREPRENARIAT DE TADU ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBCA/ DUNGU",
    "name": "UNIVERSITE BATISSONS L'ESPOIR DE DUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "C UNIV DE MINEMBWE",
    "name": "CENTRE UNIVERSITAIRE DE MINEMBWE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP KABARE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KABARE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP UVIRA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  D'UVIRA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP  WALUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP KAZIBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KAZIBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-BUKAVU",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUES MEDICALES DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM FIZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE FIZI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM SHABUNDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE SHABUNDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM UVIRA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'UVIRA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAVC MINEMBWE",
    "name": "INSTITUT SUPERIEUR AVC DE MINEMBWE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR BARAKA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR KAZIBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KAZIBA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA MUSHWESHWE",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE WALUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISACN DE MINEMBWE",
    "name": "INSTITUT SUPERIEUR AGROVERTERINAIRE ET CONSERVATION DE LA NATURE DE MINEMBWE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISAFGE DE KAHUZI BIE",
    "name": "INSTITUT SUPERIEUR AGRO FORESTERIE ET DE GESTION DE L'ENVIRONNEMENT DE KAHUZI BIEGA",
    "type_etablissment": "Public"
  },
  {
    "code": "IBTP KAMITUGA",
    "name": "INSTITUT DE BATIMENT DE TRAVAUX PUBLIC",
    "type_etablissment": "Public"
  },
  {
    "code": "EDAP/ISP KAZIBA",
    "name": "ECOLE D'APPLICATION D'INSTITUIT SUPERIEUR PEDAGOGIQUE DE KAZIBA",
    "type_etablissment": "Public"
  },
  {
    "code": "UDD DE L'AFRIQUE CEN",
    "name": "UNIVERSITE DE DEVELOPPEMENT DURABLE DE L'AFRIQUE CENTRAL DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISECOP DE BUKAVU",
    "name": "INSTITUT SUPERIEUR D'ETUDES COMMERCIALES ET FINANCIERES DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIV CEPROMAD DE BUK",
    "name": "UNIVERSITE CEPROMAD DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPF DE BUKAVU",
    "name": "INSTITUT SUPERIEUR DE PASTORALE FAMILLIALE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNEI DE BUKAVU",
    "name": "UNIVERSITE NATIONALE DES EGLISES INDEPENDANTES DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISM D'UVIRA A BUKAVU",
    "name": "INSTITUIT SUPERIEUR DE MANAGEMENT D'UVIRA A BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPDE DE BUKAVU",
    "name": "INSTITUIT SUPERIEUR POUR LA PROMOTION DE PAIX,DU DEVELOPPEMENT ET DE L'ENVIRONNEMENT  DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNDT A UVIRA",
    "name": "UNIVERSITE NOTRE DAME DE TANGANYIKA A UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULB DE BUKAVU",
    "name": "UNIVERSITE LUTHERIENNE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD BUKAVU",
    "name": "INSTITIUT SUPERIEUR DES TECHNIQUES ET DEVELOPPEMENT DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPD DE BUKAVU",
    "name": "INSTITUT SUPERIEUR POUR LA PROMOTION DU DEVELOPPEMENT DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTCE DE BUKAVU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES COMMERCIALES ET ECONOMIQUES DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDP DE KALEHE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT ET DU PROGRES DE KALEHE",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFSD DE MWENGA A KAM",
    "name": "INSTITUT FACULTAIRE DES SCIENCES DE DEVELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCDR DE KALEHE A MI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET DE DEVELOPPEMENT RURAL DE KALEHE A MINOVA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSR DE BUKAVU",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTB",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE LA FONDATION BITAKWIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KIMB-BUKAVU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUE MEDICALES KIMBANGUISTE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBERLI DE BUKAVU",
    "name": "UNIVERSITE B ERLI DE BUKAVU ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULM DE MWENGA",
    "name": "UNIVERSITE LIBRE DE MWENGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEC A BARAKA",
    "name": "UNIVERSITE ESPOIR DU CONGO A BARAKA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIKAZ DE KAZIBA",
    "name": "UNIVERSITE DE KAZIBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAEGL",
    "name": "UNIVERSITE D'EXCELLENCE POUR L'AFRIQUE DES GRANDS LACS",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULINDI DE KAMITUGA",
    "name": "UNIVERSITE DU BASSIN D'ULINDI DE KAMITUGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UINIRE DE BUKAVU",
    "name": "UNIVERSITE INTERNALE NANGO ISHINGWA DE LA RENNAISSANCE EVANGELIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISGM UVIRA",
    "name": "INSTITUT SUPERIEUR DE GESTION ET DU MANAGEMENT  D'UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPEA",
    "name": "UNIVERSITE PROTESTANTE EVANGELIQUE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTEK",
    "name": "INSTITUT SUPERIEUR THEOLOGIE EVANGELIQUE AU KIVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "BIOSADEC DE BUKAVU",
    "name": "UNIVERSITE BIOSADEC DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UHTGL A KALAMBO",
    "name": "UNIVERSITE DES HAUTES TECHNOLOGIES DE GRANDS LACS A KALAMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCL DE FIZI",
    "name": "UNIVERSITE CATHOLIQUE DE LION DE FIZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMD DE VAMARO",
    "name": "INSTITUT SUPERIEUR DE TECCHNIQUE DE MANAGEMENT ET DEVELOPPEMENT DE VAMARO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIVT DE BUKAVU",
    "name": "UNIVERSITE DE LA TROPE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UOF DE BARAKA",
    "name": "UNIVERSITE OFFICIELLE DE FIZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPA DE BUKAVU",
    "name": "UNIVERSITE DE PAIX AFRIQUE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "USK A BUKAVU",
    "name": "UNIVERSITE SAVANTE DU KIVU A BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UA DE BUKAVU",
    "name": "UNIVERSITE DE ADASCO DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULK DE BUKAVU",
    "name": "UNIVERSITE LUTHER KING DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJ DE GOMA A SHABUN",
    "name": "UNIVERSITE SAINT JOSEPH DE GOMA A SHABUN?DA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJGU",
    "name": "UNIVERSITE SAINT JOSEPH DE GOMA A UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJGB",
    "name": "UNIVERSITE SAINT JOSEPH DE GOMA A BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEECI",
    "name": "INSTITUT SUPERIEUR D'ETUDES ECONOMIQUES ET COOPERATUVES/ISEC DE NYANGEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPEU",
    "name": "INSTITUT SUPERIEUR DE PECHE/ISPE D'UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEC",
    "name": "INSTITUT SUPERIEUR D'ECOLOGIE ET DE CONSERVATION DE LA NATURE DE KATANA EXTENSION DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISINM",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE DE MURESA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULBC",
    "name": "UNIVERSITE LIBRE BAPTISTE AU CONGO/ULBC A UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UECA",
    "name": "UNIVERSITE EPISCOPALE CHARISMATIQUE EN AFRIQUE DE BUKAVU ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPPKB",
    "name": "UNIVERSITE POUR LE PROGRÃˆS DU KIVU A BUKAVU ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPB",
    "name": "UNIVERSITE DE PROXIMITÃ‰ DE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM KIMPESE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIMPESE",
    "type_etablissment": "Public"
  },
  {
    "code": "ULJNB",
    "name": "UNIVERSITE LIBRE JULIUS NYERERE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM KISANTU",
    "name": "INSTITUT SUPERIUR DES TECHNIQUES MEDICALES DE KISANTU",
    "type_etablissment": "Public"
  },
  {
    "code": "URBK",
    "name": "UNIVERSITE ROI BAUDOIN DE KADUTA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UII",
    "name": "UNIVERSITE INTERNATIONALE D'ITIMBWE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULVM",
    "name": "UNIVERSITE LIBRE DES VOLCANS DE MINOVA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR KINZAUMVUETE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL KINZAUMVUETE",
    "type_etablissment": "Public"
  },
  {
    "code": "ULDACB",
    "name": "UNIVERSITE LIBRE DE DÃ‰VELOPPEMENT EN AFRIQUE CENTRAL DE BUKAVU ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPP",
    "name": "UNIVERSITE PANAFRICAINE DE PAIX (UPP) d'UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULUGL",
    "name": "UNIVERSITE LIBRE D'UVIRA ET DE GRANDS LACS/ULUGL",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBC",
    "name": "UNIVERSITE DE BUKAVU CENTRE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCM DU MAYOMBE ",
    "name": "UNIVERSITE COMMUNAUTAIRE DU MAYOMBE",
    "type_etablissment": "Privé"
  },
  {
    "code": "USPI",
    "name": "UNIVERSITE SAINT PERE D'IDJWI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UACB",
    "name": "UNIVERSITE AFRICAINE AU CONGO A BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCPROMAD MOANDA",
    "name": "UNIVERSITE DU CEPROMAD MOANDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UKGK",
    "name": "UNIVERSITE DU KIVU DE GOMA A BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCU",
    "name": "UNIVERSITE CHRETIENNE D'UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBC DE KIKONGO",
    "name": "UNIVERSITE BAPTISTE AU CONGO DE KIKONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNVC",
    "name": "UNIVERSITE  NOUVELLE VISION INTERNATIONALE DU KIVU  ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULB",
    "name": "UNIVERSITE LUMUMBA DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNDM DE MATADI",
    "name": "UNIVERSITE NOTRE DAME D'AFRIQUE DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNAK",
    "name": "UNIVERSITE DE LA NOUVELLE ACADEMIE DU KIVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UFB",
    "name": "UNIVERSITE FONDATION BITAKWIRA/UFB A UVIRA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNDM DE MOANDA",
    "name": "UNIVERSITE NOTRE DAME D'AFRIQUE DE MOANDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "FBN UU",
    "name": "FBN UNIVERSITY OF UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNILIC MATADI",
    "name": "UNIVERSITE LIBRE DE LA RDC A MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIMA",
    "name": "UNIVERSITE DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCKIM",
    "name": "UNIVERSITE CHRETIENNE  DE KIMPESE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIFA MATADI",
    "name": "UNIVERSITE FRANCOPHONE D'AFRIQUE DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEK",
    "name": "UNIVERSITE DE L'EXCELLENCE DE KAMANYOLA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP INKISI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D'INKISI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPPS",
    "name": "UNIVERSITE POUR LE PROGRES DE SHABUNDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM MATADI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM MATADI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMG BOMA",
    "name": "IINSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ET GESTION ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCU",
    "name": "UNIVERSITE COMMUNAUTAIRE D'UVIRA /UCU",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST-BOMA",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE BOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGLA",
    "name": "UNIVERSITE DE GRANDS LACS AFRICAINS D'uvira ",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUEFD DE BANZA NGUNG",
    "name": "INSTITUT UNIVERSITAIRE D'ETUDES DE FORMATION ET DE DEVELOPPEMENT/IUEFD DE BANZ NGUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTACHA KIMPESE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUEES ET CHIMIE AGRO-ALIMENTAIRE/KIMPESE",
    "type_etablissment": "Privé"
  },
  {
    "code": "MKU-RUZIZI",
    "name": "MONT KENYA UNIVERSITY RUZIZICAMPUS OF BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIPA/MATADI",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ,PROGRAMMATION ET ANALYSE DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM DE LUOZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  DE  LUOZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAC DE MBANZA NGUN",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES  APPLIQUEES ET COMMERCIALES DE MBANZA NGUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMG DE MOANDA ",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ET DE GESTION/ISTMG",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD DE KIKONDA",
    "name": "INSTITUT DUPERIEUR DES TECHNIQUES DE DEVELOPPEMENT DE KIKONDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "BAGIRA",
    "name": "BAGIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-GL DE BUKAVU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES  DES GRAND LACS DE GOMA A BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMAK",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES ET DE MANAGEMENT DU KIVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISETC MOANDA",
    "name": "INSTITUT SUPERIEUR D'ETUDES TECHNIQUES ET COMMERCIALES DE LOANDA /DE MOANDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISI BUKAVU",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISITA MATADI",
    "name": "INSTITUT SUPERIEUR INFORMATIQUE ET DES TECHNIQUES APPLIQUEES DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEDAF",
    "name": "INSTITUT SUPERIEUR D’ÉDUCATION ET DÉVELOPPEMENT AGRICOLE ET FORESTIER",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISITA",
    "name": "INSTITUT SUPERIEUR INFORMATIQUE ET DES TECHNIQUES DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISADEF",
    "name": "INSTITUT SUPERIEUR D'ÉTUDE ET DEVELOPPEMENT AGRICOLE ET FORESTIER DE KALONGE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPG/MOANDA",
    "name": "INSTITUT SUPERIEUR DU PETROL ET DU GAZ /MOANDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISA",
    "name": "INSTITUT SUPERIEUR D'AUDIOVISUEL ",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST-BUKAVU",
    "name": "INSTITUT SUPERIEUR  TECHNIQUE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTC /MATADI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES COMMERCIALES ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTTMN DE NZOBE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE NZOBE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTS BUKAVU",
    "name": "INSTITUT SUPERIEUR  TECHNIQUE ET SOCIAL DE GOMA A BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSCR MATADI",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUES DE SCIENCES DE SANTE DE LA CROIX -ROUGE DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISFAD BUKAVU",
    "name": "INSTITUT SUPERIEUR DES FINANCES D'ADMINISTRATION ET DES DOUANES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISMD-AFRIQUE",
    "name": "INSTITUT SUPERIEUR DE MANAGEMENT DE L'AFRIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR DU KIVU/D",
    "name": "INSTITUT SUPERIEUR DE DÃ‰VELOPPEMENT RURAL DU KIVU/D",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR KIVU/B",
    "name": "INSTITUT SUPERIEUR DE DÃ‰VELOPPEMENT  RURAL DE KIVU BRUR",
    "type_etablissment": "Public"
  },
  {
    "code": "ISA UVIRA",
    "name": "INSTITUT SUPERIEUR D'AFRIQUE A UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTU",
    "name": "INSTITUT SUPERIEUR TECHNOLOGIQUE D'UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCA/BOMA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET D'ADMINISTRATION DE BOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISBT",
    "name": "INTERNATIONAL SCHOOL OF BUSINESS, TECHNOLOGY OF BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM KAMITUGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES  KAMITUGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM Pro-santÃ©",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ISTM -Pro-SantÃ© de kisantu",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEA UVIRA",
    "name": "INSTITUT SUPERIEUR  D'ETUDES AGRONOMIQUES D'UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCGD/KISANTU",
    "name": "INSTITUT SUPERIEUR CATHOLIQUE DE GESTION ET DE DEVELOPPEMENT  DE KISANTU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISKB",
    "name": "INSTITUT  SUPERIEUR DE KIVU A BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDU/K",
    "name": "INSTITUT SUPERIEUR DE DÃ‰VELOPPEMENT URBAIN DE KADUTU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSI-MATADI",
    "name": "INSTITUT SUPERIEUR DES SCIENCES INFIRMIERES DE MATADI ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPRA/K",
    "name": "INSTITUT SUPERIEUR DE PAYS RÃ‰GIONAUX EN AFRIQUE DE KAMITUGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UGK/BUKAVU",
    "name": "UNIVERSITE DU GRAND KIVU DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIGL/BOMA",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DE BOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UFGL/B",
    "name": "UNIVERSITE FRANCOPHONE  DE GRANDS LACS DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UFU",
    "name": "UNIVERSITE FRANCOPHONE D'UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIGL/LUKULA",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DE LUKULAA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTC/KIMPESE ",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES ET COMMERCIALE DE KIMPESE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTGD/KIMPESE",
    "name": "INSTITUT SUPERIEUR DES TECHENIQUES DE GESTION ET DE DEVELOPPEMENT/KIMPESE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCGD/KIMPESE",
    "name": "INSTITUT SUPERIEUR CATHOLIQUE DE GESTION ET DE DEVELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSD/UNADIC",
    "name": "INSTITUT SUPERIEUR SCIENCES DE SANTE ET DE DEVELOPPEMENT DE KASANGULU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPG/KISANTU",
    "name": "INSTITUT SUPERIEUR DE PETROLE ET DE GAZ DE KASAVUBU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCEPROM/KISANTU",
    "name": "UNIVERSITE DU CEPROMAD KISANTU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCEPRO/BOMA",
    "name": "UNIVERSITE DU CEPROMAD BOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIV MALONDA",
    "name": "UNIVERSITE MALONDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSA LUOZI",
    "name": "ISSA LUOZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEMIC LUOZI",
    "name": "ISEMIC LUOZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-MATADI",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC-LUOZI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  DE LUOZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULK MOANDA",
    "name": "ULK MOANDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPT LIKASI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE LIKASI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-LIKASI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LIKASI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP MITWABA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MITWABA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM MITWABA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MITWABA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNH",
    "name": "UNIVERSITE NOUVEAUX HORISONS ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIV APL",
    "name": "UNIVERSITE ADVENTISTE PHILIP LEMON",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIPAL DE LUBUMBASHI",
    "name": "UNIVERSITE PANAFRICAINE DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSM DE LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES SCIENCES MEDICALES DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ITSS DE LUBUMBASHI",
    "name": "INSTITUT DE THEOLOGIE SAINT JEAN BOSCO DE SALES DE LUBUMBASHI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISJK A KAFUBU",
    "name": "INSTITUT SAINT JEAN BOSCO DE KANSEBULA A KAFUBU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UDBL",
    "name": "UNIVERSITE DON BOSCO DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISNT DE LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES NOUVELLES TECHNOLOGIES DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM BON BERGER ",
    "name": "INSTITUT SUPERIEUR DES  TECHNIQUES MPEDICALES DE BON BERGER",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAM LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUES ,DES ARTS ET METIERS DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTL LUIBUMBASHI",
    "name": "INSTITUT SUPERIEUR TECHNIOQUE DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIA DE LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE APPLIQUEE DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UM DE LUBUMBASHI",
    "name": "UNIVERSITE METHODISTE DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCIC/L'SHI",
    "name": "UNIVERSITE CHRETIENNE INTERPROFESSIONNELLE DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISES DE LIKASI",
    "name": "INSTITUT SUPERIEUR D'ETUDES SOCIALES DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "USV DE LIKASI",
    "name": "UNIVERSITE SOURCE DE VIE DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM DE LIKASI",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUC DE LIKASI",
    "name": "INSTITUT UNIVERSITAIRE DU CONGO DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTIC",
    "name": "INSTITUT SUPERIEUR DES TECHNOLOGIES DE L'INFORMATION ET BDE COMMUNICATION",
    "type_etablissment": "Privé"
  },
  {
    "code": "ESTISC",
    "name": "ECOLE SUPERIEURE DES TECHNIQUES INFORMATIQUES ET SCIENCES COMMERCIALES",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIDEL DE LIKASI",
    "name": "UNIVERSITE DES ELITES DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIV SF",
    "name": "UNIVERSITE SAINT FRANCOIS",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULL ",
    "name": "UNIVERSITE LIBRE DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UC DE LIKASI",
    "name": "UNIVERSITE DU CONGO DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIV DHH",
    "name": "UNIVERSITE DAG HARKJOD",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIV TWIGA",
    "name": "UNIVERSITE TWIGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNILYS",
    "name": "UNIVERSITE ILYS DE LUBUMBASHI ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNCUP",
    "name": "UNIVERSITE CONTEMPORAINE UMOJA PLUS",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIV CEPROMAD DE LIK",
    "name": "UNIVERSITE CEPROMAD DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISS LIKASI",
    "name": "INSTITUT SUPERIEUR DE STATISTIQUES DE LIKASI ",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST DE LIKASI",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUSS",
    "name": "INSTITUT SUPERIEUR DES SCIENCES  DE SANTE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES INFORMATIQUES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUESS APPLIQUEES ET INFORMATIQUES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM DU KATANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DU KATANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "(ISPT NGUYA)",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE TECHNIQUE DE NGUYA (ISPT NGUYA)",
    "type_etablissment": "Privé"
  },
  {
    "code": "(ISC) GEMENA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE (ISC) GEMENA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP LIBENGE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE LIBENGE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP",
    "name": "INSTITUT SUPERIEUR PEDAGAGIQUE (ISP) BANGAKUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIC GEMENA",
    "name": "UNIVERSITE DU CEPROMAD GEMENA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSS C-R GEMENA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES DE SANTE CROIX-ROUGE GEMENA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSRD/LENDISA DE BWA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES ET DE DÃ‰VELOPPEMENT  LENDISA DE BWAMANDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR DONGO",
    "name": "INSTITUT SUPERIEUR DE DÃ‰VELOPPEMENT RURAL DE DONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP KUNGU",
    "name": "INSTITUT SUPERIEUR DE PÃ‰DAGOGIQUE DE KUNGU/NGIRI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM BUDJALA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES  BUDJALA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNI-G",
    "name": "UNIVERSITE DE GEMENA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UK",
    "name": "UNIVERSITE KONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM/G",
    "name": "INSTITUT SUPERIEUR D'ARTS ET MÉTIERS DE GEMENA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR/LENDISA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE  LENDISA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSCR MATADI",
    "name": "INSTITUT SUPERIEUR DE SCIENCE DE SANTE DE LA CROIX-ROUGE DE MATADI ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPGK",
    "name": "INSTITUT SUPERIEUR DE PETROLE ET DE GAZ DE KASAVUBU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTP-TSHIKAPA",
    "name": "INSTITUT PEDAGOGIQUE ET TECHNIQUE  TSHIKAPA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSM-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR DE SCIENCES MEDICALES DE TSHIKAPA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UOKA/ KABINDA ",
    "name": "UNIVERSITE OFFICIELLE DE KABINDA ",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTMM/MWENE-DITU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES MORAVE DE MWENE-DITU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISETM/LUBAO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LUBAO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UA/NGANDAJIKA",
    "name": "UNIVERSITEAPOSTOLIQUE NGANDAJIKA",
    "type_etablissment": "Public"
  },
  {
    "code": "IUC/NGANDAJIKA",
    "name": "INSTITUT UNIVERSITAIRE DU CONGO A  NGANDAJIKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA / NGANDAJIKA",
    "name": "INSTITUT SUPERIEUR D'ENSEIGNEMENT AGRONOMIQUE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM-KIM-KIKWIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES KIMBAGUISTE DE KIKWIT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-MABENGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MABENGA A BAGATA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSD",
    "name": "INSTITUT SUPERIEUR DES SCIENCES ET DU DEVELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISNB",
    "name": "INSTITUT SUPERIEUR NORMAL DE BANATI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPUA",
    "name": "UNIVERSITE PROTESTANTE DE L'UBANGI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-MANZASAYI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE MANZASAYI",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFSSCE",
    "name": "INSTITUT FACUTATAIRE DES SCIENCES DE SANTE CARDINAL ETSHOU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ERAIFT",
    "name": "ECOLE REG.POST.UNIV.INT.FOR.T.TROP.",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP/KAMINA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE KAMINA",
    "type_etablissment": "Public"
  },
  {
    "code": "USK KINSHASA",
    "name": "UNIVERSITE SIMON KIMBANGU DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "GSSAK",
    "name": "GRAND SEMINAIRE SAINT ANDRE KAGGWA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-FAK",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUESA MEDICALES FRANCO AMERICAINE DE KINSHAS",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTS- TSHUMBE",
    "name": "INSTITUT SUPERIEUR  TECHNIQUE LA SAGESSE DE TSHUMBE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTE-K",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE EVANGELIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTE-K",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE EVANGELIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPK",
    "name": "UNIVERSITE PROGRES DE KINSHASA -EST/PUK-E",
    "type_etablissment": "Privé"
  },
  {
    "code": "UACO-K",
    "name": "UNIVERSITE ADVENTISTE DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UND/KINDU",
    "name": "UNIVERSITE NATIONALE DE DECENTRALISATION",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEST/KINDU",
    "name": "UNIVERSITE DES ETUDES SCIENTIFIQUE E TECHNOLOGIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPAG/KINDU",
    "name": "INSTITUT SUPERIEURDE PROGRAMME DES AFFAIRES ET DE GESTION",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KIMBANGUISTE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES KIMBAGUISTE - LISALA",
    "type_etablissment": "Privé"
  },
  {
    "code": "CEPROMAD-BUMBA",
    "name": "UNIVERSITE DU CEPROMAD DE BUMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTD DE DUNGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES  DE DEVELOPPEMENT DE DUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM WATSA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE WATSA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM DE MBUJI",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERDS DE MBUJI MAYI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEA MUKUNGO",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES MUKONGO",
    "type_etablissment": "Public"
  },
  {
    "code": "UM",
    "name": "UNIVERSITE DE MBUJI MAYI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISMD",
    "name": "INSTITUT SUPERIEUR DE MANAGEMENT ET DE DEVELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST-ISIRO",
    "name": "INSTITUT SUPERIEUR TECHNOLOGIQUE D'ISIRO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNI-CEP-ISIRO",
    "name": "UNIVERSITE DU CEPROMAD ISIRO",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST-YAKUSU",
    "name": "INSTITUT SUPERIEUR THEOLOGIQUE DE YAKUSU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBU",
    "name": "UNIVERSITE DU BASSIN DE L'UELE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UFAD",
    "name": "UNIVERSITE FRANCOPHONE AFRICAINE DE DURBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJN",
    "name": "UNIVERSITE SAINT JOSEPH DE NIANGARA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJD",
    "name": "UNIVERSITE SAINT JOSEPH DE DUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJDU",
    "name": "UNIVERSITE SAINT JOSEPH DE DURBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISC/BUTEMBO",
    "name": "INSTITUT SUPERIEUR DE COMMERCE",
    "type_etablissment": "Public"
  },
  {
    "code": "USJW",
    "name": "UNIVERSITE SAINT JOSEPH DE WATSA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCD",
    "name": "UNIVERSITE  DU CEPROMAD DUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCDUR",
    "name": "UNIVERSITE DU CEPROMAD DURBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCN",
    "name": "UNIVERSITE DU CEPROMAD NIANGARA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/KINYATSI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE  KINYATSI",
    "type_etablissment": "Public"
  },
  {
    "code": "UCWA",
    "name": "UNIVERSITE DU CEPROMAD WAMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ICD",
    "name": "ISTM-CEPROMAD-DUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSC-ISIRO",
    "name": "INSTITUT SUPERIEUR DE SCIENCE DE SANTE DE LA CROIX-ROUGE D'ISIRO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEAV-ISIRO",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRE D'ISIRO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPT-DUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE DUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-DUNGU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE DUNGU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR-FARADJE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL - FARADJE ",
    "type_etablissment": "Public"
  },
  {
    "code": "ISEAV-PIMBO",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE PIMO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMK",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES KIBALI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPK",
    "name": "INSTITUT SUPERIEUR POLYVALENT DU KIVU A DURBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEAI-DURBA",
    "name": "INSTITUT SUPERIEUR DES ETUDES AGRONOMIQUES ET INDUSTRIE DE DURBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDI-DURBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT INTERGRAL DE DURBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJI",
    "name": "UNIVERSITE SAINT JOSEPH ISIRO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT INTEGRAL",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR/GL",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DES GRANDS LACS",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR-VOLCAN",
    "name": "INSTITUT SUPERIEUR TECHNIQUE ET DE DEVELOPPEMENT RURAL DU VOLCAN",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST-UHTGL",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUE DE L'UHTGL",
    "type_etablissment": "Privé"
  },
  {
    "code": "(ISSS-CR GOMA)",
    "name": "INSTITUT SUPERIEUR DE SCIENCE DE LA SANTE DE LA Croix Rouge de Goma ",
    "type_etablissment": "Privé"
  },
  {
    "code": "(istgd kasindi)",
    "name": "INSTITUT SUPERIEUR des techniques de gestion et de developpement de kasindi",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISM-BUKAVU",
    "name": "INSTITUIT SUPERIEUR DE MANAGEMENT DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM YAKOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  YAKOMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTE-BUKAVU",
    "name": "INSTITUT SUPERIEURDES TECHNIQUES DE L'EST DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UN-EG",
    "name": "UNIVERSITE DU NORD-EQUATEUR A GBADOLITE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIBO",
    "name": "UNIVERSITE BOBOZO/UNIBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISFC-B",
    "name": "INSTITUT SUPERIEURDE FINANCE ET DE COMMERCE DE BAGIRA A BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDIG",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT INKE DE GBADOLITE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/ABUZI",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE D'ABUZI (ISP/ABUZI) A YAKOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMLB",
    "name": "INSTITUT SUPERIEUR  DE TECHNIQUE MÉDICALE LOKAME DE BUSINGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMW",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUES MEDICALES (ISTM) WAPINDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMB",
    "name": "INSTITUT SUPERIEUR TECHNIQUES MEDICALES (ISTM) BILI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPB",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE (ISP) BOKADA",
    "type_etablissment": "Privé"
  },
  {
    "code": "IBTPG",
    "name": "IBTP GBADOLITE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMDDG",
    "name": "ISTITUT SUPERIEUR DES TECHNIQUES MEDICALES (ISTM) DON DE DIEU DE GBADOLITE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UU",
    "name": "UNIVERSITE DE L'Ubangi",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPW",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE WAPINDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPK",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE KOTAKOLI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPB",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE BODANGABO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTMB",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES DE BODANGABO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPND",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE NDUBULU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISPYB",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE DE YAKOMA, extension de BIRA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-YAKOMA YUYU",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE YAKOMA , extension de YUYU",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-YAKOMA KANDO",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE YAKOMA, extension de KANDO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-YAKOMA NGBONGBO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE YAKOMA, extension de NGBONGBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-ABUZI WAPINDA",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE ABUZI, extension de WAPINDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-ABUZI BWATO",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE ABUZI, extension de BWATO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-ABUZI GBUA",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE ABUZI, extension de GBUA",
    "type_etablissment": "Public"
  },
  {
    "code": "UP/PUNIA",
    "name": "UNIVERSITE DE PUNIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/KAMPENE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE KAMPENE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/WAMAZA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE WAMAZA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR/NYAMILIMA",
    "name": "INSTITUT SUPERIEURDE DEVELOPPEMENT RURAL DE  NYAMILIMA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISBN/BENI",
    "name": "INSTITUT SUPERIEUR DU BASSIN DU NIL",
    "type_etablissment": "Privé"
  },
  {
    "code": "INTS/GOMA",
    "name": "INSTITUT NATIONAL DU TRAVAIL SOCIAL",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM/KIROTSHE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES  MEDICALES ",
    "type_etablissment": "Public"
  },
  {
    "code": "UA/BUKAVU",
    "name": "UNIVERSITE ANGLICANE DE BUKAVU",
    "type_etablissment": "Public"
  },
  {
    "code": "UEB/MINEMBWE",
    "name": "UNIVERSITE EBEN EZER DE MINEMBWE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBC/LUBUMBASHI",
    "name": "UNIVERSITE BAPTISTEDU CONGO DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTE/KATANGA",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE L'EXECELLENCE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UP/ KATUMBA-MWAKE",
    "name": "UNIVERSITE POLYTECHNIQUE KATUMBA-MWAKE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/BOKUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE BOKUNGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM/LUPUTA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES-LUPUTA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM/KWANGO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES-KWANGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM/LUIZA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR/LUIZA",
    "name": "INSTITUT SUPERIEURDE DEVELOPPEMENT RURAL - LUIZA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP/TSHIKULA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE TSHIKULA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTGED/KINSHASA",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUES  DE GESTION ET DEVELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISG/KINSHASA",
    "name": "INSTITUT SUPERIEUR DE GESTION - KINSHASA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "LAU/KINSHASA",
    "name": "LEADERSHIP ACADEMIA UNIVERSITY",
    "type_etablissment": "Privé"
  },
  {
    "code": "AIME/KINSHASA",
    "name": "ACADEMPIE INTERNATIONALE DE MANAGEMENT EXCELLENTIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCM-KINSHASA",
    "name": "UNIVERSITE CARDINAL MALULA - KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPGI/KINSHASA",
    "name": "UNIVERSITE PANAFRICAINE DE GOUVERNANCE ET DINNOVATION ",
    "type_etablissment": "Privé"
  },
  {
    "code": "AUK/KINSHASA        ",
    "name": "AMERICAN UNIVERSITY OF KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST/KINSHASA",
    "name": "INSTITUT SUPERIEUR TECHNOLOGIQUE DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UBKB /KINSHASA",
    "name": "UNIVERSITE BEATRICE KIMPAVITA DE BANDALUNGWA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM BKB/KINSHASA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  BEATRICE KIMPAVITA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ECSFLU/KINSHASA",
    "name": "ECOLE SUPERIEUR DE FORMATIONDES LEADERS  DE L'UNIVERSITE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTE/SANKURU",
    "name": "INSTITUT SUPERIEUR TECHNIQUE EBONDA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM/ LUSAMBO",
    "name": "INSTITUT SUPERIEU DES TECHNIQUES MEDICALES ",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTM ND/LODJA",
    "name": "INSTITUT TECHNIQUES MEDICALES NOTRE DAME  DE LODJA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UP/ LODJA-POTO",
    "name": "UNIVERSITE  PEDAGOGIQUE DE LODJA-POTO",
    "type_etablissment": "Privé"
  },
  {
    "code": "FU/SANKURU",
    "name": "FACULTE UNIVERSITAIRE DE SANKURU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/LODJA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE LODJA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM METHODISTE/MULO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES  METHODISTE/MULONGOMEDICALES ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP METHODISTE/ MULO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE METHODISTE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR/ KONGOLO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT  RURAL",
    "type_etablissment": "Public"
  },
  {
    "code": "ISDR/ MISUMBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL - MISUMBA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP/KWILU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE",
    "type_etablissment": "Public"
  },
  {
    "code": "ULKI",
    "name": "UNIVERSITE LIBRE DU KIVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCE DE OICHA",
    "name": "UNVERSITE DU CEPROMAD DE OICHA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UDGC DE OICHA",
    "name": "UNIVERSITE DIVINA GLORIA CAMPUS DE OICHA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJG DE LUBERO",
    "name": "UNIVERSITE SAINT JOSEPH DE GOMA CAMPUS DE LUBERO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCE DE WALIKALE",
    "name": "UNIVERSITE DU CEPROMAD DE WALIKALE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-BOSOBOLO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE-BOSOBOLO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM-GBADOLITE",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE GBADOLITE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAC Ã  GOMA",
    "name": "INSTITUT SUPERIEUR DE TECHNOLOGIE EN AFRIQUE CENTRALE/ISTAC  Ã  GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAD DE GOMA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET DE DÃ‰VELOPPEMENT DE GOMA ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP EXTENSION YAKOMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE WAPINDA extension de YAKOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP BONDANGABO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  extension de l'ISP BONDANGABO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISD-KALEHE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT DE KALEHE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCC-DON AKAM",
    "name": "UNIVERSITE CHRETIENNE CATHOLIQUE DON AKAM",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM SAINT JOSEPH DE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  SAINT JOSEPH  DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UHTGL-GOMA",
    "name": "UNIVERSITE DES HAUTES TECHNOLOGIES DE GRANDS LACS ",
    "type_etablissment": "Privé"
  },
  {
    "code": "HESDC/CEPRISE-PHD",
    "name": "Haute Ecole Supérieure Demez Christian du Centre d'Etude, de Promotion et des Recherches en Interventions Socio-Economiques-Père Hardy Développement",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIMALEMBANKULU",
    "name": "UNIVERSITE  DE MALEMB-NKULU",
    "type_etablissment": "Public"
  },
  {
    "code": "UOS- BENI",
    "name": "UNIVERSITE  OFFICIELLE  DE SEMULIKI   DE  BENI",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIK",
    "name": "UNIVERSITE  DÂ’IKELA",
    "type_etablissment": "Public"
  },
  {
    "code": "UNIKWANGO",
    "name": "UNIVERSITE  DU KWANGO",
    "type_etablissment": "Public"
  },
  {
    "code": "UPK",
    "name": "UNIVERSITÃ‰ PROTESTANTE DE KIMPESE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-LUBUTU",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE  DE  LUBUTU",
    "type_etablissment": "Public"
  },
  {
    "code": "UPRECO",
    "name": "UNIVERSITÃ‰ PRESBYTÃ‰RIENNE SHAPPERD ET LAPSLEY DU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSR",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES DE KANANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISGT",
    "name": "INSTITUT SUPERIEUR DE GESTION ET DES TECHNIQUES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM SAINT LUC",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÃ‰DICALES SAINT LUC",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPL",
    "name": "UNIVERSITÃ‰ PROTESTANTE DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUC",
    "name": "INSTITUT UNIVERSITAIRE DU CONGO A LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFTR",
    "name": "INSTITUT FACULTAIRE THÉOPHILE REYN DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUMM",
    "name": "INSTITUT UNIVERSITAIRE MARIA MALKIA DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIM",
    "name": "INSTITUT SUPERIEUR INTERDIOCESAIN MONSEIGNEUR MULOLWA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAM LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR D'ARTS ET MÉTIERS DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAGO",
    "name": "UNIVERSITÃ‰ ADVENTISTE DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULPGL DE GOMA",
    "name": "UNIVERSITÃ‰ LIBRE DES PAYS DES GRANDS LACS A GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCNDK",
    "name": "UNIVERSITÃ‰ DE CONSERVATION DE LA NATURE ET DE DÃ‰VELOPPEMENT ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSC-MULO",
    "name": "UNIVERSITÃ‰ SAINTE CROIX DE MULO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UDG DE BUTEMBO",
    "name": "UNIVERSITÃ‰ DIVINA GLORIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIG",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DE GOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDR DE KITSHANGA",
    "name": "INSTITUT SUPERIEUR DE DÃ‰VELOPPEMENT RURAL DES GRANDS LACS ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEAB",
    "name": "INSTITUT SUPERIEUR EMMANUEL D'ALZON DE BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "UEA",
    "name": "UNIVERSITÃ‰ Ã‰VANGÃ‰LIQUE EN AFRIQUE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "CUP-BUKAVU",
    "name": "CENTRE UNIVERSITAIRE DE LA PAIX DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISECOF",
    "name": "INSTITUT SUPERIEUR D'ÉTUDES COMMERCIALES ET FINANCIÈRES",
    "type_etablissment": "Privé"
  },
  {
    "code": "UMK",
    "name": "UNIVERSITÃ‰ MÃ‰THODISTE AU KATANGA A MULUNGUISHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIJK",
    "name": "UNIVERSITÃ‰ JEAN XXIII DE KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "CELI-KIS",
    "name": "COMPLEXE EDUCATIF LIKUNDE DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-L",
    "name": "INSTITUT SUPERIEUR PÃ‰DAGOGIQUE LIBRE DE KISANGANI ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-NYANKUNDE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES NYANKUNDE",
    "type_etablissment": "Privé"
  },
  {
    "code": "URK",
    "name": "UniversitÃ© RÃ©vÃ©rend KIM",
    "type_etablissment": "Privé"
  },
  {
    "code": "UOC",
    "name": "UniversitÃ© orthodoxe du Congo",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNICO",
    "name": "Université internationale ALMoustapha",
    "type_etablissment": "Privé"
  },
  {
    "code": "CUM",
    "name": "Centre Universitaire de Missiologie",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISETAM",
    "name": "Institut Superieur d'Enseignement Technique,Arts et Metiers",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSS-CR",
    "name": "Institut Superieur des sciences de santé de la  croix-rouge",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-WB",
    "name": "Institut Superieur des Techniques Medicales william BOOTH",
    "type_etablissment": "Privé"
  },
  {
    "code": "IPG",
    "name": "Institut du Pétrole et du Gaz",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSK",
    "name": "Institut Superieur des Sciences de Sante Kimbanguiste",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-RB",
    "name": "Institut Supérieur des Techniques Médicales Révérend BOKUNDOA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTEMI",
    "name": "Institut Supérieur de Théologie Évangélique de la Mission",
    "type_etablissment": "Privé"
  },
  {
    "code": "ESMICOM",
    "name": "ECOLE SUPERIEURE DES METIERS D'INFORMATIQUE ET DE COMMENCE",
    "type_etablissment": "Privé"
  },
  {
    "code": "EIFI",
    "name": "Ecole Informatique des Finances",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCBA",
    "name": "UNIVERSITE CHRETIENNE DE BANDUNDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UMN",
    "name": "UNIVERSITE DE MAI-NDOMBE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPLU",
    "name": "UNIVERSITE DU PONT LUBWE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCGB",
    "name": "UNIVERSITE CATHOLIQUE DU GRAND BANDUNDU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTH",
    "name": "INSTITUT SUPÉRIEUR DE THEOLOGIE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSS-KIKWIT",
    "name": "INSTITUT SUPÉRIEUR DES SCIENCES DE SANTE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-KYONDO",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES MÉDICALES - KYONDO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSI",
    "name": "INSTITUT SUPÉRIEUR DES SCIENCES DE SANTE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAC",
    "name": "UNIVERSITÃ‰ DE L'ALLIANCE AU CONGO ",
    "type_etablissment": "Privé"
  },
  {
    "code": "IUEFD",
    "name": "INSTITUT UNIVERSITAIRE D'Ã‰TUDE, DE FORMATION ET DE DÃ‰VELOPPEMENT ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSD / KASANGULU",
    "name": "INSTITUT SUPÉRIEUR DES SCIENCES DE SANTE ET DE DÉVELOPPEMENT ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAC",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÃ‰ES ET COMMERCIALES",
    "type_etablissment": "Privé"
  },
  {
    "code": "IPB",
    "name": "INSTITUT DE PHILOSOPHIE DE BOMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTPS",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE ET DE PHILOSOPHIE SAINT BELLARMIN DE MAYIDI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPU",
    "name": "UNIVERSITE PROTESTANTE DE L'UBANGI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPE",
    "name": "UNIVERSITE PROTESTANTE DE L'EQUATEUR",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTM-TOBIKISA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAMe",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS",
    "type_etablissment": "Privé"
  },
  {
    "code": "PESK",
    "name": "PHILOSOPHÃ‚T EDITH STEIN Ã€ KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "PSAK",
    "name": "PHILOSOPHÃ‚T SAINT AUGUSTIN DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UMC",
    "name": "UNIVERSITE MARISTE AU CONGO DE KISANGANI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UL",
    "name": "UNIVERSITE DU LAC(ex-CENTRE UNIVERSITAIRE DE MAHAGI/CUMA)",
    "type_etablissment": "Privé"
  },
  {
    "code": "CEPROMADB",
    "name": "UNIVERSITE DU CEPROMADB DE BUNIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCSV",
    "name": "UNIVERSITE CHRETIENNE SOURCE DE VIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISHECD",
    "name": "INSTITUT SUPERIEUR DE HAUTES ETUDES DE CRIMINOLOGIE ET DETECTIVES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTCI",
    "name": "INSTITUT SUPERIEUR TECHNIQUE COMMERCIAL ET INFORMATIQUES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCI-LIKASI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET INFORMATIQUE DE LIKASI",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPROKOL",
    "name": "UNIVERSITE PROTESTANTE DE KOLWEZI",
    "type_etablissment": "Privé"
  },
  {
    "code": "USJG",
    "name": "UNIVERSITE SAINT JOSEPH DE GOMA CAMPUS DE RUBAYA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULPGLa",
    "name": "UNIVERSITE LIBRE DES PAYS DES GRANDS LACS",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIGL",
    "name": "UNIVERSITE DES GRANDS LACS",
    "type_etablissment": "Privé"
  },
  {
    "code": "UPAC",
    "name": "UNIVERSITE PANAFRICAINE AU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAD",
    "name": "INSTITUT SUPERIEUR D'ADMINISTRATION ET DE DEVELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISIDE",
    "name": "INSTITUT SUPERIEUR D'INGÉNIERIE DE DÉVELOPPEMENT ET DE GESTION DE L'ENVIRONNEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAMG",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTGA DE GOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE GESTION DES AFFAIRES ",
    "type_etablissment": "Privé"
  },
  {
    "code": "USK-BUKAVU",
    "name": "UNIVERSITE SIMON KIMBANGU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTHEMI",
    "name": "UNIVERSITE EBEN EZER Ã€ NIAMIANDA(EX-INSTITUT SUPERIEUR DE THEOLOGIE ET DE MISSIOLOGIE)",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULPGL",
    "name": "UNIVERSITE LIBRE DE GRANDS LACS DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULKT",
    "name": "UNIVERSITE LIBRE DU KIVU ET DU TANGANYIKA",
    "type_etablissment": "Privé"
  },
  {
    "code": "PIB",
    "name": "PHILOSOPHÃ‚T ISIDORE BAKANJA DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNILAI",
    "name": "UNIVERSITE LAÃ?QUE D'IDJWI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISM",
    "name": "INSTITUT SUPERIEUR DE MANAGEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTEGI",
    "name": "INSTITUT SUPERIEUR TECHNIQUE D'ETUDES EN GESTION ET INFORMATIQUE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPF",
    "name": "INSTITUT SUPERIEUR DE PASTORALE FAMILIALE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDRO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL D'OSHWE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISCI LIKASI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET D'INFORMATIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISEIF",
    "name": "INSTITUT D'ETUDES INFORMATIQUES ET DES FINANCES DE MATADI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISGC",
    "name": "INSTITUT SUPERIEUR DE GÃ‰NIE COMMERCIAL D'INKISI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDRB",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAMW",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE WEMBO-NYAMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAV",
    "name": "INSTITUT SUPERIEUR AGRO-VÉTÉRINAIRE DE BAMBESA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPÃª",
    "name": "INSTITUT SUPERIEUR DE PÃŠCHE D'UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNICL",
    "name": "UNIVERSITE DU CEPROMAD DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISPÃªK",
    "name": "INSTITUT SUPERIEUR DE PÃŠCHE DE KALEMIE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCAC",
    "name": "UNIVERSITE CANADIENNE AU CONGO ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTACe",
    "name": "INSTITUT SUPERIEUR DE TECHNOLOGIE EN AFRIQUE CENTRALE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'OICHA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSNT",
    "name": "INSTITUT SUPERIEUR DE STATISTIQUE ET NOUVELLES TECHNOLOGIES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTS DE GOMA ",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUE SOCIAL ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTPA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES ET PEDAGOGIE APPLIQUEE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ULDK",
    "name": "UNIVERSITE LIBRE DE DEVELOPPEMENT DE KITSHUKU",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCS",
    "name": "UNIVERSITE CATHOLIQUE LA SAPIENTIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCPROMAD",
    "name": "UNIVERSITE DU CEPROMADB DE BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "FABB",
    "name": "FACULTES AFRICAINES BAKHITA DE BUTEMBO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSSa",
    "name": "INSTITUT SUPERIEUR DES SCIENCES DE SANTÃ‰ ",
    "type_etablissment": "Privé"
  },
  {
    "code": "UMKK",
    "name": "UNIVERSITE METHODISTE AU KATANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISAMM",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS MARIE AUXILIATRICE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ECOPO DE LUISHI",
    "name": "ECOLE SUPERIEURE DE LA GOUVERNANCE ECONOMIQUE ET POLITIQUE ",
    "type_etablissment": "Privé"
  },
  {
    "code": "ESI-SALAMA",
    "name": "ECOLE SUPERIEURE D'INFORMATIQUE SALAMA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSMÃ©",
    "name": "INSTITUT SUPERIEUR DES SCIENCES MEDICALES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ITSFS",
    "name": "INSTITUT DE THEOLOGIE SAINT-FRANCOIS DE SALES DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTELU",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE DE LUBUMBASHI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTADC",
    "name": "INSTITUT SUPERIEUR THEOLOGIQUE DES ASSEMBLÃ‰ES DE DIEU AU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTAS",
    "name": "INSTITUT SUPERIEUR D'ANIMATION SOCIALE",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISDRu",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTME",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES MÉDICALES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISG",
    "name": "Institut Supérieur de Gestion",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTEM-FA",
    "name": "Institut Supérieur des Techniques Médicale Franco-Américain",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFGC",
    "name": "INSTITUT FACULTAIRE DE GESTION ET DE COMMUNICATION",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNILUK",
    "name": "UNIVERSITE ADVENTISTE DE LUKANGA",
    "type_etablissment": "Privé"
  },
  {
    "code": "USB",
    "name": "UNIVERSITE SHALOM DE BUNIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UAB",
    "name": "UNIVERSITÃ‰ ANGLICANE DU CONGO DE BUNIA",
    "type_etablissment": "Privé"
  },
  {
    "code": "UCB",
    "name": "UNIVERSITÃ‰ CATHOLIQUE DE BUKAVU",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTIA",
    "name": "INSTITUT SUPERIEUR TECHNIQUE D'INFORMATIQUE APPLIQUÃ‰E ",
    "type_etablissment": "Privé"
  },
  {
    "code": "IST",
    "name": "INSTITUT SUPERIEUR TECHNIQUE",
    "type_etablissment": "Privé"
  },
  {
    "code": "UM",
    "name": "UNIVERSITÃ‰ DE MBUJI-MAYI",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISETM",
    "name": "INSTITUT SUPERIEUR D'ENSEIGNEMENT TECHNIQUE MEDICALE",
    "type_etablissment": "Privé"
  },
  {
    "code": "IFAD",
    "name": "INSTITUT FACULTAIRE DE DÉVELOPPEMENT",
    "type_etablissment": "Privé"
  },
  {
    "code": "Ex-IFAS",
    "name": "INSTITUT SUPERIEUR TECHNIQUE SONG HWA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISP-KALEMIE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KALEMIE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-RUGARI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE RUGARI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-NYANZALE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE NYANZALE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-RUBAYA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE RUBAYA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BENI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BENI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-UPOTO-BINGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DÂ’UPOTO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-BONGANDANGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BONGANDANGA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-NGANDAJIKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE NGANDAJIKA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-MANGAI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MANGAI",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-LUKALABA",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE  DE LUKALABA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP- KABULUANDA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KABULUANDA",
    "type_etablissment": "Public"
  },
  {
    "code": "ISP-DIBAYA LUBWE",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE  DE  DIBAYA  LUBWE",
    "type_etablissment": "Public"
  },
  {
    "code": "ISC-LUEBO",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE LUEBO",
    "type_etablissment": "Public"
  },
  {
    "code": "ISTCE-UVIRA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES COMMERCIALES ET ECONOMIQUES - UVIRA",
    "type_etablissment": "Privé"
  },
  {
    "code": "EFEAC/CEEAC",
    "name": "ECOLE DE FORMATION ELECTORAL EN AFRIQUE CENTRAL/CEEAC",
    "type_etablissment": "Privé"
  },
  {
    "code": "USCITECH",
    "name": "UNIVERSITE DES SCIENCES ET TECHNOLOGIES",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISRTM/KINSHASA",
    "name": "INSTITUT SUPERIEUR ROYAL DES TECHNIQUES MEDICALES DE KINSHASA",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISSM-MWENE-DITU",
    "name": "Institut Supérieur des Sciences Médicales de Mwene-Ditu",
    "type_etablissment": "Privé"
  },
  {
    "code": "UNIPAC",
    "name": "UNIVERSITÉ DE LA PAIX AU CONGO",
    "type_etablissment": "Privé"
  },
  {
    "code": "MU",
    "name": "MALIKIAH UNIVERSITY",
    "type_etablissment": "Privé"
  },
  {
    "code": "ISTCK",
    "name": "INSTITUT SUPÉRIEUR TECHNIQUE CATHOLIQUE DE KIKWIT",
    "type_etablissment": "Privé"
  }
];


const ProfessorRegistrationForm = ({ onLogout, currentUser, preselectedType, onRequestAccountTypeReset, formMode, preloadedRecord, onBackToRecord }) => {
  // État initial par défaut
  const defaultFormState = {
    nom: '',
    postnom: '',
    prenom: '',
    sexe: '',
    type_etablissement: '',
    matricule_esu: '',
    matricule: '',
    lieu_naissance: '',
    date_naissance: '',
    grade_actuel: '',
    pays_soutenance: '',
    universite_soutenance: '',
    numero_arrete_equivalence: '',
    copie_arrete_equivalence: null,
    date_soutenance: '',
    type_diplome: '',
    universite_attache: '',
    universite_attache_precisee: '',
    date_engagement: '',
    reference_dernier_arrete: '',
    prime_institutionnelle: '',
    salaire_base: '',
    photo_identite: null,
    possede_diplome: '',
    copie_diplome: null,
    documents_equivalents: null,
    charge_horaire: null,
    domaine_recherche: '',
    sujet_these: '',
    universite_obtention_diplome_doctorat: '',
    pays_obtention_diplome_doctorat: '',
    date_obtention_diplome_doctorat: '',
    a_etudie_etranger: '',
    commentaire_confirmation: '',
    informations_vraies: false,
    diplome_etat: null,
    diplome_graduat: null,
    diplome_licence: null,
    diplome_master_dea_ds: null,
    has_diplome_etat: '',
    has_diplome_graduat: '',
    has_diplome_licence: '',
    has_inscription_dea_des: '',
    has_diplome_master_dea_ds: '',
    universite_master_dea_ds: '',
    pays_master_dea_ds: '',
    date_obtention_master_dea_ds: '',
    type_diplome_dea_des: '',
    arrete_nomination_ct: null,
    photo_passeport: null,
    type_assistant: '',
    decision_nomination_assistant: null,
    etablissement_inscription_3cycle: null,
    decision_inscription_ass_ct: null,
    date_inscription: '',
    statut: '',
    statut_apprenant: '',
    typecompte: '',
    categorie_assistant: '',
    centre_laboratoire_recherche: '',
  };

  // Initialiser formData en restaurant le brouillon si disponible
  // MAIS si preselectedType est fourni, l'ignorer si le brouillon a un type différent
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        // Si le brouillon n'a pas de typecompte valide, ne pas le charger
        // Car preselectedType va le fournir dans l'useEffect suivant
        if (!draft.typecompte || draft.typecompte === '') {
          return defaultFormState;
        }
        return { ...defaultFormState, ...draft };
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du brouillon:', error);
    }
    return defaultFormState;
  });

  // Si l'application a pré-sélectionné un type de compte (depuis App.js), l'appliquer
  useEffect(() => {
    if (preselectedType && preselectedType !== '') {
      setFormData((prev) => {
        if (prev.typecompte !== preselectedType) {
          const updated = { ...prev, typecompte: preselectedType };
          return updated;
        }
        return prev;
      });
      setPreviousType(preselectedType);
      setViewType(preselectedType);
    }
  }, [preselectedType]);

  // Si on arrive depuis MyRecord en mode edit, pré-remplir les données
  useEffect(() => {
    if (formMode === 'edit' && preloadedRecord) {
      const d = preloadedRecord;
      const tc = preselectedType || 'Professeur';
      setViewedData(d);
      setEditRecordId(d.id || null);
      setViewMatricule(d.matricule || d.matricule_esu || '');
      setFormData({
        typecompte: tc,
        nom: d.nom || '',
        postnom: d.postnom || '',
        prenom: d.prenom || '',
        sexe: d.sexe || '',
        lieu_naissance: d.lieu_naissance || '',
        date_naissance: d.date_naissance || '',
        domaine_recherche: d.domaine_recherche || '',
        prime_institutionnelle: d.prime_institutionnelle || '',
        salaire_base: d.salaire_base || '',
        commentaire_confirmation: d.commentaires || '',
        informations_vraies: d.informations_vraies || false,
        universite_attache: d.universite_attache || d.etablissement_attache || '',
        universite_attache_precisee: d.universite_attache_precisee || '',
        date_engagement: d.date_engagement || '',
        date_soutenance: tc === 'Professeur' ? '' : (d.date_soutenance || d.date_engagement || ''),
        etablissement_inscription_3cycle: d.etablissement_inscription_3cycle || '',
        date_inscription: d.date_inscription || '',
        statut_apprenant: d.statut_apprenant || '',
        // Diplômes
        diplome_etat: null,
        diplome_graduat: null,
        diplome_licence: null,
        diplome_master_dea_ds: null,
        has_diplome_etat: d.diplome_etat ? 'Oui' : '',
        has_diplome_graduat: d.diplome_graduat ? 'Oui' : '',
        has_diplome_licence: d.diplome_licence ? 'Oui' : '',
        has_inscription_dea_des: !d.diplome_master_dea_ds && (d.etablissement_inscription_3cycle || d.date_inscription || d.statut_apprenant) ? 'Oui' : '',
        has_diplome_master_dea_ds: d.diplome_master_dea_ds ? 'Oui' : '',
        universite_master_dea_ds: d.universite_master_dea_ds || '',
        pays_master_dea_ds: d.pays_master_dea_ds || '',
        date_obtention_master_dea_ds: d.date_obtention_master_dea_ds || '',
        a_etudie_etranger: d.a_etudie_etranger || '',
        // Professeur
        type_etablissement: d.type_etablissement || '',
        matricule_esu: d.matricule_esu || '',
        grade_actuel: d.grade_actuel || '',
        pays_soutenance: '',
        universite_soutenance: '',
        numero_arrete_equivalence: d.numero_arrete_equivalence || '',
        copie_arrete_equivalence: null,
        type_diplome: d.type_diplome || '',
        type_diplome_dea_des: d.type_diplome_dea_des || '',
        reference_dernier_arrete: d.reference_dernier_arrete || '',
        photo_identite: null,
        possede_diplome: d.possede_diplome || '',
        copie_diplome: null,
        documents_equivalents: null,
        charge_horaire: null,
        sujet_these: d.sujet_these || '',
        copie_these: null,
        // Assistant
        matricule: d.matricule || '',
        statut: d.mandat_assistant || d.statut || '',
        decision_nomination_assistant: null,
        decision_inscription_ass_ct: null,
        photo_passeport: null,
        type_assistant: d.type_assistant || '',
        categorie_assistant: d.categorie_assistant || '',
        centre_laboratoire_recherche: d.centre_laboratoire_recherche || '',
        // CT
        arrete_nomination_ct: null,
      });
      setChangedFields({});
      setEditMode(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMode, preloadedRecord]);

  // État pour l'indicateur de sauvegarde
  const [draftSaved, setDraftSaved] = useState(false);

  // Référence pour gérer le debounce
  const saveTimeoutRef = useRef(null);
  const showIndicatorTimeoutRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showTypeChangeModal, setShowTypeChangeModal] = useState(false);
  const [pendingTypeSelection, setPendingTypeSelection] = useState('');
  const [previousType, setPreviousType] = useState('');
  const [viewMatricule, setViewMatricule] = useState('');
  const [viewLoading, setViewLoading] = useState(false);
  const [viewedData, setViewedData] = useState(null);
  const [editRecordId, setEditRecordId] = useState(null);
  const [viewType, setViewType] = useState(preselectedType || 'Professeur');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState(''); // 'error', 'info', 'success'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editMode, setEditMode] = useState(formMode === 'edit');
  const [changedFields, setChangedFields] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [filePreviews, setFilePreviews] = useState({});

  // Si le formulaire est rendu sans type de compte ET aucun type n'a été pré-sélectionné,
  // demander au parent (App) d'afficher l'écran de sélection global.
  useEffect(() => {
    if (!editMode && (!preselectedType || preselectedType === '')) {
      // Si preselectedType est vide et formData.typecompte est aussi vide, faire une redirection
      if (!formData.typecompte || formData.typecompte === '') {
        if (typeof onRequestAccountTypeReset === 'function') {
          onRequestAccountTypeReset();
        }
      }
    }
  }, [editMode, preselectedType, onRequestAccountTypeReset]);

  const showPopup = (msg, type = 'info') => {
    setPopupMessage(msg);
    setPopupType(type);
    const duration = type === 'error' ? 8000 : 4000;
    setTimeout(() => {
      setPopupMessage('');
      setPopupType('');
    }, duration);
  };

  const readJsonResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!text) return {};

    if (contentType.includes('application/json')) {
      return JSON.parse(text);
    }

    try {
      return JSON.parse(text);
    } catch (_) {
      const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      throw new Error(
        plainText
          ? `Réponse non JSON du serveur (${response.status}). ${plainText.slice(0, 180)}`
          : `Réponse non JSON du serveur (${response.status})`
      );
    }
  };

  // Sauvegarder automatiquement le brouillon avec debounce
  useEffect(() => {
    // Annuler le timeout précédent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Créer un nouveau timeout
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const draftData = { ...formData };
        // Exclure les fichiers binaires
        draftData.photo_identite = null;
        draftData.copie_diplome = null;
        draftData.copie_arrete_equivalence = null;
        draftData.documents_equivalents = null;
        draftData.charge_horaire = null;
        draftData.arrete_nomination_ct = null;
        draftData.photo_passeport = null;
        draftData.decision_nomination_assistant = null;
        draftData.etablissement_inscription_3cycle = null;
        draftData.decision_inscription_ass_ct = null;
        draftData.date_inscription = '';
        draftData.has_inscription_dea_des = '';
        draftData.diplome_etat = null;
        draftData.diplome_graduat = null;
        draftData.diplome_licence = null;
        draftData.diplome_master_dea_ds = null;

        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));

        // Afficher l'indicateur visuel
        setDraftSaved(true);
        if (showIndicatorTimeoutRef.current) {
          clearTimeout(showIndicatorTimeoutRef.current);
        }
        showIndicatorTimeoutRef.current = setTimeout(() => {
          setDraftSaved(false);
        }, 2000);
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du brouillon:', error);
      }
    }, DRAFT_SAVE_DELAY);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData]);

  // Sauvegarder le brouillon avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const draftData = { ...formData };
        draftData.photo_identite = null;
        draftData.copie_diplome = null;
        draftData.copie_arrete_equivalence = null;
        draftData.documents_equivalents = null;
        draftData.charge_horaire = null;
        draftData.arrete_nomination_ct = null;
        draftData.photo_passeport = null;
        draftData.decision_nomination_assistant = null;
        draftData.etablissement_inscription_3cycle = null;
        draftData.decision_inscription_ass_ct = null;
        draftData.date_inscription = '';
        draftData.has_inscription_dea_des = '';
        draftData.diplome_etat = null;
        draftData.diplome_graduat = null;
        draftData.diplome_licence = null;
        draftData.diplome_master_dea_ds = null;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde avant fermeture:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData]);

  // Gestion du changement de type de compte avec confirmation si on risque de perdre des fichiers/champs
  const handleTypecompteChange = (newType) => {
    const currentType = formData.typecompte;
    if (newType === currentType) return;

    const fieldsThatWouldBeCleared = [];
    // Si on quitte Assistant, prévenir si statut ou décision de nomination sont présents
    if (currentType === 'Assistant' && newType !== 'Assistant') {
      if (formData.decision_nomination_assistant) fieldsThatWouldBeCleared.push('Décision de nomination (assistant)');
      if (formData.statut) fieldsThatWouldBeCleared.push('Statut');
      if (formData.categorie_assistant) fieldsThatWouldBeCleared.push("Catégorie d'Assistant");
      if (formData.centre_laboratoire_recherche) fieldsThatWouldBeCleared.push('Centre/Laboratoire de Recherche');
      if (formData.charge_horaire) fieldsThatWouldBeCleared.push('Charge Horaire');
    }
    // Si on quitte CT, prévenir si arrêté de nomination est présent
    if (currentType === 'CT' && newType !== 'CT') {
      if (formData.arrete_nomination_ct) fieldsThatWouldBeCleared.push('Arrêté de nomination (CT)');
    }

    if (fieldsThatWouldBeCleared.length > 0) {
      setPendingTypeSelection(newType);
      setPreviousType(currentType || '');
      setShowTypeChangeModal(true);
      return;
    }

    // Sinon, appliquer directement
    const updatedForm = { ...formData, typecompte: newType };
    setFormData(updatedForm);
    setPreviousType(newType);
    if (editMode) setChangedFields({ ...changedFields, typecompte: newType });
  };
  

  const confirmTypeChange = () => {
    const newType = pendingTypeSelection;
    const cur = previousType;
    const updated = { ...formData };
    // Effacer les champs sensibles selon l'ancien type
    if (cur === 'Assistant' && newType !== 'Assistant') {
      updated.decision_nomination_assistant = null;
      updated.statut = '';
      updated.categorie_assistant = '';
      updated.centre_laboratoire_recherche = '';
      updated.charge_horaire = null;
    }
    if (cur === 'CT' && newType !== 'CT') {
      updated.arrete_nomination_ct = null;
    }

    updated.typecompte = newType;
    setFormData(updated);
    if (editMode) setChangedFields({ ...changedFields, typecompte: newType });
    setShowTypeChangeModal(false);
    setPendingTypeSelection('');
    setPreviousType(newType);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    const nextFormData = {
      ...formData,
      [name]: newValue,
    };
    const nextChangedFields = {
      ...changedFields,
      [name]: newValue,
    };

    if (name === 'type_etablissement' && isPrivateEtablissement(newValue)) {
      nextFormData.salaire_base = '';
      nextFormData.matricule = '';
      nextFormData.prime_institutionnelle = '';
      nextChangedFields.salaire_base = '';
      nextChangedFields.matricule = '';
      nextChangedFields.prime_institutionnelle = '';

      if (formData.typecompte === 'Professeur') {
        nextFormData.matricule_esu = '';
        nextChangedFields.matricule_esu = '';
      }
    }

    if (name === 'type_etablissement') {
      const selectedUniversity = UNIVERSITIES.find((university) => university.code === formData.universite_attache);
      const selectedUniversityType = getUniversityType(selectedUniversity);

      if (
        formData.universite_attache &&
        !isManualTypeEtablissementAllowed(formData.universite_attache) &&
        selectedUniversityType &&
        selectedUniversityType !== newValue
      ) {
        nextFormData.universite_attache = '';
        nextFormData.universite_attache_precisee = '';
        nextChangedFields.universite_attache = '';
        nextChangedFields.universite_attache_precisee = '';
      }
    }

    if (name === 'grade_actuel' && newValue === 'DT') {
      nextFormData.reference_dernier_arrete = '';
      nextChangedFields.reference_dernier_arrete = '';
    }

    if (name === 'has_diplome_licence') {
      if (newValue !== 'Oui') {
        nextFormData.diplome_licence = null;
        nextChangedFields.diplome_licence = null;
      }
    }

    if (name === 'has_diplome_master_dea_ds') {
      if (newValue === 'Oui') {
        nextFormData.has_inscription_dea_des = '';
        nextFormData.etablissement_inscription_3cycle = '';
        nextFormData.decision_inscription_ass_ct = null;
        nextFormData.date_inscription = '';
        nextFormData.statut_apprenant = '';
        nextChangedFields.has_inscription_dea_des = '';
        nextChangedFields.etablissement_inscription_3cycle = '';
        nextChangedFields.decision_inscription_ass_ct = null;
        nextChangedFields.date_inscription = '';
        nextChangedFields.statut_apprenant = '';
      } else {
        nextFormData.diplome_master_dea_ds = null;
        nextFormData.type_diplome = '';
        nextFormData.type_diplome_dea_des = '';
        nextFormData.universite_master_dea_ds = '';
        nextFormData.pays_master_dea_ds = '';
        nextFormData.date_obtention_master_dea_ds = '';
        nextChangedFields.diplome_master_dea_ds = null;
        nextChangedFields.type_diplome = '';
        nextChangedFields.type_diplome_dea_des = '';
        nextChangedFields.universite_master_dea_ds = '';
        nextChangedFields.pays_master_dea_ds = '';
        nextChangedFields.date_obtention_master_dea_ds = '';
        if (newValue !== 'Non') {
          nextFormData.has_inscription_dea_des = '';
          nextFormData.etablissement_inscription_3cycle = '';
          nextFormData.decision_inscription_ass_ct = null;
          nextFormData.date_inscription = '';
          nextFormData.statut_apprenant = '';
          nextChangedFields.has_inscription_dea_des = '';
          nextChangedFields.etablissement_inscription_3cycle = '';
          nextChangedFields.decision_inscription_ass_ct = null;
          nextChangedFields.date_inscription = '';
          nextChangedFields.statut_apprenant = '';
        }
      }
    }

    if (name === 'has_inscription_dea_des' && newValue !== 'Oui') {
      nextFormData.etablissement_inscription_3cycle = '';
      nextFormData.decision_inscription_ass_ct = null;
      nextFormData.date_inscription = '';
      nextFormData.statut_apprenant = '';
      nextChangedFields.etablissement_inscription_3cycle = '';
      nextChangedFields.decision_inscription_ass_ct = null;
      nextChangedFields.date_inscription = '';
      nextChangedFields.statut_apprenant = '';
    }

    setFormData(nextFormData);
    // Effacer l'erreur de validation
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const next = {...prev}; delete next[name]; return next; });
    }
    const errEl = document.getElementById(name);
    if (errEl) errEl.classList.remove('field-has-error');
    if (editMode) {
      setChangedFields(nextChangedFields);
    }
  };

  // ── Constantes fichiers ─────────────────────────────────────────────────
  const PHOTO_FIELDS = new Set(['photo_passeport', 'photo_identite']);
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

  // Documents (PDF, JPG, JPEG, PNG)
  const DOC_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
  const DOC_ACCEPT     = DOC_EXTENSIONS.join(',');
  const DOC_LABEL      = 'Formats acceptés : .pdf, .jpg, .jpeg, .png (max 10 Mo)';
  const DOC_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

  // Photos uniquement (pas de PDF)
  const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
  const PHOTO_ACCEPT     = PHOTO_EXTENSIONS.join(',');
  const PHOTO_LABEL      = 'Formats acceptés : .jpg, .jpeg, .png (max 10 Mo)';
  const PHOTO_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

  // Rétro-compatibilité pour les champs documents existants
  const ALLOWED_FILE_ACCEPT = DOC_ACCEPT;
  const ALLOWED_FILE_LABEL  = DOC_LABEL;

  /** Détecte le type MIME réel via les magic bytes (premiers octets du fichier). */
  const detectMimeFromBytes = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const bytes = new Uint8Array(ev.target.result);
        if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
          resolve('application/pdf'); // %PDF
        } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          resolve('image/png'); // PNG
        } else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
          resolve('image/jpeg'); // JPEG / JPG
        } else {
          resolve(null); // non reconnu
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file.slice(0, 8));
    });

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (!files || !files[0]) return;
    const file = files[0];

    const isPhoto     = PHOTO_FIELDS.has(name);
    const allowedExt  = isPhoto ? PHOTO_EXTENSIONS : DOC_EXTENSIONS;
    const allowedMime = isPhoto ? PHOTO_MIME_TYPES  : DOC_MIME_TYPES;
    const hintLabel   = isPhoto ? PHOTO_LABEL       : DOC_LABEL;

    // 1. Taille maximale (10 Mo)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showPopup('Le fichier dépasse la taille maximale autorisée (10 Mo).', 'error');
      e.target.value = '';
      return;
    }

    // 2. Extension
    const fileName = file.name.toLowerCase();
    if (!allowedExt.some(ext => fileName.endsWith(ext))) {
      showPopup(`Format de fichier non autorisé. ${hintLabel}`, 'error');
      e.target.value = '';
      return;
    }

    // 3. Type MIME réel (magic bytes) — détecte les fichiers corrompus ou renommés
    const detectedMime = await detectMimeFromBytes(file);
    if (!detectedMime || !allowedMime.has(detectedMime)) {
      showPopup(`Le fichier semble corrompu ou son contenu ne correspond pas à son extension. ${hintLabel}`, 'error');
      e.target.value = '';
      return;
    }

    // 4. Aperçu pour les champs photo
    if (isPhoto) {
      const newUrl = URL.createObjectURL(file);
      setFilePreviews(prev => {
        if (prev[name]) URL.revokeObjectURL(prev[name]);
        return { ...prev, [name]: newUrl };
      });
    }

    setFormData(prev => ({ ...prev, [name]: file }));
    // Effacer l'erreur de validation
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
    const errEl = document.getElementById(name);
    if (errEl) errEl.classList.remove('field-has-error');
    if (editMode) {
      setChangedFields(prev => ({ ...prev, [name]: file }));
    }
  };

  const handleDiplomaCountryChange = (fieldName, selectedOption) => {
    const value = selectedOption ? selectedOption.value : '';

    setFormData({
      ...formData,
      [fieldName]: value,
    });
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (editMode) {
      setChangedFields({
        ...changedFields,
        [fieldName]: value,
      });
    }
  };

  // Handler pour le changement de l'établissement d'attache
  const handleUniversityChange = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : '';
    const selectedUniversity = UNIVERSITIES.find((university) => university.code === value);
    const typeEtablissement = getUniversityType(selectedUniversity);
    const nextTypeEtablissement = typeEtablissement || formData.type_etablissement;
    const privateTypeSelected = isPrivateEtablissement(nextTypeEtablissement);

    setFormData({
      ...formData,
      universite_attache: value,
      universite_attache_precisee: value ? formData.universite_attache_precisee : '',
      type_etablissement: nextTypeEtablissement,
      matricule: privateTypeSelected ? '' : formData.matricule,
      matricule_esu: privateTypeSelected ? '' : formData.matricule_esu,
      salaire_base: privateTypeSelected ? '' : formData.salaire_base,
      prime_institutionnelle: privateTypeSelected ? '' : formData.prime_institutionnelle,
    });
    if (fieldErrors.universite_attache) {
      setFieldErrors(prev => { const next = {...prev}; delete next.universite_attache; return next; });
    }
    if (fieldErrors.type_etablissement && nextTypeEtablissement) {
      setFieldErrors(prev => { const next = {...prev}; delete next.type_etablissement; return next; });
    }
    if (editMode) {
      setChangedFields({
        ...changedFields,
        universite_attache: value,
        universite_attache_precisee: value ? formData.universite_attache_precisee : '',
        type_etablissement: nextTypeEtablissement,
        ...(privateTypeSelected ? {
          matricule: '',
          matricule_esu: '',
          salaire_base: '',
          prime_institutionnelle: '',
        } : {}),
      });
    }
  };

  // Convertir la liste UNIVERSITIES en options pour react-select
  const allUniversityOptions = UNIVERSITIES.map(buildUniversityOption);
  const universityOptions = UNIVERSITIES
    .filter((uni) => {
      if (!formData.type_etablissement) return true;
      if (isManualTypeEtablissementAllowed(uni.code)) return true;
      return getUniversityType(uni) === formData.type_etablissement;
    })
    .map(buildUniversityOption);
  const selectedUniversityOption = formData.universite_attache
    ? allUniversityOptions.find(u => u.value === formData.universite_attache) || {
        value: formData.universite_attache,
        label: formData.universite_attache,
      }
    : null;
  const isUniversitySelectDisabled = !formData.type_etablissement;
  const universitySelectPlaceholder = isUniversitySelectDisabled
    ? "Sélectionnez d'abord le type d'établissement"
    : "Sélectionner ou rechercher un établissement...";

  const handleViewData = async () => {
    if (!viewMatricule.trim()) {
      showPopup('Veuillez entrer un matricule', 'error');
      return;
    }

    setViewLoading(true);
    try {
      let endpoint = '';
      
      // Construire l'endpoint en fonction du type (nouveaux endpoints)
      if (viewType === 'Professeur') {
        endpoint = `/api/bnn/enseignant/professeur/${viewMatricule}/`;
      } else if (viewType === 'Assistant') {
        endpoint = `/api/enseignants/assistant/${viewMatricule}/`;
      } else if (viewType === 'CT') {
        endpoint = `/api/enseignants/chef-travaux/${viewMatricule}/`;
      }

      const response = await fetch(`${SERVER_URL}${endpoint}`, {
        signal: AbortSignal.timeout(240000), // 4 minutes
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `${viewType} non trouvé`);
      }

      const data = await response.json();
      setViewedData(data);
    } catch (error) {
      let errorMsg = 'Erreur lors de la recherche';
      if (error.name === 'AbortError') {
        errorMsg = 'La requête a expiré. Veuillez réessayer.';
      } else if (error.message === 'Failed to fetch') {
        console.error('Erreur de connexion réseau lors de la recherche');
        errorMsg = 'Erreur de connexion au serveur';
        return;
      } else {
        errorMsg = error.message;
      }
      showPopup(errorMsg, 'error');
      setViewedData(null);
      console.error('Erreur complète:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewMatricule('');
    setViewType('Professeur');
    setViewedData(null);
  };

  const handleDeleteProfessor = async () => {
    const retryFetch = async (url, options, maxRetries = 2) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(240000), // 4 minutes
          });
          return response;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };

    try {
      const response = await retryFetch(`${API_BASE_URL}enseignant/delete/${viewMatricule}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      showPopup('Professeur supprimé avec succès', 'success');
      setShowDeleteConfirm(false);
      handleCloseViewModal();
    } catch (error) {
      let errorMsg = 'Erreur lors de la suppression';
      if (error.name === 'AbortError') {
        errorMsg = 'La requête a expiré';
      } else if (error.message === 'Failed to fetch') {
        console.error('Erreur de connexion réseau lors de la suppression');
        return;
      }
      showPopup(errorMsg, 'error');
      console.error('Erreur complète:', error);
    }
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Fonction helper pour rendre le contenu du modal dynamiquement
  const renderModalContent = () => {
    if (!viewedData) return null;

    const isEmptyDisplayValue = (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string') return false;

      const normalized = value.trim().toLowerCase();
      return (
        normalized === '' ||
        normalized === 'non renseigné' ||
        normalized === 'non renseigne' ||
        normalized === 'non fourni' ||
        normalized === 'aucun commentaire' ||
        normalized === 'null' ||
        normalized === 'undefined' ||
        normalized === 'n/a' ||
        normalized === 'na'
      );
    };

    const DataRow = ({ label, value, hideEmpty = true }) => {
      if (hideEmpty && isEmptyDisplayValue(value)) return null;

      return (
        <div className="data-row">
          <span className="data-label">{label}:</span>
          <span className="data-value">{value}</span>
        </div>
      );
    };

    const formatDisplaySexe = (sexe) => {
      if (isEmptyDisplayValue(sexe)) return '';
      return sexe === 'M' ? 'Masculin' : sexe === 'F' ? 'Féminin' : sexe;
    };

    const FileLink = ({ path }) => {
      if (isEmptyDisplayValue(path)) return null;
      const fileName = path.split('/').pop();
      const fullUrl = path.startsWith('http') ? path : `${SERVER_URL}${path}`;
      return (
        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="file-link" title={fileName}>
          📄 {fileName}
        </a>
      );
    };

    const FileDataRow = ({ label, path }) => {
      if (isEmptyDisplayValue(path)) return null;
      return (
        <div className="data-row">
          <span className="data-label">{label}:</span>
          <span className="data-value"><FileLink path={path} /></span>
        </div>
      );
    };

    const DataSection = ({ title, children }) => (
      <div className="data-section">
        <h3>{title}</h3>
        {children}
      </div>
    );

    // Contenu pour Professeur
    if (viewType === 'Professeur') {
      return (
        <div className="modal-data">
          <DataSection title="Informations Personnelles">
            <DataRow label="Nom" value={viewedData.nom} />
            <DataRow label="Postnom" value={viewedData.postnom} />
            <DataRow label="Prénom" value={viewedData.prenom} />
            <DataRow label="Sexe" value={formatDisplaySexe(viewedData.sexe)} />
            {!isPrivateEtablissement(viewedData.type_etablissement) && (
              <DataRow label="Matricule ESU" value={viewedData.matricule_esu} />
            )}
            <DataRow label="Type de compte" value={viewedData.typecompte || 'Professeur'} />
            <DataRow label="Lieu de naissance" value={viewedData.lieu_naissance} />
            <DataRow label="Date de naissance" value={viewedData.date_naissance} />
          </DataSection>

          <DataSection title="Informations Administratives">
            <DataRow label="Type Établissement" value={viewedData.type_etablissement === 'Public' ? 'Établissement Public' : viewedData.type_etablissement === 'Privé' ? 'Établissement Privé' : viewedData.type_etablissement} />
            <DataRow label="Grade actuel" value={formatGradeActuel(viewedData.grade_actuel)} />
            <DataRow label="Établissement d'attache" value={viewedData.universite_attache || viewedData.universite_attache_precisee} />
            <DataRow label="Domaine de recherche" value={viewedData.domaine_recherche} />
          </DataSection>

          <DataSection title="Informations de Soutenance">
            <DataRow label="Type de diplôme de Doctorat" value={viewedData.type_diplome} />
            <DataRow label="Numéro arrêté équivalence" value={viewedData.numero_arrete_equivalence} />
          </DataSection>

          <DataSection title="Diplômes par niveau">
            <FileDataRow label="Diplôme d'État" path={viewedData.diplome_etat} />
            <FileDataRow label="Diplôme de Graduat" path={viewedData.diplome_graduat} />
            <FileDataRow label="Diplôme de Licence" path={viewedData.diplome_licence} />
            <FileDataRow label="Diplôme de Master/D.E.A/D.E.S" path={viewedData.diplome_master_dea_ds} />
            <DataRow label="Université d'obtention de votre master/D.E.A/D.E.S" value={viewedData.universite_master_dea_ds} />
            <DataRow label="Pays d'obtention de votre Master/D.E.A/D.E.S" value={viewedData.pays_master_dea_ds} />
            <DataRow label="Date d'obtention de votre Master/D.E.A/D.E.S" value={viewedData.date_obtention_master_dea_ds} />
            <DataRow label="A étudié à l'étranger" value={viewedData.a_etudie_etranger} hideEmpty />
            <DataRow label="Université d'obtention de votre Doctorat" value={viewedData.universite_obtention_diplome_doctorat} />
            <DataRow label="Pays d'obtention de votre Doctorat" value={viewedData.pays_obtention_diplome_doctorat} />
            <DataRow label="Date d'obtention de votre Doctorat" value={viewedData.date_obtention_diplome_doctorat} />
            <FileDataRow label="Copie du Diplôme de Doctorat ou Document équivalent" path={viewedData.copie_diplome} />
            <FileDataRow label="Charge horaire" path={viewedData.charge_horaire} />
          </DataSection>

          {viewedData.created_at && (
            <DataSection title="Métadonnées">
              <DataRow label="Date de création" value={new Date(viewedData.created_at).toLocaleDateString('fr-FR')} />
              <DataRow label="Dernière mise à jour" value={viewedData.updated_at ? new Date(viewedData.updated_at).toLocaleDateString('fr-FR') : ''} />
            </DataSection>
          )}
        </div>
      );
    }

    // Contenu pour Assistant
    if (viewType === 'Assistant') {
      return (
        <div className="modal-data">
          <DataSection title="Informations Personnelles">
            {!isPrivateEtablissement(viewedData.type_etablissement) && (
              <DataRow label="Matricule" value={viewedData.matricule} />
            )}
            <DataRow label="Nom" value={viewedData.nom} />
            <DataRow label="Postnom" value={viewedData.postnom} />
            <DataRow label="Prenom" value={viewedData.prenom} hideEmpty />
            <DataRow label="Sexe" value={formatDisplaySexe(viewedData.sexe)} hideEmpty />
            <DataRow label="Date de naissance" value={viewedData.date_naissance} hideEmpty />
            <DataRow label="Lieu de naissance" value={viewedData.lieu_naissance} hideEmpty />
          </DataSection>

          <DataSection title="Informations Administratives">
            <DataRow label="Date d'engagement" value={viewedData.date_engagement} hideEmpty />
            <DataRow label="Domaine de recherche" value={viewedData.domaine_recherche} hideEmpty />
            <DataRow label="Établissement d'attache" value={viewedData.etablissement_attache} hideEmpty />
            <DataRow label="Mandat Assistant" value={viewedData.mandat_assistant} hideEmpty />
            <DataRow label="Catégorie d'Assistant" value={viewedData.categorie_assistant} hideEmpty />
            {viewedData.categorie_assistant === 'Recherche' && (
              <DataRow label="Centre/Laboratoire de Recherche" value={viewedData.centre_laboratoire_recherche} hideEmpty />
            )}
            {!isPrivateEtablissement(viewedData.type_etablissement) && (
              <DataRow label="Prime institutionnelle" value={viewedData.prime_institutionnelle} hideEmpty />
            )}
          </DataSection>

          {shouldShowThirdCycleInfo(viewedData) && (
            <DataSection title="Inscriptions et Statut">
              <DataRow label="Établissement inscription 3e cycle" value={viewedData.etablissement_inscription_3cycle} hideEmpty />
              <DataRow label="Date d'inscription" value={viewedData.date_inscription} hideEmpty />
              <DataRow label="Statut d'apprenant" value={viewedData.statut_apprenant} hideEmpty />
            </DataSection>
          )}

          <DataSection title="Documents">
            <FileDataRow label="Photo passeport" path={viewedData.photo_passeport} />
            <FileDataRow label="Décision de nomination" path={viewedData.decision_nomination} />
            {shouldShowThirdCycleInfo(viewedData) && (
              <FileDataRow label="Décision d'inscription" path={viewedData.decision_inscription} />
            )}
            {!isAssistantRecherche(viewedData.categorie_assistant) && (
              <FileDataRow label="Charge horaire" path={viewedData.charge_horaire} />
            )}
          </DataSection>

          <DataSection title="Confirmation">
            <DataRow label="Commentaires" value={viewedData.commentaires} hideEmpty />
            <DataRow label="Informations confirmées" value={viewedData.informations_vraies ? 'Oui ✓' : 'Non ✗'} />
          </DataSection>

          {viewedData.created_at && (
            <DataSection title="Métadonnées">
              <DataRow label="Date de création" value={new Date(viewedData.created_at).toLocaleDateString('fr-FR')} />
            </DataSection>
          )}
        </div>
      );
    }

    // Contenu pour Chef de Travaux
    if (viewType === 'CT') {
      return (
        <div className="modal-data">
          <DataSection title="Informations Personnelles">
            {!isPrivateEtablissement(viewedData.type_etablissement) && (
              <DataRow label="Matricule" value={viewedData.matricule} />
            )}
            <DataRow label="Nom" value={viewedData.nom} />
            <DataRow label="Postnom" value={viewedData.postnom} />
            <DataRow label="Prenom" value={viewedData.prenom} hideEmpty />
            <DataRow label="Sexe" value={formatDisplaySexe(viewedData.sexe)} hideEmpty />
            <DataRow label="Date de naissance" value={viewedData.date_naissance} hideEmpty />
            <DataRow label="Lieu de naissance" value={viewedData.lieu_naissance} hideEmpty />
          </DataSection>

          <DataSection title="Informations Administratives">
            <DataRow label="Date d'engagement" value={viewedData.date_engagement} hideEmpty />
            <DataRow label="Domaine de recherche" value={viewedData.domaine_recherche} hideEmpty />
            <DataRow label="Établissement d'attache" value={viewedData.etablissement_attache} hideEmpty />
            <DataRow label="Type d'établissement" value={viewedData.type_etablissement === 'Public' ? 'Établissement Public' : viewedData.type_etablissement === 'Privé' ? 'Établissement Privé' : viewedData.type_etablissement} hideEmpty />
            {!isPrivateEtablissement(viewedData.type_etablissement) && (
              <DataRow label="Prime institutionnelle" value={viewedData.prime_institutionnelle} hideEmpty />
            )}
          </DataSection>

          {shouldShowThirdCycleInfo(viewedData) && (
            <DataSection title="Inscriptions et Statut">
              <DataRow label="Établissement inscription 3e cycle" value={viewedData.etablissement_inscription_3cycle} hideEmpty />
              <DataRow label="Date d'inscription" value={viewedData.date_inscription} hideEmpty />
              <DataRow label="Statut d'apprenant" value={viewedData.statut_apprenant} hideEmpty />
            </DataSection>
          )}

          <DataSection title="Documents">
            <FileDataRow label="Arrêté de nomination" path={viewedData.arrete_nomination} />
            <FileDataRow label="Photo passeport" path={viewedData.photo_passeport} />
            {shouldShowThirdCycleInfo(viewedData) && (
              <FileDataRow label="Décision d'inscription" path={viewedData.decision_inscription} />
            )}
            <FileDataRow label="Charge horaire" path={viewedData.charge_horaire} />
          </DataSection>

          <DataSection title="Confirmation">
            <DataRow label="Commentaires" value={viewedData.commentaires} hideEmpty />
            <DataRow label="Informations confirmées" value={viewedData.informations_vraies ? 'Oui ✓' : 'Non ✗'} />
          </DataSection>

          {viewedData.created_at && (
            <DataSection title="Métadonnées">
              <DataRow label="Date de création" value={new Date(viewedData.created_at).toLocaleDateString('fr-FR')} />
            </DataSection>
          )}
        </div>
      );
    }

    return null;
  };

  const handleStartEdit = () => {
    setEditMode(true);
    // typecompte drives which form sections are shown
    const tc = viewType === 'CT' ? 'CT' : viewType === 'Assistant' ? 'Assistant' : 'Professeur';
    setFormData({
      typecompte: tc,
      // ── Common personal fields ────────────────────────────────────────────
      nom: viewedData.nom || '',
      postnom: viewedData.postnom || '',
      prenom: viewedData.prenom || '',
      sexe: viewedData.sexe || '',
      lieu_naissance: viewedData.lieu_naissance || '',
      date_naissance: viewedData.date_naissance || '',
      domaine_recherche: viewedData.domaine_recherche || '',
      prime_institutionnelle: viewedData.prime_institutionnelle || '',
      salaire_base: viewedData.salaire_base || '',
      commentaire_confirmation: viewedData.commentaire_confirmation || viewedData.commentaires || '',
      informations_vraies: viewedData.informations_vraies || false,
      universite_attache: viewedData.universite_attache || viewedData.etablissement_attache || '',
      universite_attache_precisee: viewedData.universite_attache_precisee || '',
      date_engagement: viewedData.date_engagement || '',
      date_soutenance: tc === 'Professeur' ? '' : (viewedData.date_soutenance || viewedData.date_engagement || ''),
      etablissement_inscription_3cycle: viewedData.etablissement_inscription_3cycle || '',
      date_inscription: viewedData.date_inscription || '',
      statut_apprenant: viewedData.statut_apprenant || '',
      // Diploma toggles (common)
      diplome_etat: null,
      diplome_graduat: null,
      diplome_licence: null,
      diplome_master_dea_ds: null,
      has_diplome_etat: viewedData.diplome_etat ? 'Oui' : '',
      has_diplome_graduat: viewedData.diplome_graduat ? 'Oui' : '',
      has_diplome_licence: viewedData.diplome_licence ? 'Oui' : '',
      has_diplome_master_dea_ds: viewedData.diplome_master_dea_ds ? 'Oui' : '',
      universite_master_dea_ds: viewedData.universite_master_dea_ds || '',
      pays_master_dea_ds: viewedData.pays_master_dea_ds || '',
      date_obtention_master_dea_ds: viewedData.date_obtention_master_dea_ds || '',
      // ── Professeur-specific ───────────────────────────────────────────────
      type_etablissement: viewedData.type_etablissement || '',
      matricule_esu: viewedData.matricule_esu || '',
      grade_actuel: viewedData.grade_actuel || '',
      pays_soutenance: '',
      universite_soutenance: '',
      numero_arrete_equivalence: viewedData.numero_arrete_equivalence || '',
      copie_arrete_equivalence: null,
      type_diplome: viewedData.type_diplome || '',
      reference_dernier_arrete: viewedData.reference_dernier_arrete || '',
      photo_identite: null,
      possede_diplome: viewedData.possede_diplome || '',
      copie_diplome: null,
      documents_equivalents: null,
      charge_horaire: null,
      sujet_these: viewedData.sujet_these || '',
      copie_these: null,
      // ── Assistant-specific ────────────────────────────────────────────────
      matricule: viewedData.matricule || '',
      statut: viewedData.mandat_assistant || viewedData.statut || '',
      decision_nomination_assistant: null,
      decision_inscription_ass_ct: null,
      photo_passeport: null,
      // ── CT-specific ───────────────────────────────────────────────────────
      arrete_nomination_ct: null,
    });
    setChangedFields({});
    setEditRecordId(viewedData.id || null);
    setShowViewModal(false);
  };

  const handleEditProfessor = async () => {
    // En mode édition on envoie uniquement les champs modifiés (PATCH partiel) :
    // aucune validation bloquante n'est nécessaire.
    if (Object.keys(changedFields).length === 0) {
      showPopup('Aucune modification détectée', 'info');
      return;
    }

    setLoading(true);

    const retryFetch = async (url, options, maxRetries = 2) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(240000), // 4 minutes timeout pour PATCH
          });
          return response;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };

    try {
      const submitData = new FormData();

      // Mapping des noms de champs formulaire → noms API pour CT
      const CT_FIELD_MAP = {
        date_soutenance:            'date_engagement',
        universite_attache:         'etablissement_attache',
        arrete_nomination_ct:       'arrete_nomination',
        decision_inscription_ass_ct:'decision_inscription',
        commentaire_confirmation:   'commentaires',
      };

      // Ajouter uniquement les champs modifiés
      Object.keys(changedFields).forEach((key) => {
        let value = changedFields[key];

        // Si c'est le champ universite_attache et que la valeur est "AUTRES",
        // utiliser la valeur du champ de précision à la place
        if (key === 'universite_attache' && value === 'AUTRES') {
          value = formData.universite_attache_precisee;
        }

        // Pour CT, remapper les noms de champs formulaire vers les noms API
        const apiKey = formData.typecompte === 'CT' && CT_FIELD_MAP[key] ? CT_FIELD_MAP[key] : key;
        if (formData.type_etablissement === 'Privé' && ['salaire_base', 'matricule', 'prime_institutionnelle'].includes(apiKey)) {
          return;
        }

        if (
          formData.typecompte === 'Professeur' &&
          formData.type_etablissement === 'Privé' &&
          apiKey === 'matricule_esu'
        ) {
          return;
        }

        if (changedFields[key] instanceof File) {
          submitData.append(apiKey, changedFields[key]);
        } else if (value !== null && value !== undefined) {
          submitData.append(apiKey, value);
        }
      });

      if (!editRecordId) {
        throw new Error("Impossible de modifier ce dossier : l'identifiant est introuvable.");
      }

      const editUrl = formData.typecompte === 'Assistant'
        ? `${SERVER_URL}/api/enseignants/assistant/edit/${editRecordId}/`
        : formData.typecompte === 'CT'
          ? `${SERVER_URL}/api/enseignants/chef-travaux/edit/${editRecordId}/`
          : `${SERVER_URL}/api/enseignants/professeur/edit/${editRecordId}/`;

      const response = await retryFetch(editUrl, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await readJsonResponse(response);
        throw new Error(errorData.message || errorData.detail || 'Erreur lors de la modification');
      }

      await readJsonResponse(response);
      showPopup('Dossier modifié avec succès', 'success');
      setEditMode(false);
      setChangedFields({});
      // Si on vient de MyRecord, y retourner après 800ms
      if (onBackToRecord) {
        setTimeout(() => onBackToRecord(), 800);
        return;
      }
      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        postnom: '',
        prenom: '',
        sexe: '',
        type_etablissement: '',
        matricule_esu: '',
        lieu_naissance: '',
        date_naissance: '',
        grade_actuel: '',
        pays_soutenance: '',
        universite_soutenance: '',
        numero_arrete_equivalence: '',
        copie_arrete_equivalence: null,
        date_soutenance: '',
        type_diplome: '',
        universite_attache: '',
        universite_attache_precisee: '',
        reference_dernier_arrete: '',
        prime_institutionnelle: '',
        salaire_base: '',
        photo_identite: null,
        possede_diplome: '',
        copie_diplome: null,
        documents_equivalents: null,
        charge_horaire: null,
        domaine_recherche: '',
        sujet_these: '',
        commentaire_confirmation: '',
        informations_vraies: false,
        diplome_etat: null,
        diplome_graduat: null,
        diplome_licence: null,
        diplome_master_dea_ds: null,
        has_diplome_etat: '',
        has_diplome_graduat: '',
        has_diplome_licence: '',
        has_diplome_master_dea_ds: '',
        universite_master_dea_ds: '',
        pays_master_dea_ds: '',
        date_obtention_master_dea_ds: '',
        universite_obtention_diplome_doctorat: '',
        pays_obtention_diplome_doctorat: '',
        date_obtention_diplome_doctorat: '',
        a_etudie_etranger: '',
      });
    } catch (error) {
      let errorMsg = 'Erreur lors de la modification';
      if (error.name === 'AbortError') {
        errorMsg = 'La requête a expiré';
      } else if (error.message === 'Failed to fetch') {
        console.error('Erreur de connexion réseau lors de la modification');
        return;
      } else if (error.message) {
        errorMsg = error.message;
      }
      showPopup(errorMsg, 'error');
      console.error('Erreur complète:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Validation des champs obligatoires avant soumission ────────────────
  const validateForm = () => {
    const errors = {};
    const errorMessages = [];

    const req = (field, label) => {
      const val = formData[field];
      if (!val || (typeof val === 'string' && val.trim() === '')) {
        errors[field] = true;
        errorMessages.push(label);
      }
    };

    const reqFile = (field, label) => {
      if (!formData[field]) {
        errors[field] = true;
        errorMessages.push(label);
      }
    };

    const reqDiplomaFile = (hasField, fileField, label) => {
      if (formData[hasField] !== 'Oui') {
        errors[hasField] = true;
        errorMessages.push(`${label} (sélectionnez Oui et téléversez le fichier)`);
        return;
      }

      reqFile(fileField, label);
    };

    // Champs communs à tous les types de compte
    req('nom', 'Nom');
    req('postnom', 'Postnom');
    req('sexe', 'Sexe');
    req('lieu_naissance', 'Lieu de Naissance');
    req('date_naissance', 'Date de Naissance');
    if (!formData.informations_vraies) {
      errors['informations_vraies'] = true;
      errorMessages.push("Confirmation des informations (case à cocher)");
    }

    if (['Assistant', 'CT', 'Professeur'].includes(formData.typecompte)) {
      reqDiplomaFile('has_diplome_etat', 'diplome_etat', "Copie du Diplôme d'État ou document équivalent");
      reqDiplomaFile('has_diplome_graduat', 'diplome_graduat', 'Copie du Diplôme de Graduat ou document équivalent');
      if (formData.typecompte === 'Professeur') {
        reqDiplomaFile('has_diplome_licence', 'diplome_licence', 'Copie du Diplôme de Licence ou document équivalent');
      } else {
        req('has_diplome_licence', 'Diplôme de Licence / Médecine');
        if (formData.has_diplome_licence === 'Oui') {
          reqFile('diplome_licence', 'Copie du Diplôme de Licence ou document équivalent');
        }
      }
      if (formData.typecompte === 'Professeur') {
        reqDiplomaFile('has_diplome_master_dea_ds', 'diplome_master_dea_ds', 'Copie du Diplôme de Master / D.E.A / D.E.S ou document équivalent');
      } else {
        req('has_diplome_master_dea_ds', 'Diplôme Master / D.E.A / D.E.S ou document équivalent');
        if (formData.has_diplome_master_dea_ds === 'Oui') {
          reqFile('diplome_master_dea_ds', 'Copie du Diplôme de Master / D.E.A / D.E.S ou document équivalent');
        }
        if (formData.has_diplome_master_dea_ds === 'Non') {
          req('has_inscription_dea_des', 'Êtes-vous inscrit au Master/D.E.A/D.E.S ?');
          if (formData.has_inscription_dea_des === 'Oui') {
            req('etablissement_inscription_3cycle', "Établissement d'Inscription au Troisième Cycle");
            reqFile('decision_inscription_ass_ct', "Décision d'Inscription (D.E.A/D.E.S ou Doctorat/Thèse)");
            req('date_inscription', "Date d'inscription au troisième cycle");
            req('statut_apprenant', 'Statut Apprenant');
          }
        }
      }

      if (formData.type_etablissement !== 'Privé') {
        req('salaire_base', 'Salaire de base');
      }
    }

    if (formData.typecompte === 'Assistant') {
      req('date_soutenance', "Date d'Engagement");
      req('universite_attache', "Établissement d'attache");
      req('domaine_recherche', 'Domaine de Recherche');
      req('type_etablissement', "Type d'Établissement");
      if (formData.type_etablissement === 'Public') {
        req('matricule', 'Matricule');
      }
      req('statut', 'Mandat Assistant (Premier ou Deuxième Mandat)');
      req('categorie_assistant', "Catégorie d'Assistant");
      // Validation du centre de recherche si c'est un Assistant de Recherche
      if (formData.categorie_assistant === 'Recherche') {
        req('centre_laboratoire_recherche', 'Centre/Laboratoire de Recherche');
      }
      // req('statut_apprenant', 'Statut Apprenant');
      // req('date_inscription', "Date d'Inscription");
      if (formData.has_diplome_master_dea_ds === 'Oui') {
        req('type_diplome', 'Type de diplôme Master / D.E.A / D.E.S');
        req('universite_master_dea_ds', "Université d'obtention de votre master/D.E.A/D.E.S");
        req('pays_master_dea_ds', "Pays d'obtention de votre Master/D.E.A/D.E.S");
        req('date_obtention_master_dea_ds', "Date d'obtention de votre Master/D.E.A/D.E.S");
      }
      reqFile('photo_passeport', 'Photo Passeport');
      reqFile('decision_nomination_assistant', 'Décision de nomination comme assistant');
    } else if (formData.typecompte === 'CT') {
      req('prenom', 'Prénom');
      req('date_soutenance', "Date d'Engagement");
      req('universite_attache', "Établissement d'attache");
      req('domaine_recherche', 'Domaine de Recherche');
      req('type_etablissement', "Type d'Établissement");
      if (formData.type_etablissement === 'Public') {
        req('matricule', 'Matricule');
      }
      // req('type_diplome', 'Type de diplôme');
      reqFile('arrete_nomination_ct', 'Arrêté de nomination comme CT');
      if (formData.has_diplome_master_dea_ds === 'Oui') {
        req('type_diplome', 'Type de diplôme Master / D.E.A / D.E.S');
        req('universite_master_dea_ds', "Université d'obtention de votre master/D.E.A/D.E.S");
        req('pays_master_dea_ds', "Pays d'obtention de votre Master/D.E.A/D.E.S");
        req('date_obtention_master_dea_ds', "Date d'obtention de votre Master/D.E.A/D.E.S");
      }
      reqFile('photo_passeport', 'Photo Passeport');
    } else {
      // Professeur — seuls les champs strictement requis par le serveur
      req('prenom', 'Prénom');
      req('a_etudie_etranger', "Avez-vous étudié à l'étranger ?");
      if (formData.has_diplome_master_dea_ds === 'Oui') {
        req('type_diplome_dea_des', 'Type de diplôme Master / D.E.A / D.E.S');
      }
    }

    return { errors, errorMessages };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation complète des champs obligatoires
    const { errors, errorMessages } = validateForm();
    if (errorMessages.length > 0) {
      setFieldErrors(errors);
      // Mettre en évidence les champs en erreur via le DOM
      Object.keys(errors).forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (el) el.classList.add('field-has-error');
      });
      // Scroller vers le premier champ en erreur
      const firstId = Object.keys(errors)[0];
      const firstEl = document.getElementById(firstId);
      if (firstEl) firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Popup avec la liste des champs manquants
      const listMsg = errorMessages.map((m, i) => `${i + 1}. ${m}`).join('\n');
      showPopup(`Champs obligatoires non remplis :\n${listMsg}`, 'error');
      return;
    }

    setLoading(true);
    setMessage(''); // Effacer les messages précédents
    setMessageType(''); // Réinitialiser le type

    const retryFetch = async (url, options, maxRetries = 1) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(240000), // 4 minutes timeout
          });
          return response;
        } catch (error) {
          console.error(`❌ Tentative ${i + 1} échouée:`, error.name, error.message);
          if (i === maxRetries - 1) throw error;
          const delayMs = 1000 * (i + 1);
          await new Promise(resolve => setTimeout(resolve, delayMs)); // Attendre avant retry
        }
      }
    };

    try {
      // Créer FormData pour multipart/form-data
      const submitData = new FormData();

      // Ajouter l'ID du compte connecté
      const currentUser = AuthService.getUser();
      if (currentUser && currentUser.id) {
        submitData.append('compte_id', currentUser.id);
      }

      if (formData.typecompte === 'Assistant') {
        // ── Endpoint: POST /api/enseignants/assistant/add/ ────────────────────────
        const etablissementAttache = formData.universite_attache === 'AUTRES'
          ? formData.universite_attache_precisee
          : formData.universite_attache;

        const ASSISTANT_TEXT_MAP = {
          nom:                              formData.nom,
          postnom:                          formData.postnom,
          prenom:                           formData.prenom,
          sexe:                             formData.sexe,
          date_naissance:                   formData.date_naissance,
          lieu_naissance:                   formData.lieu_naissance,
          date_engagement:                  formData.date_soutenance,
          domaine_recherche:                formData.domaine_recherche,
          etablissement_attache:            etablissementAttache,
          mandat_assistant:                 formData.statut.split(' ')[0], // "Premier Mandat" -> "Premier", "Deuxième Mandat" -> "Deuxième"
          etablissement_inscription_3cycle: shouldShowThirdCycleFields ? formData.etablissement_inscription_3cycle : '',
          statut_apprenant:                 shouldShowThirdCycleFields ? formData.statut_apprenant : '',
          date_inscription:                 shouldShowThirdCycleFields ? formData.date_inscription : '',
          type_etablissement:               formData.type_etablissement,
          prime_institutionnelle:           formData.type_etablissement === 'Privé' ? '' : formData.prime_institutionnelle,
          type_diplome:                     formData.type_diplome,
          type_diplome_dea_des:             formData.type_diplome_dea_des,
          categorie_assistant:              formData.categorie_assistant,
          // Optionnels
          salaire_base:                     formData.type_etablissement === 'Privé' ? '' : formData.salaire_base,
          commentaires:                     formData.commentaire_confirmation,
          informations_vraies:              formData.informations_vraies,
          centre_laboratoire_recherche:     formData.centre_laboratoire_recherche,
        };

        // Ajouter matricule seulement si l'établissement n'est pas privé
        if (formData.type_etablissement !== 'Privé' && formData.matricule && formData.matricule.trim() !== '') {
          submitData.append('matricule', formData.matricule);
        }

        Object.entries(ASSISTANT_TEXT_MAP).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            submitData.append(key, value);
          }
        });

        // ── Fichiers API Assistant ──────────────────────────────────────────
        if (formData.photo_passeport)               submitData.append('photo_passeport',      formData.photo_passeport);
        if (formData.decision_nomination_assistant) submitData.append('decision_nomination',  formData.decision_nomination_assistant);
        if (shouldShowThirdCycleFields && formData.decision_inscription_ass_ct) submitData.append('decision_inscription', formData.decision_inscription_ass_ct);
        // Envoyer charge_horaire seulement pour Assistant Académique
        if (formData.charge_horaire && formData.categorie_assistant === 'Academique') submitData.append('charge_horaire', formData.charge_horaire);
        if (formData.diplome_etat)                  submitData.append('diplome_etat',          formData.diplome_etat);
        if (formData.diplome_graduat)               submitData.append('diplome_graduat',       formData.diplome_graduat);
        if (formData.diplome_licence)               submitData.append('diplome_licence',       formData.diplome_licence);
        if (formData.diplome_master_dea_ds)         submitData.append('diplome_master_dea_ds', formData.diplome_master_dea_ds);

      } else if (formData.typecompte === 'CT') {
        // ── Endpoint: POST /api/enseignants/chef-travaux/add/ ─────────────────────────
        const etablissementAttache = formData.universite_attache === 'AUTRES'
          ? formData.universite_attache_precisee
          : formData.universite_attache;

        // ── Obligatoires ────────────────────────────────────────────────────
        const CT_REQUIRED_MAP = {
          nom:                              formData.nom,
          postnom:                          formData.postnom,
          prenom:                           formData.prenom,
          sexe:                             formData.sexe,
          date_naissance:                   formData.date_naissance,
          lieu_naissance:                   formData.lieu_naissance,
          date_engagement:                  formData.date_soutenance,
          domaine_recherche:                formData.domaine_recherche,
          etablissement_attache:            etablissementAttache,
          type_etablissement:               formData.type_etablissement,
          etablissement_inscription_3cycle: shouldShowThirdCycleFields ? formData.etablissement_inscription_3cycle : '',
          statut_apprenant:                 shouldShowThirdCycleFields ? formData.statut_apprenant : '',
          date_inscription:                 shouldShowThirdCycleFields ? formData.date_inscription : '',
          prime_institutionnelle:           formData.type_etablissement === 'Privé' ? '' : formData.prime_institutionnelle,
          salaire_base:                     formData.type_etablissement === 'Privé' ? '' : formData.salaire_base,
          type_diplome:                     formData.type_diplome,
          type_diplome_dea_des:             formData.type_diplome_dea_des,
        };

        Object.entries(CT_REQUIRED_MAP).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            submitData.append(key, value);
          }
        });

        // ── Matricule (saisi par l'utilisateur, sauf établissement privé) ──
        if (formData.type_etablissement !== 'Privé' && formData.matricule) submitData.append('matricule', formData.matricule);

        if (formData.commentaire_confirmation)    submitData.append('commentaires',       formData.commentaire_confirmation);
        if (formData.informations_vraies !== null && formData.informations_vraies !== undefined) {
          submitData.append('informations_vraies', formData.informations_vraies);
        }

        // ── Fichiers API Chef de Travaux ────────────────────────────────────
        if (formData.arrete_nomination_ct)        submitData.append('arrete_nomination',    formData.arrete_nomination_ct);
        if (formData.photo_passeport)             submitData.append('photo_passeport',      formData.photo_passeport);
        if (shouldShowThirdCycleFields && formData.decision_inscription_ass_ct) submitData.append('decision_inscription', formData.decision_inscription_ass_ct);
        if (formData.charge_horaire)              submitData.append('charge_horaire',        formData.charge_horaire);
        if (formData.diplome_etat)                submitData.append('diplome_etat',          formData.diplome_etat);
        if (formData.diplome_graduat)             submitData.append('diplome_graduat',       formData.diplome_graduat);
        if (formData.diplome_licence)             submitData.append('diplome_licence',       formData.diplome_licence);
        if (formData.diplome_master_dea_ds)       submitData.append('diplome_master_dea_ds', formData.diplome_master_dea_ds);

      } else {
        // ── Endpoint: POST /api/bnn/enseignant/add/ (Professeur) ──────────────────────────
        const univAttache = formData.universite_attache === 'AUTRES'
          ? formData.universite_attache_precisee
          : formData.universite_attache;

        const PROF_TEXT_MAP = {
          nom:                        formData.nom,
          postnom:                    formData.postnom,
          prenom:                     formData.prenom,
          sexe:                       formData.sexe,
          type_etablissement:         formData.type_etablissement,
          matricule_esu:              formData.type_etablissement === 'Public' ? formData.matricule_esu : '',
          lieu_naissance:             formData.lieu_naissance,
          date_naissance:             formData.date_naissance,
          grade_actuel:               formData.grade_actuel,
          numero_arrete_equivalence:  formData.numero_arrete_equivalence,
          type_diplome:               formData.type_diplome,
          universite_attache:         univAttache,
          date_engagement:            formData.date_engagement,
          reference_dernier_arrete:   formData.grade_actuel === 'DT' ? '' : formData.reference_dernier_arrete,
          prime_institutionnelle:     formData.type_etablissement === 'Privé' ? '' : formData.prime_institutionnelle,
          salaire_base:               formData.type_etablissement === 'Privé' ? '' : formData.salaire_base,
          possede_diplome:                 formData.possede_diplome,
          domaine_recherche:               formData.domaine_recherche,
          sujet_these:                     formData.sujet_these,
          universite_obtention_diplome_doctorat: formData.universite_obtention_diplome_doctorat,
          pays_obtention_diplome_doctorat:       formData.pays_obtention_diplome_doctorat,
          date_obtention_diplome_doctorat:       formData.date_obtention_diplome_doctorat,
          a_etudie_etranger:              formData.a_etudie_etranger,
          commentaire_confirmation:        formData.commentaire_confirmation,
          informations_vraies:             formData.informations_vraies,
          universite_master_dea_ds:        formData.universite_master_dea_ds,
          pays_master_dea_ds:              formData.pays_master_dea_ds,
          date_obtention_master_dea_ds:    formData.date_obtention_master_dea_ds,
          type_diplome_dea_des:            formData.type_diplome_dea_des,
        };

        Object.entries(PROF_TEXT_MAP).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            submitData.append(key, value);
          }
        });

        // ── Fichiers API Professeur ─────────────────────────────────────────
        if (formData.photo_identite)           submitData.append('photo_identite',           formData.photo_identite);
        if (formData.copie_diplome)            submitData.append('copie_diplome',            formData.copie_diplome);
        // if (formData.copie_arrete_equivalence) submitData.append('copie_arrete_equivalence', formData.copie_arrete_equivalence);
        if (formData.documents_equivalents)    submitData.append('documents_equivalents',    formData.documents_equivalents);
        if (formData.charge_horaire)           submitData.append('charge_horaire',           formData.charge_horaire);
        if (formData.diplome_etat)             submitData.append('diplome_etat',             formData.diplome_etat);
        if (formData.diplome_graduat)          submitData.append('diplome_graduat',          formData.diplome_graduat);
        if (formData.diplome_licence)          submitData.append('diplome_licence',          formData.diplome_licence);
        if (formData.diplome_master_dea_ds)    submitData.append('diplome_master_dea_ds',    formData.diplome_master_dea_ds);
      } // fin branches Professeur / Assistant / CT
      // Endpoint par type d'enseignant
      const submitUrl = formData.typecompte === 'Assistant'
        ? `${SERVER_URL}/api/enseignants/assistant/add/`
        : formData.typecompte === 'CT'
          ? `${SERVER_URL}/api/enseignants/chef-travaux/add/`
          : `${API_BASE_URL}enseignant/add/`;

      const startTime = performance.now();
      const response = await retryFetch(submitUrl, {
        method: 'POST',
        body: submitData,
        // Ne pas ajouter de Content-Type, FormData le fait automatiquement
      });
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      if (response.ok) {
        const result = await response.json();
        const successMsg = result.message || 'Enregistrement réalisé avec succès';
        const detailsMessage = result.data && result.data.id
          ? ` - ID: ${result.data.id}${result.data.matricule_esu ? `, Matricule: ${result.data.matricule_esu}` : ''}`
          : '';
        
        setSuccessMessage(successMsg + detailsMessage);
        setShowSuccessModal(true);

        // Supprimer le brouillon après enregistrement réussi
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (error) {
          console.error('Erreur lors de la suppression du brouillon:', error);
        }

        // Si on vient de MyRecord, y retourner après fermeture du modal de succès
        if (onBackToRecord) {
          setTimeout(() => onBackToRecord(), 2000);
        }

        // Réinitialiser le formulaire
        setFormData({
          nom: '',
          postnom: '',
          prenom: '',
          sexe: '',
          type_etablissement: '',
          matricule_esu: '',
          lieu_naissance: '',
          date_naissance: '',
          grade_actuel: '',
          pays_soutenance: '',
          universite_soutenance: '',
          numero_arrete_equivalence: '',
          copie_arrete_equivalence: null,
          date_soutenance: '',
          type_diplome: '',
          universite_attache: '',
          universite_attache_precisee: '',
          reference_dernier_arrete: '',
          prime_institutionnelle: '',
          salaire_base: '',
          photo_identite: null,
          possede_diplome: '',
          copie_diplome: null,
          documents_equivalents: null,
          charge_horaire: null,
          domaine_recherche: '',
          sujet_these: '',
          universite_obtention_diplome_doctorat: '',
          pays_obtention_diplome_doctorat: '',
          date_obtention_diplome_doctorat: '',
          commentaire_confirmation: '',
          informations_vraies: false,
        });
        setLoading(false);
        return;
      } else {
        let errorMsg = 'Une erreur est survenue lors de la création du professeur';
        let isMatriculeError = false;

        try {
          const result = await response.json();
          // Vérifier si c'est une erreur de matricule existant
          if (response.status === 400 && result.matricule_esu &&
            Array.isArray(result.matricule_esu) &&
            result.matricule_esu.some(msg => msg.includes('existe déjà'))) {
            errorMsg = 'Désolé, il semble que votre matricule existe déjà, pour plus d\'information contacter le conseiller chargé du numérique via\nle numéro : (+243 812 044 120)';
            isMatriculeError = true;
          } else if (result.message) {
            // Extraire le message détaillé du serveur
            errorMsg = result.message;
          } else if (result.error) {
            errorMsg = result.error;
          } else if (result.details) {
            errorMsg = JSON.stringify(result.details, null, 2);
          } else if (typeof result === 'object' && result !== null) {
            // Erreurs de validation DRF : { "field": ["message"] }
            const fieldErrors = Object.entries(result)
              .map(([field, msgs]) => {
                const msgText = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
                return `• ${field} : ${msgText}`;
              })
              .join('\n');
            if (fieldErrors) errorMsg = fieldErrors;
          }

          console.error('❌ Réponse d\'erreur du serveur:', {
            status: response.status,
            statusText: response.statusText,
            message: errorMsg,
            fullResponse: result,
          });
        } catch (e) {
          // Si la réponse n'est pas du JSON valide
          const errorDescriptions = {
            400: 'Données invalides envoyées',
            401: 'Authentification requise',
            403: 'Accès refusé',
            404: 'Endpoint non trouvé',
            409: 'Conflit (données en doublon?)',
            500: 'Erreur serveur interne',
            503: 'Service indisponible',
          };

          errorMsg = errorDescriptions[response.status] || `Erreur HTTP ${response.status}`;
          if (response.statusText) {
            errorMsg += ` (${response.statusText})`;
          }

          console.error('❌ Erreur serveur (pas de JSON):', {
            status: response.status,
            statusText: response.statusText,
            parseError: e.message,
          });
        }

        // Ajouter des conseils selon le type d'erreur (sauf pour le matricule existant qui a déjà son message)
        let userFriendlyMsg = errorMsg;
        if (response.status === 400 && !errorMsg.includes('matricule existe déjà')) {
          userFriendlyMsg += '\n\n💡 Conseil: Vérifiez que tous les champs obligatoires sont remplis correctement.';
        } else if (response.status === 409) {
          userFriendlyMsg += '\n\n💡 Conseil: Ce matricule existe peut-être déjà. Vérifiez le matricule ESU.';
        } else if (response.status >= 500) {
          userFriendlyMsg += '\n\n💡 Conseil: Le serveur rencontre des problèmes. Veuillez réessayer dans quelques instants.';
        }

        // Afficher le modal pour l'erreur matricule, sinon le popup normal
        if (isMatriculeError) {
          setErrorModalMessage(userFriendlyMsg);
          setShowErrorModal(true);
        } else {
          showPopup(userFriendlyMsg, 'error');
        }
        console.error('📢 Message d\'erreur affiché:', userFriendlyMsg);
        setLoading(false);
        return;
      }
    } catch (error) {
      let errorMsg = 'Erreur lors de l\'enregistrement';

      console.error('=== ERREUR COMPLÈTE ===');
      console.error('Nom:', error.name);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);

      if (error.name === 'AbortError') {
        errorMsg = '⏱️ La requête a expiré (timeout)\n\n' +
          'Le serveur met trop de temps à répondre (plus de 2 minutes).\n\n' +
          '💡 Solutions possibles:\n' +
          '• Les fichiers uploadés sont trop volumineux\n' +
          '• Le serveur est surchargé\n' +
          '• Votre connexion Internet est lente\n\n' +
          'Veuillez réessayer avec des fichiers plus petits.';
      } else if (error.message === 'Failed to fetch') {
        // Ignorer silencieusement les erreurs de connexion réseau
        console.error('Erreur de connexion réseau détectée');
        return;
      } else if (error.message && error.message.includes('CORS')) {
        errorMsg = '🔒 Erreur CORS\n\n' +
          'Le serveur n\'autorise pas l\'accès depuis votre domaine.\n\n' +
          'Contactez l\'administrateur du serveur.';
      } else if (error.message && error.message.includes('JSON')) {
        errorMsg = '⚠️ Réponse invalide du serveur\n\n' +
          'Le serveur a envoyé une réponse mal formatée.\n\n' +
          '💡 Conseil: Contactez le support technique.';
      } else {
        errorMsg = error.message || 'Une erreur inconnue s\'est produite. Veuillez réessayer.';
      }

      showPopup(errorMsg, 'error');
      console.error('❌ Message d\'erreur affiché:', errorMsg);
      setLoading(false);
    }
  };

  const shouldShowThirdCycleFields =
    formData.has_diplome_master_dea_ds === 'Non' && formData.has_inscription_dea_des === 'Oui';

  const renderThirdCycleFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="etablissement_inscription_3cycle">Établissement d'Inscription au Troisième Cycle <span className="required">*</span></label>
        <input
          type="text"
          id="etablissement_inscription_3cycle"
          name="etablissement_inscription_3cycle"
          value={formData.etablissement_inscription_3cycle}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="decision_inscription_ass_ct">Décision d'Inscription (D.E.A/D.E.S ou Doctorat/Thèse) <span className="required">*</span></label>
        <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
        <input
          type="file"
          id="decision_inscription_ass_ct"
          name="decision_inscription_ass_ct"
          accept={ALLOWED_FILE_ACCEPT}
          onChange={handleFileChange}
          required={!formData.decision_inscription_ass_ct}
        />
        {formData.decision_inscription_ass_ct && (
          <small className="file-info">✅ Fichier sélectionné: {formData.decision_inscription_ass_ct.name}</small>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="date_inscription">Date d'inscription au troisième cycle <span className="required">*</span></label>
        <input
          type="date"
          id="date_inscription"
          name="date_inscription"
          value={formData.date_inscription}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="statut_apprenant">Statut Apprenant <span className="required">*</span></label>
        <select
          id="statut_apprenant"
          name="statut_apprenant"
          value={formData.statut_apprenant}
          onChange={handleInputChange}
          required
        >
          <option value="">-- Sélectionner --</option>
          <option value="DEA/DES">D.E.A/D.E.S</option>
          <option value="Doctorat">Doctorat</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="professor-registration-form">
      {/* ── Header pleine largeur ── */}
      <header className="form-header">
        <div className="form-header-left">
          <img src="/app-logo.png" alt="Logo MINESURSI" className="form-header-logo" />
          <div className="form-header-titles">
            <h1 className="form-header-title">{(() => {
              const t = formData && formData.typecompte ? formData.typecompte : '';
              if (t === 'Assistant') return "Registre d'Identification des Assistants";
              if (t === 'CT') return "Registre d'Identification des Chefs de Travaux";
              return "Registre d'Identification des Professeurs";
            })()}</h1>
            <p className="form-header-subtitle">{(formData && (formData.typecompte === 'Assistant' || formData.typecompte === 'CT')) ? 'Corps scientifique du MINESURSI' : 'Corps académique du MINESURSI'}</p>
          </div>
        </div>
        <div className="form-header-right">
          {currentUser && (
            <button
              type="button"
              className="mr-user-btn"
              onClick={() => setShowProfileSidebar(true)}
              title="Voir mon profil"
            >
              <UserInfo user={currentUser} />
            </button>
          )}
          <a
            href="/guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mr-guide-btn"
            title="Consulter le guide d'utilisation"
          >
            Guide
          </a>
          {onLogout && (
            <button
              type="button"
              className="mr-logout-btn"
              onClick={onLogout}
              title="Se déconnecter"
            >
              <FaSignOutAlt /> Déconnexion
            </button>
          )}
        </div>
      </header>

      {/* ── Contenu centré ── */}
      <div className="form-body">

      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}

      {popupMessage && (
        <div className={`popup-message popup-${popupType}`} role="alert" aria-live="assertive">
          {popupMessage}
        </div>
      )}

      {/* Indicateur de sauvegarde du brouillon */}
      {draftSaved && (
        <div className="draft-saved-indicator">
          ✓ Brouillon sauvegardé
        </div>
      )}

      <div className="form-toolbar">
        {onBackToRecord && (
          <button
            type="button"
            className="btn-back-to-record"
            onClick={onBackToRecord}
          >
            <FaArrowLeft /> Retour à mon dossier
          </button>
        )}
      </div>

      {editMode && (
        <div className="edit-mode-banner">
          Mode édition activé
          {([formData.nom || preloadedRecord?.nom, formData.postnom || preloadedRecord?.postnom].filter(Boolean).join(' ')) &&
            ` — ${[formData.nom || preloadedRecord?.nom, formData.postnom || preloadedRecord?.postnom].filter(Boolean).join(' ')}`
          }
        </div>
      )}

      {/* If no account type is set, ask the parent App to show the global chooser (avoid duplicating) */}
      

      

          {/* Confirmation modal when changing account type */}
          {showTypeChangeModal && (
            <div className="modal-overlay" onClick={() => { setShowTypeChangeModal(false); setPendingTypeSelection(''); }}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Confirmer le changement de type</h2>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => { setShowTypeChangeModal(false); setPendingTypeSelection(''); }}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <p>Vous changez le type de compte de <strong>{previousType || 'Non renseigné'}</strong> vers <strong>{pendingTypeSelection}</strong>.</p>
                  <p>Les champs suivants seront effacés et les fichiers associés perdus :</p>
                  <ul>
                    {(() => {
                      const items = [];
                      if (previousType === 'Assistant' && pendingTypeSelection !== 'Assistant') {
                        if (formData.decision_nomination_assistant) items.push('Décision de nomination (assistant)');
                        if (formData.statut) items.push('Statut');
                      }
                      if (previousType === 'CT' && pendingTypeSelection !== 'CT') {
                        if (formData.arrete_nomination_ct) items.push('Arrêté de nomination (CT)');
                      }
                      if (items.length === 0) return <li>Aucun champ sensible détecté.</li>;
                      return items.map((it) => <li key={it}>{it}</li>);
                    })()}
                  </ul>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowTypeChangeModal(false);
                      setPendingTypeSelection('');
                      // remettre l'ancien type dans le formulaire
                      setFormData({ ...formData, typecompte: previousType });
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={confirmTypeChange}
                  >
                    Confirmer et effacer
                  </button>
                </div>
              </div>
            </div>
          )}

      <form style={{ display: (!editMode && !formData.typecompte) ? 'none' : 'block' }} onSubmit={editMode ? (e) => { e.preventDefault(); handleEditProfessor(); } : handleSubmit} encType="multipart/form-data" noValidate={editMode}>
        {/* Type de compte (géré via le bouton 'Changer le type de compte') */}
        <input type="hidden" name="typecompte" value={formData.typecompte} />

        {/* Section Informations Assistants (only for Assistant) */}
        {formData.typecompte === 'Assistant' && (
          <fieldset>
            <legend><FaUser /> Informations Assistants</legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nom">Nom <span className="required">*</span></label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="postnom">Postnom <span className="required">*</span></label>
                <input
                  type="text"
                  id="postnom"
                  name="postnom"
                  value={formData.postnom}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prenom">Prénom <span className="required">*</span></label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date_naissance">Date de Naissance <span className="required">*</span></label>
                <input
                  type="date"
                  id="date_naissance"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sexe">Sexe <span className="required">*</span></label>
                <select
                  id="sexe"
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="lieu_naissance">Lieu de Naissance <span className="required">*</span></label>
                <input
                  type="text"
                  id="lieu_naissance"
                  name="lieu_naissance"
                  value={formData.lieu_naissance}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="date_soutenance">Date d'Engagement <span className="required">*</span></label>
              <input
                type="date"
                id="date_soutenance"
                name="date_soutenance"
                value={formData.date_soutenance}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="domaine_recherche">Domaine de Recherche <span className="required">*</span></label>
              <input
                type="text"
                id="domaine_recherche"
                name="domaine_recherche"
                value={formData.domaine_recherche}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="categorie_assistant">Catégorie d'Assistant <span className="required">*</span></label>
              <select
                id="categorie_assistant"
                name="categorie_assistant"
                value={formData.categorie_assistant}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                {CATEGORIE_ASSISTANT_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.categorie_assistant === 'Recherche' && (
              <div className="form-group">
                <label htmlFor="centre_laboratoire_recherche">Centre/Laboratoire de Recherche <span className="required">*</span></label>
                <input
                  type="text"
                  id="centre_laboratoire_recherche"
                  name="centre_laboratoire_recherche"
                  value={formData.centre_laboratoire_recherche}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="photo_passeport">Photo Passeport <span className="required">*</span></label>
              <small className="file-hint">{PHOTO_LABEL}</small>
              <input
                type="file"
                id="photo_passeport"
                name="photo_passeport"
                accept={PHOTO_ACCEPT}
                onChange={handleFileChange}
                required={!formData.photo_passeport}
              />
              {filePreviews.photo_passeport && (
                <img src={filePreviews.photo_passeport} alt="Aperçu photo passeport" className="file-preview-img" />
              )}
              {!filePreviews.photo_passeport && formData.photo_passeport && (
                <small className="file-info">✅ Fichier sélectionné : {formData.photo_passeport.name}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="type_etablissement">Type d'Établissement d'Attache (Privé ou Public) <span className="required">*</span></label>
              <select
                id="type_etablissement"
                name="type_etablissement"
                value={formData.type_etablissement}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="Public">Établissement Public</option>
                <option value="Privé">Établissement Privé</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="universite_attache">Établissement d'attache <span className="required">*</span></label>
              <Select
                id="universite_attache"
                name="universite_attache"
                className={fieldErrors.universite_attache ? 'select-has-error' : undefined}
                options={universityOptions}
                value={selectedUniversityOption}
                onChange={handleUniversityChange}
                placeholder={universitySelectPlaceholder}
                isDisabled={isUniversitySelectDisabled}
                isClearable
              />
            </div>

            {!isPrivateEtablissement(formData.type_etablissement) && (
              <div className="form-group">
                <label htmlFor="matricule">
                  Matricule {formData.type_etablissement === 'Public' ? <span className="required">*</span> : <span className="optional">(optionnel)</span>}
                </label>
                <input
                  type="text"
                  id="matricule"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleInputChange}
                  required={formData.type_etablissement === 'Public'}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="statut">Assistant Premier ou Deuxième Mandat <span className="required">*</span></label>
              <select
                id="statut"
                name="statut"
                value={formData.statut}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="Premier Mandat">Premier Mandat</option>
                <option value="Deuxième Mandat">Deuxième Mandat</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="decision_nomination_assistant">Téléverser la décision de nomination comme assistant premier mandat ou deuxième mandat <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input
                type="file"
                id="decision_nomination_assistant"
                name="decision_nomination_assistant"
                accept={ALLOWED_FILE_ACCEPT}
                onChange={handleFileChange}
                required={!formData.decision_nomination_assistant}
              />
              {formData.decision_nomination_assistant && (
                <small className="file-info">✅ Fichier sélectionné: {formData.decision_nomination_assistant.name}</small>
              )}
            </div>

          </fieldset>
        )}

        {/* Section Documents à Télécharger for Assistant */}
        {formData.typecompte === 'Assistant' && (
        <fieldset>
          <legend><FaFileAlt /> Documents à Télécharger</legend>

          {/* Diplôme d'État */}
          <div className="form-group">
            <label htmlFor="has_diplome_etat_ass">Avez-vous un Diplôme d'État ou document équivalent ? <span className="required">*</span></label>
            <select id="has_diplome_etat_ass" name="has_diplome_etat" value={formData.has_diplome_etat} onChange={handleInputChange} required>
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_etat === 'Oui' && (
            <div className="form-group">
              <label htmlFor="diplome_etat_ass">Téléverser la copie du diplôme d'État ou d'un document équivalent. <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input type="file" id="diplome_etat_ass" name="diplome_etat" accept={ALLOWED_FILE_ACCEPT} onChange={handleFileChange} required={!formData.diplome_etat} />
              {formData.diplome_etat && <small className="file-info">✅ Fichier sélectionné: {formData.diplome_etat.name}</small>}
            </div>
          )}

          {/* Diplôme de Graduat */}
          <div className="form-group">
            <label htmlFor="has_diplome_graduat_ass">Avez-vous un Diplôme de Graduat ou Document équivalent ? <span className="required">*</span></label>
            <select id="has_diplome_graduat_ass" name="has_diplome_graduat" value={formData.has_diplome_graduat} onChange={handleInputChange} required>
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_graduat === 'Oui' && (
            <div className="form-group">
              <label htmlFor="diplome_graduat_ass">Copie du Diplôme de Graduat ou Document équivalent <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input type="file" id="diplome_graduat_ass" name="diplome_graduat" accept={ALLOWED_FILE_ACCEPT} onChange={handleFileChange} required={!formData.diplome_graduat} />
              {formData.diplome_graduat && <small className="file-info">✅ Fichier sélectionné: {formData.diplome_graduat.name}</small>}
            </div>
          )}

          {/* Diplôme de Licence */}
          <div className="form-group">
            <label htmlFor="has_diplome_licence_ass">Avez-vous un Diplôme de Licence / Medecine ? <span className="required">*</span></label>
            <select id="has_diplome_licence_ass" name="has_diplome_licence" value={formData.has_diplome_licence} onChange={handleInputChange} required>
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_licence === 'Oui' && (
            <div className="form-group">
              <label htmlFor="diplome_licence_ass">Copie du Diplôme de Licence ou Document équivalent <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input type="file" id="diplome_licence_ass" name="diplome_licence" accept={ALLOWED_FILE_ACCEPT} onChange={handleFileChange} required={!formData.diplome_licence} />
              {formData.diplome_licence && <small className="file-info">✅ Fichier sélectionné: {formData.diplome_licence.name}</small>}
            </div>
          )}
          {/* Diplôme Master / D.E.A / D.E.S */}
          <div className="form-group">
            <label htmlFor="has_diplome_master_ass">Avez-vous un Diplôme Master / D.E.A / D.E.S  ou Document équivalent ? <span className="required">*</span></label>
            <select id="has_diplome_master_ass" name="has_diplome_master_dea_ds" value={formData.has_diplome_master_dea_ds} onChange={handleInputChange} required>
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_master_dea_ds === 'Non' && (
            <div className="form-group">
              <label htmlFor="has_inscription_dea_des_ass">Êtes-vous inscrit au Master/D.E.A/D.E.S ? <span className="required">*</span></label>
              <select
                id="has_inscription_dea_des_ass"
                name="has_inscription_dea_des"
                value={formData.has_inscription_dea_des}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
          )}
          {shouldShowThirdCycleFields && renderThirdCycleFields()}
          {formData.has_diplome_master_dea_ds === 'Oui' && (
            <>
              <div className="form-group">
                <label htmlFor="type_diplome_ass">Type de diplôme Master / D.E.A / D.E.S <span className="required">*</span></label>
                <select
                  id="type_diplome_ass"
                  name="type_diplome"
                  value={formData.type_diplome}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="Academique">Académique</option>
                  <option value="Professionnel">Professionnel</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="diplome_master_ass">Copie du Diplôme de Master / D.E.A / D.E.S ou Document équivalent <span className="required">*</span></label>
                <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
                <input type="file" id="diplome_master_ass" name="diplome_master_dea_ds" accept={ALLOWED_FILE_ACCEPT} onChange={handleFileChange} required={!formData.diplome_master_dea_ds} />
                {formData.diplome_master_dea_ds && <small className="file-info">✅ Fichier sélectionné: {formData.diplome_master_dea_ds.name}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="universite_master_dea_ds_ass">Université d'obtention de votre master/D.E.A/D.E.S <span className="required">*</span></label>
                <input type="text" id="universite_master_dea_ds_ass" name="universite_master_dea_ds" value={formData.universite_master_dea_ds} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="pays_master_dea_ds_ass">Pays d'obtention de votre Master/D.E.A/D.E.S <span className="required">*</span></label>
                <Select
                  id="pays_master_dea_ds_ass"
                  name="pays_master_dea_ds"
                  className={fieldErrors.pays_master_dea_ds ? 'select-has-error' : undefined}
                  options={COUNTRIES}
                  value={formData.pays_master_dea_ds ? COUNTRIES.find(c => c.value === formData.pays_master_dea_ds) : null}
                  onChange={(selectedOption) => handleDiplomaCountryChange('pays_master_dea_ds', selectedOption)}
                  placeholder="Sélectionner ou rechercher un pays..."
                  isSearchable={true}
                  isClearable={true}
                  noOptionsMessage={() => 'Aucun pays trouvé'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="date_obtention_master_dea_ds_ass">Date d'obtention de votre Master/D.E.A/D.E.S <span className="required">*</span></label>
                <input type="date" id="date_obtention_master_dea_ds_ass" name="date_obtention_master_dea_ds" value={formData.date_obtention_master_dea_ds} onChange={handleInputChange} required />
              </div>
            </>
          )}
        </fieldset>
        )}

        {/* Charge Horaire for Assistant Académique */}
        {formData.typecompte === 'Assistant' && formData.categorie_assistant === 'Academique' && (
          <fieldset>
            <legend>Charge Horaire</legend>
            <div className="form-group">
              <label htmlFor="charge_horaire_ass">Charge horaire validée par une autorité décanale / Académique <span className="optional">(optionnel)</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input
                type="file"
                id="charge_horaire_ass"
                name="charge_horaire"
                accept={ALLOWED_FILE_ACCEPT}
                onChange={handleFileChange}
              />
              {formData.charge_horaire && (
                <small className="file-info">✅ Fichier sélectionné: {formData.charge_horaire.name}</small>
              )}
            </div>
          </fieldset>
        )}

        {/* Section Informations CT (only for CT) */}
        {formData.typecompte === 'CT' && (
          <fieldset>
            <legend><FaUser /> Informations CT (Chef de Travaux)</legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nom">Nom <span className="required">*</span></label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="postnom">Postnom <span className="required">*</span></label>
                <input
                  type="text"
                  id="postnom"
                  name="postnom"
                  value={formData.postnom}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prenom">Prénom <span className="required">*</span></label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date_naissance">Date de Naissance <span className="required">*</span></label>
                <input
                  type="date"
                  id="date_naissance"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sexe">Sexe <span className="required">*</span></label>
                <select
                  id="sexe"
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="lieu_naissance">Lieu de Naissance <span className="required">*</span></label>
                <input
                  type="text"
                  id="lieu_naissance"
                  name="lieu_naissance"
                  value={formData.lieu_naissance}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="date_soutenance">Date d'Engagement <span className="required">*</span></label>
              <input
                type="date"
                id="date_soutenance"
                name="date_soutenance"
                value={formData.date_soutenance}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="domaine_recherche">Domaine de Recherche <span className="required">*</span></label>
              <input
                type="text"
                id="domaine_recherche"
                name="domaine_recherche"
                value={formData.domaine_recherche}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="arrete_nomination_ct">Téléverser votre arrêté de nomination comme CT <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input
                type="file"
                id="arrete_nomination_ct"
                name="arrete_nomination_ct"
                accept={ALLOWED_FILE_ACCEPT}
                onChange={handleFileChange}
                required={!formData.arrete_nomination_ct}
              />
              {formData.arrete_nomination_ct && (
                <small className="file-info">✅ Fichier sélectionné: {formData.arrete_nomination_ct.name}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="photo_passeport">Photo Passeport <span className="required">*</span></label>
              <small className="file-hint">{PHOTO_LABEL}</small>
              <input
                type="file"
                id="photo_passeport"
                name="photo_passeport"
                accept={PHOTO_ACCEPT}
                onChange={handleFileChange}
                required={!formData.photo_passeport}
              />
              {filePreviews.photo_passeport && (
                <img src={filePreviews.photo_passeport} alt="Aperçu photo passeport" className="file-preview-img" />
              )}
              {!filePreviews.photo_passeport && formData.photo_passeport && (
                <small className="file-info">✅ Fichier sélectionné : {formData.photo_passeport.name}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="type_etablissement">Type d'Établissement d'Attache (Privé ou Public) <span className="required">*</span></label>
              <select
                id="type_etablissement"
                name="type_etablissement"
                value={formData.type_etablissement}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="Public">Établissement Public</option>
                <option value="Privé">Établissement Privé</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="universite_attache">Établissement d'attache <span className="required">*</span></label>
              <Select
                id="universite_attache"
                name="universite_attache"
                className={fieldErrors.universite_attache ? 'select-has-error' : undefined}
                options={universityOptions}
                value={selectedUniversityOption}
                onChange={handleUniversityChange}
                placeholder={universitySelectPlaceholder}
                isDisabled={isUniversitySelectDisabled}
                isClearable
              />
            </div>

            {!isPrivateEtablissement(formData.type_etablissement) && (
              <div className="form-group">
                <label htmlFor="matricule">
                  Matricule {formData.type_etablissement === 'Public' ? <span className="required">*</span> : <span className="optional">(optionnel)</span>}
                </label>
                <input
                  type="text"
                  id="matricule"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleInputChange}
                  required={formData.type_etablissement === 'Public'}
                />
              </div>
            )}

          </fieldset>
        )}

        {/* Section Documents à Télécharger for CT */}
        {formData.typecompte === 'CT' && (
        <fieldset>
          <legend><FaFileAlt /> Documents à Télécharger</legend>

          {/* Diplôme d'État */}
          <div className="form-group">
            <label htmlFor="has_diplome_etat_ct">Avez-vous un Diplôme d'État ou document équivalent ? <span className="required">*</span></label>
            <select id="has_diplome_etat_ct" name="has_diplome_etat" value={formData.has_diplome_etat} onChange={handleInputChange} required>
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_etat === 'Oui' && (
            <div className="form-group">
              <label htmlFor="diplome_etat_ct">Téléverser la copie du diplôme d'État ou d'un document équivalent. <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input type="file" id="diplome_etat_ct" name="diplome_etat" accept={ALLOWED_FILE_ACCEPT} onChange={handleFileChange} required={!formData.diplome_etat} />
              {formData.diplome_etat && <small className="file-info">✅ Fichier sélectionné: {formData.diplome_etat.name}</small>}
            </div>
          )}

          {/* Diplôme de Graduat */}
          <div className="form-group">
            <label htmlFor="has_diplome_graduat_ct">Avez-vous un Diplôme de Graduat ou Document équivalent ? <span className="required">*</span></label>
            <select id="has_diplome_graduat_ct" name="has_diplome_graduat" value={formData.has_diplome_graduat} onChange={handleInputChange} required>
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_graduat === 'Oui' && (
            <div className="form-group">
              <label htmlFor="diplome_graduat_ct">Copie du Diplôme de Graduat ou Document équivalent <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input type="file" id="diplome_graduat_ct" name="diplome_graduat" accept={ALLOWED_FILE_ACCEPT} onChange={handleFileChange} required={!formData.diplome_graduat} />
              {formData.diplome_graduat && <small className="file-info">✅ Fichier sélectionné: {formData.diplome_graduat.name}</small>}
            </div>
          )}

          {/* Diplôme de Licence */}
          <div className="form-group">
            <label htmlFor="has_diplome_licence_ct">Avez-vous un Diplôme de Licence / de Médecine ? <span className="required">*</span></label>
            <select id="has_diplome_licence_ct" name="has_diplome_licence" value={formData.has_diplome_licence} onChange={handleInputChange} required>
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_licence === 'Oui' && (
            <div className="form-group">
              <label htmlFor="diplome_licence_ct">Copie du Diplôme de Licence  ou Document équivalent <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input type="file" id="diplome_licence_ct" name="diplome_licence" accept={ALLOWED_FILE_ACCEPT} onChange={handleFileChange} required={!formData.diplome_licence} />
              {formData.diplome_licence && <small className="file-info">✅ Fichier sélectionné: {formData.diplome_licence.name}</small>}
            </div>
          )}
          {/* Diplôme Master / D.E.A / D.E.S */}
          <div className="form-group">
            <label htmlFor="has_diplome_master_ct">Avez-vous un Diplôme Master / D.E.A / D.E.S ou Document équivalent ? <span className="required">*</span></label>
            <select id="has_diplome_master_ct" name="has_diplome_master_dea_ds" value={formData.has_diplome_master_dea_ds} onChange={handleInputChange} required>
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_master_dea_ds === 'Non' && (
            <div className="form-group">
              <label htmlFor="has_inscription_dea_des_ct">Êtes-vous inscrit au Master/D.E.A/D.E.S ? <span className="required">*</span></label>
              <select
                id="has_inscription_dea_des_ct"
                name="has_inscription_dea_des"
                value={formData.has_inscription_dea_des}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
          )}
          {shouldShowThirdCycleFields && renderThirdCycleFields()}
          {formData.has_diplome_master_dea_ds === 'Oui' && (
            <>
              <div className="form-group">
                <label htmlFor="type_diplome_ct">Type de diplôme Master / D.E.A / D.E.S <span className="required">*</span></label>
                <select
                  id="type_diplome_ct"
                  name="type_diplome"
                  value={formData.type_diplome}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="Academique">Académique</option>
                  <option value="Professionnel">Professionnel</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="diplome_master_ct">Copie du Diplôme de Master / D.E.A / D.E.S ou Document équivalent <span className="required">*</span></label>
                <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
                <input type="file" id="diplome_master_ct" name="diplome_master_dea_ds" accept={ALLOWED_FILE_ACCEPT} onChange={handleFileChange} required={!formData.diplome_master_dea_ds} />
                {formData.diplome_master_dea_ds && <small className="file-info">✅ Fichier sélectionné: {formData.diplome_master_dea_ds.name}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="universite_master_dea_ds_ct">Université d'obtention de votre Master/D.E.A/D.E.S <span className="required">*</span></label>
                <input type="text" id="universite_master_dea_ds_ct" name="universite_master_dea_ds" value={formData.universite_master_dea_ds} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="pays_master_dea_ds_ct">Pays d'obtention de votre Master/D.E.A/D.E.S <span className="required">*</span></label>
                <Select
                  id="pays_master_dea_ds_ct"
                  name="pays_master_dea_ds"
                  className={fieldErrors.pays_master_dea_ds ? 'select-has-error' : undefined}
                  options={COUNTRIES}
                  value={formData.pays_master_dea_ds ? COUNTRIES.find(c => c.value === formData.pays_master_dea_ds) : null}
                  onChange={(selectedOption) => handleDiplomaCountryChange('pays_master_dea_ds', selectedOption)}
                  placeholder="Sélectionner ou rechercher un pays..."
                  isSearchable={true}
                  isClearable={true}
                  noOptionsMessage={() => 'Aucun pays trouvé'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="date_obtention_master_dea_ds_ct">Date d'obtention de votre Master/D.E.A/D.E.S <span className="required">*</span></label>
                <input type="date" id="date_obtention_master_dea_ds_ct" name="date_obtention_master_dea_ds" value={formData.date_obtention_master_dea_ds} onChange={handleInputChange} required />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="charge_horaire_ct">Charge horaire validée par une autorité décanale / Académique <span className="optional">(optionnel)</span></label>
            <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
            <input
              type="file"
              id="charge_horaire_ct"
              name="charge_horaire"
              accept={ALLOWED_FILE_ACCEPT}
              onChange={handleFileChange}
            />
            {formData.charge_horaire && (
              <small className="file-info">✅ Fichier sélectionné: {formData.charge_horaire.name}</small>
            )}
          </div>
        </fieldset>
        )}

        {/* Section Informations Personnelles (only for Professeur) */}
        {formData.typecompte === 'Professeur' && (
        <fieldset>
          <legend><FaUser /> Informations Personnelles</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nom">Nom <span className="required">*</span></label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="postnom">Postnom <span className="required">*</span></label>
              <input
                type="text"
                id="postnom"
                name="postnom"
                value={formData.postnom}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prenom">Prénom <span className="required">*</span></label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sexe">Sexe <span className="required">*</span></label>
              <select
                id="sexe"
                name="sexe"
                value={formData.sexe}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="lieu_naissance">Lieu de Naissance <span className="required">*</span></label>
            <input
              type="text"
              id="lieu_naissance"
              name="lieu_naissance"
              value={formData.lieu_naissance}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date_naissance">Date de Naissance <span className="required">*</span></label>
            <input
              type="date"
              id="date_naissance"
              name="date_naissance"
              value={formData.date_naissance}
              onChange={handleInputChange}
              required
            />
          </div>

        </fieldset>
        )}

        {/* All other sections for Professeur only */}
        {formData.typecompte === 'Professeur' && (
        <>
        {/* Section Informations Administratives */}
        <fieldset>
          <legend><FaGraduationCap /> Informations Administratives</legend>

          <div className="form-group">
            <label htmlFor="type_etablissement">Type d'Établissement d'Attache (Privé ou Public) <span className="required">*</span></label>
            <select
              id="type_etablissement"
              name="type_etablissement"
              value={formData.type_etablissement}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="Public">Établissement Public</option>
              <option value="Privé">Établissement Privé</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="universite_attache">Etablissement d'Attache <span className="required">*</span></label>
            <Select
              id="universite_attache"
              name="universite_attache"
              className={fieldErrors.universite_attache ? 'select-has-error' : undefined}
              options={universityOptions}
              value={selectedUniversityOption}
              onChange={handleUniversityChange}
              placeholder={universitySelectPlaceholder}
              searchable={true}
              isSearchable={true}
              isDisabled={isUniversitySelectDisabled}
              isClearable={false}
              required
            />
          </div>

          {!isPrivateEtablissement(formData.type_etablissement) && formData.type_etablissement === 'Public' && (
            <div className="form-group">
              <label htmlFor="matricule_esu">Matricule ESU <span className="required">*</span></label>
              <input
                type="text"
                id="matricule_esu"
                name="matricule_esu"
                value={formData.matricule_esu}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          {formData.typecompte === 'Professeur' && (
            <div className="form-group">
              <label htmlFor="date_engagement">Date d'Engagement <span className="required">*</span></label>
              <input
                type="date"
                id="date_engagement"
                name="date_engagement"
                value={formData.date_engagement}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          {formData.typecompte === 'Assistant' && (
            <div className="form-group">
                <label htmlFor="statut">Statut {formData.typecompte === 'Assistant' ? <span className="required">(requis)</span> : <span className="optional">(optionnel)</span>}</label>
              <select
                id="statut"
                name="statut"
                value={formData.statut}
                onChange={handleInputChange}
                required={formData.typecompte === 'Assistant'}
              >
                <option value="">-- Sélectionner --</option>
                <option value="Assistant premier mandat">Assistant premier mandat</option>
                <option value="Assistant deuxième mandat">Assistant deuxième mandat</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="grade_actuel">Grade Actuel <span className="required">*</span></label>
            <select
              id="grade_actuel"
              name="grade_actuel"
              value={formData.grade_actuel}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="PE">Professeur Émérite</option>
              <option value="PO">Professeur Ordinaire</option>
              <option value="P">Professeur</option>
              <option value="PA">Professeur Associé</option>
              <option value="DT">Docteur à thèse</option>
            </select>
          </div>

          {formData.universite_attache === 'AUTRES' && (
            <div className="form-group">
              <label htmlFor="universite_attache_precisee">Préciser l'Etablissement d'attache <span className="required">*</span></label>
              <input
                type="text"
                id="universite_attache_precisee"
                name="universite_attache_precisee"
                value={formData.universite_attache_precisee}
                onChange={handleInputChange}
                required={formData.universite_attache === 'AUTRES'}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="domaine_recherche">Domaine de Recherche <span className="required">*</span></label>
            <input
              type="text"
              id="domaine_recherche"
              name="domaine_recherche"
              value={formData.domaine_recherche}
              onChange={handleInputChange}
              required
            />
          </div>

          {formData.grade_actuel !== 'DT' && (
            <div className="form-group">
              <label htmlFor="reference_dernier_arrete">Numéro de Référence du Dernier Arrêté <span className="required">*</span></label>
              <input
                type="text"
                id="reference_dernier_arrete"
                name="reference_dernier_arrete"
                value={formData.reference_dernier_arrete}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="numero_arrete_equivalence">Numéro de l'arrêté d'équivalence (si la thèse a été soutenue à l'étranger) <span className="optional">(optionnel)</span></label>
            <input
              type="text"
              id="numero_arrete_equivalence"
              name="numero_arrete_equivalence"
              value={formData.numero_arrete_equivalence}
              onChange={handleInputChange}
            />
          </div>

          {/* copie_arrete_equivalence désactivé
          <div className="form-group">
            <label htmlFor="copie_arrete_equivalence">Copie Arrêté Équivalence <span className="optional">(optionnel)</span></label>
            <input
              type="file"
              id="copie_arrete_equivalence"
              name="copie_arrete_equivalence"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={handleFileChange}
            />
          </div>
          */}
        </fieldset>

        {/* Section Documents à Télécharger (only for Professeur) */}
        {formData.typecompte === 'Professeur' && (
        <fieldset>
          <legend><FaFileAlt /> Documents à Télécharger</legend>

          {/* Diplôme d'État */}
          <div className="form-group">
            <label htmlFor="has_diplome_etat">Avez-vous un Diplôme d'État ou document équivalent ? <span className="required">*</span></label>
            <select
              id="has_diplome_etat"
              name="has_diplome_etat"
              value={formData.has_diplome_etat}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_etat === 'Oui' && (
            <div className="form-group">
              <label htmlFor="diplome_etat">Téléverser la copie du diplôme d'État ou d'un document équivalent. <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input
                type="file"
                id="diplome_etat"
                name="diplome_etat"
                accept={ALLOWED_FILE_ACCEPT}
                onChange={handleFileChange}
                required={!formData.diplome_etat}
              />
              {formData.diplome_etat && (
                <small className="file-info">✅ Fichier sélectionné: {formData.diplome_etat.name}</small>
              )}
            </div>
          )}

          {/* Diplôme de Graduat */}
          <div className="form-group">
            <label htmlFor="has_diplome_graduat">Avez-vous un Diplôme de Graduat ou Document équivalent ? <span className="required">*</span></label>
            <select
              id="has_diplome_graduat"
              name="has_diplome_graduat"
              value={formData.has_diplome_graduat}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_graduat === 'Oui' && (
            <div className="form-group">
              <label htmlFor="diplome_graduat">Copie du Diplôme de Graduat ou Document équivalent <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input
                type="file"
                id="diplome_graduat"
                name="diplome_graduat"
                accept={ALLOWED_FILE_ACCEPT}
                onChange={handleFileChange}
                required={!formData.diplome_graduat}
              />
              {formData.diplome_graduat && (
                <small className="file-info">✅ Fichier sélectionné: {formData.diplome_graduat.name}</small>
              )}
            </div>
          )}

          {/* Diplôme de Licence */}
          <div className="form-group">
            <label htmlFor="has_diplome_licence">Avez-vous un Diplôme de Licence / de Médecine ? <span className="required">*</span></label>
            <select
              id="has_diplome_licence"
              name="has_diplome_licence"
              value={formData.has_diplome_licence}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_licence === 'Oui' && (
            <div className="form-group">
              <label htmlFor="diplome_licence">Copie du Diplôme de Licence ou Document équivalent <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input
                type="file"
                id="diplome_licence"
                name="diplome_licence"
                accept={ALLOWED_FILE_ACCEPT}
                onChange={handleFileChange}
                required={!formData.diplome_licence}
              />
              {formData.diplome_licence && (
                <small className="file-info">✅ Fichier sélectionné: {formData.diplome_licence.name}</small>
              )}
            </div>
          )}

          {/* Diplôme Master / D.E.A / D.E.S */}
          <div className="form-group">
            <label htmlFor="has_diplome_master_dea_ds">Avez-vous un Diplôme de Master / D.E.A / D.E.S ? <span className="required">*</span></label>
            <select
              id="has_diplome_master_dea_ds"
              name="has_diplome_master_dea_ds"
              value={formData.has_diplome_master_dea_ds}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
          {formData.has_diplome_master_dea_ds === 'Oui' && (
            <>
              <div className="form-group">
                <label htmlFor="type_diplome_dea_des">Type de diplôme Master / D.E.A / D.E.S <span className="required">*</span></label>
                <select
                  id="type_diplome_dea_des"
                  name="type_diplome_dea_des"
                  value={formData.type_diplome_dea_des || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="Academique">Académique</option>
                  <option value="Professionnel">Professionnel</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="diplome_master_dea_ds">Copie du Diplôme de Master / D.E.A / D.E.S ou Document équivalent <span className="required">*</span></label>
                <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
                <input
                  type="file"
                  id="diplome_master_dea_ds"
                  name="diplome_master_dea_ds"
                  accept={ALLOWED_FILE_ACCEPT}
                  onChange={handleFileChange}
                  required={!formData.diplome_master_dea_ds}
                />
                {formData.diplome_master_dea_ds && (
                  <small className="file-info">✅ Fichier sélectionné: {formData.diplome_master_dea_ds.name}</small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="universite_master_dea_ds">Université d'obtention de votre master/D.E.A/D.E.S <span className="optional">(optionnel)</span></label>
                <input
                  type="text"
                  id="universite_master_dea_ds"
                  name="universite_master_dea_ds"
                  value={formData.universite_master_dea_ds}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="pays_master_dea_ds">Pays d'obtention de votre Master/D.E.A/D.E.S <span className="optional">(optionnel)</span></label>
                <Select
                  id="pays_master_dea_ds"
                  name="pays_master_dea_ds"
                  className={fieldErrors.pays_master_dea_ds ? 'select-has-error' : undefined}
                  options={COUNTRIES}
                  value={formData.pays_master_dea_ds ? COUNTRIES.find(c => c.value === formData.pays_master_dea_ds) : null}
                  onChange={(selectedOption) => handleDiplomaCountryChange('pays_master_dea_ds', selectedOption)}
                  placeholder="Sélectionner ou rechercher un pays..."
                  isSearchable={true}
                  isClearable={true}
                  noOptionsMessage={() => 'Aucun pays trouvé'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="date_obtention_master_dea_ds">Date d'obtention de votre Master/D.E.A/D.E.S <span className="optional">(optionnel)</span></label>
                <input
                  type="date"
                  id="date_obtention_master_dea_ds"
                  name="date_obtention_master_dea_ds"
                  value={formData.date_obtention_master_dea_ds}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="possede_diplome">Possédez-vous une copie de votre Diplôme de Doctorat ? <span className="required">*</span></label>
            <select
              id="possede_diplome"
              name="possede_diplome"
              value={formData.possede_diplome}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="a_etudie_etranger">Avez-vous étudié à l'étranger ? <span className="required">*</span></label>
            <select
              id="a_etudie_etranger"
              name="a_etudie_etranger"
              value={formData.a_etudie_etranger}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Sélectionner --</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          {formData.possede_diplome === 'Oui' && (
            <>
            <div className="form-group">
              <label htmlFor="type_diplome">Type de diplôme de Doctorat <span className="optional">(optionnel)</span></label>
              <select
                id="type_diplome"
                name="type_diplome"
                value={formData.type_diplome}
                onChange={handleInputChange}
              >
                <option value="">-- Sélectionner --</option>
                <option value="Academique">Académique</option>
                <option value="Professionnel">Professionnel</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="universite_obtention_diplome_doctorat">Université d'obtention de votre Doctorat <span className="optional">(optionnel)</span></label>
              <input
                type="text"
                id="universite_obtention_diplome_doctorat"
                name="universite_obtention_diplome_doctorat"
                value={formData.universite_obtention_diplome_doctorat}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pays_obtention_diplome_doctorat">Pays d'obtention de votre Doctorat <span className="optional">(optionnel)</span></label>
              <Select
                id="pays_obtention_diplome_doctorat"
                name="pays_obtention_diplome_doctorat"
                className={fieldErrors.pays_obtention_diplome_doctorat ? 'select-has-error' : undefined}
                options={COUNTRIES}
                value={formData.pays_obtention_diplome_doctorat ? COUNTRIES.find(c => c.value === formData.pays_obtention_diplome_doctorat) : null}
                onChange={(selectedOption) => handleDiplomaCountryChange('pays_obtention_diplome_doctorat', selectedOption)}
                placeholder="Sélectionner ou rechercher un pays..."
                isSearchable={true}
                isClearable={true}
                noOptionsMessage={() => 'Aucun pays trouvé'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="date_obtention_diplome_doctorat">Date d'obtention de votre Doctorat <span className="optional">(optionnel)</span></label>
              <input
                type="date"
                id="date_obtention_diplome_doctorat"
                name="date_obtention_diplome_doctorat"
                value={formData.date_obtention_diplome_doctorat}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sujet_these">Sujet ou intitulé de votre thèse (Doctorat) <span className="required">*</span></label>
              <textarea
                id="sujet_these"
                name="sujet_these"
                value={formData.sujet_these}
                onChange={handleInputChange}
                rows="3"
                maxLength="200"
                required
              ></textarea>
              <small className="char-count">{formData.sujet_these.length}/200 caractères</small>
            </div>
            <div className="form-group">
              <label htmlFor="copie_diplome">Copie du Diplôme de Doctorat ou Document équivalent <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input
                type="file"
                id="copie_diplome"
                name="copie_diplome"
                accept={ALLOWED_FILE_ACCEPT}
                onChange={handleFileChange}
                required={formData.possede_diplome === 'Oui'}
              />
            </div>
            </>
          )}

          {formData.possede_diplome === 'Non' && (
            <div className="form-group">
              <label htmlFor="documents_equivalents">Documents Équivalents <span className="required">*</span></label>
              <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
              <input
                type="file"
                id="documents_equivalents"
                name="documents_equivalents"
                accept={ALLOWED_FILE_ACCEPT}
                onChange={handleFileChange}
                required={formData.possede_diplome === 'Non'}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="charge_horaire">Charge horaire validée par une autorité décanale / Académique <span className="required">*</span></label>
            <small className="file-hint">{ALLOWED_FILE_LABEL}</small>
            <input
              type="file"
              id="charge_horaire"
              name="charge_horaire"
              accept={ALLOWED_FILE_ACCEPT}
              onChange={handleFileChange}
              required
            />
            {formData.charge_horaire && (
              <small className="file-info">✅ Fichier sélectionné: {formData.charge_horaire.name}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="photo_identite">Photo d'Identité <span className="required">*</span></label>
            <small className="file-hint">{PHOTO_LABEL}</small>
            <input
              type="file"
              id="photo_identite"
              name="photo_identite"
              accept={PHOTO_ACCEPT}
              onChange={handleFileChange}
              required
            />
            {filePreviews.photo_identite && (
              <img src={filePreviews.photo_identite} alt="Aperçu photo identité" className="file-preview-img" />
            )}
            {!filePreviews.photo_identite && formData.photo_identite && (
              <small className="file-info">✅ Fichier sélectionné : {formData.photo_identite.name}</small>
            )}
          </div>

        </fieldset>
        )}

        </>
        )}

        {/* Section Informations Financières - Common to all types */}
        {!isPrivateEtablissement(formData.type_etablissement) && (
        <fieldset>
          <legend><FaFileAlt /> Informations Financières</legend>

            <div className="form-group">
              <label htmlFor="prime_institutionnelle">Avez-vous une prime institutionnelle ? <span className="required">*</span></label>
              <select
                id="prime_institutionnelle"
                name="prime_institutionnelle"
                value={formData.prime_institutionnelle}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="salaire_base"> Avez-vous un salaire de Base ? <span className="required">*</span></label>
              <select
                id="salaire_base"
                name="salaire_base"
                value={formData.salaire_base}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
        </fieldset>
        )}

        {/* Section Confirmation - Common to all types */}
        <fieldset>
          <legend><FaCheckCircle /> Confirmation</legend>

          <div className="form-group">
            <label htmlFor="commentaire_confirmation">Commentaires <span className="optional">(optionnel)</span></label>
            <textarea
              id="commentaire_confirmation"
              name="commentaire_confirmation"
              value={formData.commentaire_confirmation}
              onChange={handleInputChange}
              rows="3"
              maxLength="250"
            ></textarea>
            <small className="char-count">{formData.commentaire_confirmation.length}/250 caractères</small>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="informations_vraies"
              name="informations_vraies"
              checked={formData.informations_vraies}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="informations_vraies">
              J'affirme que toutes les informations fournies sont vraies et exactes <span className="required">*</span>
            </label>
          </div>
        </fieldset>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? 'Envoi en cours...' : editMode ? 'Enregistrer les modifications' : 'Valider les informations'}
          </button>
          <button
            type="button"
            className="btn-reset"
            onClick={() => {
              if (editMode) {
                setEditMode(false);
                setChangedFields({});
              } else {
                setFormData({ ...defaultFormState, typecompte: formData.typecompte });
                setFieldErrors({});
                setFilePreviews({});
                // Vider les inputs file du DOM
                document.querySelectorAll('input[type="file"]').forEach(el => { el.value = ''; });
                // Effacer le brouillon local
                try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
              }
            }}
          >
            {editMode ? 'Annuler l\'édition' : 'Réinitialiser'}
          </button>
        </div>
      </form>

      {/* Modal pour voir les données */}
      {showViewModal && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Consulter vos informations</h2>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseViewModal}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {!viewedData ? (
                <div className="modal-search">
                  <div className="form-group">
                    <label htmlFor="view-matricule">Matricule <span className="required">*</span></label>
                    <input
                      type="text"
                      id="view-matricule"
                      value={viewMatricule}
                      onChange={(e) => setViewMatricule(e.target.value)}
                      placeholder="Ex: 099300"
                      onKeyPress={(e) => e.key === 'Enter' && handleViewData()}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-search"
                    onClick={handleViewData}
                    disabled={viewLoading}
                  >
                    {viewLoading ? 'Recherche...' : 'Rechercher'}
                  </button>
                </div>
              ) : (
                <>
                  {renderModalContent()}
                </>
              )}
            </div>

            <div className="modal-footer">
              {viewedData && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleStartEdit}
                >
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmer la suppression</h2>
              <button
                type="button"
                className="btn-close"
                onClick={handleCancelDelete}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir supprimer ce professeur ? Cette action est irréversible.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelDelete}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteProfessor}
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Matricule Error */}
      {showErrorModal && (
        <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="modal modal-error" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Matricule existant</h2>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowErrorModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="error-message">{errorModalMessage}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowErrorModal(false)}
              >
                J'ai compris, fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal modal-success" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-success-header">
              <h2>✓ Succès!</h2>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowSuccessModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="success-icon">✓</div>
              <p className="success-message">{successMessage}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-success"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onRequestAccountTypeReset) {
                    onRequestAccountTypeReset();
                  }
                }}
              >
                Retour au choix du compte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      <LoadingModal
        isVisible={loading}
        message="Enregistrement en cours"
      />

      {/* Profile Sidebar */}
      <ProfileSidebar
        isOpen={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
        user={currentUser}
        onViewMyRecord={() => setShowViewModal(true)}
        onLogout={onLogout}
      />
      </div>
    </div>
  );
};

export default ProfessorRegistrationForm;
