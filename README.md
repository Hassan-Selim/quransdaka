# قرآن صدقة

موقع للقرآن الكريم الصوتي والرقية الشرعية وراديو القرآن الكريم باستخدام بيانات من [mp3quran.net](https://mp3quran.net).

## المحتويات

- **الصفحة الرئيسية:** ثلاثة أزرار (القرآن الكريم، الرقية الشرعية، راديو القرآن الكريم).
- **صفحة القرآن:** عرض أسماء السور والقراء مع إمكانية اختيار القارئ ونوع القراءة وتشغيل أي سورة.
- **صفحة الرقية الشرعية:** تشغيل سور الفاتحة والإخلاص والفلق والناس من نفس API.
- **صفحة الراديو:** قائمة محطات راديو القرآن من mp3quran مع تشغيل مباشر.

## التقنيات

- HTML5, CSS3, JavaScript (بدون إطار عمل).
- واجهة [mp3quran API v3](https://mp3quran.net/eng/api): السور، القراء، الراديو.
- تصميم إسلامي عصري (ألوان تيل/ذهبي/أبيض) ومتجاوب مع الشاشات المختلفة.

## التشغيل

1. فتح المجلد في المتصفح أو تشغيل خادم محلي (مثلاً عبر Live Server أو `npx serve`).
2. افتح `index.html` للصفحة الرئيسية.

## هيكل المشروع

```
├── index.html      الصفحة الرئيسية
├── quran      القرآن الكريم
|   ├── index.html 
├── ruqyah     الرقية الشرعية
|   ├── index.html
├── radio      راديو القرآن    
|   ├── index.html
├── quran-read      قراءة القرآن    
|   ├── index.html
├── ramadan      رمضان
|   ├── index.html
├── tasbeeh      تسبيح
|   ├── index.html
├── about      عن الموقع
|   ├── index.html
├── css/
│   ├── style.css   تنسيقات عامة
│   ├── home.css
│   ├── quran.css
│   ├── quran-read.css
│   ├── about.css
│   ├── ruqyah.css
│   ├── ramadan.css
│   ├── tasbeeh.css
│   └── radio.css
├── js/
│   ├── quran.js
│   ├── quran-read.js
│   ├── home.js
│   ├── ramadan.js
│   ├── quran.js
│   ├── tasbeeh.js
│   ├── theme.js
│   └── radio.js
├── json/
│   ├── quran.json
│   ├── ayahTimings.json
│   ├── reciters.json
│   ├── surah-name.json
├── img/
│   ├── icon.WEBP
│   ├── banner.WEBP
├── manifset,json
├── service-worker.js
└── README.md
```

## ملاحظة

- البيانات الصوتية ومحطات الراديو من موقع mp3quran. تأكد من الاتصال بالإنترنت للتشغيل.
