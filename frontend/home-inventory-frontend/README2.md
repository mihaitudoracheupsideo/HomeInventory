# HomeInventory Frontend

Acesta este frontend-ul aplicației **HomeInventory**, construit cu **React + Vite + TypeScript + TailwindCSS**.

## Structura proiectului (`src/`)

```
src/
├── components/        ← componente UI reutilizabile
├── pages/             ← pagini complete (ex: BoxesPage, RoomsPage)
├── layouts/           ← layout-uri comune (ex: cu meniu lateral)
├── routes/            ← definirea rutelor
├── services/          ← API calls către backend
├── types/             ← tipuri TypeScript (Box, Room etc)
├── index.css          ← fișier global de stiluri (Tailwind)
├── App.tsx            ← componenta principală a aplicației
└── main.tsx           ← punctul de intrare în aplicație
```

### 📁 `components/`

Aici se află componentele UI reutilizabile, cum ar fi:

- `Button.tsx`
- `Modal.tsx`
- `BoxCard.tsx`

Scopul acestora este de a fi folosite în mai multe pagini pentru a menține consistența vizuală și funcțională.

### 📁 `pages/`

Fiecare fișier din acest director reprezintă o pagină completă. Exemple:

- `BoxesPage.tsx` – listă cu toate cutiile
- `RoomsPage.tsx` – listă cu camerele existente

### 📁 `layouts/`

Conține layout-uri comune, cum ar fi:

- `SidebarLayout.tsx` – layout cu meniu lateral și conținut principal

Aceste layout-uri sunt folosite pentru a menține structura comună a paginilor.

### 📁 `routes/`

Definirea rutelor aplicației React. Aici se configurează ce componentă este afișată pentru fiecare URL.

### 📁 `services/`

Aici sunt centralizate apelurile către API-ul backend. Exemple:

- `boxService.ts`
- `roomService.ts`

Acest layer facilitează izolarea logicii de comunicare HTTP și permite testarea mai ușoară.

### 📁 `types/`

Conține definiții de tipuri TypeScript folosite în toată aplicația. Exemple:

- `Box.ts`
- `Room.ts`

Acestea ajută la asigurarea consistenței și siguranței tipurilor.

### 📄 `index.css`

Importă TailwindCSS și alte stiluri globale ale aplicației.

### 📄 `App.tsx`

Componenta principală a aplicației care definește layout-ul general și include router-ul.

### 📄 `main.tsx`

Punctul de intrare al aplicației React. Montează aplicația în DOM și aplică configurații globale.

## 🛠 Tehnologii folosite

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router DOM](https://reactrouter.com/)
- [ASP.NET Core Backend](../backend/README.md) (legătură către backend)

## 🔧 În lucru

Aceasta este doar o documentație inițială. Secțiuni viitoare pot include:

- Ghid de instalare și rulare
- Convenții de cod
- Testare
- Contribuție

> 📌 Dacă ai sugestii pentru structură sau îmbunătățiri, contribuțiile sunt binevenite!