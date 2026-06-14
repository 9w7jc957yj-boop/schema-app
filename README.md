# Schemaläggning – prototyp

En webbapp-prototyp för schemaläggning, byggd i **React + TypeScript** med
**Vite**. Designen följer Apples *Human Interface Guidelines* (Cupertino/iOS):
rena ytor, mjuka skuggor, rundade hörn, SF-liknande typografi och iOS
systemfärger. All data är mockad och sparas lokalt i `localStorage`.

Vyn är byggd för en **schemaläggare / platsansvarig** som lägger ut pass på
medarbetare under en vecka.

## Kör projektet

Kräver [Node.js](https://nodejs.org/) 18+ (testat med en nyare version) och npm.

```bash
npm install      # installera beroenden
npm run dev      # starta utvecklingsserver (Vite skriver ut en URL, t.ex. http://localhost:5173)
```

Övriga kommandon:

```bash
npm run build    # typecheck + produktionsbygge till dist/
npm run preview  # förhandsvisa produktionsbygget lokalt
```

## Så används appen

- **Växla mellan Grundschema och Liveschema:** segmentväxeln i toppmenyn (mer
  nedan).
- **Lägg ut ett pass:** dra en passmall från paletten överst och släpp den i en
  cell (medarbetare × dag).
- **Flytta ett pass:** dra ett redan utlagt pass till en annan cell.
- **Ta bort ett pass:** håll muspekaren över passet och klicka på ✕, eller
  högerklicka på passet.
- Båda schemana sparas automatiskt i `localStorage`. Töm webbläsarens lagring för
  att återställa till seed-datan.

## Personalschema och brukarschema

Längst upp finns en växel **👤 Personal / 🏠 Brukare** som byter mellan två
scheman:

- **Personalschema** – medarbetare som rader × dagar, med pass i celler och
  timtotaler. Här finns Grundschema/Liveschema, Vecka/Månad, Fyll ut, avvikelser
  och drag & släpp (se nedan).
- **Brukarschema** – de **8 brukarnas** vecka: en matris av brukare × dagar där
  varje cell visar tidsatta **aktiviteter och dagliga insatser** (med
  kategori-ikon, ansvarig personal och plats). Vänster kolumn visar brukarens
  enhet och intressen. Antal insatser summeras per dag och per brukare.

### Lägga in aktiviteter och insatser (brukarschemat)

- **Klicka i en cell** → en dialog öppnas där du fyller i vad som ska göras, tid,
  kategori (inköp, aktivitet, utflykt, omvårdnad, medicin, måltid, städ, övrigt),
  ansvarig personal, plats och anteckning.
- Kryssa **"Daglig insats – upprepa måndag–söndag"** för återkommande insatser
  (t.ex. medicin varje morgon).
- **Klicka på ett chip** för att redigera, eller **✕** för att ta bort.
- Insatserna sparas i `localStorage` (seedas med exempeldata första gången).

### Dagens insatser (dagdrawer)

I **personalschemats liveläge** är varje dagrubrik klickbar. Ett klick öppnar en
**drawer från höger** som beskriver dagens arbete kring brukarna:

- en sammanfattning (antal brukare, insatser, klara),
- **vem som jobbar** den dagen (personal på pass, med pass-tider),
- ett **kort per brukare** med tidsatta insatser, ansvarig personal och plats, och
- en **bock** för att markera en insats som klar.

Dagrubrikerna är inte klickbara i grundschemaläget.

## Grundschema vs Liveschema

Appen har två scheman som man växlar mellan via segmentväxeln i toppmenyn:

- **Grundschema** – grundbemanningen, grunden för bemanningsplaneringen (läggs
  vanligtvis per månad). Detta är mallen.
- **Liveschema** – den aktiva veckan som justeras löpande när något ändras, t.ex.
  vid sjukdom.

Liveschemat **ärver grundbemanningen** första gången det skapas och kan därefter
redigeras helt självständigt – ändringar i det ena påverkar inte det andra
(separata `localStorage`-nycklar). I liveläget visas:

- en **avvikelse-räknare** i sidhuvudet (antal celler som skiljer sig från
  grundschemat),
- ett **orange accentstreck** på varje cell som avviker, och
- knappen **Återställ till grund** som kopierar tillbaka grundschemat till
  liveschemat (med bekräftelse).

### Fyll ut grundschemat automatiskt

Knappen **✨ Fyll ut** (syns i grundschemaläget) genererar ett *förslag* på pass
för alla medarbetare utifrån deras **bemanningsgrad**. Varje medarbetare får ett
veckomönster som fyller upp mot de avtalade timmarna (40 h/vecka vid 100 %), med:

- roterande dagpass för variation och staplade starter så att medarbetarna sprids
  över veckodagarna,
- nattpass för personal på nattenheten, och
- ett kortare pass som toppar upp sista dagen så totalen hamnar nära avtalet.

Mönstret upprepas över hela den visade perioden (vecka eller månad) och **ersätter
befintliga pass i perioden** (med bekräftelse). Resultatet är ett utgångsläge som
sedan kan finjusteras manuellt med drag och släpp.

### Vecka eller månad i grundschemat

I grundschemaläget finns en **Vecka / Månad-växel** i toppmenyn. Eftersom
grundschemat planeras per månad visas det som standard i **månadsvy** – en kolumn
per dag i månaden, med en linje vid varje måndag som avgränsar veckorna.
Totalkolumnen byter då till **Månad / Avtal** och de avtalade timmarna skalas
efter periodens längd (40 h/vecka). Liveschemat visas alltid per vecka.

## Funktioner i detta steg

- **Växling Personal ⇄ Brukare** (personalschema respektive brukarschema).
- **Brukarschema** med aktiviteter/dagliga insatser som kan läggas till, redigeras
  och tas bort (sparas i `localStorage`).
- **Växling Grundschema ⇄ Liveschema** med separat data och avvikelsemarkering.
- **Automatisk ifyllning** av grundschemat utifrån bemanningsgrad (✨ Fyll ut).
- **Vecka/Månad-vy för grundschemat** med skalad avtalsjämförelse.
- Matris med medarbetare × dagar. Lör/sön markeras med svag röd ton.
- Vänster fast kolumn med medarbetare (namn + enhet/grad).
- Celler kan innehålla flera staplade pass. Nattpass som korsar midnatt visas
  tvådelat.
- **Totalrad** längst ned summerar timmar per dag samt periodens total.
- Per medarbetare visas **period vs avtalade timmar** (t.ex. `35:00 / 30:00`)
  med färgmarkering för över/under.
- Toppmeny med *Filter · [Grundschema | Liveschema] · [Vecka | Månad] · ✨ Fyll ut
  · Återställ till grund · Skapa ny · Ta bort · Ändra namn · Rulla ut*. Filter,
  Skapa ny, Ta bort, Ändra namn och Rulla ut är visuella stubbar i detta steg.

> **Senare steg:** filterlogik och "rulla ut"-funktionen. Knapparna finns redan
> men saknar funktion.

## Projektstruktur

```
src/
  types/        Domänmodell (Employee, ShiftTemplate, ScheduledShift, Schedule)
  data/         Mockad seed-data (medarbetare, passmallar, schema, brukare, insatser)
  utils/        Tidsberäkningar, vecka, färgkontrast, drag-and-drop, avvikelser,
                autofyll, localStorage
  components/
    SchedulePage     Toppvy som äger alla scheman, läge och vald vy
    -- Personalschema --
    Toolbar          Toppmeny med Personal/Brukare- och Grundschema/Liveschema-växlar
    ShiftPalette     Drag-källa med alla passmallar
    ScheduleGrid     Matrisen (tabell) + aggregering av summor
    EmployeeRow      En rad: medarbetare + dagceller + veckototal
    ShiftCell        En cell (drop-mål) som kan stapla pass
    ShiftBlock       En färgad pass-ruta (palett- och cell-variant)
    TotalsRow        Nedersta raden med kolumnsummor
    DayDrawer        Dagdrawer: dagens insatser per brukare (liveläget)
    -- Brukarschema --
    BrukareSchedule  Matris av brukare × dagar med aktiviteter/insatser
    ActivityDialog   Dialog för att lägga till/redigera en insats
```

## Datamodell

| Typ              | Beskrivning                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `Employee`       | Medarbetare med enhet, anställningsgrad (%) och avtalade timmar/vecka.    |
| `ShiftTemplate`  | Passmall med tid, färg och flagga för midnattspassering.                  |
| `ScheduledShift` | Ett konkret utlagt pass (medarbetare + datum + passmall).                |
| `Schedule`       | Ett namngivet schema som samlar alla utlagda pass.                       |
| `Brukare`        | En boende/brukare som personalen ger stöd.                              |
| `DayActivity`    | En tidsatt insats för en brukare en viss dag (med ansvarig medarbetare). |

Passlängd beräknas från start/slut och hanterar passering över midnatt.
**100 % anställning = 40 h/vecka.**
