import { NextRequest, NextResponse } from "next/server";

type Language = "en" | "es" | "fr" | "hi";

function detectFocus(text: string) {
  const value = text.toLowerCase();
  if (/exam|study|quiz|class|course|assignment|homework/.test(value)) return "academic";
  if (/job|resume|interview|career|application|recruiter/.test(value)) return "career";
  if (/paper|research|dataset|experiment|literature|thesis/.test(value)) return "research";
  if (/email|professor|message|team|presentation|meeting/.test(value)) return "communication";
  if (/opt|cpt|visa|international student|dso|immigration/.test(value)) return "international student administration";
  return "student planning";
}

const translations = {
  en: {
    labels: ["Quick next step", "Step-by-step plan", "Expert-quality result"],
    situation: "Situation", student: "Student context", program: "Program", goal: "Broader goal",
    quickRole: (focus: string) => `Act as a practical student coach with experience in ${focus}.`,
    quick: "Identify the most important outcome, any critical missing information, and the single best next action I can complete in the next 30 minutes. Keep the response concise, realistic, and specific. Do not invent facts or complete graded work for me.",
    planRole: "Act as a thoughtful planning partner for a student.",
    plan: "Turn this into a step-by-step plan. First separate facts, assumptions, deadlines, and constraints. Then prioritize the work, estimate realistic effort, include one buffer, and give me a checklist for today and this week. Ask no more than three questions if essential information is missing.",
    expertRole: (focus: string) => `Act as an expert mentor in ${focus}.`,
    expert: "Help me produce a high-quality result while keeping me responsible for the thinking. Explain the best approach, show a strong structure or example, identify common mistakes, and create a final quality-check rubric. Clearly mark anything that needs human or source verification.",
    simple: "Use plain, everyday language. Keep sentences short, explain necessary terms, and avoid jargon.",
    response: "Write your entire response in English."
  },
  es: {
    labels: ["Siguiente paso", "Plan paso a paso", "Resultado de alta calidad"],
    situation: "Situación", student: "Contexto del estudiante", program: "Programa", goal: "Objetivo general",
    quickRole: () => "Actúa como un orientador estudiantil práctico.",
    quick: "Identifica el resultado más importante, cualquier dato esencial que falte y la mejor acción que pueda completar en los próximos 30 minutos. Mantén la respuesta breve, realista y específica. No inventes datos ni hagas por mí un trabajo evaluado.",
    planRole: "Actúa como un compañero de planificación atento para un estudiante.",
    plan: "Convierte esto en un plan paso a paso. Primero separa los hechos, supuestos, plazos y límites. Después prioriza el trabajo, calcula un esfuerzo realista, añade un margen y crea una lista para hoy y para esta semana. Haz como máximo tres preguntas si falta información esencial.",
    expertRole: () => "Actúa como un mentor experto para estudiantes.",
    expert: "Ayúdame a producir un resultado de alta calidad sin quitarme la responsabilidad de pensar. Explica el mejor enfoque, muestra una estructura o ejemplo sólido, señala errores comunes y crea una lista final de control de calidad. Marca claramente todo lo que necesite verificación humana o de una fuente.",
    simple: "Usa palabras sencillas y cotidianas. Escribe frases cortas, explica los términos necesarios y evita la jerga.",
    response: "Escribe toda tu respuesta en español."
  },
  fr: {
    labels: ["Prochaine étape", "Plan étape par étape", "Résultat de qualité"],
    situation: "Situation", student: "Contexte de l’étudiant", program: "Programme", goal: "Objectif général",
    quickRole: () => "Agis comme un conseiller étudiant pratique.",
    quick: "Repère le résultat le plus important, toute information essentielle manquante et la meilleure action que je peux réaliser dans les 30 prochaines minutes. Donne une réponse concise, réaliste et précise. N’invente aucun fait et ne fais pas un travail évalué à ma place.",
    planRole: "Agis comme un partenaire de planification attentif pour un étudiant.",
    plan: "Transforme ceci en plan étape par étape. Sépare d’abord les faits, les hypothèses, les échéances et les contraintes. Puis établis les priorités, estime un effort réaliste, ajoute une marge et donne-moi une liste pour aujourd’hui et cette semaine. Pose au maximum trois questions si une information essentielle manque.",
    expertRole: () => "Agis comme un mentor expert pour les étudiants.",
    expert: "Aide-moi à produire un résultat de qualité tout en me laissant responsable de la réflexion. Explique la meilleure approche, montre une structure ou un exemple solide, relève les erreurs courantes et crée une grille finale de contrôle qualité. Signale clairement tout élément qui nécessite une vérification humaine ou une source.",
    simple: "Utilise des mots simples et courants. Fais des phrases courtes, explique les termes nécessaires et évite le jargon.",
    response: "Rédige toute ta réponse en français."
  },
  hi: {
    labels: ["अगला आसान कदम", "चरण-दर-चरण योजना", "उच्च-गुणवत्ता वाला परिणाम"],
    situation: "स्थिति", student: "विद्यार्थी का संदर्भ", program: "पाठ्यक्रम", goal: "बड़ा लक्ष्य",
    quickRole: () => "एक व्यावहारिक विद्यार्थी मार्गदर्शक की तरह काम करें।",
    quick: "सबसे महत्वपूर्ण परिणाम, कोई जरूरी छूटी हुई जानकारी और वह एक सर्वोत्तम काम पहचानें जिसे मैं अगले 30 मिनट में पूरा कर सकूँ। उत्तर छोटा, व्यावहारिक और स्पष्ट रखें। तथ्य न गढ़ें और मेरा मूल्यांकित काम मेरे लिए पूरा न करें।",
    planRole: "एक विद्यार्थी के लिए सोच-समझकर योजना बनाने वाले साथी की तरह काम करें।",
    plan: "इसे चरण-दर-चरण योजना में बदलें। पहले तथ्यों, धारणाओं, समय-सीमाओं और बाधाओं को अलग करें। फिर काम की प्राथमिकता तय करें, व्यावहारिक समय का अनुमान दें, थोड़ा अतिरिक्त समय रखें और आज व इस सप्ताह की जाँच-सूची बनाएँ। जरूरी जानकारी न होने पर अधिकतम तीन प्रश्न पूछें।",
    expertRole: () => "एक अनुभवी विद्यार्थी मार्गदर्शक की तरह काम करें।",
    expert: "सोचने की जिम्मेदारी मेरे पास रखते हुए उच्च-गुणवत्ता वाला परिणाम बनाने में मदद करें। सर्वोत्तम तरीका समझाएँ, मजबूत संरचना या उदाहरण दिखाएँ, आम गलतियाँ बताएँ और अंत में गुणवत्ता जाँच-सूची बनाएँ। जिस बात की मानव या स्रोत से पुष्टि जरूरी हो, उसे साफ़ चिह्नित करें।",
    simple: "सरल और रोज़मर्रा की भाषा का उपयोग करें। वाक्य छोटे रखें, जरूरी शब्द समझाएँ और कठिन शब्दावली से बचें।",
    response: "अपना पूरा उत्तर हिंदी में लिखें।"
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { situation?: string; passport?: { program?: string; goal?: string }; language?: Language; simpleLanguage?: boolean };
    const situation = String(body.situation || "").trim().slice(0, 5000);
    if (!situation) return NextResponse.json({ error: "Describe your situation" }, { status: 400 });
    const language: Language = ["en", "es", "fr", "hi"].includes(body.language || "") ? body.language! : "en";
    const copy = translations[language];
    const focus = detectFocus(situation);
    const program = String(body.passport?.program || "").trim().slice(0, 300);
    const broaderGoal = String(body.passport?.goal || "").trim().slice(0, 500);
    const studentContext = [program && `${copy.program}: ${program}`, broaderGoal && `${copy.goal}: ${broaderGoal}`].filter(Boolean).join("\n");
    const shared = `${copy.situation}: ${situation}${studentContext ? `\n${copy.student}:\n${studentContext}` : ""}`;
    const accessibility = `${copy.response}${body.simpleLanguage ? ` ${copy.simple}` : ""}`;
    const prompts = [
      { label: copy.labels[0], prompt: `${copy.quickRole(focus)}\n\n${shared}\n\n${copy.quick}\n\n${accessibility}` },
      { label: copy.labels[1], prompt: `${copy.planRole}\n\n${shared}\n\n${copy.plan}\n\n${accessibility}` },
      { label: copy.labels[2], prompt: `${copy.expertRole(focus)}\n\n${shared}\n\n${copy.expert}\n\n${accessibility}` }
    ];
    return NextResponse.json({ focus, language, prompts });
  } catch {
    return NextResponse.json({ error: "Unable to create prompts" }, { status: 500 });
  }
}
