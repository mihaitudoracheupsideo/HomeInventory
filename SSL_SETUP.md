# 🔐 Configurare HTTPS pentru Home Inventory

## ✅ Ce am configurat:

1. **Certificate SSL generate cu mkcert** (`.ssl/` folder)
   - CA Root: `ca.crt` și `ca.key`
   - Certificate aplicație: `localhost+2.crt`, `localhost+2.key`, `localhost+2.pfx`
   - Valabile pentru: `localhost`, `127.0.0.1`, IP-uri specifice

2. **Vite (Frontend)** configurat pentru HTTPS pe port 5173
3. **Backend (.NET)** configurat pentru HTTPS pe port 5005
4. **CORS** actualizat pentru origini HTTPS
5. **🆕 API_BASE_URL dinamic** - detectează automat hostname-ul (nu mai trebuie actualizat manual!)

---

## 💡 **IMPORTANT: Evită regenerarea certificatelor**

**API_BASE_URL este acum DINAMIC** - folosește automat IP-ul/hostname-ul de pe care accesezi aplicația.

Pentru a evita regenerarea certificatelor la fiecare schimbare de IP:
1. **Generează certificat cu hostname:** Rulează `.\regenerate-ssl.ps1`
2. **Accesează prin hostname, nu IP:** 
   - PC: `https://localhost:5173`
   - Mobil: `https://NUME-PC.local:5173`

✅ Astfel certificatul rămâne valabil indiferent de IP-ul DHCP!

---

## 📱 **INSTALARE CERTIFICAT PE DISPOZITIV MOBIL**

### Pentru Android:

1. **Transferă certificatul CA pe telefon:**
   ```
   Copiază fișierul: .ssl/ca.crt
   ```

2. **Instalează certificatul:**
   - Deschide **Settings** → **Security** → **Encryption & credentials**
   - Apasă pe **Install a certificate** → **CA certificate**
   - Navighează și selectează fișierul `ca.crt`
   - Dă-i un nume (ex: "Home Inventory Dev CA")
   - Confirmă instalarea

3. **Variante de transfer:**
   - Email: Trimite `ca.crt` pe email și deschide-l pe telefon
   - Google Drive / OneDrive / Dropbox
   - USB: Conectează telefonul și copiază fișierul
   - ADB: `adb push .ssl/ca.crt /sdcard/Download/`

### Pentru iOS:

1. **Transferă certificatul:**
   - Email: Atașează `ca.crt` la un email și deschide pe iPhone
   - AirDrop: Trimite direct de pe Mac
   - iCloud Drive

2. **Instalează profilul:**
   - Deschide email-ul / fișierul `ca.crt`
   - Apasă pe **Allow** când apare dialogul
   - Mergi la **Settings** → **General** → **VPN & Device Management**
   - Selectează profilul instalat și apasă **Install**

3. **Activează trust complet:**
   - **Settings** → **General** → **About** → **Certificate Trust Settings**
   - Activează switch-ul pentru certificatul "Home Inventory Dev CA"

---

## 🚀 **PORNIRE APLICAȚII**

### Backend (.NET):
```powershell
cd c:\Projects\HomeInventory\backend\HomeInventory.WebApi
dotnet run
```
- Backend va rula pe: **https://192.168.1.152:5005**
- Și pe: **http://192.168.1.152:5000** (redirect automat la HTTPS)

### Frontend (React/Vite):
```powershell
cd c:\Projects\HomeInventory\frontend\home-inventory-frontend
npm run dev
```
- Frontend va rula pe: **https://192.168.1.152:5173**

---

## 🌐 **ACCESARE DE PE MOBIL**

1. **Asigură-te că telefonul și PC-ul sunt pe aceeași rețea Wi-Fi**
2. **Asigură-te că certificatul CA este instalat pe mobil** (vezi secțiunea de mai sus)
3. **Află numele PC-ului:**
   ```powershell
   # Rulează în PowerShell pe PC
   $env:COMPUTERNAME
   ```
   Notează numele (ex: `DESKTOP-ABC123`)

4. **Accesează aplicația folosind hostname-ul:**
   ```
   https://DESKTOP-ABC123.local:5173
   ```
   (sau prin IP dacă hostname nu funcționează: `https://192.168.0.193:5173`)

