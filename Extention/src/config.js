// ============================================================
// ФАЙЛ: src/config.js
// ============================================================
const COLORS = {
    button: {
        background: '#b2b5b8',
        backgroundHover: '#cecfd0',
        text: '#1f1f1f',
        icon: '🏆'
    },
    modal: {
        overlay: 'rgba(0,0,0,0.7)',
        background: '#1a1a1a',
        border: '#9aa777',
        shadow: 'rgba(0,0,0,0.5)'
    },
    header: {
        text: '#9aa777',
        closeButton: '#9aa777',
        closeButtonText: '#1f1f1f',
        closeButtonHover: '#accaa6'
    },
    card: {
        background: '#292828',
        border: '#444',
        titleColor: '#9aa777',
        descriptionColor: '#ccc',
        linkBackground: '#9aa777',
        linkBackgroundHover: '#A1B866',
        linkText: '#000000'
    },
    text: {
        primary: '#cdcdd3',
        secondary: '#ccc',
        error: '#ff6b6b',
        notFound: '#999'
    },
    support: {
        background: '#9aa777',
        backgroundHover: '#A1B866',
        text: '#1f1f1f',
        border: '#444'
    },
    fonts: {
        main: 'Verdana, sans-serif',
        button: 'Helvetica, Arial, sans-serif'
    }
};

const SUPPORT_LINK = 'https://otieu.com/4/10392370';

const BLOCKED_PATHS = [
    /^https:\/\/jut\.su\/user\//,
    /^https:\/\/jut\.su\/pm\//,
    /^https:\/\/jut\.su\/anime\//,
    /^https:\/\/jut\.su\/rewards\//,
    /^https:\/\/jut\.su\/ninja\//
];
