const STRINGS = {
  en: {
    contact: 'Contact',
    about: 'About',
    experience: 'Experience',
    skills: 'Skills',
    projects: 'Projects',
    language: 'Language',
    theme: 'Theme',
    heroContactTitle: 'Quick pitch',
  },
  rw: {
    contact: 'Twandikire',
    about: 'Amakuru',
    experience: 'Ubunararibonye',
    skills: 'Ubumenyi',
    projects: 'Imishinga',
    language: 'Ururimi',
    theme: 'Uko ibintu bimeze',
    heroContactTitle: 'Intego yihuse',
  },
  fr: {
    contact: 'Contact',
    about: 'À propos',
    experience: 'Expérience',
    skills: 'Compétences',
    projects: 'Projets',
    language: 'Langue',
    theme: 'Thème',
    heroContactTitle: 'Pitch rapide',
  },
};

function applyNavLabels(lang) {
  const t = STRINGS[lang] || STRINGS.en;

  const nav = document.querySelector('.nav');
  if (!nav) return;

  const map = [
    { selector: 'a[href="#about"]', key: 'about' },
    { selector: 'a[href="#experience"]', key: 'experience' },
    { selector: 'a[href="#skills"]', key: 'skills' },
    { selector: 'a[href="#projects"]', key: 'projects' },
    { selector: '[data-nav-contact]', key: 'contact' },
  ];

  for (const item of map) {
    const el = nav.querySelector(item.selector);
    if (el) el.textContent = t[item.key];
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (!root) return;
  root.dataset.theme = theme;
}

function initI18nAndTheme() {
  const root = document.documentElement;
  if (!root) return;

  // Theme
  const themeButtons = document.querySelectorAll('[data-theme]');
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      applyTheme(theme);
    });
  });

  // Language
  const langButtons = document.querySelectorAll('[data-lang]');
  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      applyNavLabels(lang);
    });
  });

  // Default theme
  if (!root.dataset.theme) {
    root.dataset.theme = 'light';
  }

  // Default language: English
  applyNavLabels('en');
}

initI18nAndTheme();

