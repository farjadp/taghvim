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
2A:21:28:8E:2B:A9:A8:13:C2:19:84:83:D8:29:2D:9D:03:94:7D:19:C3:D8:71:7E:42:DA:8E:CF:6C:7B:68:6E
```

جزئیات: [VERIFY.md](https://github.com/farjadp/taghvim/blob/main/VERIFY.md)

---

Every file here was built by GitHub Actions from this commit, with a signed build-provenance attestation. The signed APK is the unsigned build plus the signature, nothing else. See VERIFY.md.
