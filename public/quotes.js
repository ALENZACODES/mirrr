/**
 * Rotating quotes: words on beauty, well-being and being yourself from many cultures, each in its
 * own language and script with English below. A new quote every 60 seconds, starting at a random
 * one. Pauses while the pointer or keyboard focus is on it; no fade when the reader prefers
 * reduced motion. Every quote is checked against a published source (see the repo's quotes notes).
 */
(() => {
  const QUOTES = [
    { lang: 'en', dir: 'ltr', text: 'Caring for myself is not self-indulgence. It is self-preservation, and that is an act of political warfare.', en: '', by: 'Audre Lorde · A Burst of Light · 1988' },
    { lang: 'en', dir: 'ltr', text: 'I’m a woman / Phenomenally. / Phenomenal woman, / That’s me.', en: '', by: 'Maya Angelou · “Phenomenal Woman”, And Still I Rise · 1978' },
    { lang: 'yo', dir: 'ltr', text: 'Ìwà l’ẹwà.', en: 'Character is beauty.', by: 'Yoruba proverb · Nigeria' },
    { lang: 'zu', dir: 'ltr', text: 'Umuntu ngumuntu ngabantu.', en: 'A person is a person through other people.', by: 'Zulu proverb · South Africa' },
    { lang: 'sw', dir: 'ltr', text: 'Haraka haraka haina baraka.', en: 'Hurry, hurry has no blessing.', by: 'Swahili proverb · East Africa' },
    { lang: 'am', dir: 'ltr', text: 'ቀስ በቀስ እንቁላል በእግሩ ይሄዳል።', en: 'Slowly, slowly, an egg will walk on its own legs.', by: 'Amharic proverb · Ethiopia' },
    { lang: 'ar', dir: 'rtl', text: 'إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ', en: 'God is beautiful and loves beauty.', by: 'Saying of the Prophet Muhammad ﷺ (peace be upon him) · Sahih Muslim 91' },
    { lang: 'fa', dir: 'rtl', text: 'هر کسی کو دور ماند از اصل خویش / باز جوید روزگار وصل خویش', en: 'Everyone who is left far from their source wishes back the time when they were one with it.', by: 'Rumi · Masnavi, Book I, line 4 · c. 1260' },
    { lang: 'fa', dir: 'rtl', text: 'بنی‌آدم اعضای یک پیکرند / که در آفرینش ز یک گوهرند', en: 'Human beings are members of one body, created from one essence.', by: 'Saadi · Gulistan · 1258' },
    { lang: 'ur', dir: 'rtl', text: 'خودی کو کر بلند اتنا کہ ہر تقدیر سے پہلے / خدا بندے سے خود پوچھے، بتا تیری رضا کیا ہے', en: 'Raise your selfhood so high that before every decree, God Himself asks you: tell me, what is your wish?', by: 'Muhammad Iqbal · Bal-e-Jibril · 1935' },
    { lang: 'he', dir: 'rtl', text: 'אִם אֵין אֲנִי לִי, מִי לִי?', en: 'If I am not for myself, who will be for me?', by: 'Hillel the Elder · Pirkei Avot 1:14' },
    { lang: 'sa', dir: 'ltr', text: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्', en: 'Lift yourself up by your own self; never let yourself sink.', by: 'Bhagavad Gita 6.5 · Sanskrit' },
    { lang: 'hi', dir: 'ltr', text: 'बुरा जो देखन मैं चला, बुरा न मिलिया कोय। जो दिल खोजा आपना, मुझसे बुरा न कोय॥', en: 'I went looking for the bad and found no one. When I searched my own heart, I found no one worse than me.', by: 'Kabir · doha · 15th century' },
    { lang: 'zh', dir: 'ltr', text: '知人者智，自知者明。', en: 'Knowing others is wisdom; knowing yourself is clarity.', by: 'Laozi · Tao Te Ching, ch. 33' },
    { lang: 'zh', dir: 'ltr', text: '君子坦荡荡，小人长戚戚。', en: 'The noble person is calm and at ease; the petty person is always anxious.', by: 'Confucius · Analects 7.37' },
    { lang: 'ja', dir: 'ltr', text: '十人十色', en: 'Ten people, ten colours: everyone is different.', by: 'Japanese proverb' },
    { lang: 'ja', dir: 'ltr', text: '七転び八起き', en: 'Fall down seven times, get up eight.', by: 'Japanese proverb' },
    { lang: 'ko', dir: 'ltr', text: '보기 좋은 떡이 먹기도 좋다.', en: 'A rice cake that looks good also tastes good.', by: 'Korean proverb' },
    { lang: 'vi', dir: 'ltr', text: 'Tốt gỗ hơn tốt nước sơn.', en: 'Good wood is better than good paint.', by: 'Vietnamese proverb' },
    { lang: 'tl', dir: 'ltr', text: 'Ang hindi lumingon sa pinanggalingan ay hindi makararating sa paroroonan.', en: 'Whoever does not look back to where she came from will not reach where she is going.', by: 'Tagalog proverb · Philippines' },
    { lang: 'mi', dir: 'ltr', text: 'Ehara taku toa i te toa takitahi, engari he toa takitini.', en: 'My strength is not that of one alone, but the strength of many.', by: 'Māori whakataukī · Aotearoa New Zealand' },
    { lang: 'grc', dir: 'ltr', text: 'ὀ μὲν γὰρ κάλος ὄσσον ἴδην πέλεται, ὀ δὲ κἄγαθος αὔτικα καὶ κάλος ἔσσεται.', en: 'The beautiful are beautiful to look at; the good will soon be beautiful too.', by: 'Sappho · Fragment 50 · c. 600 BCE' },
    { lang: 'la', dir: 'ltr', text: 'Mens sana in corpore sano.', en: 'A sound mind in a sound body.', by: 'Juvenal · Satire X · c. 100 CE' },
    { lang: 'es', dir: 'ltr', text: 'Pies, ¿para qué los quiero si tengo alas pa’ volar?', en: 'Feet, what do I need them for, if I have wings to fly?', by: 'Frida Kahlo · her diary · 1953' },
    { lang: 'fr', dir: 'ltr', text: 'On ne naît pas femme : on le devient.', en: 'One is not born, but rather becomes, a woman.', by: 'Simone de Beauvoir · Le Deuxième Sexe · 1949' },
    { lang: 'fr', dir: 'ltr', text: 'On ne voit bien qu’avec le cœur. L’essentiel est invisible pour les yeux.', en: 'One sees clearly only with the heart. What is essential is invisible to the eye.', by: 'Antoine de Saint-Exupéry · Le Petit Prince · 1943' },
    { lang: 'pt', dir: 'ltr', text: 'Tudo vale a pena / Se a alma não é pequena.', en: 'Everything is worth it if the soul is not small.', by: 'Fernando Pessoa · “Mar Português”, Mensagem · 1934' },
    { lang: 'it', dir: 'ltr', text: 'Chi va piano va sano e va lontano.', en: 'Whoever goes slowly goes safely, and goes far.', by: 'Italian proverb' },
    { lang: 'tr', dir: 'ltr', text: 'Güzelliğin on para etmez / Bu bendeki aşk olmasa.', en: 'Your beauty would not be worth ten coins, were it not for the love in me.', by: 'Âşık Veysel · “Güzelliğin On Para Etmez”' },
    { lang: 'ru', dir: 'ltr', text: 'Красота спасёт мир.', en: 'Beauty will save the world.', by: 'Fyodor Dostoevsky · The Idiot · 1869' },
  ];
  const ROTATE_MS = 60000;
  const FADE_MS = 600;
  globalThis.MIRRR_QUOTES = QUOTES;
  globalThis.MIRRR_QUOTES_ROTATE_MS = ROTATE_MS;
  if (typeof document === 'undefined') return;

  function start() {
    const box = document.getElementById('manifesto-section');
    const q = box && box.querySelector('.manifesto-quote');
    const tr = box && box.querySelector('.manifesto-en');
    const at = box && box.querySelector('.manifesto-attr');
    if (!q || !tr || !at) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = Math.floor(Math.random() * QUOTES.length);
    let paused = false;
    let timer = null;
    const paint = () => {
      const x = QUOTES[i];
      q.textContent = `“${x.text}”`;
      q.setAttribute('lang', x.lang);
      q.setAttribute('dir', x.dir);
      tr.textContent = x.en ? `“${x.en}”` : '';
      tr.hidden = !x.en;
      at.textContent = `— ${x.by}`;
      box.dataset.quoteIndex = String(i);
    };
    const show = next => {
      i = (next + QUOTES.length) % QUOTES.length;
      if (reduce) { paint(); return; }
      box.classList.add('quote-fading');
      setTimeout(() => { paint(); box.classList.remove('quote-fading'); }, FADE_MS);
    };
    const tick = () => { if (!paused && !document.hidden) show(i + 1); };
    paint();
    timer = setInterval(tick, ROTATE_MS);
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    box.addEventListener('mouseenter', pause);
    box.addEventListener('mouseleave', resume);
    box.addEventListener('focusin', pause);
    box.addEventListener('focusout', resume);
    globalThis.MIRRR_QUOTE_NEXT = () => show(i + 1);
    return timer;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
