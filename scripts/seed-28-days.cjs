/*
 Seed 28 days of start/end survey data for two users by displayName.
 Usage:
   1) Create a Firebase service account key JSON and set:
        export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/service-account.json
   2) Run:
        node scripts/seed-28-days.js "Mateo Zobel" "Katlin Zobel"
*/

const admin = require('firebase-admin');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set to a service account JSON.');
  process.exit(1);
}

try {
  admin.initializeApp({});
} catch {}

const db = admin.firestore();

function ymd(d) {
  return d.toISOString().split('T')[0];
}

async function getUser(input) {
  let snap;
  if (input.includes('@')) {
    snap = await db.collection('users').where('email', '==', input).limit(1).get();
  } else {
    snap = await db.collection('users').where('displayName', '==', input).limit(1).get();
  }
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, uid: doc.get('uid') || doc.id, data: doc.data() };
}

async function seedUser(uid, displayName, withSkips = false, userAgencyId = null) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 27);

  // Choose 3 skip indices for withSkips
  const skipIdx = new Set();
  if (withSkips) {
    while (skipIdx.size < 3) {
      skipIdx.add(Math.floor(Math.random() * 28));
    }
  }

  const batch = db.batch();
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = ymd(d);

    const doSkip = skipIdx.has(i);

    // surveyCompletions: 1 doc per day per user
    const compRef = db.collection('surveyCompletions').doc(`${uid}_${dateStr}`);
    batch.set(compRef, {
      userId: uid,
      date: dateStr,
      start: !doSkip,
      end: !doSkip,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // surveys: create docs for start/end if not skipped (matches app collection)
    if (!doSkip) {
      const startRef = db.collection('surveys').doc();
      batch.set(startRef, {
        userId: uid,
        displayName,
        surveyType: 'start',
        date: dateStr,
        completedAt: admin.firestore.Timestamp.fromDate(d),
        agencyId: userAgencyId,
        userRole: 'user',
        responses: { mood: ['great','okay','tired','stressed','overwhelmed'][Math.floor(Math.random()*5)] },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const endRef = db.collection('surveys').doc();
      batch.set(endRef, {
        userId: uid,
        displayName,
        surveyType: 'end',
        date: dateStr,
        completedAt: admin.firestore.Timestamp.fromDate(d),
        agencyId: userAgencyId,
        userRole: 'user',
        responses: { mood: ['great','okay','tired','stressed','overwhelmed'][Math.floor(Math.random()*5)] },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  await batch.commit();
}

(async () => {
  const [firstUser = 'Mateo Zobel', secondUser = 'Katlin Zobel'] = process.argv.slice(2);
  const u1 = await getUser(firstUser);
  const u2 = await getUser(secondUser);

  if (!u1 || !u2) {
    console.error('Could not find one or both users. Ensure documents exist in collection "users" with matching displayName or email.');
    process.exit(1);
  }

  console.log('Seeding 28 days for:', firstUser, u1.uid, 'and', secondUser, u2.uid);
  await seedUser(u1.uid, u1.data.displayName || firstUser, false, u1.data.agencyId || null);
  await seedUser(u2.uid, u2.data.displayName || secondUser, true, u2.data.agencyId || null);
  console.log('Done.');
})();


