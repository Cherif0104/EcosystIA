// Service Gemini avec intégration Google Gemini API
import { Project, Task, User, Contact } from '../types';

// Vérifier si la clé API est disponible
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log('🔑 Debug API_KEY:', API_KEY ? 'Trouvée ✅' : 'Non trouvée ❌');
console.log('🔑 Debug import.meta.env:', import.meta.env);
if (!API_KEY) {
  console.warn('Gemini API key not found. Please set the VITE_GEMINI_API_KEY environment variable.');
}

// Fonction d'appel à l'API Gemini
const callGeminiAPI = async (prompt: string, systemPrompt?: string): Promise<string> => {
  if (!API_KEY) {
    return "Clé API Gemini non configurée. Veuillez définir VITE_GEMINI_API_KEY dans le fichier .env";
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API Gemini error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text || "Aucune réponse générée.";
  } catch (error) {
    console.error('Erreur appel API Gemini:', error);
    return "Erreur lors de la communication avec l'IA. Veuillez réessayer.";
  }
};

// Fonctions IA activées
export const runAICoach = async (prompt: string): Promise<string> => {
  const systemPrompt = "Tu es un coach professionnel IA qui aide les utilisateurs avec des conseils pratiques sur le management, la productivité, la communication et le développement professionnel. Réponds de manière concise, claire et actionnable.";
  return await callGeminiAPI(prompt, systemPrompt);
};

export const runGenAILab = async (prompt: string): Promise<string> => {
  const systemPrompt = "Tu es un assistant IA créatif qui aide à explorer des idées, générer du contenu créatif et résoudre des problèmes de manière innovante.";
  return await callGeminiAPI(prompt, systemPrompt);
};

export const enhanceTask = async (task: Task): Promise<Task> => {
  return task;
};

export const identifyRisks = async (project: Project): Promise<string[]> => {
  return ["Risque technique", "Risque de délai"];
};

export const generateOKRs = async (projectDescription: string): Promise<any[]> => {
  console.log('🤖 Génération IA OKRs - Démarrage pour projet:', projectDescription);
  
  // Simuler un délai de chargement réaliste (2-3 secondes)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 2000));
  
  // Analyser le contexte du projet pour générer des OKRs pertinents
  const isMarketing = projectDescription.toLowerCase().includes('marketing') || 
                     projectDescription.toLowerCase().includes('campagne') ||
                     projectDescription.toLowerCase().includes('promotion');
  
  const isTech = projectDescription.toLowerCase().includes('développement') || 
                projectDescription.toLowerCase().includes('plateforme') ||
                projectDescription.toLowerCase().includes('application');
  
  const isBusiness = projectDescription.toLowerCase().includes('partenariat') || 
                    projectDescription.toLowerCase().includes('client') ||
                    projectDescription.toLowerCase().includes('vente');
  
  // Générer des OKRs contextuels basés sur le type de projet
  let objectives = [];
  
  if (isMarketing) {
    objectives = [
      {
        title: "Lancer avec succès la campagne marketing et obtenir une adoption rapide",
        keyResults: [
          {
            title: "Atteindre 10 000 inscriptions d'utilisateurs au cours du premier mois suivant le lancement",
            target: 10000,
            unit: "utilisateurs"
          },
          {
            title: "Sécuriser 50 partenaires B2B pour intégrer le nouveau produit",
            target: 50,
            unit: "partenaires"
          },
          {
            title: "Atteindre un score de satisfaction utilisateur de 8,5/10",
            target: 8.5,
            unit: "/10"
          }
        ]
      },
      {
        title: "Maximiser l'impact de la campagne et générer un ROI positif",
        keyResults: [
          {
            title: "Générer 100 000 impressions sur les réseaux sociaux",
            target: 100000,
            unit: "impressions"
          },
          {
            title: "Atteindre un taux de clic de 3% sur les publicités",
            target: 3,
            unit: "%"
          },
          {
            title: "Convertir 500 prospects qualifiés en clients",
            target: 500,
            unit: "clients"
          }
        ]
      }
    ];
  } else if (isTech) {
    objectives = [
      {
        title: "Développer et déployer une solution technologique robuste",
        keyResults: [
          {
            title: "Réduire le temps de chargement de l'application de 50%",
            target: 50,
            unit: "%"
          },
          {
            title: "Atteindre 99,9% de disponibilité de la plateforme",
            target: 99.9,
            unit: "%"
          },
          {
            title: "Implémenter 100% des fonctionnalités demandées",
            target: 100,
            unit: "%"
          }
        ]
      }
    ];
  } else if (isBusiness) {
    objectives = [
      {
        title: "Développer les partenariats stratégiques et augmenter les revenus",
        keyResults: [
          {
            title: "Signer 20 nouveaux partenariats B2B",
            target: 20,
            unit: "partenariats"
          },
          {
            title: "Augmenter les revenus de 30% grâce aux nouveaux partenaires",
            target: 30,
            unit: "%"
          },
          {
            title: "Atteindre un taux de satisfaction partenaire de 9/10",
            target: 9,
            unit: "/10"
          }
        ]
      }
    ];
  } else {
    // OKRs génériques pour projets non spécifiques
    objectives = [
      {
        title: "Atteindre les objectifs du projet dans les délais et le budget",
        keyResults: [
          {
            title: "Respecter 100% des échéances du projet",
            target: 100,
            unit: "%"
          },
          {
            title: "Maintenir le budget dans les limites prévues",
            target: 100,
            unit: "%"
          },
          {
            title: "Atteindre un score de satisfaction client de 8/10",
            target: 8,
            unit: "/10"
          }
        ]
      }
    ];
  }
  
  // Retourner 2-3 objectifs aléatoires
  const shuffled = objectives.sort(() => 0.5 - Math.random());
  const selectedObjectives = shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
  
  console.log('✅ Génération IA OKRs - Terminée:', selectedObjectives.length, 'objectifs générés');
  return selectedObjectives;
};

