# سیاست امنیتی / Security Policy

<div dir="rtl">

## نسخه‌های پشتیبانی‌شده

فقط **آخرین نسخهٔ منتشرشده** و شاخهٔ **`main`** اصلاحات امنیتی می‌گیرند. این شامل سایت [taghv.im](https://taghv.im)، آخرین نسخهٔ افزونهٔ کروم و فایرفاکس، و آخرین APK اندروید در [Releases](https://github.com/farjadp/taghvim/releases) است.

## گزارش آسیب‌پذیری

اگر آسیب‌پذیری جدی پیدا کردی، **پیش از تماس با نگهدارنده آن را عمومی نکن**: نه issue، نه pull request، نه شبکه‌های اجتماعی.

به **farjad@ashavid.ca** ایمیل بفرست (همان نشانی گزارش اشکال در [taghv.im/help#feedback](https://taghv.im/help#feedback)). اگر GitHub برایت راحت‌تر است، می‌توانی از [گزارش خصوصی آسیب‌پذیری](https://github.com/farjadp/taghvim/security/advisories/new) هم استفاده کنی، در صورتی که روی ریپو فعال باشد.

در گزارش بنویس:

- چه بخشی آسیب‌پذیر است (سایت، افزونه، برنامهٔ اندروید، workflow انتشار)
- مراحل بازتولید یا نمونهٔ اثبات
- نسخه یا commit
- اثر احتمالی

پس از بررسی و رفع، اگر بخواهی نامت در توضیح اصلاح آورده می‌شود. این پروژه برنامهٔ جایزهٔ باگ (bug bounty) ندارد.

## مرتبط

- [`VERIFY.md`](VERIFY.md): سنجیدن اینکه فایل‌های منتشرشده از همین کد ساخته شده‌اند.

</div>

---

## Supported versions

Security fixes go to the **latest release** and the **`main`** branch only: the site at taghv.im, the current Chrome and Firefox extension, and the latest Android APK on the Releases page.

## Reporting a vulnerability

Please **do not disclose a serious vulnerability publicly** (issues, pull requests, social media) before contacting the maintainer.

Email **farjad@ashavid.ca**, the project's published contact address (see `src/lib/feedback.ts` and taghv.im/help#feedback). If it is enabled on the repository, you can also use [GitHub private vulnerability reporting](https://github.com/farjadp/taghvim/security/advisories/new).

Include the affected component, reproduction steps or a proof of concept, the version or commit, and the likely impact. There is no bug bounty program.

To check that a published file was built from this repository, see [`VERIFY.md`](VERIFY.md).
