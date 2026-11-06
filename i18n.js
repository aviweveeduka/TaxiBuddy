import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadData, saveData } from './storage';

// English (en) and isiXhosa (xh) text for the whole app.
// Placeholders such as {name} are filled in by t('key', { name: 'Aviwe' }).
const strings = {
  en: {
    // Tabs (short label) and screen titles
    tabNewTrip: 'New Trip',
    tabActiveTrip: 'Active Trip',
    tabContacts: 'Contacts',
    tabHistory: 'History',
    tabProfile: 'Profile',
    titleNewTrip: 'New Trip',
    titleActiveTrip: 'Active Trip',
    titleContacts: 'Trusted Contacts',
    titleHistory: 'Trip History',
    titleProfile: 'My Profile',

    // Common
    cancel: 'Cancel',
    remove: 'Remove',
    no: 'No',

    // Contacts
    contactNamePh: 'Name (e.g. Mama)',
    contactPhonePh: 'Phone number',
    addContact: 'Add Contact',
    missingName: 'Missing name',
    enterContactName: "Please enter the contact's name.",
    invalidNumber: 'Invalid number',
    enterValidPhone: 'Please enter a valid phone number (at least 10 digits).',
    removeContactTitle: 'Remove contact',
    removeContactMsg: 'Remove this person from your trusted contacts?',
    noContactsYet: 'No trusted contacts yet. Add someone who should know when you travel.',

    // New Trip
    tripInProgressTitle: 'Trip in progress',
    finishCurrentTrip: 'Finish your current trip before starting a new one.',
    missingDetails: 'Missing details',
    enterRoute: 'Please enter where you are leaving from and where you are going.',
    missingPlate: 'Missing plate number',
    enterPlate: 'Please enter the taxi number plate.',
    noTrustedTitle: 'No trusted contacts',
    noTrustedMsg: 'Add at least one trusted contact so someone can be alerted.',
    addContactShort: 'Add contact',
    bannerInProgress: 'A trip is already in progress ({plate})',
    labelFrom: 'Leaving from (rank / pickup)',
    phFrom: 'e.g. Buffalo City Taxi Rank',
    labelTo: 'Going to',
    phTo: 'e.g. Mdantsane NU 2',
    labelPlate: 'Taxi number plate',
    phPlate: 'e.g. CA 123 456',
    labelTime: 'Expected trip time',
    minutesShort: '{n} min',
    hintOne: "1 trusted contact will be alerted if you don't arrive on time.",
    hintMany: "{n} trusted contacts will be alerted if you don't arrive on time.",
    startTrip: 'Start Trip',
    greeting: 'Hi, {name}',
    photoLabel: 'Taxi photo (optional)',
    photoHint: 'Photograph the taxi and its number plate before you board.',
    takePhoto: 'Take photo',
    retakePhoto: 'Retake',
    cameraPermTitle: 'Camera permission needed',
    cameraPermMsg: 'Allow camera access in Settings to photograph the taxi.',

    // Active Trip
    noActiveTrip: 'No active trip',
    startFromNewTrip: 'Start one from the New Trip tab.',
    locDenied: 'Location permission denied. Enable it in Settings.',
    gettingLocation: 'Getting your location...',
    taxiLabel: 'Taxi: {plate}',
    overdue: 'OVERDUE',
    alertNow: 'Alert your contacts now',
    untilArrival: 'until expected arrival',
    sendAlertSms: 'Send alert SMS',
    shareLocation: 'Share my location',
    sosButton: 'SOS - I need help',
    arrived: "I've arrived",
    cancelTrip: 'Cancel trip',
    noContactsTitle: 'No contacts',
    addTrustedFirst: 'Add a trusted contact first.',
    noLocationTitle: 'No location yet',
    waitingGps: 'Waiting for your GPS position. Try again in a moment.',
    smsUnavailable: 'SMS unavailable',
    smsUnavailableMsg: 'This device cannot send SMS.',
    cancelTripTitle: 'Cancel trip',
    cancelTripMsg: 'End this trip without marking it as arrived?',
    sosTitle: 'Send SOS?',
    sosMsg: 'This opens a message to all your trusted contacts with your location and trip details.',
    sendSos: 'Send SOS',
    notifWarnTitle: 'TaxiBuddy: 5 minutes left',
    notifWarnBody: 'Your trip is almost due. Tap "I\'ve arrived" when you get there.',
    notifOverTitle: 'TaxiBuddy: trip overdue!',
    notifOverBody: 'You have not marked your arrival. Open the app to alert your contacts.',
    smsShare: '{name} is travelling in taxi {plate} from {pickup} to {dest}. Follow their location: {link}',
    smsAlert: 'ALERT: {name} has not arrived. Taxi {plate} from {pickup} to {dest}.{extra} Last location: {link}',
    smsSos: 'SOS! {name} needs help NOW. Taxi {plate} from {pickup} to {dest}.{extra} Location: {link}',
    smsHome: ' Home area: {v}.',
    smsMedical: ' Medical note: {v}.',
    someone: 'Someone you know',
    locNotAvailable: 'location not available yet',

    // History
    noTripsYet: 'No trips yet',
    completedAppear: 'Completed trips will appear here.',
    badgeArrived: 'Arrived',
    badgeCancelled: 'Cancelled',
    tookPlanned: 'Took {d} (planned {n} min)',
    under1: 'under 1 min',
    durMin: '{m} min',
    durHourMin: '{h} h {m} min',
    clearHistory: 'Clear history',
    clearHistoryMsg: 'Delete all past trips? This cannot be undone.',
    deleteAll: 'Delete all',

    // Profile
    setUpProfile: 'Set up your profile',
    fullName: 'Full name',
    phFullName: 'e.g. Aviwe Duka',
    yourPhone: 'Your phone number (optional)',
    phYourPhone: 'e.g. 082 123 4567',
    homeArea: 'Home area (optional)',
    phHome: 'e.g. Mdantsane NU 2',
    medicalNote: 'Medical note (optional)',
    phMedical: 'e.g. Asthma, allergic to penicillin',
    profileHint:
      'Your details stay on this phone. Your name is added to the messages sent to your trusted contacts, and your home area and medical note are added to overdue alerts.',
    saveProfile: 'Save Profile',
    enterYourName: 'Please enter your name.',
    validPhoneOrEmpty: 'Please enter a valid phone number (at least 10 digits), or leave it empty.',
    profileSaved: 'Profile saved',
    profileSavedMsg: 'Your details will now appear in your trip alerts.',
    languageLabel: 'Language',
  },

  xh: {
    tabNewTrip: 'Olutsha',
    tabActiveTrip: 'Olusebenzayo',
    tabContacts: 'Abantu',
    tabHistory: 'Imbali',
    tabProfile: 'Iprofayile',
    titleNewTrip: 'Uhambo Olutsha',
    titleActiveTrip: 'Uhambo Olusebenzayo',
    titleContacts: 'Abantu Othembileyo',
    titleHistory: 'Imbali Yohambo',
    titleProfile: 'Iprofayile Yam',

    cancel: 'Rhoxisa',
    remove: 'Susa',
    no: 'Hayi',

    contactNamePh: 'Igama (umz. uMama)',
    contactPhonePh: 'Inombolo yomnxeba',
    addContact: 'Yongeza Umntu',
    missingName: 'Igama alikho',
    enterContactName: 'Nceda ufake igama lomntu.',
    invalidNumber: 'Inombolo ayivumelekanga',
    enterValidPhone: 'Nceda ufake inombolo yomnxeba esebenzayo (ubuncinane amanani ali-10).',
    removeContactTitle: 'Susa umntu',
    removeContactMsg: 'Uyafuna ukumsusa lo mntu kubantu othembileyo?',
    noContactsYet: 'Akukabikho bantu uthembileyo. Yongeza umntu omele azi xa uhamba.',

    tripInProgressTitle: 'Uhambo luyaqhubeka',
    finishCurrentTrip: 'Gqibezela uhambo lwakho lwangoku ngaphambi kokuqalisa olutsha.',
    missingDetails: 'Iinkcukacha azipheleli',
    enterRoute: 'Nceda ufake apho uphuma khona nalapho uya khona.',
    missingPlate: 'Inombolo yeplate ayikho',
    enterPlate: 'Nceda ufake inombolo yeplate yeteksi.',
    noTrustedTitle: 'Akukho bantu uthembileyo',
    noTrustedMsg: 'Yongeza ubuncinane umntu omnye othembileyo ukuze kulumkiswe umntu.',
    addContactShort: 'Yongeza umntu',
    bannerInProgress: 'Kukho uhambo oluqhubekayo ({plate})',
    labelFrom: 'Uphuma phi (irenki / apho uthatha khona iteksi)',
    phFrom: 'umz. Irenki yeeteksi yaseBuffalo City',
    labelTo: 'Uya phi',
    phTo: 'umz. eMdantsane NU 2',
    labelPlate: 'Inombolo yeplate yeteksi',
    phPlate: 'umz. CA 123 456',
    labelTime: 'Ixesha olilindele lohambo',
    minutesShort: '{n} imizuzu',
    hintOne: 'Umntu o-1 othembileyo uya kulumkiswa ukuba awufikanga ngexesha.',
    hintMany: 'Abantu abangu-{n} othembileyo baya kulumkiswa ukuba awufikanga ngexesha.',
    startTrip: 'Qalisa Uhambo',
    greeting: 'Molo, {name}',
    photoLabel: 'Ifoto yeteksi (akunyanzelekanga)',
    photoHint: 'Thabatha ifoto yeteksi neplate yayo ngaphambi kokuba ukhwele.',
    takePhoto: 'Thabatha ifoto',
    retakePhoto: 'Thabatha kwakhona',
    cameraPermTitle: 'Kufuneka imvume yekhamera',
    cameraPermMsg: 'Vumela ikhamera kwiSetingi ukuze uthabathe ifoto yeteksi.',

    noActiveTrip: 'Akukho hambo luqhubekayo',
    startFromNewTrip: 'Qalisa olunye kwithebhu ethi Olutsha.',
    locDenied: 'Imvume yendawo ayinikezwanga. Yivule kwiSetingi.',
    gettingLocation: 'Ndifumana indawo yakho...',
    taxiLabel: 'Iteksi: {plate}',
    overdue: 'IXESHA LIDLULILE',
    alertNow: 'Lumkisa abantu bakho ngoku',
    untilArrival: 'ngaphambi kokufika okulindelekileyo',
    sendAlertSms: 'Thumela i-SMS yesilumkiso',
    shareLocation: 'Yabelana ngendawo yam',
    sosButton: 'SOS - Ndifuna uncedo',
    arrived: 'Ndifikile',
    cancelTrip: 'Rhoxisa uhambo',
    noContactsTitle: 'Akukho bantu',
    addTrustedFirst: 'Yongeza umntu othembileyo kuqala.',
    noLocationTitle: 'Akukabikho ndawo',
    waitingGps: 'Silinde indawo yakho ye-GPS. Zama kwakhona kwintsukwana.',
    smsUnavailable: 'I-SMS ayifumaneki',
    smsUnavailableMsg: 'Esi sixhobo asikwazi ukuthumela i-SMS.',
    cancelTripTitle: 'Rhoxisa uhambo',
    cancelTripMsg: 'Uyafuna ukuphelisa olu hambo ungaphawulanga ukuba ufikile?',
    sosTitle: 'Thumela i-SOS?',
    sosMsg: 'Oku kuvula umyalezo oya kubo bonke abantu othembileyo, unendawo yakho neenkcukacha zohambo.',
    sendSos: 'Thumela i-SOS',
    notifWarnTitle: 'TaxiBuddy: Imizuzu emi-5 eseleyo',
    notifWarnBody: 'Uhambo lwakho lusondele ukuphela. Cofa "Ndifikile" xa ufika.',
    notifOverTitle: 'TaxiBuddy: Ixesha lohambo lidlulile!',
    notifOverBody: 'Awuphawulanga ukuba ufikile. Vula i-app ukulumkisa abantu bakho.',
    smsShare: '{name} uhamba ngeteksi {plate} esuka {pickup} aya {dest}. Landela indawo apho akhoyo: {link}',
    smsAlert: 'ISILUMKISO: {name} akafikanga. Iteksi {plate} isuka {pickup} iya {dest}.{extra} Indawo yokugqibela: {link}',
    smsSos: 'SOS! {name} ufuna uncedo NGOKU. Iteksi {plate} isuka {pickup} iya {dest}.{extra} Indawo: {link}',
    smsHome: ' Indawo yokuhlala: {v}.',
    smsMedical: ' Inqaku lezonyango: {v}.',
    someone: 'Umntu omaziyo',
    locNotAvailable: 'indawo ayikafumaneki',

    noTripsYet: 'Akukabikho hambo',
    completedAppear: 'Uhambo oluphelileyo luya kubonakala apha.',
    badgeArrived: 'Ufikile',
    badgeCancelled: 'Lurhoxisiwe',
    tookPlanned: 'Luthathe {d} (kucwangcisiwe {n} imizuzu)',
    under1: 'ngaphantsi komzuzu o-1',
    durMin: '{m} imizuzu',
    durHourMin: '{h} h {m} imizuzu',
    clearHistory: 'Cima imbali',
    clearHistoryMsg: 'Cima lonke uhambo olwadlulayo? Oku akunakuhlehliswa.',
    deleteAll: 'Cima konke',

    setUpProfile: 'Misela iprofayile yakho',
    fullName: 'Igama elipheleleyo',
    phFullName: 'umz. Aviwe Duka',
    yourPhone: 'Inombolo yakho yomnxeba (akunyanzelekanga)',
    phYourPhone: 'umz. 082 123 4567',
    homeArea: 'Indawo ohlala kuyo (akunyanzelekanga)',
    phHome: 'umz. eMdantsane NU 2',
    medicalNote: 'Inqaku lezonyango (akunyanzelekanga)',
    phMedical: 'umz. I-asthma, ukungavani ne-penicillin',
    profileHint:
      'Iinkcukacha zakho zihlala kule foni. Igama lakho longezwa kwimiyalezo ethunyelwa kubantu othembileyo, kwaye indawo ohlala kuyo nenqaku lezonyango longezwa kwizilumkiso.',
    saveProfile: 'Gcina iProfayile',
    enterYourName: 'Nceda ufake igama lakho.',
    validPhoneOrEmpty: 'Nceda ufake inombolo yomnxeba esebenzayo (ubuncinane amanani ali-10), okanye uyishiye ize.',
    profileSaved: 'Iprofayile igciniwe',
    profileSavedMsg: 'Iinkcukacha zakho ziya kubonakala kwizilumkiso zohambo.',
    languageLabel: 'Ulwimi',
  },
};

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  // Restore the saved language when the app opens
  useEffect(() => {
    loadData('language', 'en').then((saved) => {
      if (saved === 'en' || saved === 'xh') setLangState(saved);
    });
  }, []);

  const setLang = useCallback(async (next) => {
    setLangState(next);
    await saveData('language', next);
  }, []);

  const t = useCallback(
    (key, params) => {
      let text = (strings[lang] && strings[lang][key]) || strings.en[key] || key;
      if (params) {
        Object.keys(params).forEach((name) => {
          text = text.split('{' + name + '}').join(String(params[name]));
        });
      }
      return text;
    },
    [lang]
  );

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}
