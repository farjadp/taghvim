# سنجیدن فایل‌های تقویم / Verifying Taghvim's files

از نسخهٔ ۰٫۹٫۳۹ به بعد، افزونه‌ها و برنامهٔ اندروید روی سیستم شخصی ساخته نمی‌شوند. هر فایل را [GitHub Actions](.github/workflows/release.yml) از commit همان نسخه می‌سازد، و برای هر کدام یک گواهی ساخت (build provenance attestation) امضاشده صادر می‌کند. تنها کاری که بیرون از GitHub انجام می‌شود امضای APK است، چون کلید امضا نباید در هیچ سرویسی باشد؛ و این امضا قابل سنجیدن است.

From 0.9.39 on, nothing published is built on a personal machine. The [release workflow](.github/workflows/release.yml) builds every file from the tagged commit and attests it. The only step outside GitHub is signing the APK, and that step is checkable too.

## ۱. هر فایل از کدام commit ساخته شده؟ / Where was a file built?

```
gh attestation verify taghvim-0.9.39.zip --repo farjadp/taghvim
```

خروجی، commit و workflow سازنده را نشان می‌دهد. برای هر فایل دیگرِ release هم همین است، از جمله `taghvim-<v>-unsigned.apk`.

The output names the commit and the workflow. Works for every file in the release, including the unsigned APK. `SHA256SUMS` in the release lists every file's hash.

## ۲. APK امضاشده همان خروجی GitHub است؟ / Is the signed APK the CI build?

```
apksigcopier compare --unsigned taghvim-1.2-unsigned.apk taghvim-1.2.apk
```

([apksigcopier](https://github.com/obfusk/apksigcopier), `pip install apksigcopier`.) اگر بی‌خطا تمام شود، APK امضاشده جز بلوک امضا بایت‌به‌بایت همان فایلی است که GitHub ساخته. Exit 0 means the signed APK is the attested unsigned build with a signature block added, and nothing else.

## ۳. با کلید تقویم امضا شده؟ / Signed with Taghvim's key?

```
apksigner verify --print-certs taghvim-1.2.apk
```

باید `CN=Taghvim` و این اثر انگشت SHA-256 باشد / must show `CN=Taghvim` and:

```
2A:21:28:8E:2B:A9:A8:13:C2:19:84:83:D8:29:2D:9D:03:94:7D:19:C3:D8:71:7E:42:DA:8E:CF:6C:7B:68:6E
```

## حد این سنجش / What this does not prove

- نسخه‌ای که از فروشگاه کروم نصب می‌شود را فروشگاه دوباره بسته‌بندی و امضا می‌کند؛ تطبیق مستقیمش با این فایل‌ها ممکن نیست. The Chrome Web Store repackages and re-signs what it serves, so an install from the store cannot be matched byte for byte.
- گواهی ساخت نشان می‌دهد فایل از کدام کد ساخته شده، نه اینکه آن کد بی‌اشکال است؛ کد برای خواندن باز است. An attestation proves which source a file came from, not that the source is right; the source is public to read.
- نسخه‌های تا ۰٫۹٫۳۸ و برنامهٔ ۱٫۰ و ۱٫۱ هنوز روی سیستم شخصی ساخته شده بودند. Releases up to 0.9.38, and Android 1.0 and 1.1, were built locally and carry no attestation.

## برای نگهدارنده / For the maintainer

1. `package.json`، مانیفست افزونه و در صورت نیاز `versionName` برنامه را بالا ببر و commit کن.
2. `git tag v<version> && git push origin v<version>` — workflow یک release پیش‌نویس می‌سازد.
3. `node scripts/sign-release-apk.mjs v<version>` — همان APK را دانلود، گواهی‌اش را بررسی، امضا و سنجش می‌کند و بالا می‌گذارد؛ پیش از انتشار می‌پرسد.
4. زیپ‌های افزونه را از همان release در فروشگاه‌ها بارگذاری کن.
