// Service Gemini temporairement désactivé pour éviter les erreurs
import { Project, Task, User, Contact } from '../types';

// Vérifier si la clé API est disponible
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.warn('Gemini API key not found. Please set the VITE_GEMINI_API_KEY environment variable.');
}

// Mock functions temporaires
export const runAICoach = async (prompt: string): Promise<string> => {
  return "Service AI temporairement désactivé. Fonctionnalité en cours de développement.";
};

export const runGenAILab = async (prompt: string): Promise<string> => {
  return "Service AI temporairement désactivé. Fonctionnalité en cours de développement.";
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
  return "Email temporaire - Service en développement";
};

export const summarizeAndCreateDoc = async (text: string, user: User): Promise<{ summary: string, document: any }> => {
  return {
    summary: "Résumé temporaire",
    document: { title: "Document temporaire", content: text }
  };
};

export const runAIAgent = async (prompt: string): Promise<string> => {
  return "Agent AI temporairement désactivé. Fonctionnalité en cours de développement.";
};

// Exports manquants identifiés dans les erreurs
export const runAuthAIAssistant = async (prompt: string): Promise<string> => {
  return "Assistant AI temporairement désactivé. Fonctionnalité en cours de développement.";
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
  return "Rapport de statut temporaire - Fonctionnalité en cours de développement.";
};

export const summarizeTasks = async (tasks: Task[]): Promise<string> => {
  return "Résumé des tâches temporaire - Fonctionnalité en cours de développement.";
};