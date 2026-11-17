# Trello Bulk Importer V3

Ein statisches Trello Power-Up für GitHub Pages. Es bietet eine sichtbare Startseite, CSV-Dateiupload, Vorschau, Ziel-Listen-Auswahl, Duplikatprüfung und Import via Trello REST API.

## Installation

1. Erzeuge im Trello Power-Up Admin Portal (https://trello.com/apps/admin) einen **Trello API Key** für dein Power-Up.
2. Öffne `config.js` und ersetze `HIER_DEIN_TRELLO_API_KEY` durch diesen API Key. Ein API Key darf öffentlich sein; **niemals einen User Token veröffentlichen**.
3. Lade **alle** Dateien dieses Ordners direkt in die Wurzel des GitHub-Repositories `trello_cardImporter` hoch (alte `index.html` und `importer.html` ersetzen).
4. Aktiviere GitHub Pages mit `main` und `/(root)`.
5. Connector URL im Trello Power-Up Admin Portal: `https://oreokeks01.github.io/trello_cardImporter/index.html`
6. Aktiviere `board-buttons` und installiere das Power-Up in deinem Board.
7. Klicke im Board auf **🧠 CSV importieren**, verbinde Trello per Klick, wähle CSV-Datei und Zielliste und importiere.

## CSV-Format

Erste Zeile muss eine Kopfzeile enthalten. Erforderlich: `Vorderseite,Rückseite` (alternativ `Frage,Antwort`). Optional: `Fach,Schwierigkeit`.

Beispiel:

```csv
Vorderseite,Rückseite,Fach,Schwierigkeit
Was ist JavaScript?,Eine Programmiersprache,JavaScript,Grundlagen
"Was ist eine Funktion, kurz erklärt?","Ein wiederverwendbarer Codeblock",JavaScript,Grundlagen
```

Komma und Semikolon werden unterstützt. CSV mit UTF-8 speichern. Maximal 5 MB / 2000 Karten pro Datei.

## Wichtige Hinweise

- Die öffentliche Startseite ist absichtlich sichtbar. Die eigentliche Trello-Verbindung funktioniert nur im Power-Up-Kontext.
- Browser können den Trello-Autorisierungsdialog blockieren. Die Autorisierung wird ausschließlich durch einen echten Klick ausgelöst.
- GitHub Pages ist statisch; es gibt keinen Server. Trello-User-Tokens werden nicht in Dateien gespeichert.
- Trello-API-Limits können große Importe verlangsamen oder abbrechen. Fehler werden gezählt.
- Die Dateien sind für einen praktischen Test vorbereitet, aber noch nicht mit deinem echten Trello-Board end-to-end getestet.
