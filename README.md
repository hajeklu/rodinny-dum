# Rodinný dům Hájek · model v09

Interaktivní 3D studie bez garáže. Zachovává dohodnutou stranově převrácenou orientaci, střechu 45°, okapní přesah 1,20 m a štítový 0,80 m. Střešní okna: VELUX FK08 66 × 140 cm, čtyři na jižní a dvě na severní straně.

## Obsah
- `index.html` — otočný 3D model s přepínači matné engoby a lesklé glazury i dvou rozsahů terasy
- `cad/` — OpenSCAD, OBJ a MTL exporty z varianty 09
- `povoleni/` — složka pro stavební povolení; zatím je v ní pouze informace, že podklad nebyl k dispozici
- `.github/workflows/pages.yml` — nasazení GitHub Pages po pushi do větve `main`

Dřevěný obklad z průjezdu přechází na boční fasády a končí tam pravidelnými schody (spodní prkna nejdelší). Rohový sloupek je obložený dřevem jen do výšky HS portálu. Lesklá glazura odráží oblohu po jednotlivých řadách tašek místo plošného pruhu. Dům má nízký tmavý sokl končící pod HS portálem a střecha tenké oplechování štítu a hřebene. Přepínače ve „Variantách fasády“ zapínají antracitové šambrány a špalety oken, antracitovou linii patra ve štítech, svislé lamely na rohovém sloupku a ocelovou pergolu nad terasou; na prázdné stěně u fixu lze zobrazit dřevěné lamely nebo zelenou stěnu. Model zůstává vizualizační studií, ne prováděcí dokumentací ani podkladem pro statické posouzení.

## Zprovoznění Pages
V repozitáři otevři **Settings → Pages** a vyber **GitHub Actions** jako zdroj. Workflow potom nasadí stránku po pushi do `main`.
