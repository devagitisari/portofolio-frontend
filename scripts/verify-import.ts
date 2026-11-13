/**
 * Verifies the data that was imported from the old database.
 *
 * Usage:
 *   npx tsx scripts/verify-import.ts
 */
import { prisma } from "../src/lib/api/prisma";

async function main() {
  const projects = await prisma.project.findMany({
    include: { images: true, projectSkills: { include: { skill: true } } },
    orderBy: { id: "asc" },
  });

  console.log(`projects=${projects.length}`);

  for (const project of projects) {
    console.log(
      `  #${project.id} "${project.title}" slug=${project.slug} status=${project.status} featured=${project.featured} ` +
        `images=${project.images.length} skills=[${project.projectSkills.map((entry) => entry.skill.name).join(", ")}] ` +
        `features=${Array.isArray(project.keyFeatures) ? project.keyFeatures.length : 0} ` +
        `dates=${project.startDate?.toISOString().slice(0, 10) ?? "-"}..${project.endDate?.toISOString().slice(0, 10) ?? "-"}`,
    );
  }

  const skills = await prisma.skill.findMany({ orderBy: { id: "asc" } });
  console.log(`skills=${skills.length}`);
  for (const skill of skills) {
    console.log(`  ${skill.name} (${skill.category}) ${skill.percentage}% show_on_home=${skill.showOnHome}`);
  }

  const experiences = await prisma.experience.findMany({ orderBy: { id: "asc" } });
  console.log(`experiences=${experiences.length}`);
  for (const experience of experiences) {
    console.log(
      `  ${experience.company} — ${experience.position} (${experience.startDate.toISOString().slice(0, 10)} → ${experience.endDate?.toISOString().slice(0, 10) ?? "now"})`,
    );
  }

  const certificates = await prisma.certificate.findMany({ orderBy: { id: "asc" } });
  console.log(`certificates=${certificates.length}`);
  for (const certificate of certificates) {
    console.log(`  ${certificate.title} — ${certificate.issuer} (${certificate.date?.toISOString().slice(0, 10) ?? "-"})`);
  }

  const settings = await prisma.setting.findFirst();
  console.log(`settings=${settings ? `${settings.name} / ${settings.siteName} / github=${settings.github}` : "none"}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
