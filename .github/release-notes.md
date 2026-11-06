همهٔ فایل‌های این نسخه روی GitHub Actions و از همین commit ساخته شده‌اند، نه روی سیستم شخصی. برای هر فایل یک گواهی ساخت (attestation) امضاشده هست که نشان می‌دهد از کدام commit و با کدام workflow ساخته شده.

- `taghvim-<نسخه>.zip` — افزونهٔ کروم
- `taghvim-<نسخه>-firefox.zip` — افزونهٔ فایرفاکس
- `taghvim-<نسخه>-source.zip` — کد منبع همین commit
- `taghvim-<نسخهٔ برنامه>-unsigned.apk` — برنامهٔ اندروید، همان‌طور که GitHub ساخته، بدون امضا
- `taghvim-<نسخهٔ برنامه>.apk` — همان فایل، امضاشده با کلید تقویم؛ این را نصب کن

**سنجیدن:**

```
gh attestation verify <فایل> --repo farjadp/taghvim
apksigcopier compare --unsigned taghvim-<v>-unsigned.apk taghvim-<v>.apk
```

دستور دوم نشان می‌دهد APK امضاشده، جز امضا، بایت‌به‌بایت همان خروجی GitHub است. اثر انگشت SHA-256 گواهی امضا:

```
AF:5B:08:88:E0:9F:6B:19:0F:A9:66:C7:37:81:29:D7:03:BD:3C:2B:CB:D4:F5:22:32:8B:AC:13:1B:11:23:7B
```

جزئیات: [VERIFY.md](https://github.com/farjadp/taghvim/blob/main/VERIFY.md)

---

Every file here was built by GitHub Actions from this commit, with a signed build-provenance attestation. The signed APK is the unsigned build plus the signature, nothing else. See VERIFY.md.
