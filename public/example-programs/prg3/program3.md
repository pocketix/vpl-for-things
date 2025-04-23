# Příklad 3 - Teplota hrnku s kávou

## Zadání

Představte si, že vlastníte chytrý podtácek, který v má v sobě integrovaný senzor teploty, topné těleso, LED a bzučák. Vytvořte program, který bude měnit barvu LED (`LED-1.setLedColor()`) v závislosti na úrovni teploty hrku s kávou. Každá úroveň bude mít svou barvu LED, aby uživatel mohl pohledem na LED lehce teplotu poznat. Úrovně teploty jsou dostupné v atributu zařízení `TemperatureDevice-1.temperatureLevel` a mohou nabývat řetězcových hodnot **"high"**, **"ideal"**, **"low"** a **"critical_low"**. Pokud bude aktuální úroveň teploty hrnku kriticky nízká, tak se **3x** rozezní bzučák (`Buzzer-1.beep()`) a vydá se pokyn k nastavení teploty topného tělesa na ideální teplotu (`TemperatureDevice-1.setTemperature()`).

Pozn.: Při kontrole úrovně teploty zkuste místo několika příkazů `if` použít příkaz `switch`. Pokuste se pomocí vytvoření procedury abstrahovat opakované rozeznění bzučáku. Proceduru pojmenujte například jako `buzzerBeep3x`.

## Zařízení

- TemperatureDevice-1
- LED-1
- Buzzer-1
