import { z } from "zod";

export const roles = ["Student", "Professor", "Researcher"] as const;
export const roleSchema = z.enum(roles);
export type Role = z.infer<typeof roleSchema>;
export const routeForRole = (role: Role) => "/dashboard/" + role.toLowerCase();

export const fields = {
  Student: { university: "University", degree: "Degree program", major: "Major", graduation: "Expected graduation date" },
  Professor: { university: "University or organization", department: "Department", title: "Academic title", courses: "Courses taught" },
  Researcher: { university: "Institution or organization", title: "Research title", areas: "Research areas", orcid: "ORCID identifier" },
} as const;
