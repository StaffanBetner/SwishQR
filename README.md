# Swish QR-generator

En enkel, snabb och ren webbapplikation för att generera färdiga och scanningsbara Swish QR-koder för direktbetalning.

**Live Demo:** [https://staffanbetner.github.io/SwishQR/](https://staffanbetner.github.io/SwishQR/)

---

## Funktioner

- **Officiell Swish-standard:** Skapar QR-koder med Swish payload-format (`C<mottagare>;<belopp>;<meddelande>;<låsflagga>`).
- **Stöd för privat & företag:** Validerar och formaterar automatiskt både vanliga mobilnummer (`07x...`) och företags-/föreningsnummer (`123...`).
- **Valbart eller låst belopp:** Möjlighet att låsa beloppet så att betalaren inte kan ändra det i Swish-appen.
- **Valbart eller låst meddelande:** Skriv in valfritt referensmeddelande (upp till 50 tecken) och lås det vid behov.
- **Sparade mottagare i webbläsaren:** Spara dina vanligaste mottagare i minnet (`localStorage`) för snabb åtkomst utan registrering eller konton.
- **Spara & Dela:**
  - Ladda ner som skarp, högupplöst PNG-bild med Swish-logotyp.
  - Kopiera QR-bilden direkt till urklipp.
  - Testa direkt i Swish via mobilens app-länk.
- **Integritetsvänlig:** 100% klientsidig applikation – inga externa databaser, cookies eller spårning.

---

## Kom igång lokalt

1. Klona repot:
   ```bash
   git clone https://github.com/staffanbetner/SwishQR.git
   cd SwishQR
   ```

2. Installera beroenden:
   ```bash
   npm install
   ```

3. Starta utvecklingsservern:
   ```bash
   npm run dev
   ```

4. Bygg för produktion:
   ```bash
   npm run build
   ```
   Byggfilerna genereras i mappen `dist/`.

---

## Publicera på GitHub Pages

Projektet är förberett för GitHub Pages med relativa länkar (`base: './'`).

### Alternativ 1: GitHub Pages via Actions (Rekommenderat)
1. Gå till ditt repo på GitHub: **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, välj **GitHub Actions**.
3. Lägg till filen `.github/workflows/deploy.yml` med följande innehåll:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Alternativ 2: Manuell driftsättning
Bygg projektet och publicera `dist/`-mappen till branschen `gh-pages`:
```bash
npm run build
npx gh-pages -d dist
```

---

## Licens
MIT
