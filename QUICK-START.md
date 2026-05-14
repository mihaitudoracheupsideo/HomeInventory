# 🚀 PAȘI RAPIZI - Configurare HTTPS

## ✅ Pe MOBIL: **NIMIC!**
Certificatul CA (ca.crt) rămâne același - nu trebuie să faci nimic pe telefon!

---

## 💻 Pe PC: 4 pași simpli

### **Pasul 0: Configurează firewall-ul (O SINGURĂ DATĂ!)**
**IMPORTANT:** Rulează PowerShell ca Administrator (click-dreapta → Run as Administrator)
```powershell
cd c:\Projects\HomeInventory
.\setup-firewall.ps1
```
✅ Acest pas permite conexiuni externe pe porturile 5000 și 5005
⚠️ **Trebuie făcut doar o dată!**

---

### **Pasul 1: Generează certificatul cu hostname**
```powershell
cd c:\Projects\HomeInventory
.\regenerate-ssl.ps1
```

Notează numele PC-ului afișat (ex: `DESKTOP-ABC123`)

---

### **Pasul 2: Pornește aplicațiile**

**Terminal 1 - Backend:**
```powershell
cd c:\Projects\HomeInventory\backend\HomeInventory.WebApi
dotnet run
```

**Terminal 2 - Frontend:**
```powershell
cd c:\Projects\HomeInventory\frontend\home-inventory-frontend
npm run dev
```

---

### **Pasul 3: Accesează aplicația**

**🖥️ Pe PC:**
Deschide browser: `https://localhost:5173`

**📱 Pe mobil:**
Deschide browser: `https://NUME-PC.local:5173`
(înlocuiește NUME-PC cu numele afișat de script)

**Exemplu:** Dacă PC-ul se numește `DESKTOP-ABC123`:
```
https://desktop-abc123.local:5173
```

---

## 🔧 Troubleshooting

### ❌ "Not secure" pe PC
1. Instalează certificatul CA în Windows:
   - Dublu-click pe `C:\Projects\HomeInventory\.ssl\ca.crt`
   - Click "Install Certificate" → "Current User"
   - "Place all certificates in the following store" → "Trusted Root Certification Authorities"
   - Restart browser

### ❌ Datele nu se încarcă pe mobil (pagina se deschide dar nu apar items)
**Cauze posibile:**

1. **Backend nu rulează** 
   - Verifică că ai terminal deschis cu `dotnet run` care rulează
   - Caută în output mesajul: `Now listening on: https://0.0.0.0:5005`

2. **Firewall blochează conexiuni** ⚠️ **CEA MAI COMUNĂ PROBLEMĂ**
   - Rulează `.\setup-firewall.ps1` ca Administrator
   - Restart backend după configurare

3. **Certificat invalid pentru IP-ul curent**
   - Rulează `.\regenerate-ssl.ps1` pentru a include IP-ul curent
   - Verifică că IP-ul din browser (ex: 192.168.0.193) e același cu cel afișat de script

**Testare rapidă:**
- De pe mobil accesează direct API: `https://192.168.0.193:5005/api/items`
- Dacă vezi eroare de certificat → rulează `.\regenerate-ssl.ps1`
- Dacă vezi timeout/connection refused → firewall sau backend nu rulează
- Dacă vezi JSON cu date → backend funcționează, problema e în frontend

### ❌ Certificate invalide
Scriptul nu a rulat corect. Verifică că ai fișierele:
- `.ssl/localhost+host.key`
- `.ssl/localhost+host.crt`
- `.ssl/localhost+host.pfx`

Dacă lipsesc, rulează din nou `.\regenerate-ssl.ps1`

### ❌ Hostname nu funcționează pe mobil
Unele rețele blochează mDNS. Folosește IP-ul direct:
```
https://192.168.0.193:5173
```
(verifică IP-ul cu `ipconfig` pe PC)

⚠️ **Dacă folosești IP-ul, va trebui să regenerezi certificatul când IP-ul se schimbă!**

---

## 📋 Recap

✅ **Setup inițial (O singură dată):**
1. Rulează `.\setup-firewall.ps1` (ca Administrator) - permite conexiuni externe
2. Instalează certificatul CA în Windows și pe mobil (ca.crt)

✅ **La fiecare pornire:**
1. Pornește backend (`dotnet run`)
2. Pornește frontend (`npm run dev`)

✅ **La schimbare IP (doar dacă folosești IP în loc de hostname):**
1. Rulează `.\regenerate-ssl.ps1`

✅ Configurările sunt deja actualizate pentru `localhost+host.*`
✅ CA-ul (ca.crt) rămâne același - nu trebuie reinstalat
✅ API_BASE_URL e dinamic - detectează automat hostname/IP
✅ Certificatul funcționează pe orice IP dacă accesezi prin hostname

**🎯 TL;DR:**
1. Setup firewall (o dată, ca Admin): `.\setup-firewall.ps1`
2. Generează certificate: `.\regenerate-ssl.ps1`
3. Pornește backend + frontend
4. Accesează: PC = `https://localhost:5173`, Mobil = `https://NUME-PC.local:5173`
