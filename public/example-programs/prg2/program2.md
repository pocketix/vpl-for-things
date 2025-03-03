# Příklad 2 - Retenční nádrže

## Zadání

Představte si, že vlastníte 2 retenční nádrže na vodu. Vytvořtě program, který definuje logiku nádrže tak, že pokud *číselná* procentuální hodnota naplnění nádrže přesáhne **80%**, tak se voda začne přečerpávat do jiné nádrže, aby nedošlo k přetečení. Aktuální procentuální *číselná* hodnota naplnění nádrže je dostupná v atributu zařízení `DistanceSensor-1.waterLevel`. Zapnutí či vypnutí čerpadla lze docílit pomocí příkazu zařízení `LT22222-Relay-1.setRelay()`.

Pozn.: Je třeba ošetřit opakované zapínání a vypínání čerpadla. Toho lze docílit kontrolou stavu spínače čerpadla. Stav čerpadla je dostupný v atributu `LT22222-Relay-1.relayState`. Pokud atribut `relayState` obsahuje řetězcovou hodnotu **"opened"**, čerpadlo je spuštěno a přečerpává vodu. Hodnota **"closed"** znamená, že je čerpadlo vypnuto.

## Zařízení

- DistanceSensor-1
- LT22222-Relay-1
