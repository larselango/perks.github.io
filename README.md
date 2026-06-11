# perks

Uavhengig oversikt over norske medlemsfordeler. Mobil-først, bygget med React + Vite,
hostet gratis på GitHub Pages med eget domene via Cloudflare.

## Kom i gang (for utvikling på egen maskin – valgfritt) 

```bash
npm install     # last ned avhengigheter (én gang)
npm run dev      # start lokal forhåndsvisning
npm run build    # bygg ferdig side til dist/
```

Du trenger ikke gjøre dette for å publisere – GitHub bygger siden automatisk når du
laster opp endringer (se `.github/workflows/deploy.yml`).

## Hvor ting bor

| Vil du endre …            | Rediger fila      |
|---------------------------|-------------------|
| Tilbud, merchants, katalog| `src/content.js`  |
| Aktuelt-stripa, meny, guider | `src/content.js` |
| Farger og fonter          | `src/theme.js`    |
| Ikon-regler (avansert)    | `src/icons.js`    |
| Selve appen (sjelden)     | `src/Perks.jsx`   |

## Dokumentasjon

- **VEILEDNING.md** – steg-for-steg fra null til publisert side (lese først).
- **REDIGERE-INNHOLD.md** – hvordan legge til tilbud og endre forsiden.

## Lisens / innhold

Innholdet i katalogen er kuratert manuelt. Rabatter og vilkår kan endres – sjekk alltid
hos tilbyderen.
