import fs from "node:fs";
const file = "client/public/question_1.json";
const questions = JSON.parse(fs.readFileSync(file, "utf8"));
const q = questions.find((item) => String(item.id) === "190");
if (!q) throw new Error("Question 190 was not found");
q.type = "hotspot";
q.interaction = "answer_area_select";
q.media = [{ type: "image", src: "/manus-storage/page-187_237be972.jpg", alt: "Question 190 source exhibit with the user-role table and two answer areas", caption: "Source exhibit — PDF page 187" }];
q.answer_areas = [
  { id: "permissions", label: "Users who can modify the permissions for RG1", options: ["User1 only", "User1 and User2 only", "User1 and User3 only", "User1, User2 and User3 only", "User1, User2, User3 and User4"], answer: "User1 only" },
  { id: "virtual-networks", label: "Users who can create virtual networks in RG1", options: ["User1 only", "User1 and User2 only", "User1 and User3 only", "User1, User2 and User3 only", "User1, User2, User3, and User4"], answer: "User1, User2 and User3 only" },
];
q.answer = ["permissions=User1 only", "virtual-networks=User1, User2 and User3 only"];
q.explanation = "Permissions: only User1 has the Owner role, so only User1 can modify permissions. Virtual networks: User1 (Owner), User2 (Contributor), and User3 (Security Admin) can create virtual networks in the resource group; User4 has no subscription role and cannot create resources there.";
q.AI_explanation = { heading: "How to solve this answer-area question", overview: "Read each answer area as a separate Azure RBAC decision. The first asks who can delegate permissions; the second asks who can create a resource.", reasoning_steps: ["User1 is Owner, so User1 can manage access and modify permissions for RG1.", "User2 is Contributor. Contributor can create resources but cannot change permissions.", "User3 is Security Admin. This role does not grant permission delegation on RG1.", "User4 has no subscription role, so User4 cannot create a virtual network in RG1."], exam_tip: "Separate permission management from resource creation: Owner can do both; Contributor can create resources but cannot delegate access.", caution: "Each answer area is graded independently. Changing one selection does not change the other." };
fs.writeFileSync(file, JSON.stringify(questions, null, 2) + "\n");
console.log("Patched question 190.");
