/**
 * Plume seed — populates every table with realistic, demo-able data:
 *   • 1 platform admin (existing) + 2 reviewer admins
 *   • 6 schools (active + pilot)
 *   • 5 parents, 7 children (linked + one suspended)
 *   • A mix of approved, pending and flagged achievements across all categories
 *   • Moderation events so the audit log + p50/p99 review times have data
 *   • One completed teacher co-sign (verified-by line on the public profile)
 *   • A couple of admin → family messages
 *
 * Run with:
 *   node prisma/seed.mjs
 *
 * Safe to re-run — wipes anything tagged with the `@plume.demo` email domain
 * before re-inserting. The seeded `admin@linkedinforkids.local` row is
 * upserted in place (its password is reset to the env value).
 */

import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Plume1234";
const ADMIN_EMAIL    = process.env.ADMIN_SEED_EMAIL    || "admin@linkedinforkids.local";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin123456";

function daysAgo(days, hours = 0) {
  return new Date(Date.now() - (days * 86400_000 + hours * 3_600_000));
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  const demoHash  = await bcrypt.hash(DEMO_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // ---------------------------------------------------------------
  // 1. Reset the demo cohort. Anything ending @plume.demo is fair game.
  //    Deleting the User row cascades to ChildProfile / Achievement /
  //    ParentChild / Session / Message (via FK).
  // ---------------------------------------------------------------
  await prisma.user.deleteMany({ where: { email: { endsWith: "@plume.demo" } } });

  // Wipe demo cosigns + leftover moderation events for any lingering achievements
  await prisma.coSign.deleteMany({ where: { signerEmail: { endsWith: "@plume.demo" } } });

  // ---------------------------------------------------------------
  // 2. Admin config (singleton)
  // ---------------------------------------------------------------
  await prisma.adminConfig.upsert({
    where: { id: "singleton" },
    update: {
      autoApproveParent: true,
      holdChildUploads:  true,
      requireProof:      false,
      csamHashCheck:     true,
    },
    create: { id: "singleton" },
  });

  // ---------------------------------------------------------------
  // 3. Admin team — platform admin + reviewers
  // ---------------------------------------------------------------
  const platformAdmin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      fullName: "Mariam Ahmed",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      reviewerTitle: "Head of Trust",
    },
    create: {
      email: ADMIN_EMAIL,
      fullName: "Mariam Ahmed",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      reviewerTitle: "Head of Trust",
    },
  });

  const james = await prisma.user.create({
    data: {
      email: "james@plume.demo",
      fullName: "James Liu",
      passwordHash: demoHash,
      role: UserRole.ADMIN,
      reviewerTitle: "Senior reviewer",
    },
  });
  const fatima = await prisma.user.create({
    data: {
      email: "fatima@plume.demo",
      fullName: "Fatima Noor",
      passwordHash: demoHash,
      role: UserRole.ADMIN,
      reviewerTitle: "Reviewer",
    },
  });
  const reviewers = [platformAdmin, james, fatima];

  // ---------------------------------------------------------------
  // 4. Schools
  // ---------------------------------------------------------------
  const schoolDefs = [
    { name: "Dubai Modern Academy", city: "Dubai", status: "ACTIVE" },
    { name: "Repton Dubai",         city: "Dubai", status: "ACTIVE" },
    { name: "GEMS Wellington",      city: "Dubai", status: "ACTIVE" },
    { name: "Jumeirah College",     city: "Dubai", status: "ACTIVE" },
    { name: "Kings' Al Barsha",     city: "Dubai", status: "PILOT" },
    { name: "JESS Arabian Ranches", city: "Dubai", status: "PILOT" },
  ];
  const schoolByName = {};
  for (const def of schoolDefs) {
    const s = await prisma.school.upsert({
      where: { name: def.name },
      update: { city: def.city, status: def.status },
      create: { name: def.name, city: def.city, status: def.status },
    });
    schoolByName[def.name] = s.id;
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  async function createParent({ email, fullName, phone }) {
    return prisma.user.create({
      data: { email, fullName, phone: phone ?? null, passwordHash: demoHash, role: UserRole.PARENT },
    });
  }
  async function createChild({ parent, email, fullName, profile, suspended = false, accessApproved = true }) {
    const child = await prisma.user.create({
      data: { email, fullName, passwordHash: demoHash, role: UserRole.CHILD, isSuspended: suspended },
    });
    await prisma.parentChild.create({
      data: { parentId: parent.id, childId: child.id, accessApproved },
    });
    await prisma.childProfile.create({
      data: { childId: child.id, ...profile },
    });
    return child;
  }
  async function createAchievement({ child, title, category, description, isApproved, days, hours = 0, isFlagged = false, proofUrl = null }) {
    return prisma.achievement.create({
      data: {
        childId: child.id,
        title, category, description: description ?? null,
        proofUrl,
        isApproved, isFlagged,
        createdAt: daysAgo(days, hours),
      },
    });
  }
  async function logEvent({ achievement, reviewer, decision, lagMinutes }) {
    const reviewMs = lagMinutes * 60_000;
    await prisma.moderationEvent.create({
      data: {
        achievementId: achievement.id,
        achievementTitle: achievement.title,
        achievementCategory: achievement.category,
        childId: achievement.childId,
        reviewerId: reviewer.id,
        decision,
        reviewMs,
        createdAt: new Date(achievement.createdAt.getTime() + reviewMs),
      },
    });
  }

  // ---------------------------------------------------------------
  // 5. Families + children + profiles
  // ---------------------------------------------------------------

  // --- Khalifa family (the hero family in the prototype) ---
  const noor = await createParent({
    email: "noor@plume.demo",
    fullName: "Noor Khalifa",
    phone: "+971 50 555 0182",
  });
  const amara = await createChild({
    parent: noor,
    email: "amara@plume.demo",
    fullName: "Amara Khalifa",
    profile: {
      age: 11,
      grade: "Grade 6",
      school: "Dubai Modern Academy",
      schoolId: schoolByName["Dubai Modern Academy"],
      bio: "I love painting watercolors of birds and writing little stories about them. One day I want to make a real picture book.",
      funFact: "I can name 42 species of birds from sound alone.",
      skills: ["Watercolor", "Storywriting", "Bird ID"],
      interests: ["Birds", "Books", "Nature walks"],
      location: "Dubai, UAE",
      isPublic: true,
      requireApproval: true,
    },
  });
  const yusuf = await createChild({
    parent: noor,
    email: "yusuf@plume.demo",
    fullName: "Yusuf Khalifa",
    profile: {
      age: 9,
      grade: "Grade 4",
      school: "Repton Dubai",
      schoolId: schoolByName["Repton Dubai"],
      bio: "Football, chess, and Lego. Hoping to play for the U10 first team next year.",
      funFact: "I can solve a Rubik's cube in under a minute.",
      skills: ["Chess", "Football", "Drawing"],
      interests: ["Lego", "Stars", "Reading"],
      location: "Dubai, UAE",
      isPublic: false,
      requireApproval: true,
    },
  });

  // --- Tan family ---
  const hannah = await createParent({
    email: "hannah@plume.demo",
    fullName: "Hannah Tan",
    phone: "+971 55 555 2233",
  });
  const marcus = await createChild({
    parent: hannah,
    email: "marcus@plume.demo",
    fullName: "Marcus Tan",
    profile: {
      age: 13,
      grade: "Grade 8",
      school: "GEMS Wellington",
      schoolId: schoolByName["GEMS Wellington"],
      bio: "Cellist and Scratch coder. I want to combine music and programming someday.",
      funFact: "I composed my first piece at age 9.",
      skills: ["Cello", "Scratch", "Composition"],
      interests: ["Classical music", "Robotics", "Anime"],
      location: "Dubai, UAE",
      isPublic: true,
      requireApproval: true,
    },
  });

  // --- Sayed family ---
  const sayed = await createParent({
    email: "sayed@plume.demo",
    fullName: "Karim Sayed",
    phone: null,
  });
  const layla = await createChild({
    parent: sayed,
    email: "layla@plume.demo",
    fullName: "Layla Sayed",
    profile: {
      age: 12,
      grade: "Grade 7",
      school: "Jumeirah College",
      schoolId: schoolByName["Jumeirah College"],
      bio: "Maths competitions, Python, and dance. Hackathons most weekends.",
      funFact: "I once debugged a bug at 2am — it was a missing semicolon.",
      skills: ["Python", "Scratch", "Maths"],
      interests: ["Astronomy", "Robotics", "Animation"],
      location: "Dubai, UAE",
      isPublic: false,
      requireApproval: true,
    },
  });

  // --- Raj family ---
  const raj = await createParent({
    email: "raj@plume.demo",
    fullName: "Priya Raj",
    phone: null,
  });
  const aarav = await createChild({
    parent: raj,
    email: "aarav@plume.demo",
    fullName: "Aarav Raj",
    profile: {
      age: 10,
      grade: "Grade 5",
      school: "Kings' Al Barsha",
      schoolId: schoolByName["Kings' Al Barsha"],
      bio: "Maths circles and badminton. I love space and animation.",
      funFact: "I can name every planet plus the four Galilean moons.",
      skills: ["Maths", "Badminton", "Animation"],
      interests: ["Space", "Numberphile", "Lego"],
      location: "Dubai, UAE",
      isPublic: false,
      requireApproval: true,
    },
  });

  // --- Mansoor family (with a suspended child to demo the moderation tooling) ---
  const rasha = await createParent({
    email: "rasha@plume.demo",
    fullName: "Rasha Mansoor",
    phone: null,
  });
  const daniel = await createChild({
    parent: rasha,
    email: "daniel@plume.demo",
    fullName: "Daniel Akinwale",
    profile: {
      age: 14,
      grade: "Grade 9",
      school: "JESS Arabian Ranches",
      schoolId: schoolByName["JESS Arabian Ranches"],
      bio: "Football and drumming. Looking to start a school podcast.",
      funFact: "I'm left-footed but ambidextrous on the drum kit.",
      skills: ["Football", "Drums", "Editing"],
      interests: ["FPL", "Films", "Music production"],
      location: "Dubai, UAE",
      isPublic: false,
      requireApproval: true,
    },
    suspended: true,
    accessApproved: false,
  });

  // ---------------------------------------------------------------
  // 6. Achievements
  // ---------------------------------------------------------------
  const achievements = {
    // Amara
    juniorBirdwatcher: await createAchievement({ child: amara, title: "Junior Birdwatcher of the Year", category: "ACADEMICS", description: "Awarded by Emirates Bird Records Committee for documenting 60+ species in a year-long project.", isApproved: true, days: 70 }),
    watercolorExhibit: await createAchievement({ child: amara, title: 'Watercolor exhibit — "Wings of the Wadi"', category: "ARTS", description: "Showed 9 original watercolor pieces at a school-wide art evening.", isApproved: true, days: 110 }),
    shortStory:        await createAchievement({ child: amara, title: "Short story published in school anthology", category: "ACADEMICS", description: '"The Hoopoe Who Forgot Her Song" — selected from 200+ entries.', isApproved: true, days: 170 }),
    birdApp:           await createAchievement({ child: amara, title: "Built a bird-call sound matching app", category: "CODING", description: "First Scratch project — matches recordings to 12 local bird species.", isApproved: false, days: 0, hours: 2, proofUrl: "https://scratch.mit.edu/projects/demo" }),

    // Yusuf
    chessCaptain:      await createAchievement({ child: yusuf, title: "Chess club captain", category: "ACADEMICS", description: "Elected by the club for the spring term.", isApproved: false, days: 1 }),
    footballMatch:     await createAchievement({ child: yusuf, title: "U10 football — best defender", category: "SPORTS", description: "Awarded after the school's spring league.", isApproved: true, days: 40 }),
    mathsBronze:       await createAchievement({ child: yusuf, title: "Maths Olympiad — bronze", category: "ACADEMICS", description: "Top 30% of his grade.", isApproved: true, days: 60 }),

    // Marcus
    concertoRecital:   await createAchievement({ child: marcus, title: "Concerto recital at Madinat Theatre", category: "MUSIC", description: "Played 'Elegy in C minor' to a 200-strong audience.", isApproved: false, days: 1 }),
    scratchProject:    await createAchievement({ child: marcus, title: "First Scratch game — Dune Runner", category: "CODING", description: "Built and shared on the Scratch community.", isApproved: true, days: 20 }),
    abrsmGrade5:       await createAchievement({ child: marcus, title: "ABRSM Cello Grade 5 — Distinction", category: "MUSIC", description: "Sat the exam at GEMS Wellington in February.", isApproved: true, days: 80 }),

    // Layla
    hackathonWin:      await createAchievement({ child: layla, title: "Junior Hackathon — 1st place team", category: "CODING", description: "Built a study buddy app over a weekend.", isApproved: false, days: 0, hours: 5 }),
    pythonCert:        await createAchievement({ child: layla, title: "Python intro certificate", category: "CODING", description: "Completed a 40-hour online course.", isApproved: true, days: 35 }),

    // Aarav
    mathsCircle:       await createAchievement({ child: aarav, title: "Maths circle — top problem solver", category: "ACADEMICS", description: "Highest cumulative score in spring problem-of-the-week.", isApproved: false, days: 2 }),
    badmintonMatch:    await createAchievement({ child: aarav, title: "U11 badminton — runner up", category: "SPORTS", description: "Inter-school spring tournament.", isApproved: true, days: 50 }),

    // Daniel (account suspended — older content remains in the DB for audit)
    footballGoal:      await createAchievement({ child: daniel, title: "First competitive goal", category: "SPORTS", description: "Tap-in from a corner in the U13 league.", isApproved: true, days: 95 }),
    drumsExam:         await createAchievement({ child: daniel, title: "Drum kit Grade 2 — Merit", category: "MUSIC", description: "Trinity exam at the music centre.", isApproved: false, days: 4, isFlagged: true },),
  };

  // ---------------------------------------------------------------
  // 7. Moderation events (audit log + p50/p99 latency)
  // ---------------------------------------------------------------
  // Approvals
  const approved = await prisma.achievement.findMany({ where: { isApproved: true } });
  for (const a of approved) {
    const reviewer = pick(reviewers);
    const lag = 5 + Math.floor(Math.random() * 110); // 5min – ~2h
    await logEvent({ achievement: a, reviewer, decision: "APPROVED", lagMinutes: lag });
  }
  // A rejected event for variety — for an item already gone, we still keep the row.
  await prisma.moderationEvent.create({
    data: {
      achievementId: null, // already cascaded out
      achievementTitle: "Spammy upload — duplicate certificate",
      achievementCategory: "OTHER",
      childId: null,
      reviewerId: james.id,
      decision: "REJECTED",
      reviewMs: 45 * 60_000,
      notes: "Same image hash as a previously rejected upload.",
      createdAt: daysAgo(3, 4),
    },
  });
  // The flagged drum exam → FLAGGED event
  await logEvent({ achievement: achievements.drumsExam, reviewer: james, decision: "FLAGGED", lagMinutes: 25 });

  // ---------------------------------------------------------------
  // 8. Teacher co-sign — completed for Amara's Junior Birdwatcher
  // ---------------------------------------------------------------
  const cosign = await prisma.coSign.create({
    data: {
      achievementId: achievements.juniorBirdwatcher.id,
      requestedBy: noor.id,
      signerEmail: "mrs.pillai@dma.example.com",
      signerName: "Mrs. Pillai",
      signerTitle: "Art teacher",
      note: "I supervised Amara's project — a lovely year-long effort.",
      token: "demo-" + Math.random().toString(36).slice(2, 18),
      expiresAt: daysAgo(-30), // 30 days in the future
      signedAt: daysAgo(12),
      createdAt: daysAgo(15),
    },
  });
  await prisma.moderationEvent.create({
    data: {
      achievementId: achievements.juniorBirdwatcher.id,
      achievementTitle: achievements.juniorBirdwatcher.title,
      achievementCategory: achievements.juniorBirdwatcher.category,
      childId: achievements.juniorBirdwatcher.childId,
      reviewerId: noor.id,
      decision: "COSIGN_REQUESTED",
      // reviewMs intentionally omitted — cosign requests aren't a moderation
      // latency measurement, they're a separate verification flow.
      notes: `Sent to ${cosign.signerEmail}`,
      createdAt: daysAgo(15),
    },
  });
  await prisma.moderationEvent.create({
    data: {
      achievementId: achievements.juniorBirdwatcher.id,
      achievementTitle: achievements.juniorBirdwatcher.title,
      achievementCategory: achievements.juniorBirdwatcher.category,
      childId: achievements.juniorBirdwatcher.childId,
      reviewerId: noor.id,
      decision: "COSIGN_COMPLETED",
      notes: `Signed by ${cosign.signerName} (${cosign.signerTitle})`,
      createdAt: daysAgo(12),
    },
  });

  // ---------------------------------------------------------------
  // 9. Admin → family messages
  // ---------------------------------------------------------------
  await prisma.message.create({
    data: {
      fromUserId: platformAdmin.id,
      toUserId: noor.id,
      subject: "Welcome to Plume",
      body: "Hi Noor — thanks for joining Plume. Reach out anytime if you need help, and let us know what we can do to make the experience better for Amara and Yusuf.",
      createdAt: daysAgo(28),
      readAt:    daysAgo(28, -1),
    },
  });
  await prisma.message.create({
    data: {
      fromUserId: james.id,
      toUserId: hannah.id,
      subject: "About Marcus's recital",
      body: "Lovely upload — we'd love to feature it. If you'd like a teacher co-sign added, send us their email and we'll handle the rest.",
      createdAt: daysAgo(3),
    },
  });
  await prisma.message.create({
    data: {
      fromUserId: fatima.id,
      toUserId: rasha.id,
      subject: "Account on hold",
      body: "Hi Rasha — we've paused Daniel's account while we review the drum exam upload. We'll send a full note within 24 hours.",
      createdAt: daysAgo(4),
    },
  });

  // ---------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------
  const counts = {
    users: await prisma.user.count(),
    schools: await prisma.school.count(),
    achievements: await prisma.achievement.count(),
    moderationEvents: await prisma.moderationEvent.count(),
    messages: await prisma.message.count(),
    cosigns: await prisma.coSign.count(),
  };

  console.log("");
  console.log("Plume seed complete.");
  console.log("");
  console.log("Counts:");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(18)} ${v}`);

  console.log("");
  console.log("Sign-in credentials:");
  console.log("  ADMIN  ·  admin@linkedinforkids.local   ·  Admin123456");
  console.log("  ADMIN  ·  james@plume.demo              ·  Plume1234   (Senior reviewer)");
  console.log("  ADMIN  ·  fatima@plume.demo             ·  Plume1234   (Reviewer)");
  console.log("");
  console.log("  PARENT ·  noor@plume.demo               ·  Plume1234   (Khalifa family — public)");
  console.log("  PARENT ·  hannah@plume.demo             ·  Plume1234   (Tan family)");
  console.log("  PARENT ·  sayed@plume.demo              ·  Plume1234   (Sayed family)");
  console.log("  PARENT ·  raj@plume.demo                ·  Plume1234   (Raj family)");
  console.log("  PARENT ·  rasha@plume.demo              ·  Plume1234   (Mansoor — child suspended)");
  console.log("");
  console.log("  CHILD  ·  amara@plume.demo              ·  Plume1234   (public profile — start here)");
  console.log("  CHILD  ·  yusuf@plume.demo              ·  Plume1234");
  console.log("  CHILD  ·  marcus@plume.demo             ·  Plume1234   (public profile)");
  console.log("  CHILD  ·  layla@plume.demo              ·  Plume1234");
  console.log("  CHILD  ·  aarav@plume.demo              ·  Plume1234");
  console.log("  CHILD  ·  daniel@plume.demo             ·  Plume1234   (SUSPENDED — cannot sign in)");
  console.log("");
  console.log(`Amara's public profile: /p/${amara.id}`);
  console.log("");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
