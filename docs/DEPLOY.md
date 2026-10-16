# Frontend Deployment Flow

## GitHub implementation update — 16 October 2026

The owner now authorizes pushes to repair branches and pull requests, with no main merge or deployment. Work is published at https://github.com/futurerotech/HealthyLifestyles/pull/9 on `codex/seo-cms-sync`. `vercel.json` disables automatic deployments for `codex/**` branches. Historical holds and audit results below describe earlier snapshots, not the current dependency tree.

Astro 7.4, Vercel adapter 11, Preact integration 6 and sharp 0.35.5 replace vulnerable versions. A scoped override updates Vercel routing-utils' path-to-regexp from 6.1 to the compatible patched 6.3 series; fixture builds exercise redirects and provider output. The strict security gate now reports zero vulnerabilities. TypeScript, 69 SEO/loader tests, 12 preservation tests, 7 subscription/share-image tests and the isolated CMS fixture build pass. The image endpoint uses valid XML numeric entities and rejects oversized text; a native PNG decode verifies 1200x630 output. Full production content verification still requires the separately approved CMS access release; pSEO is not assumed empty. No deployment is authorized.

The frontend (`www.healthylifesstyles.com`) is an Astro static site with Vercel server routes. Its GitHub repository is `futurerotech/HealthyLifestyles`. The independent Payload/Next.js application is `futurerotech/healthylifestyles-cms`, hosted on Hostinger at `cms.healthylifesstyles.com`. Astro reads the CMS over HTTPS; the CMS application is not deployed with Astro.

## خطة الإصدار المنفصلة — 16 أكتوبر 2026

هذه الخطة تُقدّم على تعليمات الإصدار المنسّق القديمة أدناه. لا يوجد إذن بـPush أو Merge أو Deploy أو Migration أو تعديل إعدادات الاستضافة. بقيت الإصلاحات السابقة على `codex/seo-cms-sync` في المستودعين. التغييرات في هذه الجولة تقتصر على التوثيق وتقارير تدقيق الأمان؛ لم تُغيّر الاعتماديات أو المحتوى.

أكد المالك من hPanel: CMS على Cloud Startup، تطبيق Node.js/Next.js مُدار، Node 22.x، متصل بمستودع `futurerotech/healthylifestyles-cms` وفرع `main` مع auto-deploy مفعّل وSSH متاح. هذه إفادة المالك المباشرة؛ إعدادات البناء والتشغيل وSHA المنشور وقاعدة الإنتاج والتخزين وربط Vercel ما زالت تحتاج تحققاً. توفر SSH لا يغيّر مسار الإصدار إلى VPS.

### ما تم إثباته وما يحتاج إلى لوحة الاستضافة

| المسار | ما تثبته الملفات | حالة الإعداد الحي |
| --- | --- | --- |
| GitHub للموقع | workflow يختبر `dev` ثم يحاول ترقية `main` تلقائياً عند النجاح؛ PR يشغّل الفحوص دون ترقية | تفعيل Actions وحماية الفروع وصلاحياتها تحتاج تحققاً من GitHub |
| GitHub لـCMS | تحقق API حي: workflow active؛ main غير محمي بحسب استجابة الفرع ولا Rulesets عامة؛ dev متأخر 7 commits | أكد المالك GitHub CMS/main وauto-deploy في Hostinger؛ SHA Hostinger وتفاصيل Webhooks الإدارية غير متحققة |
| Vercel | المحوّل الفعلي `@astrojs/vercel`، و`output: static`؛ تعليمات Node adapter القديمة لا تصف الإعداد الحالي | المستودع المرتبط وProduction Branch وBuild Command وDeploy Hooks وPreview triggers تحتاج تحققاً من لوحة Vercel |
| CMS إلى Vercel | `POST /api/deploy` يستدعي Webhook من الخادم بعد تحقق المدير وOrigin؛ زر الإدارة يطلبه يدوياً | وجود المتغير على Hostinger وهدفه وأي cron/n8n أو webhook خارجي غير متحقق |

لم توجد جلسة متصفح مفتوحة إلى Hostinger أو Vercel ولا قناة إدارة مصادقة متاحة؛ لذلك لا يُعد وصف الوثائق القديمة للنشر التلقائي إثباتاً لإعدادات الحساب الحالية. `origin/main` مرجع محلي، وليس إثباتاً لـSHA الخادم الحي. في المرجع المحلي لـCMS توجد دالة `triggerVercelDeploy` قديمة، لكن البحث لم يجد استيراداً نشطاً لها؛ وجود الملف وحده لا يعني أنها تعمل. لا يوجد استدعاء Vercel نشط في بدء CMS في الكود المفحوص. يلزم مطابقة ذلك مع نسخة الإنتاج وسجل أحداث Vercel.

أُضيف لاحقاً تحقق قراءة GitHub الحي: main يطابق `b508b0dc3e751c276155468ebf55225522d84bbd`؛ dev متأخر 7 commits. استعلامات Webhooks وتفاصيل الحماية تحتاج مصادقة وأعادت 401. تعامل مع أي تغيير main في CMS كإصدار Hostinger تلقائي بحسب تأكيد المالك؛ لا تستخدم dev قبل مراجعة تأخره ومسار ترقيته. لا تغير حماية الفروع أو إعدادات المضيف ضمن هذه الخطة دون اعتماد.

