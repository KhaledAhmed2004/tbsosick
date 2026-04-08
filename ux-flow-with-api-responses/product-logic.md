# TBSOSick — Product Logic & Overview (Ki eta? Ebong keno?)

> **Uddeshya**: Ei document-e TBSOSick platform-er core logic, business value, ebong features "ki" (What) ebong "keno" (Why) ta clear kora hoyeche. Eta `user-journey.md`-er technical flow-er pashe ekta logical layer hisebe kaj korbe.

---

## 🌟 Project Vision
TBSOSick hocche surgical professionals (bishesh kore students ebong doctors) der jonno ekta specialized platform. Er main goal hocche **Surgical Preference Cards**-ke digital kora ebong workflow aro efficient kora.

---

## 🛠️ Ki eta? (The "What")

TBSOSick ekta dual-platform system:
1.  **Student/Doctor Mobile App**: User-der jonno application jekhane preference cards banano, search kora, ebong manage kora jay.
2.  **Admin Dashboard**: Super Admin-er jonno ekta portal jekhane platform-er analytics ebong user (doctor) verification handle kora hoy.

### Core Jinishpati & Features

#### 1. Preference Cards (System-er pran)
*   **Ki eta**: Digital documents jekhane ekta specific surgical procedure-er shob details thake (Surgeon preference, instruments, sutures, workflow, etc.).
*   **Main Data**: Surgeon Info, Medication, Supplies, Sutures, Instruments, Positioning, Prepping, Workflow, Notes, ebong Photo Library.
*   **Visibility**: 
    *   **Public**: Shobar jonno khola (Library-te thake).
    *   **Private**: Sudhu creator-i dekhte parbe.

#### 2. Digital Library
*   **Ki eta**: Ekta searchable repository jekhane user-ra verified preference cards khuje pay.
*   **Logic**: Specialty-wise filtering ebong verification status (VERIFIED vs UNVERIFIED) check korar system.

#### 3. Surgical Calendar
*   **Ki eta**: User-er upcoming surgery ba case gulo track korar tool.
*   **Logic**: Event create korle system auto-reminders (24h ebong 1h age) set kore dey jate workflow smooth thake.

#### 4. Subscription Model
*   **Ki eta**: Taka-poyshar model.
*   **Plans**: 
    *   **FREE**: Basic access.
    *   **PREMIUM**: Advanced features (e.g., unlimited cards, advanced analytics, etc.).

#### 5. Admin Analytics
*   **Ki eta**: Platform kemon cholche ta track korar dashboard.
*   **Logic**: Monthly trend charts (Preference Cards growth, Active Subscriptions) ebong Growth Metrics (YoY comparison).

---

## 🎯 Keno eta dorkar? (The "Why")

### 1. "Physical Card"-er somoshya somadhan
*   **Problem**: Age preference cards paper-e thakto, ja hariye jete parto ba update kora khub kothin chilo.
*   **Solution**: Digital cards thakar karone user-ra jekono jayga theke instant access pay ebong khub shohoje update korte pare.

### 2. Surgical Workflow Standardize kora
*   **Problem**: Prottek surgeon-er preference alada hoy. Naya staff ba students-der jonno eta mone rakha khub chap-er kaj.
*   **Solution**: Platform-ti ekta centralized "Single Source of Truth" provide kore, jate bhul-er chance kome ebong patient safety bare.

### 3. Students-der jonno Knowledge Sharing
*   **Problem**: Surgical students-der senior surgeons-der techniques shikhte hoy.
*   **Solution**: Public library-r maddhome students-ra verified cards dekhe procedure-er preparation nite pare.

### 4. Automated Reminders & Planning
*   **Problem**: Surgery-r preparation miss hoye jete pare busy schedule-er karone.
*   **Solution**: Calendar integration ebong auto-reminders user-ke thik thak preparation nite help kore (e.g., "Shob preference cards ready koro" type reminder).

### 5. Data-diye Management (Admin View)
*   **Problem**: Platform koto-ta kaj korche ta manually track kora impossible.
*   **Solution**: Admin dashboard growth metrics provide kore, jate system usage ebong subscription trends dekhe bhalo decision neya jay.

---

## 📈 Business Logic Summary

| Feature | Business Value (Keno?) |
| :--- | :--- |
| **Verification Status** | Data-r quality thik rakha; "VERIFIED" cards user-der moddhe trust build kore. |
| **Download Tracking** | Kono card koto-ta popular ta track kora (Content analytics). |
| **Favorite System** | User-ke dhore rakha; bar bar dorkari card-gulo quick access kora. |
| **Token Rotation** | High-level security; user session secure rakha ebong unauthorized access bondho kora. |
| **Growth Metrics** | System koto-ta boro hocche ta track kora (Doctors vs Cards vs Revenue). |

---

## 🚀 Future Roadmap (Idea-gulo)
*   **AI-Suggested Supplies**: Procedure-er nam likhle system nijei supplies suggest korbe.
*   **Team Collaboration**: Specific hospital team-er moddhe shared private cards.
*   **Advanced Image Markup**: Surgery-r chobi-r upor mark korar system.
