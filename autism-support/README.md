# Neuplay Autism Support

A local full-stack school-project prototype with a doctor workspace, patient page, four demo activities, clinician-reviewed suggestions, and a server-enforced session limit. It is not a diagnostic or treatment product. Use fictional data only.

## Requirements
- Node.js 20 or later
- VS Code

## Run on Windows
Open this folder in VS Code. Open Terminal > New Terminal and run:

```powershell
npm install
npm run dev
```

Open the Vite address printed in the terminal (usually http://localhost:5173). The Express API runs at http://localhost:3001. The first run creates `server/data.json` with fictional demo records.

## Demo accounts
- Doctor: `doctor@neuplay.demo` / `doctor123`
- Patient: `patient@neuplay.demo` / `patient123`

The doctor dashboard has a Quick timer demo toggle. When enabled, assignments end after one minute so you can demonstrate the enforced timeout. The patient cannot change this setting. Turn it off to use the clinician-assigned duration.

## Features
- One doctor login and unified workspace for patient records, suggestions, assignment, and session history.
- Local demo suggestion engine; the doctor reviews and assigns every activity.
- Communication Choices, Story Builder, Daily Steps, and Feelings Explorer activities.
- Patient activity records and server-side elapsed-time validation.
- Colourful Neuplay-inspired responsive interface.

## Notes
This starter stores demo passwords in the local JSON seed file for easy classroom setup and uses a local demo JWT secret. Do not deploy it or enter real patient data. For real deployment, use a secure database, password hashing, managed secrets, HTTPS, privacy and consent review, and clinical validation. The reference site may require access to the same local network; the app itself does not depend on it.

To reset demo records, stop the server and delete `server/data.json`; it will be recreated from the seed on next start.
