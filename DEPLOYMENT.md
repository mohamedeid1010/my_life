# 🚀 Deployment Guide — Pro Gym Dashboard

## Links

- **Live Site:** https://my-life-3519c.web.app
- **GitHub:** https://github.com/mohamedeid1010/my_life

---

## خطوات التحديث

### 1. عدّل الكود

عدّل أي ملف عادي.

### 2. جرّب محلي

```bash
npm run dev
```

### 3. احفظ نسخة على GitHub

```bash
git add -A
git commit -m "وصف التعديل"
git push
```

### 4. انشر على الموقع

```bash
npm run build
firebase deploy --only hosting
```

---

## أمر واحد يعمل كل حاجة

```bash
git add -A && git commit -m "update habits" && git push && npm run build && firebase deploy --only hosting
```

---

## أوامر مفيدة

| الأمر                            | الوظيفة               |
| -------------------------------- | --------------------- |
| `npm run dev`                    | تشغيل محلي            |
| `npm run build`                  | بناء ملفات الإنتاج    |
| `firebase deploy --only hosting` | نشر الموقع            |
| `git log --oneline`              | عرض كل النسخ المحفوظة |
| `git checkout <hash>`            | الرجوع لنسخة قديمة    |
| `git checkout main`              | الرجوع للنسخة الأخيرة |

---

## لو حاجة باظت

```bash
git log --oneline          # شوف النسخ
git checkout abc1234       # ارجع لنسخة معينة
git checkout main          # ارجع للأخيرة
```