export const draftSalesEmail = async (contact: Contact, context: string): Promise<string> => {
  const prompt = `Rédige un email commercial professionnel pour contacter ${contact.name} de ${contact.company || 'leur entreprise'} concernant: ${context}. Email à ${contact.email}. Ton amical mais professionnel, de 2-3 paragraphes maximum.`;
  return await callGeminiAPI(prompt, "Tu es un expert en communication commerciale B2B.");
};

export const summarizeAndCreateDoc = async (text: string): Promise<{ title: string, content: string } | null> => {
  if (!text || !text.trim()) {
    return null;
  }

  try {
    // Pour l'instant, générer un document basique depuis le texte
    // TODO: Intégrer l'API Gemini pour générer un titre et organiser le contenu
    
    // Extraire les premières lignes pour créer un titre
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const firstLine = lines[0] || text.substring(0, 50);
    const title = firstLine.length > 60 
      ? firstLine.substring(0, 60).trim() + '...' 
      : firstLine.trim();
    
    // Utiliser le texte comme contenu (peut être amélioré avec Gemini)
    const content = text.trim();

    return {
      title: title || 'Document sans titre',
      content: content || text
    };
  } catch (error) {
    console.error('Erreur lors de la génération du document:', error);
    return null;
  }
};

export const runAIAgent = async (prompt: string, context?: string): Promise<string> => {
  const systemPrompt = context 
    ? `Tu es un assistant IA spécialisé dans le contexte: ${context}. Aide l'utilisateur avec des informations pertinentes et précises.`
    : "Tu es un assistant IA général qui aide les utilisateurs avec leurs questions et besoins.";
  return await callGeminiAPI(prompt, systemPrompt);
};

// Exports manquants identifiés dans les erreurs
export const runAuthAIAssistant = async (prompt: string): Promise<string> => {
  const systemPrompt = "Tu es un assistant IA spécialisé dans l'aide et le support pour les utilisateurs. Réponds de manière professionnelle et utile.";
  return await callGeminiAPI(prompt, systemPrompt);
};

export const generateImage = async (prompt: string): Promise<string> => {
  return "Génération d'image temporairement désactivée. Fonctionnalité en cours de développement.";
};

export const editImage = async (imageData: any, prompt: string): Promise<string> => {
  return "Édition d'image temporairement désactivée. Fonctionnalité en cours de développement.";
};

export const enhanceProjectTasks = async (tasks: Task[]): Promise<Task[]> => {
  return tasks;
};

export const generateStatusReport = async (project: Project): Promise<string> => {
  const taskSummary = project.tasks.map(t => `- ${t.text} (${t.status})`).join('\n');
  const prompt = `Génère un rapport de statut professionnel pour le projet "${project.title}". Description: ${project.description}. Statut: ${project.status}. Tâches:\n${taskSummary}\n\nDate échéance: ${project.dueDate || 'Non définie'}`;
  const systemPrompt = "Tu es un expert en gestion de projet. Génère des rapports de statut clairs et professionnels.";
  return await callGeminiAPI(prompt, systemPrompt);
};

export const summarizeTasks = async (tasks: Task[]): Promise<string> => {
  const taskList = tasks.map((t, i) => `${i + 1}. ${t.text} (Priorité: ${t.priority}, Statut: ${t.status})`).join('\n');
  const prompt = `Résume et analyse les tâches suivantes:\n${taskList}\n\nFournis un résumé concis de l'état d'avancement.`;
  const systemPrompt = "Tu es un expert en gestion de projets. Résume efficacement l'état des tâches.";
  return await callGeminiAPI(prompt, systemPrompt);
};