5. **Dacă vezi avertismente de securitate:**
   - Înseamnă că certificatul nu este încă instalat corect pe mobil
   - Verifică că ai instalat `ca.crt` (nu `localhost+2.crt`)
   - Reîncearcă pașii de instalare

💡 **TIP:** Hostname-ul `.local` funcționează prin mDNS (Bonjour) - majoritatea telefoanelor îl suportă nativ!

---

## 🔧 **TROUBLESHOOTING**

### Camera nu funcționează:
- ✅ Verifică că accesezi prin **HTTPS** (nu HTTP)
- ✅ Certificatul CA trebuie instalat pe dispozitiv
- ✅ Browserul trebuie să aibă permisiuni pentru cameră

### Erori CORS:
- Backend-ul este configurat pentru:
  - `http://localhost:5173`
  - `https://localhost:5173`
  - `http://192.168.1.152:5173`
  - `https://192.168.1.152:5173`
  - `https://localhost:5005`
  - `https://192.168.1.152:5005`

### Certificate invalide:
- Verifică că ai instalat **ca.crt** (nu localhost+2.crt)
- Pe Android, certificatul trebuie instalat ca **CA certificate**
- Pe iOS, trebuie activat trust-ul în **Certificate Trust Settings**

### IP-ul s-a schimbat:

**NU TREBUIE să regenerezi certificatele dacă folosești HOSTNAME în loc de IP!**

#### 🎯 Soluția recomandată (evită regenerarea):
```powershell
# Rulează scriptul care generează certificat cu hostname
.\regenerate-ssl.ps1
```

Scriptul va crea un certificat care include:
- `localhost` și `127.0.0.1`
- Numele computerului tău (ex: `DESKTOP-ABC`)
- `DESKTOP-ABC.local` (mDNS)
- IP-ul curent (bonus, pentru compatibilitate)

**Apoi accesează prin hostname, NU prin IP:**
- De pe PC: `https://localhost:5173`
- De pe mobil: `https://NUME-PC.local:5173` (înlocuiește NUME-PC cu numele tău)

✅ **Avantaj:** IP-ul poate să se schimbe, certificatul rămâne valid!

#### 📋 Regenerare manuală (doar dacă e necesar):
```powershell
cd c:\Projects\HomeInventory\.ssl
mkcert create-cert --domains localhost 127.0.0.1 [NOUL_IP] --key localhost+2.key --cert localhost+2.crt --validity 825
openssl pkcs12 -export -out localhost+2.pfx -inkey localhost+2.key -in localhost+2.crt -passout pass:dev123
```

**Nu este necesar** să actualizezi `API_BASE_URL` - e deja configurat să detecteze automat hostname-ul curent!

---

## 🔒 **SECURITATE**

⚠️ **IMPORTANT:** Aceste certificate sunt doar pentru dezvoltare locală!

- **NU** le folosi în producție
- **NU** le comite în Git (sunt în `.gitignore`)
- Certificatele au validitate de 825 zile
- Parola PFX: `dev123` (doar pentru dev)

---

## 📦 **ALTERNATIVE LA MKCERT**

### Opțiunea 2: dotnet dev-certs (doar pentru .NET)
```powershell
dotnet dev-certs https --trust
dotnet dev-certs https -ep $env:USERPROFILE\.aspnet\https\cert.pfx -p YourPassword
```
⚠️ Nu funcționează direct cu IP-uri LAN, doar localhost

### Opțiunea 3: OpenSSL (manual, mai complicat)
```bash
# Generare CA
openssl genrsa -out ca.key 2048
openssl req -new -x509 -days 825 -key ca.key -out ca.crt

# Generare certificat server
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 825
```
⚠️ Necesită configurare manuală pentru SAN (Subject Alternative Names)

---

## 📝 **NOTIȚE**

- Certificatele sunt stocate în `.ssl/` folder
- Frontend rulează pe port **5173** (Vite)
- Backend rulează pe port **5005** (HTTPS) și **5000** (HTTP)
- Backend face redirect automat de la HTTP la HTTPS
- **API_BASE_URL este dinamic** - detectează automat hostname/IP-ul curent
- **Folosește hostname pentru a evita regenerarea certificatelor** la schimbare IP
- Script regenerare disponibil: `.\regenerate-ssl.ps1`
