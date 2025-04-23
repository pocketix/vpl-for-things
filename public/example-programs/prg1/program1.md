# Příklad 1 - Chytrý zvonek

## Zadání

Představte si, že vlastníte chytrý zvonek, který dokáže detekovat pohyb u dveří Vašeho domu/bytu. Vytvořte program, který při detekci pohybu u dveří zašle upozornění v podobě SMS zprávy na Váš mobilní telefon a pořídí fotografii prostoru před dveřmi. Pro zaslání SMS upozornění lze využít příkaz `Send Notification`. Detekce pohybu lze provést za pomocí atributu zařízení `Doorbell-1.motionSensor`. Pokud atribut motionSensor obsahuje řetězcovou hodnotu **"active"**, tak detekoval pohyb. Pokud obsahuje hodnotu **"inactive"**, tak pohyb nebyl detekován. Pořízení fotografie zajišťujě příkaz zařízení Doorbell-1.takePicture().

Pozn.: Při odeslání SMS upozornění se specifikuje telefonní číslo, na které se upozornění odešle. Zkuste si nejdříve vytvořit vlastní proměnnou, která bude obsahovat zmíněné telefonní číslo a tu poté nastavit do funkce `SendNotification`. Pokud byste totiž chtěli upozornění posílat vícekrát, nebo za jiných podmínek, museli byste do příkazu `SendNotification` pokaždé telefonní číslo specifikovat znovu. To stejné platí také pro notifikační zprávu.

## Zařízení

- Doorbell-1