[Vercel يوثّق إنشاء الإنتاج من فرع الإنتاج والمعاينات من الفروع الأخرى](https://vercel.com/docs/git). [Deploy Hook يستهدف مشروعاً وفرعاً محددين](https://vercel.com/docs/deploy-hooks). هذه خصائص المنصة، وليست تأكيداً لإعداد المشروع. يجب حماية رابط Webhook كسرّ وعدم نسخه إلى تقرير أو اختباره باستدعائه.

### ترتيب التنفيذ بعد استيفاء الشروط والحصول على الموافقات

1. **Hostinger فقط:** اتبع [دليل CMS المفصل](https://github.com/futurerotech/healthylifestyles-cms/blob/codex/seo-cms-sync/docs/DEPLOY.md) لتطبيق Node.js المُدار في hPanel. سجّل SHA الحي وأوامر البناء والتشغيل ومصدر قاعدة البيانات والوسائط، وافحص جميع المشغّلات الآلية قراءةً فقط. أعد حزمة صغيرة لإصلاح صلاحيات pSEO متوافقة مع النسخة الحية؛ لا تنشر الفرع الكامل ذي التغييرات الأوسع والترحيلات المعلقة. منع seed عند بدء التطبيق شرط مستقل لم يُنفذ في هذه الجولة. يجب اجتياز أمان CMS والنسخ الاحتياطي وتجربة التراجع قبل الموافقة على إصداره.
2. **تحقق API بعد إصدار CMS المعتمد:** اجلب كل صفحات `pseo-pages` المنشورة بترتيب ID وpagination حتى تطابق `totalDocs`، وتحقق من ID وslug وheadline وSEO والصور. جرّب قراءة المنشور والمطالبة بالمسودات والحقول الخاصة بهوية عامة على staging؛ الإنتاج يقتصر على GET آمن. لا تستدعِ التوليد أو زر النشر أو تحفظ مقالات للاختبار. صفحـات pSEO العامة تستخدم `status` لا `_status`.
3. **خط أساس pSEO:** العدد الحالي غير معلوم بسبب 403؛ لا يجوز تسجيل صفر افتراضي. بعد فتح القراءة، قارِن الجرد المصرّح به/نسخة staging مع الجرد العام لتثبت عدم إخفاء سجلات منشورة، ثم راجع وسجّل IDs وslugs لكل pSEO في baseline محلياً. حذف `unverifiedCollections` أو تجديد baseline آلياً لتجاوز الخطأ ممنوع. قد تظهر عوائق محتوى أو مسارات بعد فك 403؛ تُحل دون تعديل إنتاج غير معتمد.
4. **بناء محلي حقيقي منفصل:** استخدم مساحة معزولة لحماية المخرجات السابقة، Node 22، و`CMS_URL=https://cms.healthylifesstyles.com` و`CMS_DISABLE=0` و`INDEXNOW_DISABLE=true`. لا يحتاج البناء إلى حساب مدير أو اتصال قاعدة بيانات. شغّل فحص الأمان والأنواع واختبارات SEO وحفظ المحتوى والاشتراكات، ثم `npm run build` العادي؛ يجب أن يجتاز prebuild وpostbuild وكل البوابات. لا تستخدم استدعاء Astro المباشر لتجاوز فشل الأمان، ولا fixture أو snapshot أو fallback لإثبات اكتمال الإصدار.
5. **إثبات المحتوى:** تحقق من كل IDs وslugs والتواريخ والعلاقات والنص والصور و56 FAQ، و39 مقالاً حالياً و70 سجل أدوات/68 صفحة وتحويلين، وكل pages وpSEO المنشورة. هذه أعداد مصدر حالية وليست عدد بناء ناجح؛ أي تغير حقيقي يتطلب مراجعة الجرد، لا حذف محتوى لمطابقة العدد. قارِن HTML وCanonical وrobots وOpen Graph وJSON-LD والروابط وملفات وصور المخرج ومخرجات مزود Vercel. noindex والـCanonical التحريري الخارجي لا يدخلان XML، لكن يجب توليد الصفحة المطلوبة. أي استجابة ناقصة أو تقليل محتوى غير مراجع يفشل الإصدار حتى لو نجحت الاختبارات الأخرى.
6. **Vercel بعد موافقة مستقلة:** تحقق قراءةً من المشروع الصحيح والمستودع وفرع الإنتاج وأوامر البناء وأسماء المتغيرات في Production/Preview. يجب أن يكون Build Command هو `npm run build` بكل بواباته، وألا تفعّل الإعدادات CMS_DISABLE أو fallback. ثم حدد نقطة التنفيذ المعتمدة: رفع فرع مع معاينة، ثم ترقية معتمدة إلى الإنتاج؛ أو المسار القائم `dev`→CI→`main` إذا ثبت الربط الآلي. رفع `dev` نفسه قد يبدأ السلسلة؛ الموافقة يجب أن تغطيها. لا تجمع Push وزر CMS وRedeploy في إصدار واحد فتنتج أبنية متزامنة. إن استُخدمت معاينة، يجب تحقق البناء النهائي ببيئة الإنتاج أيضاً.
7. **التحقق بعد Vercel:** طابق deployment ID وSHA، ثم `/content-manifest.json` مع الجرد الحالي ومصدر `cms` وأصل CMS، وتحقق من جميع المقالات والأدوات وpSEO والصور وFAQ وSitemap وCanonical والتحويلين وواجهات API. نجاح زر Webhook يعني طلب بناء فقط؛ لا يثبت اكتماله أو نشره. آلية تأكيد pending عبر manifest جزء من الفرع الأوسع؛ لا تفترض وجودها في حزمة 403 الصغيرة.
8. **التراجع:** احتفظ بمعرّف إصدار Vercel السابق قبل النشر. بعد اعتماد التراجع، وجّه الإنتاج إلى المخرج السابق المعروف الصالح بدلاً من إعادة بنائه من CMS الذي قد تغير؛ توفّر الخطة يؤثر في اختيار الإصدارات السابقة. هذا لا يغير قاعدة CMS. راجع عندئذ توافق المخرج القديم مع المحتوى الأحدث، ولا تصف التراجع بأنه نشر أحدث المحتوى. [دليل تراجع Vercel](https://vercel.com/docs/deployments/rollback-production-deployment).

### بوابة الأمان الحالية

| النطاق، تدقيق جديد 16 أكتوبر | حرجة | عالية | متوسطة | منخفضة | المجموع |
| --- | ---: | ---: | ---: | ---: | ---: |
| Astro، كل الاعتماديات | 1 | 4 | 0 | 1 | 6 |
| CMS، كل الاعتماديات | 2 | 13 | 12 | 3 | 30 |
| CMS، `--omit=dev` | 0 | 12 | 10 | 3 | 25 |

الأعداد تصنيفات حزم في npm audit وقد تتكرر سلسلة الثغرة بين الحزم؛ ليست عدداً مستقلاً من CVEs. تقارير [Astro](seo/security-audit-frontend-20261016.json) و[CMS](seo/security-audit-cms-20261016.json) و[CMS دون dev](seo/security-audit-cms-runtime-20261016.json) محفوظة بلا أسرار إنتاج. هذه نتائج lockfile المحلي، ولا تثبت إصدارات الخوادم الحية.

النتائج الست تخص الواجهة فقط: `astro` و`@astrojs/vercel` و`@vercel/routing-utils` و`path-to-regexp` و`sharp` و`esbuild`. ترقية Astro/المحوّل الكبرى تبقى عملاً منفصلاً، ولا تُعطل بوابة الأمان. في CMS تقع النتيجتان الحرجتان في Vitest/Tinypool ضمن أدوات الاختبار، لكن بقاء 12 نتيجة عالية عند استبعاد dev يمنع اعتبار CMS آمناً للنشر. تُراجع شجرة الاعتماديات والاستخدام الفعلي ثم تُجرّب تحديثات متوافقة لحزم Payload معاً وNext وsharp واعتمادياتها في staging، دون فرض overrides عمياء أو تشغيل audit fix قسري. لا توجد موافقة على استثناء أمني. workflow CMS الحالي لا يشغّل `npm test` أو `npm audit`؛ يلزم اشتراطهما قبل إصداره، ولا يكفي ضوء CI الأخضر وحده.

**القرار الحالي: الإصداران موقوفان.** عوائق CMS هي إعدادات الاستضافة الحية غير المتحققة، وحزمة الإصدار الصغيرة غير المعزولة على SHA الحي، وseed عند بدء التطبيق، وفحوص الأمان والنسخ الاحتياطي والتراجع. عوائق الواجهة تشمل 403، وجرد pSEO غير المعروف، والبناء الحقيقي غير المكتمل، والثغرات الست. لم يتغير الإنتاج.

## Current release hold (2026-10-16)

Content preservation is an independent release blocker. See the Arabic investigation and per-article verification below. The earlier fixture/offline results in this document are test evidence only; they do not establish production content completeness.

SEO/CMS synchronization changes are prepared locally on `codex/seo-cms-sync` in both repositories. The owner has authorized implementation, but no push, deployment, or production migration. Any push may trigger hosting, including preview builds; obtain explicit release approval first.

The major Astro/adapter security upgrade is a separate task. The frontend still has six reported dependency vulnerabilities (one critical, four high, one low). `npm run security:check` blocks both the normal build lifecycle and CI on high/critical findings. Do not renew the expired audit baseline to bypass this hold. Resolve the separate upgrade and rerun the gate before release.

## Coordinated release procedure (requires approval)

1. Review both local branches and pass the security gate, type checks, `npm run test:content`, unit tests, and CMS fixture build (`npm run test:cms-build`). The fixture runs in an isolated workspace, cannot overwrite project build output, performs no production writes, and cannot pass release preflight.
2. Release only the approved CMS access patch first under the separate-host plan above. It must require no production migration. Earlier pending migrations belong to a separate release review. Do not invoke the frontend hook; any change to live trigger settings needs separate approval. Confirm public reads expose published content only, including `pages` and `pseo-pages`.
3. Review the two legacy tool aliases and keep their canonical tool records published and enabled. The frontend suppresses alias documents and redirects old URLs to `body-fat-calculator` and `protein-intake-calculator`.
4. Release the frontend with the production `CMS_URL` and without `CMS_DISABLE=1`. A failed/incomplete CMS read or unsupported published route must fail the build. `npm run build` runs `content:preflight` after rendering: it independently re-reads every published article/tool with pagination and compares IDs, slugs, fingerprints, actual HTML, images, dates, SEO and links. Reviewed baseline IDs cannot disappear automatically. The build also checks internal links, metadata, dates, and localized shells.
5. Check the deployed `/content-manifest.json`: `source` must be `cms`, `cmsOrigin` must match this CMS, and revisions must include the changes being released. This receipt contains public revision metadata only and must not be cached by the CDN.
6. Open CMS pending deployments. Entries clear only after a matching deployed receipt confirms them. Edits arriving during a build stay pending; failed deployments leave the queue intact. Verify publish, update, unpublish, and delete in staging before normal editorial use.
7. Check legacy tool redirects, custom pages, pSEO pages, the HTML sitemap and `/sitemap-index.xml`. CMS `/sitemap.xml` redirects to the frontend. `noIndex` and non-self editorial canonicals must be absent from XML. Submit the sitemap in Search Console; IndexNow does not guarantee indexing.

The mirrored `src/lib/site-contract.json` and `site-routes.ts` define supported public URLs. Update both copies together when adding a tool or static page; the contract tests reject drift.

## Local validation evidence (2026-10-15)

- Frontend: 62 SEO/routing/snapshot tests and five subscription API tests passed; TypeScript check passed.
- CMS: 66 unit tests, TypeScript check, domain guard and database-isolated Next build passed. Production migrations have not been executed.
- Real Astro/Vercel builds passed with an isolated loopback CMS and explicit offline data. The CMS fixture checks editorial SEO/social overrides, all supported block types, legacy links, disabled bespoke tools, pSEO, XML exclusions and the deployed revision receipt.
- Offline output: 178 HTML pages checked, zero dead internal links, zero tool/article orphans; metadata, dates, JSON-LD and size checks passed. Metadata length suggestions remain advisory. No localized pages exist, so the localized-shell check has no production translations to evaluate.
- Security gate intentionally fails with six remaining dependency findings. Full GitHub CI, Lighthouse, staging database migration and live deployment verification remain release-time checks; no production changes were made.

## Conditional Git promotion path (not a deployment instruction)

1. **Only after explicit approval for the resulting deployment chain**, a push to `dev` can start promotion. Preserve the current review branch and local work; do not switch, merge, or push speculatively.
2. **GitHub Actions runs `.github/workflows/promote.yml`.**
   - Job `verify`: runs security, types, isolated fixture tests, content preservation tests, then an independent production-CMS build plus release preflight. Fixture success alone cannot reach promotion.
   - Job `promote` (only if `verify` succeeds): fast-forwards `origin/main` to the current `dev` HEAD.
3. **If the live Vercel Git integration is enabled for this repository and `main` is its production branch**, the new commit starts a production deploy. Verify those settings; the workflow file alone does not establish them. Other branch pushes may create previews before promotion.

## Rules

- **Never push directly to `main`.** Promotion is the workflow's job only.
- **Never force-push `main`.** If promotion fails because `main` has diverged, resolve it manually with a merge or rebase on `dev`.
- **Review locally before landing on `dev`.** Pushing `dev` starts automatic promotion and is a release action.

## Rollback

With release approval, restore a known-good deployment in the Vercel dashboard and prepare a normal revert through `dev`. Do not rewrite `main` history. To inspect existing deployments:

1. Open [vercel.com/dashboard](https://vercel.com/dashboard).
2. Select the `healthylifesstyles.com` project.
3. Go to **Deployments**.
4. Find the deployment for the rollback commit (or the previous known-good deployment).
5. Click the three-dots menu → **Redeploy** → confirm.

## Default branch

The repository default branch is `dev`. New pull requests and edits in the GitHub UI target `dev` automatically.

To verify or change the default branch (requires repo admin):

1. Open the repository on GitHub.
2. Go to **Settings** → **General**.
3. Under "Default branch", confirm it is set to `dev`.

<!-- CONTENT_PRESERVATION_AUDIT -->
## تقرير حفظ المحتوى — 15 أكتوبر 2026

النتيجة: تم التحقق من عرض المقالات المنشورة الـ39 كاملة في **بناء تشخيصي معزول**، لكن **البناء المعتاد المتصل مباشرة بالإنتاج لم يكتمل، والإصدار غير جاهز للنشر**. لا يجوز استخدام نجاح النسخة التشخيصية لتجاوز منع قراءة pSEO أو بوابة الأمان.

### الأعداد ومصدر المقارنة

| المصدر | المقالات | الأدوات | صلاحية الاستخدام للإصدار |
| --- | ---: | ---: | --- |
| Payload CMS العام في الإنتاج | 39 منشورة | 70 سجلاً منشوراً ومفعلاً | المصدر المرجعي |
| المخرج المحلي عند بدء التحقيق | 5 صفحات اختبار، منها 3 فقط تطابق مقالات الإنتاج | 69 سجل اختبار، منها أداة معطلة للاختبار | مرفوض؛ يغيب عنه 36 مقالاً منشوراً |
| البيانات المؤلفة داخل src/data/articles.ts | 11 | بيانات تطوير محلية | لا تشمل 28 مقالاً منشوراً؛ ليست نسخة احتياطية للإنتاج |
| البناء التشخيصي بعد الإصلاح | 39 من 39 | 68 صفحة فعلية + تحويلان دائمان لسجلين قديمين | تشخيصي فقط؛ غير صالح للنشر |

قُرئت المقالات عبر 4 صفحات API بحجم 10 سجلات، والأدوات عبر 7 صفحات، مع فحص totalDocs وفرادة ID وslug وثبات العدد. أُعيدت قراءة CMS بعد البناء وتطابقت بصمات المحتوى دون تغير. جرى جلب HTML لجميع روابط المقالات والأدوات الـ109: كل المقالات الـ39 والأدوات الفعلية الـ68 أعادت 200، والرابطان القديمان فقط أعادا 404 في الإنتاج.

مسار النسخة التشخيصية التي تم التحقق منها على هذا الجهاز: F:/cloud/.content-audit/production-review-XIOwwR/dist/client. المجلد dist في جذر المشروع ليس هذه النسخة، ولا ينبغي اعتباره مخرج إصدار ناجحاً؛ محاولة البناء المباشر توقفت عند API المحظور.

### السبب المثبت

1. سجل content-manifest.json الأصلي يثبت أن آخر اختبار سابق بنى من CMS تجريبي على 127.0.0.1 ثم ترك مخرجاته في dist وفي مجلد Vercel الخاص بالمشروع. كان يحتوي خمسة مقالات، بينها hidden-guide وduplicate-guide للاختبار. نجاح هذا الاختبار لم يكن إثبات اكتمال محتوى الإنتاج، وكان يجب توضيح ذلك في التقرير السابق.
2. مجموعة المقالات المحلية القديمة تضم 11 مقالاً فقط. كانت آلية التراجع تسمح باستخدامها عند فشل الاتصال خارج Vercel production أو عند تفعيل استثناء التراجع. لذلك كان التشغيل المحلي معرضاً لعرض بيانات أقدم حتى عندما يحتوي CMS على 39 مقالاً.
3. Pagination لم تكن تتحقق بالكامل من غياب totalDocs أو تكرار IDs أو تغير الإجمالي. لم يثبت أن ذلك اقتطع مقالات الإنتاج الحالية، لكن هذه الحالات كانت تسمح ببناء غير موثوق، وأصبحت أخطاء مانعة.
4. كان محوّل المقالات يتجاهل حقل FAQ المنفصل: استُعيد 56 سؤالاً وجواباً في 12 مقالاً، دون تكرار أزواج السؤال والجواب الموجودة بالفعل داخل layout.
5. .env يشير إلى CMS الإنتاج الصحيح. لا يوجد CMS_DISABLE مفعل في بيئة المشروع الحالية. ذاكرة الطلبات مشتركة داخل عملية البناء فقط، والطلبات تستخدم no-store؛ مصدر المخرج الناقص المثبت كان CMS الاختبار، وليس نقص العدد المرجعي في الإنتاج.
6. محاولة البناء الحقيقي من الإنتاج تتوقف عند GET /api/pseo-pages مع HTTP 403. لا يمكن استنتاج أن المجموعة فارغة أو معرفة عدد منشوراتها من هذه الاستجابة. إصلاح القراءة العامة للمحتوى المنشور موجود محلياً في CMS ولم يطبق على الإنتاج.

### الإصلاحات المحلية

- عزل اختبارات البناء وملفات Vercel في مجلد مستقل؛ واختبار أن مخرجات المشروع تبقى كما كانت بعد الاختبار.
- منع التراجع الصامت للمقالات المحلية عند فشل CMS على أي جهاز. CMS_DISABLE=1 أصبح اختيار تشخيص دون اتصال لا يجتاز التحقق قبل الإصدار، واستثناء ALLOW_LOCAL_CONTENT_FALLBACK لم يعد يسمح بهذا التجاوز.
- رفض استجابات pagination الناقصة والمتغيرة والمكررة، ورفض إسقاط سجل منشور بسبب حقول ناقصة.
- حفظ ID الأصلي في نموذج العرض وHTML، وحفظ بصمة تشمل النصوص وFAQ والتواريخ والصور وSEO وعلاقات CMS. لا تُضاف أسرار globals إلى البصمة أو التقرير. قراءات الترجمات لا تستبدل سجل النسخة الإنجليزية.
- إضافة content:preflight مستقلة: تعيد قراءة كل السجلات المنشورة وتقارنها بملفات HTML الفعلية وبالنسخة التي سيستخدمها Vercel وبسجل مرجعي من IDs وslugs وتواريخ النشر. أي نقص أو تبديل ID أو تغيير slug أو تاريخ نشر غير مراجع أو تعطيل أداة مرجعية يوقف الإصدار.
- فحص النصوص والروابط التحريرية والعناوين والوصف وcanonical وrobots ومعاينات المشاركة وتواريخ JSON-LD والصورة الرئيسية وبياناتها. التحقق من وجود 107 ملفات صور محلية، ومن ملفات HTML والسجل المرجعي داخل مخرجات Vercel أيضاً.
- ربط التحقق بالبناء المعتاد وبمسار CI قبل الترقية؛ نجاح الاختبار التجريبي وحده لا يصل إلى النشر. يرفض التحقق builds الموسومة fixture أو offline أو diagnostic أو الصادرة من CMS مختلف.

### نتيجة الاختبارات

نجح 65 اختبار SEO ومحمّل محتوى، و9 اختبارات حفظ محتوى، و5 اختبارات API اشتراك، وفحص TypeScript. نجح اختبار البناء المعزول مع إثبات أنه لا يستبدل مخرجات المشروع.

في النسخة التشخيصية ذات البيانات العامة الحقيقية: 39 مقالاً و68 صفحة أداة، و109 سجلات CMS متحقق منها مع احتساب سجلي التحويل. اجتاز المحتوى 1666 فحص نص، و234 صفحة HTML فُحصت دون روابط داخلية معطلة أو صفحات أدوات/مقالات بلا روابط واردة. نجحت فحوص metadata وJSON-LD والتواريخ وحجم الصفحات. الصور الرئيسية الـ39 أعادت 200؛ لم تُحمّل أو تُعدّل الصور. بقيت اقتراحات أطوال العناوين والوصف إرشادية.

أُثبت الرفض أيضاً على المخرج الحقيقي: شُغّل أمر التحقق قبل الإصدار فعلياً وأعاد exit code 1 للنسخة التشخيصية المكتملة، ومحاكاة غياب ملف المقال ID=37 توقف التحقق. اختبارات أخرى تثبت رفض نقص سجل، وتبديل ID مع بقاء العدد نفسه، وتغير slug، وتراجع العدد إلى صفر، واستجابة CMS مبتورة، وفقد صورة أو تاريخ أو جواب FAQ.

### القائمة الكاملة، بالمعرّف والعنوان والرابط وslug

عمود «بناء البداية» يحدد بالضبط المقالات الـ36 التي كانت مفقودة من آخر مخرج اختبار. وعمود «البيانات المحلية» يحدد المقالات الـ28 التي لا توجد في مجموعة التطوير القديمة. جميع صفوف العمود الأخير تم التحقق منها فعلياً في البناء التشخيصي الجديد، وليس بمجرد عدّ السجلات.

| ID | العنوان ورابط الإنتاج | slug | بناء البداية | البيانات المحلية | البناء التشخيصي |
| --- | --- | --- | --- | --- | --- |
| 1 | [How Many Calories Should I Eat to Lose Weight?](https://www.healthylifesstyles.com/wellness-hub/how-many-calories-to-lose-weight) | how-many-calories-to-lose-weight | موجود | موجود | متحقق |
| 2 | [How Much Protein Do I Really Need?](https://www.healthylifesstyles.com/wellness-hub/how-much-protein-do-i-need) | how-much-protein-do-i-need | مفقود | موجود | متحقق |
| 3 | [What's a Healthy BMI by Age?](https://www.healthylifesstyles.com/wellness-hub/healthy-bmi-by-age) | healthy-bmi-by-age | مفقود | موجود | متحقق |
| 4 | [The Best Time to Stop Drinking Coffee for Better Sleep](https://www.healthylifesstyles.com/wellness-hub/best-time-to-stop-drinking-coffee-for-sleep) | best-time-to-stop-drinking-coffee-for-sleep | مفقود | موجود | متحقق |
| 5 | [How to Keep Muscle While Losing Weight](https://www.healthylifesstyles.com/wellness-hub/how-to-keep-muscle-while-losing-weight) | how-to-keep-muscle-while-losing-weight | مفقود | موجود | متحقق |
| 6 | [Due Date by Conception Date: How It Works](https://www.healthylifesstyles.com/wellness-hub/due-date-by-conception-date) | due-date-by-conception-date | مفقود | موجود | متحقق |
| 7 | [Intermittent Fasting for Beginners: How to Pick a Schedule](https://www.healthylifesstyles.com/wellness-hub/intermittent-fasting-for-beginners) | intermittent-fasting-for-beginners | مفقود | موجود | متحقق |
| 8 | [Sleep Chronotypes: Are You a Lion, Bear, Wolf, or Dolphin?](https://www.healthylifesstyles.com/wellness-hub/sleep-chronotypes-explained) | sleep-chronotypes-explained | مفقود | موجود | متحقق |
| 9 | [How to Build a High-Protein Meal Plan You’ll Actually Follow](https://www.healthylifesstyles.com/wellness-hub/how-to-build-a-meal-plan) | how-to-build-a-meal-plan | مفقود | موجود | متحقق |
| 10 | [How Long Does It Take to Lose Weight? A Realistic Timeline](https://www.healthylifesstyles.com/wellness-hub/how-long-does-it-take-to-lose-weight) | how-long-does-it-take-to-lose-weight | مفقود | موجود | متحقق |
| 11 | [How to Calculate Your Macros for Your Goal](https://www.healthylifesstyles.com/wellness-hub/how-to-calculate-your-macros) | how-to-calculate-your-macros | موجود | موجود | متحقق |
| 13 | [How Much Water Should You Drink a Day?](https://www.healthylifesstyles.com/wellness-hub/how-much-water-should-you-drink-a-day) | how-much-water-should-you-drink-a-day | مفقود | مفقود | متحقق |
| 15 | [What Is Metabolic Age and What Does It Say About Your Health?](https://www.healthylifesstyles.com/wellness-hub/metabolic-age-calculator-guide) | metabolic-age-calculator-guide | مفقود | مفقود | متحقق |
| 16 | [How Are Calories Burned Calculated? A Guide to Energy Expenditure](https://www.healthylifesstyles.com/wellness-hub/calories-burned-calculator-guide) | calories-burned-calculator-guide | موجود | مفقود | متحقق |
| 17 | [What Is Lean Body Mass and Why Does It Matter More Than Weight?](https://www.healthylifesstyles.com/wellness-hub/lean-body-mass-calculator-guide) | lean-body-mass-calculator-guide | مفقود | مفقود | متحقق |
| 19 | [How Do You Calculate the Calories in a Homemade Recipe?](https://www.healthylifesstyles.com/wellness-hub/how-to-calculate-calories-in-a-recipe) | how-to-calculate-calories-in-a-recipe | مفقود | مفقود | متحقق |
| 20 | [How Many Carbs Can You Eat on Keto?](https://www.healthylifesstyles.com/wellness-hub/how-many-carbs-on-keto) | how-many-carbs-on-keto | مفقود | مفقود | متحقق |
| 21 | [What Is an Anti-Inflammatory Diet? Foods to Eat and Limit](https://www.healthylifesstyles.com/wellness-hub/what-is-an-anti-inflammatory-diet) | what-is-an-anti-inflammatory-diet | مفقود | مفقود | متحقق |
| 22 | [How Do You Know If Your Gut Is Healthy?](https://www.healthylifesstyles.com/wellness-hub/how-do-you-know-if-your-gut-is-healthy) | how-do-you-know-if-your-gut-is-healthy | مفقود | مفقود | متحقق |
| 23 | [How to Keep a Food and Symptom Diary That Finds Your Triggers](https://www.healthylifesstyles.com/wellness-hub/how-to-keep-a-food-and-symptom-diary) | how-to-keep-a-food-and-symptom-diary | مفقود | مفقود | متحقق |
| 24 | [Alcohol Calorie Calculator: Impact on Weight Loss](https://www.healthylifesstyles.com/wellness-hub/hidden-calories-in-alcohol-and-weight-loss) | hidden-calories-in-alcohol-and-weight-loss | مفقود | مفقود | متحقق |
| 25 | [How Do You Calculate Alcohol Units in Your Drinks](https://www.healthylifesstyles.com/wellness-hub/alcohol-units-calculator) | alcohol-units-calculator | مفقود | مفقود | متحقق |
| 26 | [What Do Your Blood Pressure Numbers Mean? (Age Guide)](https://www.healthylifesstyles.com/wellness-hub/what-do-your-blood-pressure-numbers-mean) | what-do-your-blood-pressure-numbers-mean | مفقود | مفقود | متحقق |
| 27 | [How to Read Your HRV Trend Without Overreacting](https://www.healthylifesstyles.com/wellness-hub/how-to-read-your-hrv-trend) | how-to-read-your-hrv-trend | مفقود | مفقود | متحقق |
| 28 | [Can Sun Exposure Tell You If You Need Vitamin D?](https://www.healthylifesstyles.com/wellness-hub/can-sun-exposure-tell-you-if-you-need-vitamin-d) | can-sun-exposure-tell-you-if-you-need-vitamin-d | مفقود | مفقود | متحقق |
| 29 | [What Your Calorie Deficit Calculator Can—and Cannot—Tell You](https://www.healthylifesstyles.com/wellness-hub/what-calorie-deficit-calculator-can-tell-you) | what-calorie-deficit-calculator-can-tell-you | مفقود | مفقود | متحقق |
| 30 | [Body Fat Calculator: What a Tape Measure Can Tell You](https://www.healthylifesstyles.com/wellness-hub/body-fat-calculator-what-the-navy-method-can-tell-you) | body-fat-calculator-what-the-navy-method-can-tell-you | مفقود | مفقود | متحقق |
| 31 | [Weight Loss Percentage: What the Number Really Means](https://www.healthylifesstyles.com/wellness-hub/weight-loss-percentage-what-the-number-really-means) | weight-loss-percentage-what-the-number-really-means | مفقود | مفقود | متحقق |
| 32 | [Waist-to-Hip Ratio: How to Measure It and What It Means](https://www.healthylifesstyles.com/wellness-hub/waist-to-hip-ratio-how-to-measure-it-and-what-it-means) | waist-to-hip-ratio-how-to-measure-it-and-what-it-means | مفقود | مفقود | متحقق |
| 37 | [What Is a Healthy Waist-to-Height Ratio?](https://www.healthylifesstyles.com/wellness-hub/healthy-waist-to-height-ratio) | healthy-waist-to-height-ratio | مفقود | مفقود | متحقق |
| 38 | [What Is Your Ideal Weight for Your Height?](https://www.healthylifesstyles.com/wellness-hub/ideal-weight-for-height-bmi-devine-guide) | ideal-weight-for-height-bmi-devine-guide | مفقود | مفقود | متحقق |
| 39 | [What Is BMR and How Many Calories Do You Burn at Rest?](https://www.healthylifesstyles.com/wellness-hub/what-is-bmr-calculator-daily-calorie-needs) | what-is-bmr-calculator-daily-calorie-needs | مفقود | مفقود | متحقق |
| 40 | [What Does Your Flexibility & Mobility Score Mean?](https://www.healthylifesstyles.com/wellness-hub/flexibility-mobility-score-at-home-tests-guide) | flexibility-mobility-score-at-home-tests-guide | مفقود | مفقود | متحقق |
| 41 | [What Does Your Push-Up Test Score Mean?](https://www.healthylifesstyles.com/wellness-hub/what-does-your-push-up-test-score-mean) | what-does-your-push-up-test-score-mean | مفقود | مفقود | متحقق |
| 42 | [How Long Should You Recover Between Workouts?](https://www.healthylifesstyles.com/wellness-hub/how-long-should-you-recover-between-workouts) | how-long-should-you-recover-between-workouts | مفقود | مفقود | متحقق |
| 43 | [What Is FFMI and What Does Your Score Mean?](https://www.healthylifesstyles.com/wellness-hub/what-is-ffmi-fat-free-mass-index-guide) | what-is-ffmi-fat-free-mass-index-guide | مفقود | مفقود | متحقق |
| 44 | [What Is Your One-Rep Max and How Do You Calculate It?](https://www.healthylifesstyles.com/wellness-hub/what-is-one-rep-max-how-to-calculate-it) | what-is-one-rep-max-how-to-calculate-it | مفقود | مفقود | متحقق |
| 45 | [How Many Calories Do You Burn Walking 10,000 Steps?](https://www.healthylifesstyles.com/wellness-hub/how-many-calories-burn-walking-10000-steps) | how-many-calories-burn-walking-10000-steps | مفقود | مفقود | متحقق |
| 46 | [What Does Your VO2 Max Score Mean?](https://www.healthylifesstyles.com/wellness-hub/what-does-your-vo2-max-score-mean) | what-does-your-vo2-max-score-mean | مفقود | مفقود | متحقق |

المعرّفات المفقودة من مخرج الاختبار الأول: 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 15, 17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46.

[الأدلة التفصيلية لكل مقال وأداة، والتواريخ والصور وSEO والعلاقات وفروق الإنتاج مقابل المحلي](seo/content-preservation-evidence.json).

### قرار الجاهزية

**لا، لا يمكن الانتقال إلى النشر حالياً.** تم إثبات حفظ مقالات الإنتاج والأدوات في النطاق المقروء، لكن قراءة مجموعة pSEO في الإنتاج ما زالت محظورة، والبناء المرجعي الكامل لم يجتز التحقق. النسخة التشخيصية مبنية من لقطة عامة موثقة عبر وسيط محلي وتعلن source=diagnostic؛ لا تصلح للنشر ولا لإقرار مزامنة CMS. تبقى بوابة الأمان مانعاً مستقلاً أيضاً.

لا يلزم تعديل محتوى الإنتاج لتطابق الأعداد، ولم ينفذ أي حذف أو seed أو import أو reset أو ترحيل قاعدة بيانات أو تغيير محتوى. لم يحدث Push أو Merge أو Deploy في هذه الجولة، ولم تنفذ ترقيات أمنية. يلزم حل صلاحية القراءة بعد موافقة صريحة، ثم إعادة بناء مباشر والتحقق من كل المجموعات المنشورة وإعادة بوابتي المحتوى والأمان قبل أي قرار إصدار.

<!-- PSEO_ACCESS_20261016 -->
## تحديث إصلاح pSEO — 16 أكتوبر 2026

**الإصلاح جاهز محلياً ومختبر، لكن 403 في خادم الإنتاج لم يتغير، ولا يوجد بناء Astro كامل ناجح من CMS الحقيقي.** لم يُنشر CMS ولم تُمنح صلاحية تجاوز باستخدام مفتاح مدير.

### السبب وطريقة الإصلاح

النسخة المرجعية من مجموعة pseo-pages تستخدم read: isAdmin. في المقابل، القالب العام السابق داخل CMS كان يقرأ status=published بواسطة Local API ذي الصلاحيات الداخلية، لذلك كانت الصفحات مصممة للعرض العام عند نشرها، رغم منع قراءتها من REST العام. Astro يستخدم REST عاماً بلا مصادقة، فتصل استجابة Payload JSON بـ403. قراءات المقالات والأدوات تعمل؛ المشكلة ليست فشل اتصال شامل أو مشكلة CORS في طلب الخادم.

الإصلاح المحلي السابق للسماح بالمنشور لم يكن قد نُشر. ثُبّت الآن في publishedPseoRead مع اختبارات مستقلة: غير المدير يرى status=published فقط؛ المدير وحده يرى المسودات. تبقى القوالب ومجموعات البيانات والمتغيرات وكلمة التوليد خاصة بالمدير، حتى مع تغيير select أو depth. عمليات الإنشاء والتعديل والحذف للمدير فقط. أُصلحت أيضاً نقطة توليد pSEO التي كانت تتحقق من تسجيل الدخول فقط: أصبحت تشترط دور المدير قبل أي قراءة أو كتابة. لا يضيف هذا الإصلاح حقول قاعدة بيانات أو يحتاج ترحيلاً جديداً بحد ذاته.

لا يحتاج بناء الموقع إلى رمز سري: يطلب الحقول العامة اللازمة فقط، مع status=published وpagination ثابتة. محمّل Astro يرفض المسودة أو السجل الناقص، ويصدر عند المنع رسالة تتضمن HTTP 403 وسبب الصلاحية ورفض fallback. لا تُستبدل بيانات الإنتاج بلقطة اختبار أو بيانات محلية.

### نتائج التحقق الحالي

| الفحص | النتيجة |
| --- | --- |
| المقالات المنشورة الحالية، بقراءة جميع صفحات API | 39 |
| سجلات الأدوات المنشورة والمفعلة | 70؛ تقابل 68 صفحة فعلية وتحويلين قديمين |
| صفحات CMS الإضافية المنشورة | 0 من استجابة ناجحة، وليس استنتاجاً من خطأ |
| صفحات pSEO المنشورة في الإنتاج | العدد غير معلوم؛ API يعيد 403 |
| أسئلة FAQ المنفصلة المستعادة | 56 سؤالاً وجواباً في 12 مقالاً |
| الصور الرئيسية الحالية | 39 من 39 أعادت 200 |
| بناء Astro المباشر من CMS الحقيقي | توقف بـexit code 1 عند pseo-pages؛ لم يكتمل |
| بناء CMS | نجح مع قاعدة وهمية محلية غير متاحة ودون schema push أو migrations |
| الاختبارات | 78 في CMS، و69 SEO ومحمّل محتوى، و12 حفظ محتوى، و5 اشتراكات؛ 164 ناجحة |
| فحص الأنواع | نجح في المستودعين |

لا يجوز احتساب 39 مقالاً و68 أداة على أنهما مخرجات بناء الإنتاج الكامل الحالي؛ هما عدد المحتوى المرجعي المقروء. محاولة البناء الحالي محفوظة في F:/cloud/.content-audit/direct-cms-SNZweA وتوقفت قبل توليد صفحات المقالات والأدوات. أدلة البناء التشخيصي السابق مؤرخة 15 أكتوبر وتبقى منفصلة عن هذه المحاولة.

تم التحقق من **3 صفحات pSEO اختبارية منشورة فقط** في مساحة معزولة: صفحة ذات Canonical ذاتي، وصفحة noindex مستبعدة من XML، وصفحة ذات Canonical تحريري مختلف مستبعدة من XML. المسودة الاختبارية لا تُولد. نجحت مقارنة HTML وSitemap وCanonical وبصمات المحتوى ومخرجات Vercel للصفحات المطلوبة في الاختبار، ولم تُستبدل مخرجات المشروع. فُحصت 170 صفحة اختبارية: صفر روابط داخلية معطلة وصفر صفحات بلا روابط واردة، ونجحت فحوص metadata والتواريخ وJSON-LD. هذا لا يثبت عدد صفحات pSEO في الإنتاج أو اكتمالها.

### بوابة الإصدار

أصبحت البوابة تعيد جلب articles وtools وpages وpseo-pages، وتتحقق من IDs وslugs والنص وSEO وCanonical وSitemap والصور والملفات المنشورة. غياب استجابة pSEO أو غياب سجلها المرجعي المُراجع يوقف الإصدار؛ لم يُسجل العدد صفراً. أزيل الاستثناء التشخيصي القديم الذي كان يستطيع تمثيل pSEO المحظور كمجموعة فارغة داخل وسيط المراجعة. شُغّل أمر content:preflight الحقيقي وأعاد exit code 1 مع رسالة CONTENT PREFLIGHT BLOCKED: pseo-pages: public CMS HTTP 403.

### الأمان وقرار النشر

**المشروع غير جاهز للنشر.** تطبيق سياسة القراءة في خادم CMS يتطلب إصداراً موافقاً عليه؛ لا يمكن لتعديل ملفات الجهاز المحلي تغيير صلاحيات الخادم. لم يُنفذ Push أو Merge أو Deploy أو تغيير DNS أو Hostinger أو تعديل محتوى الإنتاج أو ترحيل قاعدة بيانات. بقيت كل الإصلاحات السابقة على codex/seo-cms-sync.

المرحلة الأمنية مؤجلة لأن شرطها، نجاح البناء الوظيفي المباشر، لم يتحقق. لم تتغير الاعتماديات في هذه الجولة. آخر تدقيق موثق بتاريخ 15 أكتوبر سجل 6 نتائج: حرجة واحدة، و4 عالية، ومنخفضة واحدة؛ هذا ليس تدقيقاً جديداً بتاريخ 16 أكتوبر. بوابة الأمان ما زالت مانعة للإصدار. بعد فك عائق القراءة والتحقق من كل صفحات pSEO الحقيقية: يُعاد التدقيق، وتُقيّم ترقية Astro والمحوّل وsharp في عمل منفصل، ثم تعاد اختبارات المحتوى وواجهات API والبناء والمعاينات والأداء قبل أي قرار نشر.

[الأدلة المنظمة لهذا التحديث](seo/pseo-access-evidence-20261016.json).
