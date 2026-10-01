# Rodinný dům Hájek · model v09

Interaktivní 3D studie bez garáže. Zachovává dohodnutou stranově převrácenou orientaci, střechu 45°, okapní přesah 1,20 m a štítový 0,80 m. Střešní okna: VELUX FK08 66 × 140 cm, čtyři na jižní a dvě na severní straně.

## Obsah
- `index.html` — otočný 3D model s přepínači matné engoby a lesklé glazury i dvou rozsahů terasy
- `cad/` — OpenSCAD, OBJ a MTL exporty z varianty 09
- `povoleni/` — složka pro stavební povolení; zatím je v ní pouze informace, že podklad nebyl k dispozici
- `dokumentace/` — výkresy DSP: D1.2 půdorys 1NP a D1.3 půdorys 2NP (PDF)
- `.github/workflows/pages.yml` — nasazení GitHub Pages po pushi do větve `main`

Dřevěný obklad z průjezdu přechází na boční fasády a končí tam podle přepínače rovně s antracitovou lištou, střídavě nebo schody. Rohový sloupek je obložený dřevem jen do výšky HS portálu. Lesklá glazura odráží oblohu a slunce po jednotlivých taškách (vypouklý povrch, různé usazení, zaoblené hrany). Dům má nízký tmavý sokl končící pod HS portálem a střecha tenké oplechování štítu a hřebene. Přepínače ve „Variantách fasády“ zapínají antracitové šambrány a špalety oken, antracitovou linii patra ve štítech, svislé lamely na rohovém sloupku a ocelovou pergolu nad terasou; na prázdné stěně u fixu lze zobrazit dřevěné lamely nebo zelenou stěnu. Okapy jsou půlkulaté antracitové žlaby 150 mm se zarolovaným okrajem, okapnicí, háky, čely a kotlíky; na všech čtyřech rozích domu z nich vedou svody. Příjezdovka z tmavých žulových kostek vede podél domu na straně bez terasy a pokračuje průjezdem až po linii terasy. Tlačítko „Interiér přízemí“ skryje střechu a strop a ukáže zařízené přízemí podle D1.2 (obývák, jídelna, kuchyň s ostrůvkem, schodiště s krbem, koupelna, WC, předsíň, komora a technická místnost). Tlačítko „Interiér podkroví“ ukáže podkroví podle D1.3 s úpravou: ložnice v předním štítu rozdělená volně stojící stěnou na spací část a šatnu, bývalá šatna 2.03 jako koupelna k ložnici. Model zůstává vizualizační studií, ne prováděcí dokumentací ani podkladem pro statické posouzení.

## Zprovoznění Pages
V repozitáři otevři **Settings → Pages** a vyber **GitHub Actions** jako zdroj. Workflow potom nasadí stránku po pushi do `main`.
