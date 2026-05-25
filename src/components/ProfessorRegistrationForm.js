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

// Catégories d'assistant
const CATEGORIE_ASSISTANT_CHOICES = [
  { value: 'Academique', label: 'Assistant Académique' },
  { value: 'Recherche', label: 'Assistant de Recherche' },
];

const UNIVERSITIES = [
  {
    "code": "(ISSS-CR GOMA)",
    "name": "INSTITUT SUPERIEUR DE SCIENCE DE LA SANTE DE LA Croix Rouge de Goma"
  },
  {
    "code": "(istgd kasindi)",
    "name": "INSTITUT SUPERIEUR des techniques de gestion et de developpement de kasindi"
  },
  {
    "code": "ABA-KIN",
    "name": "ACADEMIE DES BEAUX - ARTS DE KINSHASA"
  },
  {
    "code": "AFRAC",
    "name": "AFRICAN  RESEARCH AND  ACTION INSTITUT"
  },
  {
    "code": "AIME/KINSHASA",
    "name": "ACADEMPIE INTERNATIONALE DE MANAGEMENT EXCELLENTIA"
  },
  {
    "code": "AUK/KINSHASA",
    "name": "AMERICAN UNIVERSITY OF KINSHASA"
  },
  {
    "code": "BIOSADEC DE BUKAVU",
    "name": "UNIVERSITE BIOSADEC DE BUKAVU"
  },
  {
    "code": "C UNIV DE MINEMBWE",
    "name": "CENTRE UNIVERSITAIRE DE MINEMBWE"
  },
  {
    "code": "CAFES",
    "name": "CENTRE AFRICAIN DE FORMATION DES ÉDUCATEURS SOCIAUX"
  },
  {
    "code": "CELI-KIS",
    "name": "COMPLEXE ÉDUCATIF LIKUNDE DE KISANGANI"
  },
  {
    "code": "CEPROMAD DE BENI",
    "name": "UNIVERSITE DU CEPROMAD DE BENI"
  },
  {
    "code": "CEPROMADB",
    "name": "UNIVERSITE DU CEPROMADB DE BUNIA"
  },
  {
    "code": "CIDEP KIS",
    "name": "CIDEP KISANGANI"
  },
  {
    "code": "CU/WAMBA",
    "name": "CENTRE UNIVERSITAIRE DE WAMBA"
  },
  {
    "code": "CULC",
    "name": "COLLEGE UNIVERSITAIRE LIBRE AU CONGO À KANANGA"
  },
  {
    "code": "CUM",
    "name": "Centre Universitaire de Missiologie"
  },
  {
    "code": "CUP-BUKAVU",
    "name": "CENTRE UNIVERSITAIRE DE LA PAIX DE BUKAVU"
  },
  {
    "code": "ECRI-BUTEMBO",
    "name": "ECOLE DE CRIMINOLIE AU SEIN  DE L'UCG BUTEMBO"
  },
  {
    "code": "ECSFLU/KINSHASA",
    "name": "ECOLE SUPERIEUR DE FORMATIONDES LEADERS  DE L'UNIVERSITE"
  },
  {
    "code": "EDAP/ISP KAZIBA",
    "name": "ECOLE D'APPLICATION D'INSTITUIT SUPERIEUR PEDAGOGIQUE DE KAZIBA"
  },
  {
    "code": "EHELET",
    "name": "ECOLE DE HAUTES ETUDES EN LEADERSHIP ETHIQUE ET TRANSFORMATION"
  },
  {
    "code": "EIFI",
    "name": "Ecole Informatique des Finances"
  },
  {
    "code": "ENACTI-KIN",
    "name": "ECOLE NATIONALE DE CADASTRE ET TITRES IMMOBILIERS DE KINSHASA"
  },
  {
    "code": "EPA-UNIKIS",
    "name": "ECOLE DE PECHE ET D'AQUACULTURE DE L'UNIKIS"
  },
  {
    "code": "EPAU",
    "name": "ECOLE DE PECHE ET D'AQUACULTURE DE L'UNILU"
  },
  {
    "code": "ERAIFT",
    "name": "ECOLE REG.POST.UNIV.INT.FOR.T.TROP."
  },
  {
    "code": "ERNI",
    "name": "ECOLE REGIONALE  DE LA NAVIGATION INTÉRIEUR"
  },
  {
    "code": "ESFORCA",
    "name": "ECOLE SUPÉRIEURE DE FORMATION DES CADRES"
  },
  {
    "code": "ESMICOM",
    "name": "Ecole Supérieure des Métiers d'Informatique et de Commerce"
  },
  {
    "code": "ESMK",
    "name": "ECOLE SUPERIEUR DE MANAGEMENT DE KINSHASA"
  },
  {
    "code": "ESP/KIN",
    "name": "ECOLE DE SANTE PUBLIQUE DE KINSHASA"
  },
  {
    "code": "ESTISC",
    "name": "ECOLE SUPERIEURE DES TECHNIQUES INFORMATIQUES ET SCIENCES COMMERCIALES"
  },
  {
    "code": "Ex-IFAS",
    "name": "INSTITUT SUPERIEUR TECHNIQUE SONG HWA"
  },
  {
    "code": "FABB",
    "name": "FACULTES AFRICAINES BAKHITA DE BUTEMBO"
  },
  {
    "code": "FATHEKA",
    "name": "FACULTETHEOLOGIQUE DE KAMINA"
  },
  {
    "code": "FU/SANKURU",
    "name": "FACULTE UNIVERSITAIRE DE SANKURU"
  },
  {
    "code": "FUB",
    "name": "FACULTE UNIVERSITAIRE  DE BAMBELOTA"
  },
  {
    "code": "GSJB/ BAMANYA",
    "name": "GRAND SEMINAIRE SAINT JEAN BAPTISTE DE BAMANYA"
  },
  {
    "code": "GSSAK",
    "name": "GRAND SEMINAIRE SAINT ANDRE KAGGWA"
  },
  {
    "code": "GSSCB",
    "name": "GRAND SÉMINAIRE DE SAINT CYPRIEN DE BUNIA"
  },
  {
    "code": "HEC-KIN",
    "name": "HAUTE ECOLE  DE  COMMERCE  DE KINSHASA"
  },
  {
    "code": "HESDC/CEPRISE-PHD",
    "name": "Haute Ecole Supérieure Demez Christian du Centre d'Etude, de Promotion et des Recherches en Interventions Socio-Economiques-Père Hardy Développement"
  },
  {
    "code": "IBTP KAMITUGA",
    "name": "INSTITUT DE BATIMENT DE TRAVAUX PUBLIC"
  },
  {
    "code": "IBTP-BUNIA",
    "name": "INSTITUT SUPERIEUR DES BÂTIMENTS ET TRAVAUX PUBLIQUES-BUNIA"
  },
  {
    "code": "IBTP-BUTA",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE BUTA"
  },
  {
    "code": "IBTP-BUTEMBO",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE BUTEMBO"
  },
  {
    "code": "IBTP-GOMA",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE GOMA"
  },
  {
    "code": "IBTP-KINDU",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE KINDU"
  },
  {
    "code": "IBTP-KISANGANI",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE KISANGANI"
  },
  {
    "code": "IBTP-LUEBO",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE LUEBO"
  },
  {
    "code": "IBTP-MATADI",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE MATADI"
  },
  {
    "code": "IBTP-MBUJI-MAYI",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE MBUJI-MAYI"
  },
  {
    "code": "IBTP-NYANGEZI",
    "name": "INSTITUT DU BATIMENT ET DES TRAVAUX PUBLICS DE NYANGENZI"
  },
  {
    "code": "IBTP/KIKWIT",
    "name": "INSTITUT SUPERIEUR DES BATIMENTS ET TRAVAUX  PUBLICS DE KIKWIT"
  },
  {
    "code": "IBTPG",
    "name": "IBTP GBADOLITE"
  },
  {
    "code": "IFA-YANGAMBI",
    "name": "INSTITUT FACULTAIRE DES SCIENCES AGRONOMIQUES DE YANGAMBI"
  },
  {
    "code": "ISTCK",
    "name": "INSTITUT  SUPERIEUR TECHNIQUE CATHOLIQUE DE KIKWIT"
  },
  // {
  //   "code": "IFAC",
  //   "name": "INSTITUT FACULTAIRE D'ANIMATION  ET DE COMMUNICATION"
  // },
  {
    "code": "IFAD",
    "name": "INSTITUT FACULTAIRE DE DÉVELOPPEMENT"
  },
  {
    "code": "IFADC",
    "name": "INSTITUT FACULTAIRE DES ASSEMBLÉES DE DIEU AU CONGO"
  },
  {
    "code": "IFASIC-KIN",
    "name": "INSTITUT FACULTAIRE DES SCIENCES DE L'INFORMATION ET DE LA COMMUNICATION DE KINSHASA"
  },
  {
    "code": "IFGC",
    "name": "INSTITUT FACULTAIRE DE GESTION ET DE COMMUNICATION"
  },
  {
    "code": "IFMG-MANIEMA-NAMOYA",
    "name": "INSTITUT FACULTAIRE DES MINES ET GEOLOGIES DU MANIEMA  NAMOYA"
  },
  {
    "code": "IFSD DE MWENGA A KAM",
    "name": "INSTITUT FACULTAIRE DES SCIENCES DE DEVELOPPEMENT"
  },
  {
    "code": "IFSSC",
    "name": "INSTITUT FACULTAIRE DE SCIENCE DE SANTE  CARDINAL ETSOU"
  },
  {
    "code": "IFSSCE",
    "name": "INSTITUT FACUTATAIRE DES SCIENCES DE SANTE CARDINAL ETSHOU"
  },
  {
    "code": "IIFT DE KINDU",
    "name": "INSTITUT INTERNATIONALDE FORMATION THEOGIQUE DE KINDU"
  },
  {
    "code": "INA-KIN",
    "name": "INSTITUT NATIONAL DES ARTS DE KINSHASA"
  },
  {
    "code": "INBTP-KIN",
    "name": "INSTITUT NATIONAL DU BATIMENT ET DES TRAVAUX PUBLICS DE KINSHASA"
  },
  {
    "code": "INIGE",
    "name": "INSTITUT NATIONAL D'INFORMATIQUE ET GESTION DES ENTREPRISES"
  },
  {
    "code": "INTS",
    "name": "INSTITUT NATIONAL DU TRAVAIL SOCIAL"
  },
  {
    "code": "INTS/GOMA",
    "name": "INSTITUT NATIONAL DU TRAVAIL SOCIAL"
  },
  {
    "code": "IPB",
    "name": "INSTITUT DE PHILOSOPHIE DE BOMA"
  },
  {
    "code": "ISABAS",
    "name": "INSTITUT SUPERIEUR D'ADMINISTRATION, BANQUES ET ASSURANCES"
  },
  {
    "code": "ISABG / ATEN",
    "name": "ISAGB / ATEN"
  },
  {
    "code": "ISACN DE MINEMBWE",
    "name": "INSTITUT SUPERIEUR AGROVERTERINAIRE ET CONSERVATION DE LA NATURE DE MINEMBWE"
  },
  {
    "code": "ISAD",
    "name": "ISAD LISALA"
  },
  {
    "code": "ISAD",
    "name": "INSTITUT SUPERIEUR D'Administration et de developpement/ISAD"
  },
  {
    "code": "ISAFGE DE KAHUZI BIE",
    "name": "INSTITUT SUPERIEUR AGRO FORESTERIE ET DE GESTION DE L'ENVIRONNEMENT DE KAHUZI BIEGA"
  },
  {
    "code": "ISAGE-GUNGU",
    "name": "INSTITUT SUPERIEUR D'AGRO-FORESTERIE ET DE GESTION DE DEVELOPPEMENT  DURABLE D'ATEN"
  },
  {
    "code": "ISAGE-KAHUZI BIEGA",
    "name": "INSTITUT SUPERIEUR D'AGRO-FORESTERIE ET DE GESTION DE DEVELOPPEMENT DURABLE KAHUZI-BIEGA"
  },
  {
    "code": "ISAM DE LIKASI",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE LIKASI"
  },
  {
    "code": "ISAM DE MBUJI",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERDS DE MBUJI MAYI"
  },
  {
    "code": "ISAM LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR D'ARTS ET MÉTIERS DE LUBUMBASHI"
  },
  {
    "code": "ISAM-BUKASA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS  DE BUKASA"
  },
  {
    "code": "ISAM-BUKAVU",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE BUKAVU"
  },
  {
    "code": "ISAM-GBADOLITE",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE GBADOLITE"
  },
  {
    "code": "ISAM-GOMA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE GOMA"
  },
  {
    "code": "ISAM-IDIOFA",
    "name": "INSTITUT SUPERIEUR D'ARTS ET METIERS D'IDIOFA"
  },
  {
    "code": "ISAM-KAMINA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KAMINA"
  },
  {
    "code": "ISAM-KIDIMA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KIDIMA"
  },
  {
    "code": "ISAM-KIN",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KINSHASA"
  },
  {
    "code": "ISAM-KINDU",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KINDU"
  },
  {
    "code": "ISAM-KISANTU",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE KISANTU"
  },
  {
    "code": "ISAM-LUBERO",
    "name": "INSTITUT SUPERIEURS DES ARTS ET METIERS DE LUBERO À BUTEMBO"
  },
  {
    "code": "ISAM-M",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE MBUJI-MAYI (PRIVE)"
  },
  {
    "code": "ISAM-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE MBUJI-MAYI"
  },
  {
    "code": "ISAM-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR D'ARTS ET MÉTIERS DE DE TSHIKAPA"
  },
  {
    "code": "ISAM-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE TSHIKAPA"
  },
  {
    "code": "ISAM-TSHUMBE",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE TSHUMBE"
  },
  {
    "code": "ISAM/EQUATEUR",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS/ EQUATEUR"
  },
  {
    "code": "ISAMG",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS"
  },
  {
    "code": "ISAML",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE LUOZI"
  },
  {
    "code": "ISAMM",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS MARIE AUXILIATRICE"
  },
  {
    "code": "ISAMW",
    "name": "INSTITUT SUPERIEUR DES ARTS ET METIERS DE WEMBO-NYAMA"
  },
  {
    "code": "ISAU-KIN",
    "name": "INSTITUT SUPERIEUR D'ARCHITECTURE ET D'URBANISME DE KINSHASA"
  },
  {
    "code": "ISAU-KINDU",
    "name": "INSTITUT SUPERIEUR D'ARCHITECTURE  ET URBANISME DE KINDU"
  },
  {
    "code": "ISAV",
    "name": "INSTITUT SUPERIEUR AGRO-VÉTÉRINAIRE DE BAMBESA"
  },
  {
    "code": "ISAVC MINEMBWE",
    "name": "INSTITUT SUPERIEUR AVC DE MINEMBWE"
  },
  {
    "code": "ISBB",
    "name": "INSTITUT SUPERIEUR BAPTISTE DE BOLOBO"
  },
  {
    "code": "ISBN/BENI",
    "name": "INSTITUT SUPERIEUR DU BASSIN DU NIL"
  },
  {
    "code": "ISBTM BUTEMBO",
    "name": "INSTITUT SUPERIEUR BAPTISTE DE THEOLOGIE ET DE MISSIOLOGIE A BUTEMBO"
  },
  {
    "code": "ISBTP BENI",
    "name": "INSTITUT SUPERIEUR DES BÂTIMENTS ET TRAVAUX PUBLICS DE BENI"
  },
  {
    "code": "ISC DE KABINDA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE KABINDA"
  },
  {
    "code": "ISC LOMAMI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE LOMAMI"
  },
  {
    "code": "ISC-ARIWARA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  ARIWARA"
  },
  {
    "code": "ISC-BENI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  BENI"
  },
  {
    "code": "ISC-BUKAVU",
    "name": "INSTITUT SUPERIEUR DE COMMERCE   DE BUKAVU"
  },
  {
    "code": "ISC-BULUNGU",
    "name": "INSTITUT  SUPERIEUR DE COMMERCE DE  BULUNGU"
  },
  {
    "code": "ISC-BUMBA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE BUMBA"
  },
  {
    "code": "ISC-BUNIA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  DE BUNIA"
  },
  {
    "code": "ISC-BUTA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE BUTA"
  },
  {
    "code": "ISC-FI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET DES FINANCES"
  },
  {
    "code": "ISC-GOMA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE GOMA"
  },
  {
    "code": "ISC-IDIOFA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE D’IDIOFA"
  },
  {
    "code": "ISC-ILEBO",
    "name": "INSTITUT SUPERIEUR DE COMMERCE   D’ILEBO"
  },
  {
    "code": "ISC-ISIRO",
    "name": "INSTITUT  SUPERIEUR DE COMMERCE D'ISIRO"
  },
  {
    "code": "ISC-KANANGA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE KANANGA"
  },
  {
    "code": "ISC-KINDU",
    "name": "INSTITUT SUPERIEUR DE COMMERCE    DE  KINDU"
  },
  {
    "code": "ISC-KISANGANI",
    "name": "INSTITUT  SUPERIEUR DE COMMERCE DE KISANGANI"
  },
  {
    "code": "ISC-KIWANJA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  DE KIWANJA"
  },
  {
    "code": "ISC-KKT",
    "name": "INSTITUT SUPERIEUR DE COMMERCE DE KIKWIT"
  },
  {
    "code": "ISC-LODJA",
    "name": "INSTITUT SUPERIEUR DE  COMMERCE DE   LODJA"
  },
  {
    "code": "ISC-LUBUMBASHI",
    "name": "INSTITUT SUPÉRIEUR DE COMMERCE DE LUBUMBASHI"
  },
  {
    "code": "ISC-MATADI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE   DE MATADI"
  },
  {
    "code": "ISC-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR DE COMMENCE DE MBUJI-MAYI"
  },
  {
    "code": "ISC-MOBA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE - MOBA"
  },
  {
    "code": "ISC-NIOKI",
    "name": "INSTITUT  SUPERIEUR DE COMMERCE DE  NIOKI"
  },
  {
    "code": "ISC-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE  DE TSHIKAPA"
  },
  {
    "code": "ISC-UVIRA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE   D’UVIRA"
  },
  {
    "code": "ISC/BUTEMBO",
    "name": "INSTITUT SUPERIEUR DE COMMERCE"
  },
  {
    "code": "ISCA-BUTEMBO",
    "name": "INSTITUT SUPERIEUR DE CHIMIES APPLIQUEES DE BUTEMBO"
  },
  {
    "code": "ISCA/BOMA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET D'ADMINISTRATION DE BOMA"
  },
  {
    "code": "ISCDR DE KALEHE A MI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET DE DEVELOPPEMENT RURAL DE KALEHE A MINOVA"
  },
  {
    "code": "ISCG-BUMBA",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET DE GESTION DE BUMBA"
  },
  {
    "code": "ISCGD/KIMPESE",
    "name": "INSTITUT SUPERIEUR CATHOLIQUE DE GESTION ET DE DEVELOPPEMENT"
  },
  {
    "code": "ISCGD/KISANTU",
    "name": "INSTITUT SUPERIEUR CATHOLIQUE DE GESTION ET DE DEVELOPPEMENT  DE KISANTU"
  },
  {
    "code": "ISCI LIKASI",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET D'INFORMATIQUE"
  },
  {
    "code": "ISCTK",
    "name": "INSTITUT SUPERIEUR DE COMMERCE ET DES TECHNIQUES DE KABINDA"
  },
  {
    "code": "ISD-KALEHE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT DE KALEHE"
  },
  {
    "code": "ISDA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT DE L'ASSOMPTION"
  },
  {
    "code": "ISDAD DE KAMIJI",
    "name": "INSTITUT SUPERIEUR DES AFFAIRES ET DE DEVELOPPEMENT DE KAMIJI"
  },
  {
    "code": "ISDAL",
    "name": "INSTITUT SUPERIEUR DES DOUANES ACCISES ET LOGISTIQUE"
  },
  {
    "code": "ISDCR",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT COMMUNAUTAIRE ET RURAL"
  },
  {
    "code": "ISDEKY",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT ET D''ENTREPRENBARIAT DE KYAVIRUMU"
  },
  {
    "code": "ISDIG",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT INKE DE GBADOLITE"
  },
  {
    "code": "ISDP DE KALEHE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT ET DU PROGRES DE KALEHE"
  },
  {
    "code": "ISDR BARAKA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BUKAVU"
  },
  {
    "code": "ISDR DE KITSHANGA",
    "name": "INSTITUT SUPERIEUR DE DÉVELOPPEMENT RURAL DES GRANDS LACS"
  },
  {
    "code": "ISDR DE RUTSHURU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE RUTSHURU"
  },
  {
    "code": "ISDR DONGO",
    "name": "INSTITUT SUPERIEUR DE DÉVELOPPEMENT RURAL DE DONGO"
  },
  {
    "code": "ISDR KAZIBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KAZIBA"
  },
  {
    "code": "ISDR KINZAUMVUETE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL KINZAUMVUETE"
  },
  {
    "code": "ISDR NYIRAGONGO",
    "name": "INSTITUT SUPERIEUR TECHNIQUE ET DEVELOPPEMENT RURAL"
  },
  {
    "code": "ISDR-AMADI POKO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL AMADI A POKO"
  },
  {
    "code": "ISDR-BENI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BENI"
  },
  {
    "code": "ISDR-BOSONDJO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BOSONDJO"
  },
  {
    "code": "ISDR-BUKAVU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BUKAVU"
  },
  {
    "code": "ISDR-BUMBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE BUMBA"
  },
  {
    "code": "ISDR-BUNIA",
    "name": "INSTITUT SUPERIEUR DE DÉVELOPPEMENT RURAL DE BUNIA"
  },
  {
    "code": "ISDR-DEKESE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE DEKESE"
  },
  {
    "code": "ISDR-DINGILA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE DINGILA"
  },
  {
    "code": "ISDR-FIZI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE FIZI"
  },
  {
    "code": "ISDR-GOMA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE GOMA"
  },
  {
    "code": "ISDR-IMBELA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL D'IMBELA"
  },
  {
    "code": "ISDR-KABALO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KABALO"
  },
  {
    "code": "ISDR-KABAMBARE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KABAMBARE"
  },
  {
    "code": "ISDR-KABONDO-DIANDA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KABONDO-DIANA"
  },
  {
    "code": "ISDR-KAHEMBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KAHEMBA"
  },
  {
    "code": "ISDR-KALEMIE",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL - KALEMIE"
  },
  {
    "code": "ISDR-KAMIJI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KAMIJI"
  },
  {
    "code": "ISDR-KANYABAYONGA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KANYABAYONGA"
  },
  {
    "code": "ISDR-KIBOMBO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KIBOMBO"
  },
  {
    "code": "ISDR-KIMVULA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KIMVULA"
  },
  {
    "code": "ISDR-KINDU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL KINDU"
  },
  {
    "code": "ISDR-KISANGANI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL KISANGANI"
  },
  {
    "code": "ISDR-KITENDA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KITENDA"
  },
  {
    "code": "ISDR-KITSOMBIRO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KITSOMBIRO À LUBERO"
  },
  {
    "code": "ISDR-KIYAKA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KIYAKA"
  },
  {
    "code": "ISDR-KONGOLO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE KONGOLO"
  },
  {
    "code": "ISDR-LAKUNDA",
    "name": "INSTITUT SUPERIUR DE DEVELOPPEMENT RURAL DE LAKUNDA"
  },
  {
    "code": "ISDR-LUABO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUABO"
  },
  {
    "code": "ISDR-LUBAO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUBAO"
  },
  {
    "code": "ISDR-LUBUTU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUBUTU"
  },
  {
    "code": "ISDR-LUEBO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUEBO"
  },
  {
    "code": "ISDR-LUOZI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE LUOZI"
  },
  {
    "code": "ISDR-MAPANGU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MAPANGU"
  },
  {
    "code": "ISDR-MBANDAKA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MBANDAKA"
  },
  {
    "code": "ISDR-MBEO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MBEO"
  },
  {
    "code": "ISDR-MISAYI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MISAYI"
  },
  {
    "code": "ISDR-MOBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MOBA"
  },
  {
    "code": "ISDR-MOSAMBO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE MOSAMBO"
  },
  {
    "code": "ISDR-PINGA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE PINGA"
  },
  {
    "code": "ISDR-SHABUNDA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE SHABUNDA"
  },
  {
    "code": "ISDR-TSHIBASHI",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE TSHIBASHI"
  },
  {
    "code": "ISDR-TSHIMBULU",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DE TSHIMBULU"
  },
  {
    "code": "ISDR-UVIRA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL D'UVIRA"
  },
  {
    "code": "ISDR-VOLCAN",
    "name": "INSTITUT SUPERIEUR TECHNIQUE ET DE DEVELOPPEMENT RURAL DU VOLCAN"
  },
  {
    "code": "ISDR/ KONGOLO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT  RURAL"
  },
  {
    "code": "ISDR/ MISUMBA",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL - MISUMBA"
  },
  {
    "code": "ISDR/GL",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL DES GRANDS LACS"
  },
  {
    "code": "ISDR/LUIZA",
    "name": "INSTITUT SUPERIEURDE DEVELOPPEMENT RURAL - LUIZA"
  },
  {
    "code": "ISDR/NYAMILIMA",
    "name": "INSTITUT SUPERIEURDE DEVELOPPEMENT RURAL DE  NYAMILIMA"
  },
  {
    "code": "ISDRO",
    "name": "INSTITUT SUPERIEUR DE DEVELOPPEMENT RURAL D'OSHWE"
  },
  {
    "code": "ISEA MUKUNGO",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES MUKONGO"
  },
  {
    "code": "ISEA MUSHWESHWE",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE WALUNGU"
  },
  {
    "code": "ISEA- WEMBO NYAMA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES DE WEMBO NYAMA"
  },
  {
    "code": "ISEA-BASOKO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE BASOKO"
  },
  {
    "code": "ISEA-BENGAMISA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE BENGAMISA"
  },
  {
    "code": "ISEA-BOKONZI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE BOKONZI"
  },
  {
    "code": "ISEA-KASEYA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KASEYA"
  },
  {
    "code": "ISEA-KENGE",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KENGE"
  },
  {
    "code": "ISEA-KIMBAO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KIMBAO"
  },
  {
    "code": "ISEA-KIYAKA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KIYAKA GUNGU"
  },
  {
    "code": "ISEA-LABA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONIMIES LABA"
  },
  {
    "code": "ISEA-LODJA",
    "name": "INNSTITUT SUPERIEUR  D'ETUDES AGRONOMIQUES DE LODJA"
  },
  {
    "code": "ISEA-LOEKA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE LOEKA"
  },
  {
    "code": "ISEA-LOMEKA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE LOMELA"
  },
  {
    "code": "ISEA-MANGAI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE MANGAYI"
  },
  {
    "code": "ISEA-MONDONGO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE MONDONGO"
  },
  {
    "code": "ISEA-MUKONGO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES MUKONGO À TSHILENGE"
  },
  {
    "code": "ISEA-MVUAZI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE MVUAZI"
  },
  {
    "code": "ISEA-MWESO",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES MWESO"
  },
  {
    "code": "ISEA-TSHELA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE TSHELA"
  },
  {
    "code": "ISEA-UNTU",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE KAMPONDE"
  },
  {
    "code": "ISEA-YATOLEMA",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE YATOLEMA"
  },
  {
    "code": "ISEA-ZOMFI",
    "name": "INSTITUT SUPERIEUR D'ETUDE AGRONOMIQUES DE ZOMFI"
  },
  {
    "code": "ISEAV KINSENGWA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRE DE KINSENGWA"
  },
  {
    "code": "ISEAV-ARU",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRE D'ARU"
  },
  {
    "code": "ISEAV-KAPANGA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES, VETERINAIRES DE KAPANGA"
  },
  {
    "code": "ISEAV-LUKASHIYI",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRO-VETERINAIRES DE LUKASHIYI"
  },
  {
    "code": "ISEAV-MALAVUDI",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE MALAVUDI"
  },
  {
    "code": "ISEAV-MANIEMA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE MANIEMA"
  },
  {
    "code": "ISEAV-SANDOA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VETERINAIRES DE SANDOA"
  },
  {
    "code": "ISEAVF BUTEMBO",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES ET VERIRINAIRES FORESTIERES DE BUTEMBO"
  },
  {
    "code": "ISEAVF-KIRUMBA",
    "name": "INSTITUT SUPERIEUR D'ETUDES AGRONOMIQUES, VETERINAIRES ET FORESTIERES DE KIRUMBA"
  },
  {
    "code": "ISECOF",
    "name": "INSTITUT SUPERIEUR D'ÉTUDES COMMERCIALES ET FINANCIÈRES"
  },
  {
    "code": "ISECOP DE BUKAVU",
    "name": "INSTITUT SUPERIEUR D'ETUDES COMMERCIALES ET FINANCIERES DE BUKAVU"
  },
  {
    "code": "ISEIF",
    "name": "INSTITUT D'ETUDES INFORMATIQUES ET DES FINANCES DE MATADI"
  },
  {
    "code": "ISEME-KINDU",
    "name": "INSTISTUT SUPERIEUR D'ETUDES MEDICALES D'EXCELLENCE DE KINDU"
  },
  {
    "code": "ISES DE LIKASI",
    "name": "INSTITUT SUPERIEUR D'ETUDES SOCIALES DE LIKASI"
  },
  {
    "code": "ISES-KANANGA",
    "name": "INSTITUT SUPERIEUR DES ETUDES SOCIALES DE KANANGA"
  },
  {
    "code": "ISESOD DE GOMA",
    "name": "INSTITUT SUPERIEUR D'ENVIRONNEMENT SOLIDAIRE ET DEVELOPPEMENT DURABLE"
  },
  {
    "code": "ISET-MALUKU",
    "name": "INSTITUT SUPERIEUR D'ÉTUDES TECHNIQUES DE MALUKU"
  },
  {
    "code": "ISETAM",
    "name": "Institut Superieur d'Enseignement Technique,Arts et Metiers"
  },
  {
    "code": "ISETC",
    "name": "INSTITUT SUPERIEUR D'ETUDES TECHNIQUES ET COMMERCIALES DE MOANDA"
  },
  {
    "code": "ISETC MOANDA",
    "name": "INSTITUT SUPERIEUR D'ETUDES TECHNIQUES ET COMMERCIALES DE LOANDA /DE MOANDA"
  },
  {
    "code": "ISETM",
    "name": "INSTITUT SUPERIEUR D'ENSEIGNEMENT TECHNIQUE MEDICALE"
  },
  {
    "code": "ISETM DE NGANDAJIKA",
    "name": "INSTITUT SUPERIEUR D'ENSEIGNEMENT TECHNIQUES MEDICALES NGADAJIKA"
  },
  {
    "code": "ISETM VIRUNGA",
    "name": "INSTITUT SUPERIEUR D'ENSEIGNEMENT TECHNIQUE MEDICALES"
  },
  {
    "code": "ISETM/LUBAO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LUBAO"
  },
  {
    "code": "ISFAD BUKAVU",
    "name": "INSTITUT SUPERIEUR DES FINANCES D'ADMINISTRATION ET DES DOUANES"
  },
  {
    "code": "ISFC",
    "name": "INSTITUT SUPERIEUR DE FORMATION COMMERCIALE"
  },
  {
    "code": "ISFC",
    "name": "INSTITUT SUPERIEURDE FINANCEET DE COMMERCE DE BAGIRA A BUKAVU"
  },
  {
    "code": "ISG/KINSHASA",
    "name": "I9NSTITUT SUPERIEUR DE GESTION - KINSHASA"
  },
  {
    "code": "ISGC",
    "name": "INSTITUT SUPERIEUR DE GÉNIE COMMERCIAL D'INKISI"
  },
  {
    "code": "ISGM UVIRA",
    "name": "INSTITUT SUPERIEUR DE GESTION ET DU MANAGEMENT  D'UVIRA"
  },
  {
    "code": "ISGT",
    "name": "INSTITUT SUPERIEUR DE GESTION ET DES TECHNIQUES"
  },
  {
    "code": "ISHECD",
    "name": "INSTITUT SUPERIEUR DE HAUTES ETUDES DE CRIMINOLOGIE ET DETECTIVES"
  },
  {
    "code": "ISHP-KALEMIE",
    "name": "INSTITUT SUPERIEUR D'HYDROLOGIE ET PECHE DE KALEMIE"
  },
  {
    "code": "ISIA DE LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE APPLIQUEE DE LUBUMBASHI"
  },
  {
    "code": "ISIAGO",
    "name": "INSTITUT SUPÉRIEUR D'INFORMATIQUE APPLIQUÉE ET DE GESTION DE GOMA"
  },
  {
    "code": "ISIB-BASANKUSU",
    "name": "INSTITUT SUPERIEUR INDUSTRIEL DES BOIS DE BASANKUSU"
  },
  {
    "code": "ISIDE",
    "name": "INSTITUT SUPERIEUR D'INGÉNIERIE DE DÉVELOPPEMENT ET DE GESTION DE L'ENVIRONNEMENT"
  },
  {
    "code": "ISIDR/ MAKORO",
    "name": "INSTITUT SUPERIEUR DES DEVELOPPEMENT RURAL DE MAKORO"
  },
  {
    "code": "ISIG",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DE GOMA"
  },
  {
    "code": "ISIG-KIS",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DE KISANGANI"
  },
  {
    "code": "ISIGE",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DES ENTREPRISES DU KINDU"
  },
  {
    "code": "ISIGL/BOMA",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DE BOMA"
  },
  {
    "code": "ISIGL/LUKULA",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ET DE GESTION DE LUKULAA"
  },
  {
    "code": "ISIM",
    "name": "INSTITUT SUPERIEUR INTERDIOCESAIN MONSEIGNEUR MULOLWA"
  },
  {
    "code": "ISIPA-KIN",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE, PROGRAMMATION ET ANALYSE"
  },
  {
    "code": "ISIPA/MATADI",
    "name": "INSTITUT SUPERIEUR D'INFORMATIQUE ,PROGRAMMATION ET ANALYSE DE MATADI"
  },
  {
    "code": "ISITA",
    "name": "INSTITUT SUPERIEUR INFORMATIQUE ET DES TECHNIQUES DE MATADI"
  },
  {
    "code": "ISITA MATADI",
    "name": "INSTITUT SUPERIEUR INFORMATIQUE ET DES TECHNIQUES APPLIQUEES DE MATADI"
  },
  {
    "code": "ISKTM",
    "name": "ISKTM DE KENGE"
  },
  {
    "code": "ISL.G",
    "name": "INSTITUT SUPÉRIEUR DU LAC DE GOMA"
  },
  {
    "code": "ISLG DE GOMA",
    "name": "INSTITUT SUPERIEUR DE LOGISTIQUE ET DE GESTION"
  },
  {
    "code": "ISM D'UVIRA A BUKAVU",
    "name": "INSTITUIT SUPERIEUR DE MANAGEMENT D'UVIRA A BUKAVU"
  },
  {
    "code": "ISM-BUKAVU",
    "name": "INSTITUIT SUPERIEUR DE MANAGEMENT DE BUKAVU"
  },
  {
    "code": "ISMD",
    "name": "INSTITUT SUPERIEUR DE MANAGEMENT ET DE DEVELOPPEMENT"
  },
  {
    "code": "ISMD",
    "name": "INSTITUT SUPERIEUR DE MANAGEMENT ET DE DEVELOPPEMENT"
  },
  {
    "code": "ISMK",
    "name": "INSTITUT SUPERIEUR DE MANAGEMENT DE KINDU"
  },
  {
    "code": "ISNPê-MOANDA",
    "name": "INSTITUT SUPERIEUR DE NAVIGATION ET DE PECHE DE MOANDA"
  },
  {
    "code": "ISNT DE LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES NOUVELLES TECHNOLOGIES DE LUBUMBASHI"
  },
  {
    "code": "ISP  WALUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE"
  },
  {
    "code": "ISP CECA-20",
    "name": "INSTITUT SUPERIEUR DE PÉDAGOGIE  CECA-20"
  },
  {
    "code": "ISP CHAMINADE",
    "name": "Institut Supérieur d'Informatique CHAMINADE"
  },
  {
    "code": "ISP DE KIBIRIZI",
    "name": "INSTRITUT SUPERIEUR PEDAGOGIQUE DE KIBIRIZI"
  },
  {
    "code": "ISP INKISI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D'INKISI"
  },
  {
    "code": "ISP KABARE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KABARE"
  },
  {
    "code": "ISP KAMANA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KAMANA"
  },
  {
    "code": "ISP KAZIBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KAZIBA"
  },
  {
    "code": "ISP KITSHANGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KITSHANGA"
  },
  {
    "code": "ISP KUNGU",
    "name": "INSTITUT SUPERIEUR DE PÉDAGOGIQUE DE KUNGU/NGIRI"
  },
  {
    "code": "ISP MASEREKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MASEREKA"
  },
  {
    "code": "ISP METHODISTE/ MULO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE METHODISTE"
  },
  {
    "code": "ISP MITWABA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MITWABA"
  },
  {
    "code": "ISP MPEGEI",
    "name": "INSTITUT SUPERIEUR PEDAGOGOIQUE DE MPEGEI"
  },
  {
    "code": "ISP UVIRA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  D'UVIRA"
  },
  {
    "code": "ISP- WATSA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE WATSA"
  },
  {
    "code": "ISP-ARU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D’ARU"
  },
  {
    "code": "ISP-B.A NSIENGWOM",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE B.A NSIENGWOM"
  },
  {
    "code": "ISP-BAFWASENDE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE - BAFWASENDE"
  },
  {
    "code": "ISP-BAGATA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BAGATA"
  },
  {
    "code": "ISP-BANDUNDU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BANDUNDU"
  },
  {
    "code": "ISP-BARAKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE BARAKA"
  },
  {
    "code": "ISP-BIAKATO",
    "name": "INSTITUT SUPERIEUR PÉDAGOGIQUE   BIAKATO"
  },
  {
    "code": "ISP-BOKORO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOKORO"
  },
  {
    "code": "ISP-BOMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOMA"
  },
  {
    "code": "ISP-BONDO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BONDO"
  },
  {
    "code": "ISP-BONGIMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE BONGIMBA"
  },
  {
    "code": "ISP-BOSO-DUA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOSO-DUA"
  },
  {
    "code": "ISP-BOSO-NDJANOA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOSO-NDJANOA"
  },
  {
    "code": "ISP-BOSOBOLO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE-BOSOBOLO"
  },
  {
    "code": "ISP-BUKAMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BUKAMA"
  },
  {
    "code": "ISP-BUKAVU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BUKAVU"
  },
  {
    "code": "ISP-BULUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BULUNGU"
  },
  {
    "code": "ISP-BUMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BUMBA"
  },
  {
    "code": "ISP-BUNIA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BUNIA"
  },
  {
    "code": "ISP-BUSINGA",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE DE BUSINGA"
  },
  {
    "code": "ISP-BUTA",
    "name": "INSTITUT SUPERIEUR PEDAOGIQUE DE BUTA"
  },
  {
    "code": "ISP-DIBAYA LUBWE",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE  DE  DIBAYA  LUBWE"
  },
  {
    "code": "ISP-DULA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE DULA"
  },
  {
    "code": "ISP-EOLO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D’EOLO"
  },
  {
    "code": "ISP-FESHI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE FESHI"
  },
  {
    "code": "ISP-GETY",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE GETY"
  },
  {
    "code": "ISP-GOMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE GOMA"
  },
  {
    "code": "ISP-GOMBE",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE  DE  LA GOMBE"
  },
  {
    "code": "ISP-GUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE GUNGU"
  },
  {
    "code": "ISP-IDIOFA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  D’IDIOFA"
  },
  {
    "code": "ISP-IDJWI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D’IDJWI"
  },
  {
    "code": "ISP-ILEBO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D’ILEBO"
  },
  {
    "code": "ISP-INONGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D’INONGO"
  },
  {
    "code": "ISP-ISANGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIUE D’ISANGI"
  },
  {
    "code": "ISP-ISIRO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D’ISIRO"
  },
  {
    "code": "ISP-KABAMBARE",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE DE KABAMBARE"
  },
  {
    "code": "ISP-KABEYA KAMUANGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KABEYA  KAMUANGA"
  },
  {
    "code": "ISP-KABINDA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KABINDA"
  },
  {
    "code": "ISP-KABONGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KABONGO"
  },
  {
    "code": "ISP-KAHEMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KAHEMBA"
  },
  {
    "code": "ISP-KALEHE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KALEHE"
  },
  {
    "code": "ISP-KALEMIE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KALEMIE"
  },
  {
    "code": "ISP-KALIMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KALIMA"
  },
  {
    "code": "ISP-KAMINA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KAMINA"
  },
  {
    "code": "ISP-KAMITUGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KAMITUGA"
  },
  {
    "code": "ISP-KANGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KANGU"
  },
  {
    "code": "ISP-KANIAMA KASESE",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE  DE KANIAMA KASESE"
  },
  {
    "code": "ISP-KARAWA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KARAWA"
  },
  {
    "code": "ISP-KASONGO",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE DE KASONGO"
  },
  {
    "code": "ISP-KASONGO-LUNDA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KASONGO–LUNDA"
  },
  {
    "code": "ISP-KATANDA",
    "name": "I\tNSTITUT SUPERIEUR PEDAGOGIQUE KATANDA"
  },
  {
    "code": "ISP-KATEA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE - KATEA"
  },
  {
    "code": "ISP-KENGE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KENGE"
  },
  {
    "code": "ISP-KIBIRIZI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIRBIRIZI"
  },
  {
    "code": "ISP-KIBOMBO",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE DE KIBOMBO"
  },
  {
    "code": "ISP-KIKWIT",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIKWIT"
  },
  {
    "code": "ISP-KILOM",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KILOM"
  },
  {
    "code": "ISP-KINDU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KINDU"
  },
  {
    "code": "ISP-KINGUNGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KINGUNGI"
  },
  {
    "code": "ISP-KINYATSI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KINYATSI"
  },
  {
    "code": "ISP-KIPAKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIPAKA"
  },
  {
    "code": "ISP-KIPUKU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIPUKU"
  },
  {
    "code": "ISP-KIRUMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KIRUMBA"
  },
  {
    "code": "ISP-KISANGANI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KISANGANI"
  },
  {
    "code": "ISP-KITANGWA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KITANGWA"
  },
  {
    "code": "ISP-KITOY",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KITOY"
  },
  {
    "code": "ISP-KOLE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE KOLE"
  },
  {
    "code": "ISP-KOLWEZI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE KOLWEZI"
  },
  {
    "code": "ISP-KONGOLO",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE DE KONGOLO"
  },
  {
    "code": "ISP-KUTU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KUTU"
  },
  {
    "code": "ISP-KWAMOUTH",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE KWAMOUTH"
  },
  {
    "code": "ISP-L",
    "name": "INSTITUT SUPERIEUR PÉDAGOGIQUE LIBRE DE KISANGANI"
  },
  {
    "code": "ISP-LISALA",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE DE LISALA"
  },
  {
    "code": "ISP-LOKUTU",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE  DE  LOKUTU"
  },
  {
    "code": "ISP-LUBEFU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE LUBEFU"
  },
  {
    "code": "ISP-LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE LUBUMBASHI"
  },
  {
    "code": "ISP-LUEBO",
    "name": "INSTITUT SUPERIEUR PEDAGOGQUE DE LUEBO"
  },
  {
    "code": "ISP-LUIZA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE LUIZA"
  },
  {
    "code": "ISP-LUKALABA",
    "name": "INSTITUT  SUPERIEUR  PEDAGOGIQUE  DE LUKALABA"
  },
  {
    "code": "ISP-LULINGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE LULINGU"
  },
  {
    "code": "ISP-MACHUMBI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE  MACHUMBI"
  },
  {
    "code": "ISP-MAHAGI",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE DE  MAHAGI"
  },
  {
    "code": "ISP-MAMBASA",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE DE MAMBASA"
  },
  {
    "code": "ISP-MANGAI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MANGAI"
  },
  {
    "code": "ISP-MANONO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MANONO"
  },
  {
    "code": "ISP-MASIMANIMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MASIMANIMBA"
  },
  {
    "code": "ISP-MASISI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MASISI"
  },
  {
    "code": "ISP-MATADI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MATADI"
  },
  {
    "code": "ISP-MATANDA",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE DE MATANDA"
  },
  {
    "code": "ISP-MBANDAKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE MBANDAKA"
  },
  {
    "code": "ISP-MBANZA-NGUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE MBANZA–NGUNGU"
  },
  {
    "code": "ISP-MBUJI-MAYI",
    "name": "INSTUTIT SUPERIEUR PEDAGOGIQUE DE MBUJI-MAYI"
  },
  {
    "code": "ISP-MILEMBWE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MILEMBWE"
  },
  {
    "code": "ISP-MILUNDU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MILUNDU"
  },
  {
    "code": "ISP-MOANDA",
    "name": "INSTITUT SUPERIEUR  PEDAGOGIQUE DE MOANDA"
  },
  {
    "code": "ISP-MOLEGBE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE MOLEGBE"
  },
  {
    "code": "ISP-MONGAMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  MONGAMA"
  },
  {
    "code": "ISP-MUHANGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MUHANGI"
  },
  {
    "code": "ISP-MUKEDI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE MUKEDI"
  },
  {
    "code": "ISP-MUSUMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MUSUMBA"
  },
  {
    "code": "ISP-MWEKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE   DE MWEKA"
  },
  {
    "code": "ISP-MWENE-DITU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MWENE-DITU"
  },
  {
    "code": "ISP-NGANDAJIKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE NGANDAJIKA"
  },
  {
    "code": "ISP-NGUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE NGUNGU"
  },
  {
    "code": "ISP-NIOKI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE NIOKI"
  },
  {
    "code": "ISP-NYIRAGONGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE NYIRAGONGO"
  },
  {
    "code": "ISP-NYUNZU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE NYUNZU"
  },
  {
    "code": "ISP-OICHA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D’OICHA"
  },
  {
    "code": "ISP-OPALA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIUE D’OPALA"
  },
  {
    "code": "ISP-PANZI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE PANZI"
  },
  {
    "code": "ISP-PAY-KONGILA",
    "name": "INSITUT SUPERIEUR PEDAGOGIQUE DE PAY-KONGILA"
  },
  {
    "code": "ISP-PELENDE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE PELENDE"
  },
  {
    "code": "ISP-PONT KWANGO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE PONT KWANGO"
  },
  {
    "code": "ISP-POPOKABAKA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE POPOKABAKA"
  },
  {
    "code": "ISP-PWETO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE PWETO"
  },
  {
    "code": "ISP-RUTSHURU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE RUTSHURU"
  },
  {
    "code": "ISP-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE   DE TSHIKAPA"
  },
  {
    "code": "ISP-TSHIOFA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE TSHIOFA"
  },
  {
    "code": "ISP-UBUNDU",
    "name": "INSTITUT  SUPERIEUR PEDAGOGIQUE D’UBUNDU"
  },
  {
    "code": "ISP-UMANGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE UMANGI"
  },
  {
    "code": "ISP-UPOTO-BINGA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D’UPOTO"
  },
  {
    "code": "ISP-WALIKALE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE  DE WALIKALE"
  },
  {
    "code": "ISP-WEMBO-NYAMA",
    "name": "INSTUTIT SUPERIEUR PEDAGOGIQUE DE WEMBO-NYAMA"
  },
  {
    "code": "ISP-YAKOMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE YAKOMA"
  },
  {
    "code": "ISP-YAMBULA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE YAMBULA"
  },
  {
    "code": "ISP.B",
    "name": "INSTITUT SUPÉRIEUR PÉDAGOGIQUE MASEREKA À BUTEMBO"
  },
  {
    "code": "ISP/ BASANKUSU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BASANKUSU"
  },
  {
    "code": "ISP/ BOLOMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE BOLOMBA"
  },
  {
    "code": "ISP/ FA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE FARADJE"
  },
  {
    "code": "ISP/ABUZI",
    "name": "INSTITUT SUPERIEUR PÉDAGOGIQUE D'ABUZI (ISP/ABUZI) A YAKOMA"
  },
  {
    "code": "ISP/BOKUNGU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE BOKUNGU"
  },
  {
    "code": "ISP/KAMINA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE KAMINA"
  },
  {
    "code": "ISP/KAMPENE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE KAMPENE"
  },
  {
    "code": "ISP/KINYATSI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE  KINYATSI"
  },
  {
    "code": "ISP/KWILU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE"
  },
  {
    "code": "ISP/LODJA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE LODJA"
  },
  {
    "code": "ISP/MAKANZA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE MAKANZA"
  },
  {
    "code": "ISP/MBANDAKA",
    "name": "INSTITUT SUPERIEUR DE PECHE DE MBANDAKA"
  },
  {
    "code": "ISP/TSHIKULA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE TSHIKULA"
  },
  {
    "code": "ISP/WAMAZA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE WAMAZA"
  },
  {
    "code": "ISPALE/ TADU",
    "name": "INSTITUT SUPERIEUR  PRINCE AMANI DES SCIENCES DE LA LOGISTIQUE ET ENTREPRENARIAT DE TADU"
  },
  {
    "code": "ISPB",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE (ISP) BOKADA"
  },
  {
    "code": "ISPD DE BUKAVU",
    "name": "INSTITUT SUPERIEUR POUR LA PROMOTION DU DEVELOPPEMENT DE BUKAVU"
  },
  {
    "code": "ISPDE DE BUKAVU",
    "name": "INSTITUIT SUPERIEUR POUR LA PROMOTION DE PAIX,DU DEVELOPPEMENT ET DE L'ENVIRONNEMENT  DE BUKAVU"
  },
  {
    "code": "ISPF",
    "name": "INSTITUT SUPERIEUR DE PASTORALE FAMILIALE"
  },
  {
    "code": "ISPF DE BUKAVU",
    "name": "INSTITUT SUPERIEUR DE PASTORALE FAMILLIALE DE BUKAVU"
  },
  {
    "code": "ISPG",
    "name": "INSTITUT SUPERIEUR DE PECHE DE GOMA"
  },
  {
    "code": "ISPG/KISANTU",
    "name": "INSTITUT SUPERIEUR DE PETROLE ET DE GAZ DE KASAVUBU"
  },
  {
    "code": "ISPG/MOANDA",
    "name": "INSTITUT SUPERIEUR DU PETROL ET DU GAZ /MOANDA"
  },
  {
    "code": "ISPGK",
    "name": "INSTITUT SUPERIEUR DE PETROLE ET DE GAZ DE KASAVUBU"
  },
  {
    "code": "ISPL",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE LUOZI"
  },
  {
    "code": "ISPO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE D'OSHWE"
  },
  {
    "code": "ISPR",
    "name": "INSTITUT SUPERIEUR DE PÉDAGOGIE RELIGIEUSE"
  },
  {
    "code": "ISPT IGB WOKOLO",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE ET TECHNIQUE IGB WOKOLO"
  },
  {
    "code": "ISPT LIKASI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE LIKASI"
  },
  {
    "code": "ISPT-BUKAVU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE BUKAVU"
  },
  {
    "code": "ISPT-BUMBA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE BUMBA"
  },
  {
    "code": "ISPT-GOMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE GOMA"
  },
  {
    "code": "ISPT-ILEBO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE D'ILEBO"
  },
  {
    "code": "ISPT-KABINDA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE KABINDA"
  },
  {
    "code": "ISPT-KANTSHI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE KANTSHI"
  },
  {
    "code": "ISPT-KIN",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE KINSHASA"
  },
  {
    "code": "ISPT-KINDI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE -KINDI"
  },
  {
    "code": "ISPT-KINDU",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE  DE KINDU"
  },
  {
    "code": "ISPT-LIKASI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE LIKASI"
  },
  {
    "code": "ISPT-LUSAMBO",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE LUSAMBO"
  },
  {
    "code": "ISPT-MISELE",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE MISELE"
  },
  {
    "code": "ISPT-MUHANGI",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE DE MUHANGI"
  },
  {
    "code": "ISPT-YAHUMA",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE ET TECHNIQUE YAHUMA"
  },
  {
    "code": "ISPT/RETHY DE ITURI",
    "name": "INSTITUT SUPERIEUR  PÉDAGOGIQUE ET  TECHNIQUE  RETHY DE ITURI"
  },
  {
    "code": "ISPY",
    "name": "INSTITUT SUPERIEUR PEDAGOGIQUE DE YUMBI"
  },
  {
    "code": "ISS-KIN",
    "name": "INSTITUT SUPERIEUR DES STATISTIQUES DE KINSHASA"
  },
  {
    "code": "ISS-KINDU",
    "name": "INSTITUT SUPERIEUR DE STATISTIQUES DE KINDU"
  },
  {
    "code": "ISS-LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES STATISTIQUES DE LUBUMBASHI"
  },
  {
    "code": "ISSC-MULO",
    "name": "UNIVERSITÉ SAINTE CROIX DE MULO"
  },
  {
    "code": "ISSCD",
    "name": "INSTITUT SUPERIEUR DES SCIENCES COMMERCIALES DE DINGA"
  },
  {
    "code": "ISSCG",
    "name": "INSTITUT SUPERIEUR DES SCIENCES COMMERCIALES DE GBADOLITE"
  },
  {
    "code": "ISSD / KASANGULU",
    "name": "INSTITUT SUPÉRIEUR DES SCIENCES DE SANTE ET DE DÉVELOPPEMENT"
  },
  {
    "code": "ISSI",
    "name": "INSTITUT SUPERIEUR DES SCIENCES INFIRMIÈRES"
  },
  {
    "code": "ISSIGE-BUNIA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES INFORMATIQUES ET DE GESTION"
  },
  {
    "code": "ISSIK",
    "name": "INSTITUT SUPERIEUR DE SCIENCES INFIRMIERES DE KALEMIE"
  },
  {
    "code": "ISSIM",
    "name": "INSTITUT SUPERIEUR DES SCIENCES INFIRMIERES DE MATADI"
  },
  {
    "code": "ISSM DE KINDU",
    "name": "INSTITUT SUPERIEUR DES SCIENCES MEDICALES DE KINDU"
  },
  {
    "code": "ISSM DE LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES SCIENCES MEDICALES DE LUBUMBASHI"
  },
  {
    "code": "ISSNT",
    "name": "INSTITUT SUPERIEUR DE STATISTIQUE ET NOUVELLES TECHNOLOGIES"
  },
  {
    "code": "ISSPH DE BUTEMBO",
    "name": "INSTITUT SUPERIEUR DFE SANTE PUBLIQUE HORIZON DE BUTEMBO"
  },
  {
    "code": "ISSR",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES DE KANANGA"
  },
  {
    "code": "ISSR-D",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES ET DE DÉVELOPPEMENT"
  },
  {
    "code": "ISSRD/LENDISA DE BWA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES ET DE DÉVELOPPEMENT  LENDISA DE BWAMANDA"
  },
  {
    "code": "ISSS / INONGO",
    "name": "ISSS / INONGO"
  },
  {
    "code": "ISSS C-R GEMENA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES DE SANTE CROIX-ROUGE GEMENA"
  },
  {
    "code": "ISSS CR GOMA",
    "name": "INSTITUT SUPERIEUR DE SCIENCES DE LA SANTE DE LA BCROIX ROUGE DE GOMA"
  },
  {
    "code": "ISSS-CR",
    "name": "Institut Superieur des sciences de sané de la  croix-rouge"
  },
  {
    "code": "ISSS-CR/KKT",
    "name": "INSTITUT SUPERIEUR DES SCIENCES DE SANTE DE LA CROIX-ROUGE à KIKWIT"
  },
  {
    "code": "ISSS-KAMINA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES DE SANTE DE KAMINA"
  },
  {
    "code": "ISSS-KIKWIT",
    "name": "INSTITUT SUPÉRIEUR DES SCIENCES DE SANTE"
  },
  {
    "code": "ISSSCR",
    "name": "INSTITUT SUPERIEUR  DES SCIENCES DE SANTE DE CROIX-ROUGE DE KALEMIE"
  },
  {
    "code": "ISSSCR MATADI",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUES DE SCIENCES DE SANTE DE LA CROIX -ROUGE DE MATADI"
  },
  {
    "code": "ISSSCR MATADI",
    "name": "INSTITUT SUPERIEUR DE SCIENCE DE SANTE DE LA CROIX-ROUGE DE MATADI"
  },
  {
    "code": "ISSSCR/ MBANDAKA",
    "name": "INSTITUT SUPERIEUR SCIENCE DE SANTE DE LA CROIX ROUGE DE MBANDAKA"
  },
  {
    "code": "ISSSD/UNADIC",
    "name": "INSTITUT SUPERIEUR SCIENCES DE SANTE ET DE DEVELOPPEMENT DE KASANGULU"
  },
  {
    "code": "ISSSI-MATADI",
    "name": "INSTITUT SUPERIEUR DES SCIENCES INFIRMIERES DE MATADI"
  },
  {
    "code": "ISSSR",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES JOSEPH MUKASA"
  },
  {
    "code": "ISSSR DE BUKAVU",
    "name": "INSTITUT SUPERIEUR DES SCIENCES RELIGIEUSES DE BUKAVU"
  },
  {
    "code": "ISSTA",
    "name": "INSTITUT SUPERIEUR DES SCIENCES ET TECHNIQUES APPLIQUÉES DE MBUJI-MAYI"
  },
  {
    "code": "ISSTDD DE MBAU",
    "name": "INSTITUT SUPERIEUR DES SCIENCES TECHNIQUES ET DEVELOPPEMENT DURABLE DE MBAU"
  },
  {
    "code": "IST DE BOMA",
    "name": "INSTITUTSUPERIEUR TECHNIQUE DE BOMA"
  },
  {
    "code": "IST-GOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE GOMA"
  },
  {
    "code": "IST-IDIOFA",
    "name": "INSTITUT  SUPERIEUR  THEOLOGIQUE D'IDIOFA"
  },
  {
    "code": "IST-ISIRO",
    "name": "INSTITUT SUPERIEUR TECHNOLOGIQUE D'ISIRO"
  },
  {
    "code": "IST-K",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE KINSHASA"
  },
  {
    "code": "IST-SANKURU",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE SANKURU"
  },
  {
    "code": "IST-UHTGL",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUE DE L'UHTGL"
  },
  {
    "code": "IST/ BASANKUSU",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE BASANKUSU"
  },
  {
    "code": "IST/KINSHASA",
    "name": "INSTITUT SUPERIEUR TECHNOLOGIQUE DE KINSHASA"
  },
  {
    "code": "IST/VAN GEERT",
    "name": "INSTITUT SUPERIEUR TECHNIQUE VAN GEEERT DE YASA-BONGA"
  },
  {
    "code": "ISTA -KALIMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUEES DE KALIMA"
  },
  {
    "code": "ISTA-BUKAVU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE BUKAVU"
  },
  {
    "code": "ISTA-DOMIONGO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE DOMIONGO"
  },
  {
    "code": "ISTA-EBONDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES D'EBONDA"
  },
  {
    "code": "ISTA-GBADOLITE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE GBADOLITE"
  },
  {
    "code": "ISTA-GOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE GOMA"
  },
  {
    "code": "ISTA-GOMBE-MATADI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE GOMBE-MATADI"
  },
  {
    "code": "ISTA-KASANGULU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE KASANGULU"
  },
  {
    "code": "ISTA-KIKWIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUEES DE KIKWIT"
  },
  {
    "code": "ISTA-KINDU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE KINDU"
  },
  {
    "code": "ISTA-KINSHASA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE KINSHASA"
  },
  {
    "code": "ISTA-KOLWEZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE KOLWEZI"
  },
  {
    "code": "ISTA-LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE LUBUMBASHI"
  },
  {
    "code": "ISTA-LUKULA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE LUKULA A BOMA"
  },
  {
    "code": "ISTA-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE MBUJI-MAYI"
  },
  {
    "code": "ISTA-NDOLUMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE NDOLUMA A LUBERO"
  },
  {
    "code": "ISTAC à GOMA",
    "name": "INSTITUT SUPERIEUR DE TECHNOLOGIE EN AFRIQUE CENTRALE/ISTAC  à GOMA"
  },
  {
    "code": "ISTAC DE MBANZA NGUN",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES  APPLIQUEES ET COMMERCIALES DE MBANZA NGUNGU"
  },
  {
    "code": "ISTACHA KIMPESE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUEES ET CHIMIE AGRO-ALIMENTAIRE/KIMPESE"
  },
  {
    "code": "ISTAD",
    "name": "INSTITUT SUPÉRIEUR DES ARTS ET DE DÉVELOPPEMENT DE GOMA"
  },
  {
    "code": "ISTAD / KINDUNDU",
    "name": "ISTAD / KINDUNDU"
  },
  {
    "code": "ISTAD BENI",
    "name": "INSTITUT SUPERIEURE DES TECHNIQUES  APPLIQUEES ET DEVELOPPEMENT DE BENI"
  },
  {
    "code": "ISTAD-MASAMUNA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES APPLIQUÉES DE MASAMUNA"
  },
  {
    "code": "ISTADC",
    "name": "INSTITUT SUPERIEUR THEOLOGIQUE DES ASSEMBLÉES DE DIEU AU CONGO"
  },
  {
    "code": "ISTAL",
    "name": "INSTITUT SUPERIEUR TECHNIQUE ADVENTISTE DE LUKANGA"
  },
  {
    "code": "ISTAM LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUES ,DES ARTS ET METIERS DE LUBUMBASHI"
  },
  {
    "code": "ISTAM-KIKWIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES, ARTS ET METIERS DE KIKWIT"
  },
  {
    "code": "ISTAPT DE KYAVINYONG",
    "name": "INSTITUT SUPERIEUR TECHNIQUE D'AQUACULTURE.DE PECHE ET DE TOURISME DE KYAVINYONGE"
  },
  {
    "code": "ISTAS-MAHAGI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES D'ANIMATION SOCIALE"
  },
  {
    "code": "ISTB",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE BOOTH"
  },
  {
    "code": "ISTB",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE LA FONDATION BITAKWIRA"
  },
  {
    "code": "ISTC /MATADI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES COMMERCIALES"
  },
  {
    "code": "ISTC/KIMPESE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES ET COMMERCIALE DE KIMPESE"
  },
  {
    "code": "ISTCE DE BUKAVU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES COMMERCIALES ET ECONOMIQUES DE BUKAVU"
  },
  {
    "code": "ISTCI",
    "name": "INSTITUT SUPERIEUR TECHNIQUE COMMERCIAL ET INFORMATIQUES"
  },
  {
    "code": "ISTD",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE ET DEVELOPPEMENT DE KAMANA"
  },
  {
    "code": "ISTD BUKAVU",
    "name": "INSTITIUT SUPERIEUR DES TECHNIQUES ET DEVELOPPEMENT DE BUKAVU"
  },
  {
    "code": "ISTD DE DUNGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES  DE DEVELOPPEMENT DE DUNGU"
  },
  {
    "code": "ISTD DE KIKONDA",
    "name": "INSTITUT DUPERIEUR DES TECHNIQUES DE DEVELOPPEMENT DE KIKONDA"
  },
  {
    "code": "ISTD-KALEHE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE DEVELOPPEMENT DE KALEHE"
  },
  {
    "code": "ISTD-KINDU",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUE ET DEVELOPPEMENT DE KINDU"
  },
  {
    "code": "ISTD-LUSAMBO",
    "name": "ISTD DE LUSAMBO"
  },
  {
    "code": "ISTD-MULUNGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES ET DE DEVELOPPEMENT DE MULUNGU A KABARE"
  },
  {
    "code": "ISTD-SANKURU",
    "name": "INSTITUT SUPERIEUR TECHNIQUE ET DEVELOPPEMENT DU SANKURU"
  },
  {
    "code": "ISTD-UPUTO LISALA",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE ET DEVELOPPEMENT COMMUNAUTAIRE UPUTO DE LISALA"
  },
  {
    "code": "ISTDC",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE ET DE DEVELOPPEMENT COMMUNAUTAIRE DE YAKUSU"
  },
  {
    "code": "ISTDC-UPOTO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE DEVELOPPEMENT DU CONGO DE UPOTO"
  },
  {
    "code": "ISTDK",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE DEVELOPPEMENT DE KASINDI"
  },
  {
    "code": "ISTE",
    "name": "INSTITUT SUPERIEUR DE THÉOLOGIE ÉVANGÉLIQUE"
  },
  {
    "code": "ISTE-K",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE EVANGELIQUE"
  },
  {
    "code": "ISTE-K",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE EVANGELIQUE"
  },
  {
    "code": "ISTE/KATANGA",
    "name": "INSTITUT SUPERIEUR TECHNIQUE DE L'EXECELLENCE"
  },
  {
    "code": "ISTE/SANKURU",
    "name": "INSTITUT SUPERIEUR TECHNIQUE EBONDA"
  },
  {
    "code": "ISTEGI",
    "name": "INSTITUT SUPERIEUR TECHNIQUE D'ETUDES EN GESTION ET INFORMATIQUE DE BUKAVU"
  },
  {
    "code": "ISTEK",
    "name": "INSTITUT SUPERIEUR THEOLOGIE EVANGELIQUE AU KIVU"
  },
  {
    "code": "ISTELU",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE DE LUBUMBASHI"
  },
  {
    "code": "ISTEMA",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE EVANGELIQUE DE MANONO"
  },
  {
    "code": "ISTEMI",
    "name": "Institut Supérieur de Théologie Évangélique de la Mission"
  },
  {
    "code": "ISTGA DE GOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE GESTION DES AFFAIRES"
  },
  {
    "code": "ISTGD KASINDI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DE GESTION ET DEVELOPPEZMENT DE KASINDI"
  },
  {
    "code": "ISTGD/KIMPESE",
    "name": "INSTITUT SUPERIEUR DES TECHENIQUES DE GESTION ET DE DEVELOPPEMENT/KIMPESE"
  },
  {
    "code": "ISTGED/KINSHASA",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUES  DE GESTION ET DEVELOPPEMENT"
  },
  {
    "code": "ISTHEMBU",
    "name": "INSTITUT SUPERIEUR DE THÉOLOGIE EVANGÉLIQUE DE MBUJI-MAYI"
  },
  {
    "code": "ISTHEMI",
    "name": "UNIVERSITE EBEN EZER À NIAMIANDA(EX-INSTITUT SUPERIEUR DE THEOLOGIE ET DE MISSIOLOGIE)"
  },
  {
    "code": "ISTIA-K",
    "name": "INSTITUT SUPERIEUR TECHNIQUE D'INFORMATIQUE APPLIQUE DE KABINDA"
  },
  {
    "code": "ISTIC",
    "name": "INSTITUT SUPERIEUR DES TECHNOLOGIES DE L'INFORMATION ET BDE COMMUNICATION"
  },
  {
    "code": "ISTK-KIN",
    "name": "INSTITUT SUPERIEUR TECHNOLOGIQUE DE KINSHASA"
  },
  {
    "code": "ISTKA",
    "name": "Institut Supérieur Technique de Kananga"
  },
  {
    "code": "ISTKM / MASI-MANIMBA",
    "name": "ISTKM / MASI-MANIMBA"
  },
  {
    "code": "ISTL LUIBUMBASHI",
    "name": "INSTITUT SUPERIEUR TECHNIOQUE DE LUBUMBASHI"
  },
  {
    "code": "ISTM",
    "name": "INSTITUT SUPOERIEUR DES TECHNIQUES MEDICALES DE RUTSHURU"
  },
  {
    "code": "ISTM  WALIKALE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE  WALIKALE"
  },
  {
    "code": "ISTM BKB/KINSHASA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  BEATRICE KIMPAVITA"
  },
  {
    "code": "ISTM BON BERGER",
    "name": "INSTITUT SUPERIEUR DES  TECHNIQUES MPEDICALES DE BON BERGER"
  },
  {
    "code": "ISTM BUDJALA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÉDICALES  BUDJALA"
  },
  {
    "code": "ISTM DE KAYNA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAYNA"
  },
  {
    "code": "ISTM DE LUKANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES"
  },
  {
    "code": "ISTM DE LUOZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  DE  LUOZI"
  },
  {
    "code": "ISTM DE TSHIOFA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES TSHIOFA"
  },
  {
    "code": "ISTM DON PETIT PETIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÉDICALES DON PETIT PETIT"
  },
  {
    "code": "ISTM FIZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE FIZI"
  },
  {
    "code": "ISTM KABARE",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUES MEDICALES DE BUKAVU"
  },
  {
    "code": "ISTM KIMPESE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIMPESE"
  },
  {
    "code": "ISTM KISANTU",
    "name": "INSTITUT SUPERIUR DES TECHNIQUES MEDICALES DE KISANTU"
  },
  {
    "code": "ISTM LUBAO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LUBAO"
  },
  {
    "code": "ISTM LUBUMBASHI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LUBUMBASHI"
  },
  {
    "code": "ISTM MASISI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MASISI"
  },
  {
    "code": "ISTM MATADI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MATADI"
  },
  {
    "code": "ISTM MATADI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MATADI"
  },
  {
    "code": "ISTM METHODISTE/MULO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES  METHODISTE/MULONGOMEDICALES"
  },
  {
    "code": "ISTM MITWABA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MITWABA"
  },
  {
    "code": "ISTM ND/LODJA",
    "name": "INSTITUT TECHNIQUES MEDICALES NOTRE DAME  DE LODJA"
  },
  {
    "code": "ISTM Pro-santé",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ISTM -Pro-Santé de kisantu"
  },
  {
    "code": "ISTM SAINT JOSEPH DE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  SAINT JOSEPH  DE LIKASI"
  },
  {
    "code": "ISTM SHABUNDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE SHABUNDA"
  },
  {
    "code": "ISTM UVIRA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'UVIRA"
  },
  {
    "code": "ISTM WATSA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE WATSA"
  },
  {
    "code": "ISTM YAKOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  YAKOMA"
  },
  {
    "code": "ISTM-ANKORO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'ABKORO"
  },
  {
    "code": "ISTM-ARU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'ARU"
  },
  {
    "code": "ISTM-BAGATA",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUES MEDICALES DE BAGATA"
  },
  {
    "code": "ISTM-BANDUNDU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BANDUNDU"
  },
  {
    "code": "ISTM-BARAKA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BARAKA"
  },
  {
    "code": "ISTM-BASOKO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BASOKO"
  },
  {
    "code": "ISTM-BENI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BENI"
  },
  {
    "code": "ISTM-BISHUSHA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BISHUSHA"
  },
  {
    "code": "ISTM-BOKORO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BOKORO"
  },
  {
    "code": "ISTM-BUKAVU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES BUKAVU"
  },
  {
    "code": "ISTM-BUMBA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BUMBA"
  },
  {
    "code": "ISTM-BUNIA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BUNIA"
  },
  {
    "code": "ISTM-BUTA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BUTA"
  },
  {
    "code": "ISTM-BUTEMBO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BUTEMBO"
  },
  {
    "code": "ISTM-CEPROMAD",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  CEPROMAD-KISANGANI"
  },
  {
    "code": "ISTM-FAK",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUESA MEDICALES FRANCO AMERICAINE DE KINSHAS"
  },
  {
    "code": "ISTM-FESHI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE FESHI"
  },
  {
    "code": "ISTM-GOMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE GOMA"
  },
  {
    "code": "ISTM-GUNGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE GUNGU"
  },
  {
    "code": "ISTM-IDIOFA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'IDIOFA"
  },
  {
    "code": "ISTM-ILEBO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'ILEBO"
  },
  {
    "code": "ISTM-IPAMU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES D'IPAMU MEDICALES D'IPAMU"
  },
  {
    "code": "ISTM-ISIRO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'ISIRO"
  },
  {
    "code": "ISTM-KABAMBARE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KABAMBARE"
  },
  {
    "code": "ISTM-KABINDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KABINDA"
  },
  {
    "code": "ISTM-KAKENGE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAKENGE"
  },
  {
    "code": "ISTM-KALEMIE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KALEMIE"
  },
  {
    "code": "ISTM-KALENDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KALENDA"
  },
  {
    "code": "ISTM-KALIMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KALIMA"
  },
  {
    "code": "ISTM-KAMIJI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAMIJI"
  },
  {
    "code": "ISTM-KAMINA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAMINA"
  },
  {
    "code": "ISTM-KANANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KANANGA"
  },
  {
    "code": "ISTM-KANGU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE TSHELA A KANGU"
  },
  {
    "code": "ISTM-KANYAMULANDE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KANYAMULANDE"
  },
  {
    "code": "ISTM-KARAWA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KARAWA"
  },
  {
    "code": "ISTM-KASONGO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KASONGO"
  },
  {
    "code": "ISTM-KASONGO-LUNDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KASONGO-LUNDA"
  },
  {
    "code": "ISTM-KAZIBA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAZIBA"
  },
  {
    "code": "ISTM-KENGE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES KENGE II"
  },
  {
    "code": "ISTM-KIBOMBO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIBOMBO"
  },
  {
    "code": "ISTM-KIDIMA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIDIMA"
  },
  {
    "code": "ISTM-KIKONDJA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIKONDJA"
  },
  {
    "code": "ISTM-KIKWIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KIKWIT"
  },
  {
    "code": "ISTM-KIM-KIKWIT",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES KIMBAGUISTE DE KIKWIT"
  },
  {
    "code": "ISTM-KIMB-BUKAVU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUE MEDICALES KIMBANGUISTE DE BUKAVU"
  },
  {
    "code": "ISTM-KIN",
    "name": "Institut supérieur des Techniques médicales de Kinshasa"
  },
  {
    "code": "ISTM-KINDU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KINDU"
  },
  {
    "code": "ISTM-KISANGANI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KISANGANI"
  },
  {
    "code": "ISTM-KKC",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  KASONGO-KABAMBARE CENTRE"
  },
  {
    "code": "ISTM-KOLE",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES MÉDICALES KOLE"
  },
  {
    "code": "ISTM-KOLWEZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - KOLWEZI"
  },
  {
    "code": "ISTM-KONGOLO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - KONGOLO"
  },
  {
    "code": "ISTM-KYONDO",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES MÉDICALES - KYONDO"
  },
  {
    "code": "ISTM-LIKASI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LIKASI"
  },
  {
    "code": "ISTM-LISALA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - LISALA"
  },
  {
    "code": "ISTM-LODJA",
    "name": "INSTITUT SUPERIRUR DES TECHNIQUES MEDICALES LODJA"
  },
  {
    "code": "ISTM-LUBEFU",
    "name": "INSTITUT SUPERIEUR  DES TECHNIQUES MEDICALES DE LUBEFU"
  },
  {
    "code": "ISTM-LUEBO",
    "name": "INSTITUT SUPÉRIEUR DES TECHNIQUES MÉDICALES DE LUEBO"
  },
  {
    "code": "ISTM-LUMBI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LUMBI"
  },
  {
    "code": "ISTM-MABENGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MABENGA A BAGATA"
  },
  {
    "code": "ISTM-MAHAGI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MAHAGI"
  },
  {
    "code": "ISTM-MANONO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - MANONO"
  },
  {
    "code": "ISTM-MBANDAKA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MBANDAKA"
  },
  {
    "code": "ISTM-MBUJI-MAYI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MBUJI-MAYI"
  },
  {
    "code": "ISTM-MIABI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MIABI"
  },
  {
    "code": "ISTM-MIKALAYI",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUE MEDICAL DE MIKALAYI"
  },
  {
    "code": "ISTM-MILLENAIRE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES - MILLINAIRE"
  },
  {
    "code": "ISTM-MOANZA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DES MOANZA"
  },
  {
    "code": "ISTM-MONGALA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES MONGALA"
  },
  {
    "code": "ISTM-MRP-KENGE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES MARIE REINE DE LA PAIX À KENGE"
  },
  {
    "code": "ISTM-MULAVUDI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICAL DE  MULAVUDI"
  },
  {
    "code": "ISTM-MULUNDU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MULUNDU"
  },
  {
    "code": "ISTM-MUSUMBA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE MUSUMBA"
  },
  {
    "code": "ISTM-NYANGENZI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE NYANGENZI"
  },
  {
    "code": "ISTM-NYANKUNDE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES NYANKUNDE"
  },
  {
    "code": "ISTM-PIMU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE PIMA"
  },
  {
    "code": "ISTM-PUNIA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE PUNIA"
  },
  {
    "code": "ISTM-SALA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES SALA"
  },
  {
    "code": "ISTM-TOBIKISA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES"
  },
  {
    "code": "ISTM-TSHIKAPA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICAL DE TSHIKAJI"
  },
  {
    "code": "ISTM-TSHILENGE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE TSHILENGE"
  },
  {
    "code": "ISTM-TSHIMBULU",
    "name": "IINSTITUT SUPERIEUR DE TECHNIQUE MEDICAL"
  },
  {
    "code": "ISTM-TSHUMBE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE TSHUMBE"
  },
  {
    "code": "ISTM-UBANGI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE UBANGI A GBADOLITE"
  },
  {
    "code": "ISTM-VANGA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE VANGA"
  },
  {
    "code": "ISTM-WAMBA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE WAMBA"
  },
  {
    "code": "ISTM-WB",
    "name": "Institut Superieur des Techniques Medicales william BOOTH"
  },
  {
    "code": "ISTM-WEMBO NYAMBO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  DE WEMBO-NYAMA"
  },
  {
    "code": "ISTM-WIKONGE",
    "name": "INSTITUT SUPERIEUR TECNIQUES MEDICALES  WIKONG"
  },
  {
    "code": "ISTM-YANGAMBI",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE YANGAMBI"
  },
  {
    "code": "ISTM-ZABA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE ZABA"
  },
  {
    "code": "ISTM/ FRANCO AMERICA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MÉDICALES FRANCO AMERICAIN"
  },
  {
    "code": "ISTM/ LUSAMBO",
    "name": "INSTITUT SUPERIEU DES TECHNIQUES MEDICALES"
  },
  {
    "code": "ISTM/ MAKANZA",
    "name": "INSTITUT SUPERIEUR DES TECHNQUES MEDICALES DE MAKANZA"
  },
  {
    "code": "ISTM/ PIMO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES  DE PIMO"
  },
  {
    "code": "ISTM/BASANKUSU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE BASANKUSU"
  },
  {
    "code": "ISTM/BULAPE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES BULAPE"
  },
  {
    "code": "ISTM/KAMUESHA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE KAMUESHA"
  },
  {
    "code": "ISTM/KIROTSHE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES  MEDICALES"
  },
  {
    "code": "ISTM/KWANGO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES-KWANGO"
  },
  {
    "code": "ISTM/LUIZA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES"
  },
  {
    "code": "ISTM/LUPUTA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES-LUPUTA"
  },
  {
    "code": "ISTMB",
    "name": "INSTITUT SUPERIEUR TECHNIQUES MEDICALES (ISTM) BILI"
  },
  {
    "code": "ISTMCR",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE LA CROIX ROUGE DE MBUJI-MAYI"
  },
  {
    "code": "ISTMDDG",
    "name": "ISTITUT SUPERIEUR DES TECHNIQUES MEDICALES (ISTM) DON DE DIEU DE GBADOLITE"
  },
  {
    "code": "ISTMEF",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES FIVAL"
  },
  {
    "code": "ISTMG BOMA",
    "name": "IINSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ET GESTION"
  },
  {
    "code": "ISTMG DE MOANDA",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ET DE GESTION/ISTMG"
  },
  {
    "code": "ISTMK",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES KIBALI"
  },
  {
    "code": "ISTMLB",
    "name": "INSTITUT SUPERIEUR  DE TECHNIQUE MÉDICALE LOKAME DE BUSINGA"
  },
  {
    "code": "ISTMM",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES ET MANAGEMENT"
  },
  {
    "code": "ISTMM/MWENE-DITU",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES MORAVE DE MWENE-DITU"
  },
  {
    "code": "ISTMMM",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES METHODISTE DE MALEMBA NKULU"
  },
  {
    "code": "ISTMN",
    "name": "INSTITUT SUPERIEUR TECHNIQUE Mgr NKINGA"
  },
  {
    "code": "ISTMO",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES D'OICHA"
  },
  {
    "code": "ISTMW",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUES MEDICALES (ISTM) WAPINDA"
  },
  {
    "code": "ISTN",
    "name": "INSTITUT SUPERIEUR DE THÉOLOGIE DE NGALIEMA"
  },
  {
    "code": "ISTOU GOMA",
    "name": "INSTITUT SUPERIEUR DE TOURISME DE GOMA"
  },
  {
    "code": "ISTP-TSHIKAPA",
    "name": "INSTITUT PEDAGOGIQUE ET TECHNIQUE  TSHIKAPA"
  },
  {
    "code": "ISTPG",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES DU PETROLE ET DU GAZ DE MOANDA"
  },
  {
    "code": "ISTPK",
    "name": "INSTITUT SUPERIEUR TECHNIQUE PROTESTANT DE KINSHASA"
  },
  {
    "code": "ISTPS",
    "name": "INSTITUT SUPERIEUR DE THEOLOGIE ET DE PHILOSOPHIE SAINT BELLARMIN DE MAYIDI"
  },
  {
    "code": "ISTS DE GOMA",
    "name": "INSTITUT SUPERIEUR DE TECHNIQUE SOCIAL"
  },
  {
    "code": "ISTS- TSHUMBE",
    "name": "INSTITUT SUPERIEUR  TECHNIQUE LA SAGESSE DE TSHUMBE"
  },
  {
    "code": "ISTTMN DE NZOBE",
    "name": "INSTITUT SUPERIEUR DES TECHNIQUES MEDICALES DE NZOBE"
  },
  {
    "code": "ISTY",
    "name": "INSTITUT  SUPERIEUR  TECHNIQUE DE NGALIEMA"
  },
  {
    "code": "ITIA DE KABINDA",
    "name": "INSTITUT TECHNIQUES INFORMATIOQUES APPLIQUEES DE KABINDA"
  },
  {
    "code": "ITIC/ MBANDAKA",
    "name": "INSTITUT TECHNOLOGIQUE INTERNATIONAL DU CONGO DE MBANDAKA"
  },
  {
    "code": "ITSS DE LUBUMBASHI",
    "name": "INSTITUT DE THEOLOGIE SAINT JEAN BOSCO DE SALES DE LUBUMBASHI"
  },
  {
    "code": "IUC DE LIKASI",
    "name": "INSTITUT UNIVERSITAIRE DU CONGO DE LIKASI"
  },
  {
    "code": "IUEFD DE BANZA NGUNG",
    "name": "INSTITUT UNIVERSITAIRE D'ETUDES DE FORMATION ET DE DEVELOPPEMENT/IUEFD DE BANZ NGUNGU"
  },
  {
    "code": "IUKL",
    "name": "INSTITUT UNIVERSITAIRE DE KASONGO-LUNDA"
  },
  {
    "code": "LAU/KINSHASA",
    "name": "LEADERSHIP ACADEMIA UNIVERSITY"
  },
  {
    "code": "PESK",
    "name": "PHILOSOPHÂT EDITH STEIN À KISANGANI"
  },
  {
    "code": "PIB",
    "name": "PHILOSOPHÂT ISIDORE BAKANJA DE BUKAVU"
  },
  {
    "code": "PSAK",
    "name": "PHILOSOPHÂT SAINT AUGUSTIN DE KISANGANI"
  },
  {
    "code": "PUK-E",
    "name": "UNIVERSITÉ PROGRÈS DE KINSHASA-EST"
  },
  {
    "code": "U C A",
    "name": "UNIVERSITE DU CEPROMAD ARU"
  },
  {
    "code": "U R",
    "name": "UNIVERSITÉ RICHFIELD S.A."
  },
  {
    "code": "UA/BUKAVU",
    "name": "UNIVERSITE ANGLICANE DE BUKAVU"
  },
  {
    "code": "UAACB BENI",
    "name": "UNIVERSITE ANGLICANE EN AFRIQUE A BENI"
  },
  {
    "code": "UAAK DE GOMA",
    "name": "UNIVERSITE ANGLICANE APPOLO KIVEBULAYA"
  },
  {
    "code": "UAB",
    "name": "UNIVERSITÉ ANGLICANE DU CONGO DE BUNIA"
  },
  {
    "code": "UAC",
    "name": "UNIVERSITÉ DE L'ALLIANCE AU CONGO"
  },
  {
    "code": "UAC",
    "name": "UNIVERSITE DE L'ASSOMPTION DU CONGO( UAC EX-INSTITUT SUPERIEUR EMMANUEL D'ALZON DE BUTEMBO )"
  },
  {
    "code": "UAC DE BENI",
    "name": "UNIVERSITE DE L'AVENIR DU CONGO DE BENI"
  },
  {
    "code": "UACO",
    "name": "UNIVERSITÉ ADVENTISTE DU CONGO"
  },
  {
    "code": "UACO-K",
    "name": "UNIVERSITE ADVENTISTE DU CONGO"
  },
  {
    "code": "UAD",
    "name": "UNIVERSITÉ AFRICAINE DE DÉVELOPPEMENT"
  },
  {
    "code": "UAEGL",
    "name": "UNIVERSITE D'EXCELLENCE POUR L'AFRIQUE DES GRANDS LACS"
  },
  {
    "code": "UAGO",
    "name": "UNIVERSITÉ ADVENTISTE DE GOMA"
  },
  {
    "code": "UAK-KANANGA",
    "name": "UNIVERSITE ADVENTISTE DE KANANGA"
  },
  {
    "code": "UBADG",
    "name": "UNIVERSITE BILINGUE ANGLICANE DE GOMA"
  },
  {
    "code": "UBADG",
    "name": "UNIVERSITE BILINGUE ANGLICANE DE GOMA"
  },
  {
    "code": "UBC",
    "name": "UNIVERSITE BELGO CONGOLAISE"
  },
  {
    "code": "UBC",
    "name": "UNIVERSITE BAPTISTE AU CONGO"
  },
  {
    "code": "UBC",
    "name": "UNIVERSITE DE BUKAVU CENTRE"
  },
  {
    "code": "UBC DE KIKONGO",
    "name": "UNIVERSITE BAPTISTE AU CONGO DE KIKONGO"
  },
  {
    "code": "UBC/LUBUMBASHI",
    "name": "UNIVERSITE BAPTISTEDU CONGO DE LUBUMBASHI"
  },
  {
    "code": "UBCA/ DUNGU",
    "name": "UNIVERSITE BATISSONS L'ESPOIR DE DUNGU"
  },
  {
    "code": "UBERLI DE BUKAVU",
    "name": "UNIVERSITE B ERLI DE BUKAVU"
  },
  {
    "code": "UBK",
    "name": "UNIVERSITE BUTRAD DE KISANGANI"
  },
  {
    "code": "UBKB /KINSHASA",
    "name": "UNIVERSITE BEATRICE KIMPAVITA DE BANDALUNGWA"
  },
  {
    "code": "UBU-BUTA",
    "name": "UNIVERSITE DE BAS-UELE DE BUTA"
  },
  {
    "code": "UCAC",
    "name": "UNIVERSITE CANADIENNE AU CONGO"
  },
  {
    "code": "UCAC-KKT",
    "name": "UNIVERSITE CHRETIENNE D'AFRIQUE DE KIKWIT CENTRALE"
  },
  {
    "code": "UCB",
    "name": "UNIVERSITÉ CATHOLIQUE DE BUKAVU"
  },
  {
    "code": "UCBC-BENI",
    "name": "UNIVERSITE CHRETIENNE BILINGUE DU CONGO UCBC"
  },
  {
    "code": "UCC",
    "name": "UNIVERSITE CATHOLIQUE AU CONGO"
  },
  {
    "code": "UCC-DON AKAM",
    "name": "UNIVERSITE CHRETIENNE CATHOLIQUE DON AKAM"
  },
  {
    "code": "UCCM",
    "name": "UNIVERSITE CHRETIENNE CARDINAL MALULA"
  },
  {
    "code": "UCDV",
    "name": "UNIVERSITE CHRETIENNE DE VIRUNGA"
  },
  {
    "code": "UCE-KISANGANI",
    "name": "UNIVERSITE DE CEPROMAD DE KISANGANI"
  },
  {
    "code": "UCG-BUTEMBO",
    "name": "UNIVERSITE CATHOLIQUE DE GRABEN DE BUTEMBO"
  },
  {
    "code": "UCGB",
    "name": "UNIVERSITE CATHOLIQUE DU GRAND BANDUNDU"
  },
  {
    "code": "UCIC/L'SHI",
    "name": "UNIVERSITE CHRETIENNE INTERPROFESSIONNELLE DU CONGO"
  },
  {
    "code": "UCK",
    "name": "UNIVERSITE CARTESIENNE DE KINKOLE"
  },
  {
    "code": "UCKIM",
    "name": "UNIVERSITE CHRETIENNE  DE KIMPESE"
  },
  {
    "code": "UCKIN",
    "name": "UNIVERSITE CHRETIENNE DE KINSHASA"
  },
  {
    "code": "UCM DU MAYOMBE",
    "name": "UNIVERSITE COMMUNAUTAIRE DU MAYOMBE"
  },
  {
    "code": "UCM-KINSHASA",
    "name": "UNIVERSITE CARDINAL MALULA - KINSHASA"
  },
  {
    "code": "UCNDK DE KASUGHO",
    "name": "UNIVERSITE DE CONSERVATION DE LA NATURE ET DE DEVELOPPEMENT DE KASUGHO"
  },
  {
    "code": "UCPROMAD",
    "name": "UNIVERSITE DU CEPROMADB DE BUTEMBO"
  },
  {
    "code": "UCPROMAD MOANDA",
    "name": "UNIVERSITE DU CEPROMAD MOANDA"
  },
  {
    "code": "UCS",
    "name": "UNIVERSITE CATHOLIQUE LA SAPIENTIA"
  },
  {
    "code": "UCS DE GOMA",
    "name": "UNIVERSITE CATHOLIQUE LA SAPIENTIA UCS DE GOMA"
  },
  {
    "code": "UCSV",
    "name": "UNIVERSITE CHRETIENNE SOURCE DE VIE"
  },
  {
    "code": "UDBL",
    "name": "UNIVERSITE DON BOSCO DE LUBUMBASHI"
  },
  {
    "code": "UDD DE L'AFRIQUE CEN",
    "name": "UNIVERSITE DE DEVELOPPEMENT DURABLE DE L'AFRIQUE CENTRAL DE BUKAVU"
  },
  {
    "code": "UDDC",
    "name": "UNIVERSITE DE DEVELOPPEMENTS DURABLE DU CONGO"
  },
  {
    "code": "UDG DE BUTEMBO",
    "name": "UNIVERSITÉ DIVINA GLORIA"
  },
  {
    "code": "UDMAZ",
    "name": "UNIVERSITÉ DE MAZENOD"
  },
  {
    "code": "UEA",
    "name": "UNIVERSITÉ ÉVANGÉLIQUE EN AFRIQUE DE BUKAVU"
  },
  {
    "code": "UEA",
    "name": "UNIVERSITÉ ÉVANGÉLIQUE DE ARU"
  },
  {
    "code": "UEAGL",
    "name": "UNIVERSITÉ DE L'EXCELLENCE POUR L'AFRIQUE DES GRANDS LACS"
  },
  {
    "code": "UEB DE BENI",
    "name": "UNIVERSITE EVANGELIQUE DE BENI"
  },
  {
    "code": "UEB/MINEMBWE",
    "name": "UNIVERSITE EBEN EZER DE MINEMBWE"
  },
  {
    "code": "UEC A BARAKA",
    "name": "UNIVERSITE ESPOIR DU CONGO A BARAKA"
  },
  {
    "code": "UEMA DE BUTEMBO",
    "name": "UNIVERSITE EVANGÉLIQUE DE LA MISSION EN AFRIQUE"
  },
  {
    "code": "UFAK",
    "name": "Université Franco-Americaine de Kinshasa"
  },
  {
    "code": "UGM-MANIEMA",
    "name": "UNIVERSITE GEOSCIENCE DU MANIEMA"
  },
  {
    "code": "UHTGL DE GOMA",
    "name": "UNIVERSITE DES HAUTES TECHNOLOGIES DES GRABDS LACS A GOMA"
  },
  {
    "code": "UHTGL-GOMA",
    "name": "UNIVERSITE DES HAUTES TECHNOLOGIES DE GRANDS LACS"
  },
  {
    "code": "UINIRE DE BUKAVU",
    "name": "UNIVERSITE INTERNALE NANGO ISHINGWA DE LA RENNAISSANCE EVANGELIQUE"
  },
  {
    "code": "UK",
    "name": "UNIVERSITÉ DU KONGO"
  },
  {
    "code": "UK",
    "name": "UNIVERSITE DE KABONGO"
  },
  {
    "code": "UK",
    "name": "UNIVERSITE KONGO"
  },
  {
    "code": "UKA",
    "name": "UNIVERSITE NOTRE DAME DU KASAYI"
  },
  {
    "code": "UKAM",
    "name": "UNIVERSITE KAM à TSHIKAPA"
  },
  {
    "code": "UKV",
    "name": "UNIVERSITE  PRESIDENT JOSEPH KASA- VUBU"
  },
  {
    "code": "UL",
    "name": "UNIVERSITE DU LAC(ex-CENTRE UNIVERSITAIRE DE MAHAGI/CUMA)"
  },
  {
    "code": "ULACK",
    "name": "UNIVERSITE LIBRE DE L'AFRIQUE CENTRALE DE KALEMIE"
  },
  {
    "code": "ULB",
    "name": "UNIVERSITE LIBRE DE BUMBA"
  },
  {
    "code": "ULB",
    "name": "UNIVERSITE LUMUMBA DE BUKAVU"
  },
  {
    "code": "ULB DE BUKAVU",
    "name": "UNIVERSITE LUTHERIENNE DE BUKAVU"
  },
  {
    "code": "ULD DE BUTEMBO",
    "name": "UNIVERSITE LIBRE DU DEVELOPPEMENT DE BUTEMBO"
  },
  {
    "code": "ULDK",
    "name": "UNIVERSITE LIBRE DE DEVELOPPEMENT DE KITSHUKU"
  },
  {
    "code": "ULIKO",
    "name": "UNIVERSITE LIBRE DE KOLWEZI"
  },
  {
    "code": "ULIMAT",
    "name": "UNIVERSITE LIBRE DE MATADI"
  },
  {
    "code": "ULINDI DE KAMITUGA",
    "name": "UNIVERSITE DU BASSIN D'ULINDI DE KAMITUGA"
  },
  {
    "code": "ULK",
    "name": "UNIVERSITE LIBRE DE KINSHASA"
  },
  {
    "code": "ULK-O",
    "name": "UNIVERSITÉ LIBRE DE KASAI-OUEST à TSHIKAPA"
  },
  {
    "code": "ULKI",
    "name": "UNIVERSITE LIBRE DU KIVU"
  },
  {
    "code": "ULKIS",
    "name": "UNIVERSITE LIBRE DE KISANGANI"
  },
  {
    "code": "ULKT",
    "name": "UNIVERSITE LIBRE DU KIVU ET DU TANGANYIKA"
  },
  {
    "code": "ULL",
    "name": "UNIVERSITÉ LIBRE DE LUOZI"
  },
  {
    "code": "ULL",
    "name": "UNIVERSITE LIBRE DE LUBUMBASHI"
  },
  {
    "code": "ULM DE MWENGA",
    "name": "UNIVERSITE LIBRE DE MWENGA"
  },
  {
    "code": "ULPA",
    "name": "UNIVERSITÉ LIBRE PROTESTANTE D'AFRIQUE"
  },
  {
    "code": "ULPGL",
    "name": "UNIVERSITE LIBRE DE GRANDS LACS DE BUKAVU"
  },
  {
    "code": "ULPGL DE BUTEMBO",
    "name": "UNIVERSITE LIBRE DES PAYS DES GRANDS LACS DE BUTEMBO"
  },
  {
    "code": "ULPGL DE GOMA",
    "name": "UNIVERSITÉ LIBRE DES PAYS DES GRANDS LACS A GOMA"
  },
  {
    "code": "ULPGLa",
    "name": "UNIVERSITE LIBRE DES PAYS DES GRANDS LACS"
  },
  {
    "code": "UM",
    "name": "UNIVERSITÉ DE MBUJI-MAYI"
  },
  {
    "code": "UM DE LUBUMBASHI",
    "name": "UNIVERSITE METHODISTE DE LUBUMBASHI"
  },
  {
    "code": "UM-KINDU",
    "name": "UNIVERSITE METHODISTE DE KINDU"
  },
  {
    "code": "UMC",
    "name": "UNIVERSITE MARISTE AU CONGO DE KISANGANI"
  },
  {
    "code": "UMK",
    "name": "UNIVERSITÉ MÉTHODISTE AU KATANGA A MULUNGUISHI"
  },
  {
    "code": "UMKI",
    "name": "UNIVERSITE MODERNE DE KINKOLE"
  },
  {
    "code": "UMKK",
    "name": "UNIVERSITE METHODISTE AU KATANGA À KAMINA"
  },
  {
    "code": "UMKK",
    "name": "UNIVERSITE METHODISTE DE KABONGO"
  },
  {
    "code": "UMKOL",
    "name": "UNIVERSITE  METHODISTE DE KOLWEZI"
  },
  {
    "code": "UML",
    "name": "UNIVERSITE DE MOYEN  LUALABA"
  },
  {
    "code": "UMM",
    "name": "UNIVERSITE METHODISTE DE MUSIUMBA"
  },
  {
    "code": "UMN",
    "name": "UNIVERSITE DE MAI-NDOMBE"
  },
  {
    "code": "UN-EG",
    "name": "UNIVERSITE DU NORD-EQUATEUR A GBADOLITE"
  },
  {
    "code": "UNDM DE MATADI",
    "name": "UNIVERSITE NOTRE DAME D'AFRIQUE DE MATADI"
  },
  {
    "code": "UNDM DE MOANDA",
    "name": "UNIVERSITE NOTRE DAME D'AFRIQUE DE MOANDA"
  },
  {
    "code": "UNDT A UVIRA",
    "name": "UNIVERSITE NOTRE DAME DE TANGANYIKA A UVIRA"
  },
  {
    "code": "UNEI DE BUKAVU",
    "name": "UNIVERSITE NATIONALE DES EGLISES INDEPENDANTES DE BUKAVU"
  },
  {
    "code": "UNH",
    "name": "UNIVERSITE NOUVEAUX HORISONS"
  },
  {
    "code": "UNI-CEP-ISIRO",
    "name": "UNIVERSITE DU CEPROMAD ISIRO"
  },
  {
    "code": "UNI-G",
    "name": "UNIVERSITE DE GEMENA"
  },
  {
    "code": "UNIBAND",
    "name": "UNIVERSITE  DE  BANDUNDU"
  },
  {
    "code": "UNIBO",
    "name": "UNIVERSITE BOBOZO/UNIBO"
  },
  {
    "code": "UNIBU",
    "name": "UNIVERSITE DE BUNIA"
  },
  {
    "code": "UNIC",
    "name": "UNIVERSITE DU CEPROMAD"
  },
  {
    "code": "UNIC BUTEMBO",
    "name": "UNIVERSITE ISLAMIQUE  DU CONGO A BUTEMBO"
  },
  {
    "code": "UNIC GEMENA",
    "name": "UNIVERSITE DU CEPROMAD GEMENA"
  },
  {
    "code": "UNIC-GOMA",
    "name": "UNIVERSITE DU CEPROMAD DE GOMA"
  },
  {
    "code": "UNIC-LWIRO",
    "name": "UNIVERSITE  DU  CINQUANTENAIRE DE LWIRO"
  },
  {
    "code": "UNICAP",
    "name": "UNIVERSITE  CATHOLIQUE DON PETI PETI"
  },
  {
    "code": "UNICL",
    "name": "UNIVERSITE DU CEPROMAD DE LUBUMBASHI"
  },
  {
    "code": "UNICO",
    "name": "Université internationale ALMoustapha"
  },
  {
    "code": "UNIDEC MUHANGI",
    "name": "UNIVERSITE DE DEVELOPPEMENT AU CONGO MUHANGI"
  },
  {
    "code": "UNIDEL DE LIKASI",
    "name": "UNIVERSITE DES ELITES DE LIKASI"
  },
  {
    "code": "UNIDJU",
    "name": "UNIVERSITE de DJUMA"
  },
  {
    "code": "UNIF/ LUKOLELA",
    "name": "UNIVERSITE DU FLEUVE DE LUKOLELA"
  },
  {
    "code": "UNIFA MATADI",
    "name": "UNIVERSITE FRANCOPHONE D'AFRIQUE DE MATADI"
  },
  {
    "code": "UNIGBA",
    "name": "UNIVERSITE DE  GBADOLITE"
  },
  {
    "code": "UNIGL",
    "name": "UNIVERSITE DES GRANDS LACS"
  },
  {
    "code": "UNIGL DE RUTSHURU",
    "name": "UNIVERSITE DES GRANDS LACS DE RUTSHURU DE KIWANJA"
  },
  {
    "code": "UNIGOM",
    "name": "UNIVERSITE DE GOMA"
  },
  {
    "code": "UNIJK",
    "name": "UNIVERSITÉ JEAN XXIII DE KOLWEZI"
  },
  {
    "code": "UNIKA",
    "name": "UNIVERSITE DE KABINDA"
  },
  {
    "code": "UNIKAL",
    "name": "UNIVERSITE  DE KALEMIE"
  },
  {
    "code": "UNIKAM",
    "name": "UNIVERSITE DE KAMINA"
  },
  {
    "code": "UNIKAN",
    "name": "UNIVERSITE DE KANANGA"
  },
  {
    "code": "UNIKAZ DE KAZIBA",
    "name": "UNIVERSITE DE KAZIBA"
  },
  {
    "code": "UNIKI",
    "name": "UNIVERSITE  DE KINDU"
  },
  {
    "code": "UNIKIK",
    "name": "UNIVERSIT DE   KIKWIT"
  },
  {
    "code": "UNIKIN",
    "name": "UNIVERSITE DE KINSHASA"
  },
  {
    "code": "UNIKIS",
    "name": "UNIVERSITE DE KISANGANI"
  },
  {
    "code": "UNIKIVU",
    "name": "UNIVERSITE DU KIVU"
  },
  {
    "code": "UNIKOL",
    "name": "UNIVERSITE DE KOLWEZI"
  },
  {
    "code": "UNIKWANGO",
    "name": "UNIVERSITE  DU KWANGO"
  },
  {
    "code": "UNILAI",
    "name": "UNIVERSITE LAÏQUE D'IDJWI"
  },
  {
    "code": "UNILIB",
    "name": "UNIVERSITE LIBRE DE BOMA"
  },
  {
    "code": "UNILIC MATADI",
    "name": "UNIVERSITE LIBRE DE LA RDC A MATADI"
  },
  {
    "code": "UNILIK",
    "name": "UNIVERSITE DE LIKASI"
  },
  {
    "code": "UNILIS",
    "name": "UNIVERSITE  DE LISALA"
  },
  {
    "code": "UNILO",
    "name": "UNIVERSITE  NOTRE  DAME DE LOMAMI"
  },
  {
    "code": "UNILOD",
    "name": "UNIVERSITE DE LODJA"
  },
  {
    "code": "UNILU",
    "name": "UNIVERSITE DE LUBUMBASHI"
  },
  {
    "code": "UNILUK",
    "name": "UNIVERSITE ADVENTISTE DE LUKANGA"
  },
  {
    "code": "UNILUS",
    "name": "UNIVERSITE DE LUSAMBO"
  },
  {
    "code": "UNIMA",
    "name": "UNIVERSITE DE MAI-NDOMBE"
  },
  {
    "code": "UNIMA",
    "name": "UNIVERSITE DE MANONO"
  },
  {
    "code": "UNIMA",
    "name": "UNIVERSITE DE MATADI"
  },
  {
    "code": "UNIMALEMBANKULU",
    "name": "UNIVERSITE  DE MALEMB-NKULU"
  },
  {
    "code": "UNIMAP",
    "name": "UNIVERSITE MAPON"
  },
  {
    "code": "UNIMBA",
    "name": "UNIVERSITE DE MBANDAKA"
  },
  {
    "code": "UNIMWD",
    "name": "UNIVERSITE DE  MWENE–DITU"
  },
  {
    "code": "UNIP-RDC",
    "name": "UNIVERSITE DE LA PAIX DE LA REPUBLIQUE DÉMOCRATIQUE DU CONGO"
  },
  {
    "code": "UNIPAL DE LUBUMBASHI",
    "name": "UNIVERSITE PANAFRICAINE DE LUBUMBASHI"
  },
  {
    "code": "UNITSHI",
    "name": "UNIVERSITE DE TSHILENGE"
  },
  {
    "code": "UNITSHU",
    "name": "UNIVERSITE NOTRE DAME  DE TSHUMBE"
  },
  {
    "code": "UNIV",
    "name": "UNIVERSITE LAURENT DESIRE KABILA DE LUBAO"
  },
  {
    "code": "UNIV APL",
    "name": "UNIVERSITE ADVENTISTE PHILIP LEMON"
  },
  {
    "code": "UNIV CEPROMAD DE BUK",
    "name": "UNIVERSITE CEPROMAD DE BUKAVU"
  },
  {
    "code": "UNIV-MB",
    "name": "UNIVERSITÉ MONT-BLEU"
  },
  {
    "code": "UNIV/UELE",
    "name": "UNIVERSITE DE L'UELE"
  },
  {
    "code": "UNP BUKAVU",
    "name": "UNIVERSITÉ DE LA NOUVELLE PÂQUES DE BUKAVU"
  },
  {
    "code": "UOB",
    "name": "UNIVERSITE   OFFICIELLE  DE   BUKAVU"
  },
  {
    "code": "UOC",
    "name": "Université orthodoxe du Congo"
  },
  {
    "code": "UOCT",
    "name": "UNIVERSITE OUEST CONGO DE TSHIKAPA"
  },
  {
    "code": "UOKA/ KABINDA",
    "name": "UNIVERSITE OFFICIELLE DE KABINDA"
  },
  {
    "code": "UOM",
    "name": "UNIVERSITE OFFICIELLE DE MBUJI-MAYI"
  },
  {
    "code": "UOMWEKA",
    "name": "UNIERSITE OFFICIELLE DE MWEKA"
  },
  {
    "code": "UOR-BUTEMBO",
    "name": "UNIVERSITE   OFFICIELLE   DE  RUWENZORI   A    BUTEMBO"
  },
  {
    "code": "UOS- BENI",
    "name": "UNIVERSITE  OFFICIELLE  DE SEMULIKI   DE  BENI"
  },
  {
    "code": "UOY",
    "name": "UNIVERSITE OFFICIELLE YABAONDO"
  },
  {
    "code": "UP/ KATUMBA-MWAKE",
    "name": "UNIVERSITE POLYTECHNIQUE KATUMBA-MWAKE"
  },
  {
    "code": "UP/ LODJA-POTO",
    "name": "UNIVERSITE  PEDAGOGIQUE DE LODJA-POTO"
  },
  {
    "code": "UP/PUNIA",
    "name": "UNIVERSITE DE PUNIA"
  },
  {
    "code": "UPA",
    "name": "UNIVERSITE PROTESTANTE EN AFRIQUE"
  },
  {
    "code": "UPAC",
    "name": "UNIVERSITE PANAFRICAINE AU CONGO"
  },
  {
    "code": "UPC",
    "name": "UNIVERSITE PROTESTANTE AU CONGO"
  },
  {
    "code": "UPCC",
    "name": "UNIVERSITE PROTESTANTE AU COEUR DU CONGO"
  },
  {
    "code": "UPCN",
    "name": "UNIVERSITE PROTESTANTE DU CONGO-NORD"
  },
  {
    "code": "UPE",
    "name": "UNIVERSITE PROTESTANTE DE L'EQUATEUR"
  },
  {
    "code": "UPE/MBANDAKA",
    "name": "UNIVERSITE PROTESTANTE DE L'EQUATEUR"
  },
  {
    "code": "UPEA",
    "name": "UNIVERSITE PROTESTANTE EVANGELIQUE DE BUKAVU"
  },
  {
    "code": "UPEL-WEMBO-NYAMA",
    "name": "UNIVERSITE PATRICE EMERY LUMUMBA DE WEMBO-NYAMA"
  },
  {
    "code": "UPGI/KINSHASA",
    "name": "UNIVERSITE PANAFRICAINE DE GOUVERNANCE ET DINNOVATION"
  },
  {
    "code": "UPK",
    "name": "UNIVERSITÉ PROTESTANTE DE KIMPESE"
  },
  {
    "code": "UPK",
    "name": "UNIVERSITE PROGRES DE KINSHASA -EST/PUK-E"
  },
  {
    "code": "UPKAN",
    "name": "Université Pédagogique de Kananga"
  },
  {
    "code": "UPL",
    "name": "UNIVERSITÉ PROTESTANTE DE LUBUMBASHI"
  },
  {
    "code": "UPL-KALEMIE",
    "name": "UNIVERSITE PATRICE EMERY LUMUMBA - KALEMIE"
  },
  {
    "code": "UPLU",
    "name": "UNIVERSITE DU PONT LUBWE"
  },
  {
    "code": "UPM",
    "name": "UNIVERSITÉ PROFESSEUR MUTUMBI"
  },
  {
    "code": "UPM",
    "name": "UNIVERSITÉ PROFESSEUR MUTUMBI"
  },
  {
    "code": "UPM-MANIEMA",
    "name": "UNIVERSITE PROTESTANTE DU MANIEMA"
  },
  {
    "code": "UPMM",
    "name": "UNIVERSITE PIC MARGERITA DE MWENDA"
  },
  {
    "code": "UPN",
    "name": "UNIVERSITE  PEDAGOGIQUE  NATIONALE"
  },
  {
    "code": "UPRECO",
    "name": "UNIVERSITÉ PRESBYTÉRIENNE SHAPPERD ET LAPSLEY DU CONGO"
  },
  {
    "code": "UPROGEL",
    "name": "UNIVERSITÉ PROGRESSISTE DES GRANDS LACS"
  },
  {
    "code": "UPROKOL",
    "name": "UNIVERSITE PROTESTANTE DE KOLWEZI"
  },
  {
    "code": "UPU",
    "name": "UNIVERSITE PROTESTANTE DE L'UBANGI"
  },
  {
    "code": "UPUA",
    "name": "UNIVERSITE PROTESTANTE DE L'UBANGI"
  },
  {
    "code": "URC",
    "name": "UNIVERSITE LOYOLA DU CONGO"
  },
  {
    "code": "URK",
    "name": "Université Révérend KIM"
  },
  {
    "code": "USA",
    "name": "UNIVERSITE SAINT AUGUSTIN"
  },
  {
    "code": "USA",
    "name": "UNIVERSITE SALAMA DE ARU"
  },
  {
    "code": "USA-KIS",
    "name": "UNIVERSITE DES SCIENCES APPLIQUEES DE KISANGANI"
  },
  {
    "code": "USB",
    "name": "UNIVERSITE SHALOM DE BUNIA"
  },
  {
    "code": "USB",
    "name": "UNIVERSITE SAINT-PIERRE DE BUNIA"
  },
  {
    "code": "USD",
    "name": "UNIVERSITE SAINT DOMINIQUE DE KINSHASA"
  },
  {
    "code": "USJ",
    "name": "UNIVERSITE SAINT JOSEPH  DE KAMUTANGA"
  },
  {
    "code": "USJGU",
    "name": "UNIVERSITE SAINT JOSEPH DE GOMA A UVIRA"
  },
  {
    "code": "USK",
    "name": "UNIVERSITE SIMON KIMBANGU DE BUKAVU"
  },
  {
    "code": "USK A BUKAVU",
    "name": "UNIVERSITE SAVANTE DU KIVU A BUKAVU"
  },
  {
    "code": "USK KINSHASA",
    "name": "UNIVERSITE SIMON KIMBANGU DE KINSHASA"
  },
  {
    "code": "USK-BUKAVU",
    "name": "UNIVERSITE SIMON KIMBANGU"
  },
  {
    "code": "USK-KANANGA",
    "name": "UNIVERSITE SIMON KIMBANGU DE KANANGA"
  },
  {
    "code": "USKK",
    "name": "UNIVERSITE SIMON KIMBANGU DE KINDU"
  },
  {
    "code": "USTC-LODJA",
    "name": "UNIVERSITE DES SCIENCES  ET DE   TECHNOLOGIES DE  LODJA"
  },
  {
    "code": "USV DE LIKASI",
    "name": "UNIVERSITE SOURCE DE VIE DE LIKASI"
  },
  {
    "code": "UTAB DE BUTUNGERA",
    "name": "UNIVERSITE TECHNOLOGIQUE AFRICAINE DE BUTUNGERA"
  },
  {
    "code": "UTBC",
    "name": "UNIVERSITE TECHNOLOGIQUE BEL CAMPUS"
  },
  {
    "code": "UTBU",
    "name": "UNIVERSITE TECHNOLOGIQUE DE BUNKEYA"
  },
  {
    "code": "UWB",
    "name": "UNIVERSITE WILLIAM BOOTH"
  },
  {
    "code": "UNIM",
    "name": "Université des Martyrs du Congo"
  }
  // {
  //   "code": "AUTRES",
  //   "name": "Autres"
  // }
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
    setFormData({
      ...formData,
      universite_attache: value,
    });
    if (fieldErrors.universite_attache) {
      setFieldErrors(prev => { const next = {...prev}; delete next.universite_attache; return next; });
    }
    if (editMode) {
      setChangedFields({
        ...changedFields,
        universite_attache: value,
      });
    }
  };

  // Convertir la liste UNIVERSITIES en options pour react-select
  const universityOptions = UNIVERSITIES.map((uni) => ({
    value: uni.code,
    label: uni.name,
  }));

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

    const isEmptyDisplayValue = (value) => (
      value === null ||
      value === undefined ||
      value === '' ||
      value === 'Non renseigné' ||
      value === 'Non fourni'
    );

    const DataRow = ({ label, value, hideEmpty = viewType === 'Assistant' || viewType === 'CT' }) => {
      if (hideEmpty && isEmptyDisplayValue(value)) return null;

      return (
        <div className="data-row">
          <span className="data-label">{label}:</span>
          <span className="data-value">{value || 'Non renseigné'}</span>
        </div>
      );
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
            <DataRow label="Sexe" value={viewedData.sexe === 'M' ? 'Masculin' : 'Féminin'} />
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
            {viewedData.type_diplome && (
              <DataRow label="Type de diplôme de Doctorat" value={viewedData.type_diplome} />
            )}
            <DataRow label="Numéro arrêté équivalence" value={viewedData.numero_arrete_equivalence} />
          </DataSection>

          <DataSection title="Diplômes par niveau">
            <div className="data-row">
              <span className="data-label">Diplôme d'État:</span>
              <span className="data-value"><FileLink path={viewedData.diplome_etat} /></span>
            </div>
            <div className="data-row">
              <span className="data-label">Diplôme de Graduat:</span>
              <span className="data-value"><FileLink path={viewedData.diplome_graduat} /></span>
            </div>
            <div className="data-row">
              <span className="data-label">Diplôme de Licence:</span>
              <span className="data-value"><FileLink path={viewedData.diplome_licence} /></span>
            </div>
            <div className="data-row">
              <span className="data-label">Diplôme de Master/D.E.A/D.E.S:</span>
              <span className="data-value"><FileLink path={viewedData.diplome_master_dea_ds} /></span>
            </div>
            <DataRow label="Université d'obtention de votre master/D.E.A/D.E.S" value={viewedData.universite_master_dea_ds} />
            <DataRow label="Pays d'obtention de votre Master/D.E.A/D.E.S" value={viewedData.pays_master_dea_ds} />
            <DataRow label="Date d'obtention de votre Master/D.E.A/D.E.S" value={viewedData.date_obtention_master_dea_ds} />
            <DataRow label="A étudié à l'étranger" value={viewedData.a_etudie_etranger} hideEmpty />
            <DataRow label="Université d'obtention de votre Doctorat" value={viewedData.universite_obtention_diplome_doctorat} />
            <DataRow label="Pays d'obtention de votre Doctorat" value={viewedData.pays_obtention_diplome_doctorat} />
            <DataRow label="Date d'obtention de votre Doctorat" value={viewedData.date_obtention_diplome_doctorat} />
            <div className="data-row">
              <span className="data-label">Copie du Diplôme de Doctorat ou Document équivalent :</span>
              <span className="data-value"><FileLink path={viewedData.copie_diplome} /></span>
            </div>
            <div className="data-row">
              <span className="data-label">Charge horaire:</span>
              <span className="data-value"><FileLink path={viewedData.charge_horaire} /></span>
            </div>
          </DataSection>

          {viewedData.created_at && (
            <DataSection title="Métadonnées">
              <DataRow label="Date de création" value={new Date(viewedData.created_at).toLocaleDateString('fr-FR')} />
              <DataRow label="Dernière mise à jour" value={new Date(viewedData.updated_at).toLocaleDateString('fr-FR')} />
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
            <DataRow label="Sexe" value={viewedData.sexe === 'M' ? 'Masculin' : viewedData.sexe === 'F' ? 'Féminin' : viewedData.sexe} hideEmpty />
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
            <DataRow label="Sexe" value={viewedData.sexe === 'M' ? 'Masculin' : viewedData.sexe === 'F' ? 'Féminin' : viewedData.sexe} hideEmpty />
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
              <label htmlFor="type_etablissement">Type Établissement d'attache (Privé ou Public) <span className="required">*</span></label>
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
              <label htmlFor="universite_attache">Établissement d'attache <span className="required">*</span></label>
              <Select
                id="universite_attache"
                name="universite_attache"
                className={fieldErrors.universite_attache ? 'select-has-error' : undefined}
                options={UNIVERSITIES.map(u => ({ value: u.code, label: u.name }))}
                value={formData.universite_attache ? { value: formData.universite_attache, label: UNIVERSITIES.find(u => u.code === formData.universite_attache)?.name } : null}
                onChange={(selectedOption) => {
                  setFormData({ ...formData, universite_attache: selectedOption ? selectedOption.value : '' });
                  if (editMode) setChangedFields({ ...changedFields, universite_attache: selectedOption ? selectedOption.value : '' });
                  if (fieldErrors.universite_attache) setFieldErrors(prev => { const n = {...prev}; delete n.universite_attache; return n; });
                }}
                isClearable
              />
            </div>

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
              <label htmlFor="type_etablissement">Type Établissement d'attache (Privé ou Public) <span className="required">*</span></label>
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
              <label htmlFor="universite_attache">Établissement d'attache <span className="required">*</span></label>
              <Select
                id="universite_attache"
                name="universite_attache"
                className={fieldErrors.universite_attache ? 'select-has-error' : undefined}
                options={UNIVERSITIES.map(u => ({ value: u.code, label: u.name }))}
                value={formData.universite_attache ? { value: formData.universite_attache, label: UNIVERSITIES.find(u => u.code === formData.universite_attache)?.name } : null}
                onChange={(selectedOption) => {
                  setFormData({ ...formData, universite_attache: selectedOption ? selectedOption.value : '' });
                  if (editMode) setChangedFields({ ...changedFields, universite_attache: selectedOption ? selectedOption.value : '' });
                  if (fieldErrors.universite_attache) setFieldErrors(prev => { const n = {...prev}; delete n.universite_attache; return n; });
                }}
                isClearable
              />
            </div>

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
            <label htmlFor="type_etablissement">Type Établissement <span className="required">*</span></label>
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



          <div className="form-group">
            <label htmlFor="universite_attache">Etablissement d'Attache <span className="required">*</span></label>
            <Select
              id="universite_attache"
              name="universite_attache"
              className={fieldErrors.universite_attache ? 'select-has-error' : undefined}
              options={universityOptions}
              value={
                formData.universite_attache
                  ? universityOptions.find(u => u.value === formData.universite_attache)
                  : null
              }
              onChange={handleUniversityChange}
              placeholder="Sélectionner ou rechercher un établissement..."
              searchable={true}
              isSearchable={true}
              isClearable={false}
              required
            />
          </div>

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
