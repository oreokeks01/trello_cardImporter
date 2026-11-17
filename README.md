# Trello Study Cards – Dummy Power-Up

Ein Minimal-Prototyp für Bulk-Import von Lernkarten in eine Trello-Liste.

## Funktionen

- Board-Button „Lernkarten importieren“
- CSV per Copy/Paste
- Vorschau
- Zielliste auswählen
- einfache Duplikaterkennung
- Bulk-Erstellung von Trello-Karten
- Fach und Schwierigkeit werden in die Beschreibung geschrieben

## Wichtig

Das Projekt ist ein Demo/MVP, kein fertiges Marketplace-Produkt.

Der CSV-Parser ist absichtlich einfach und behandelt Kommas innerhalb von Feldern nicht korrekt.
Für Produktion sollte ein robuster CSV-Parser verwendet werden.

Die Beispiel-Icon-URL kann je nach Trello-Umgebung ersetzt werden.

## Dummy-Daten

```csv
front,back,fach,schwierigkeit
Was ist Photosynthese?,Umwandlung von Lichtenergie in chemische Energie,Biologie,mittel
Was ist ATP?,Energieträger der Zelle,Biologie,leicht
Was bedeutet Osmose?,Diffusion von Wasser durch eine semipermeable Membran,Biologie,schwer
```

## Integration

Siehe die Anleitung in der ChatGPT-Antwort bzw. die aktuelle Trello-Dokumentation.
